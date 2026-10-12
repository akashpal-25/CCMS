import uuid
import os
import shutil
import uuid as uuid_lib
from app.repositories.user_repository import RoleRepository
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.utils.enums import ComplaintStatus, SLAStatus  
from app.schemas.complaint import ComplaintCreateRequest
from app.services.notification_service import create_notification
from app.services import whatsapp_service

from app.core.config import settings
from app.utils.validators import validate_file

SLA_FIRST_RESPONSE_HOURS = 72


class ComplaintService:
    def __init__(self, db: Session):
        self.db = db
        self.complaint_repo = ComplaintRepository(db)
        self.user_repo = UserRepository(db)

    def submit_complaint(self, current_user: User, data: ComplaintCreateRequest):
        # 1. Student profile nikalo
        student = self.complaint_repo.get_student_profile_by_user_id(current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can submit complaints."
            )

        # 2. Domain/category verify karo
        domain = self.complaint_repo.get_domain_by_code(data.domain_code)
        if not domain:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or inactive complaint domain."
            )

        category = None
        if data.category_code:
            category = self.complaint_repo.get_category_by_code(data.category_code)
            if not category or category.domain_id != domain.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or inactive complaint category."
                )
            # Teacher wali categories student ko allowed nahi
            if (category.audience or "STUDENT") != "STUDENT":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or inactive complaint category."
                )

        # Double-click guard: 30 second ke andar bilkul same complaint dobara aaye to nayi nahi banegi
        duplicate = self.complaint_repo.find_recent_duplicate(
            student_id=student.id, domain_id=domain.id,
            title=data.title, description=data.description,
        )
        if duplicate:
            return duplicate

        # 3. Level 1 routing rule dhundo — agar nahi mila, complaint ban hi nahi sakti
        category_id = category.id if category else None
        routing_rule = self.complaint_repo.get_routing_rule(domain.id, category_id, level=1)

        if not routing_rule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This complaint type is not yet configured for routing. Please contact administrator."
            )

        # 4. Authority dhundo. Agar is level par koi insaan nahi mila (jaise class ka teacher assign nahi hai)
        #    to complaint atki na rahe, isliye agle level par chale jao.
        level = 1
        assignees = self._resolve_authorities(routing_rule, student.department_id, student.class_section_id, domain.id)
        skipped_note = None
        while not assignees:
            next_rule = self.complaint_repo.get_routing_rule(domain.id, category_id, level + 1)
            if not next_rule:
                break
            level += 1
            routing_rule = next_rule
            assignees = self._resolve_authorities(routing_rule, student.department_id, student.class_section_id, domain.id)
            skipped_note = f"No authority found at level {level - 1}; routed directly to level {level}."

        # 5. Complaint number generate karo
        complaint_number = self.complaint_repo.generate_complaint_number()

        # 6. SLA timing calculate karo (student complaints par 72h / 48h rule jaisa pehle tha)
        now = datetime.now(timezone.utc)
        sla_deadline = now + timedelta(hours=SLA_FIRST_RESPONSE_HOURS)

        # 7. Complaint create karo
        complaint = self.complaint_repo.create_complaint(
            complaint_number=complaint_number,
            student_id=student.id,
            domain_id=domain.id,
            category_id=category_id,
            title=data.title,
            description=data.description,
            status=ComplaintStatus.SUBMITTED,
            current_escalation_level=level,
            sla_started_at=now,
            sla_deadline_at=sla_deadline,
            sla_status=SLAStatus.ON_TRACK,
        )

        # 8. Routing Engine — assign karo (ek se zyada log ho sakte hain)
        self._assign_to_users(complaint, routing_rule, assignees, level)

        # 9. Event log banao (audit trail)
        self.complaint_repo.create_event(
            complaint_id=complaint.id,
            actor_user_id=current_user.id,
            event_type="COMPLAINT_SUBMITTED",
            new_status=ComplaintStatus.SUBMITTED.value,
            description="Complaint submitted by student." + (f" {skipped_note}" if skipped_note else ""),
        )
        return complaint

    # ------------------------------------------------------------------
    # ROUTING HELPERS
    # ------------------------------------------------------------------
    def _resolve_authorities(self, routing_rule, department_id, class_section_id=None, domain_id=None) -> list:
        """
        RoutingRule batata hai 'kaunsa ROLE chahiye'.
        Ye function batata hai 'us role wale ACTUAL insaan kaun hain' (list).

        - CLASS_TEACHER role  -> student ki class section ka assigned teacher (sirf wahi)
        - DEPARTMENT scope    -> us department ke us role wale saare staff
        - GLOBAL scope        -> us role wale saare staff (department se matlab nahi)

        Staff ka domain set ho (jaise Warden -> hostel) to wo sirf usi domain ki complaints
        pata hai; domain khali ho to sab domains.
        """
        role = self.user_repo.get_role_by_id(routing_rule.target_role_id)
        if role and role.name == "CLASS_TEACHER":
            teacher = self.user_repo.find_class_teacher(class_section_id)
            return [teacher] if teacher else []

        if routing_rule.scope_type.value == "DEPARTMENT":
            return self.user_repo.find_all_staff_by_role_and_department(
                routing_rule.target_role_id, department_id, domain_id
            )
        return self.user_repo.find_all_staff_by_role_global(routing_rule.target_role_id, domain_id)

    def _assign_to_users(self, complaint, routing_rule, users: list, level: int, message: str = None):
        """Har user ke liye assignment + in-app notification banata hai."""
        seen = set()
        for user in users:
            if user.id in seen:
                continue
            seen.add(user.id)
            self.complaint_repo.create_assignment(
                complaint_id=complaint.id,
                assigned_user_id=user.id,
                routing_rule_id=routing_rule.id,
                escalation_level=level,
            )
            create_notification(
                self.db,
                user_id=user.id,
                complaint_id=complaint.id,
                notif_type="COMPLAINT_ASSIGNED",
                message=message or f"New complaint {complaint.complaint_number} has been assigned to you.",
            )

    # ------------------------------------------------------------------
    # TEACHER COMPLAINTS
    # ------------------------------------------------------------------
    TEACHER_COMPLAINT_DOMAIN = "academic"

    def get_teacher_categories(self):
        from app.models.complaint import ComplaintCategory
        domain = self.complaint_repo.get_domain_by_code(self.TEACHER_COMPLAINT_DOMAIN)
        if not domain:
            return []
        return (
            self.db.query(ComplaintCategory)
            .filter(
                ComplaintCategory.domain_id == domain.id,
                ComplaintCategory.audience == "TEACHER",
                ComplaintCategory.is_active == True,
            )
            .order_by(ComplaintCategory.name)
            .all()
        )

    def get_teacher_complaints(self, current_user: User):
        complaints = self.complaint_repo.get_complaints_filed_by(current_user.id)
        return self.complaint_repo.enrich_complaints(complaints)

    def file_teacher_complaint(self, current_user: User, data):
        """
        Teacher ki apni complaint (academic domain).
        - category 'teacher_general' -> HOD + Director dono ko
        - category 'teacher_hod'     -> sirf Director ko
        Koi 72h/48h SLA ya escalation nahi.
        """
        category = self.complaint_repo.get_category_by_code(data.category_code)
        if not category or (category.audience or "STUDENT") != "TEACHER":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please select a valid complaint category.")

        domain = self.complaint_repo.get_domain_by_id(category.domain_id)
        if not domain or not domain.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complaint domain is not active.")

        department_id = self.user_repo.get_staff_department_id(current_user.id)
        if not department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is not linked to a department. Please contact administrator."
            )

        duplicate = self.complaint_repo.find_recent_duplicate(
            filed_by_user_id=current_user.id, domain_id=domain.id,
            title=data.title, description=data.description,
        )
        if duplicate:
            return duplicate

        rules = self.complaint_repo.get_category_rules(domain.id, category.id)
        targets = []  # (rule, user)
        seen = {current_user.id}  # filer khud apna assignee na bane
        for rule in rules:
            for user in self._resolve_authorities(rule, department_id, None, domain.id):
                if user.id not in seen:
                    seen.add(user.id)
                    targets.append((rule, user))

        if not targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No HOD / Director is configured to receive this complaint yet. Please contact administrator."
            )

        complaint = self.complaint_repo.create_complaint(
            complaint_number=self.complaint_repo.generate_complaint_number(),
            student_id=None,
            domain_id=domain.id,
            category_id=category.id,
            title=data.title,
            description=data.description,
            status=ComplaintStatus.SUBMITTED,
            current_escalation_level=1,
            sla_started_at=None,
            sla_deadline_at=None,
            sla_status=SLAStatus.ON_TRACK,
            complaint_type="TEACHER",
            filed_by_user_id=current_user.id,
        )

        for rule, user in targets:
            self._assign_to_users(complaint, rule, [user], rule.escalation_level)

        self.complaint_repo.create_event(
            complaint_id=complaint.id,
            actor_user_id=current_user.id,
            event_type="COMPLAINT_SUBMITTED",
            new_status=ComplaintStatus.SUBMITTED.value,
            description="Complaint submitted by teacher.",
        )
        return complaint

    def file_student_report(self, current_user: User, data):
        """
        Teacher kisi student ki complaint/report karta hai:
        student ke department ke HOD ko jati hai aur parent ko WhatsApp message.
        """
        student = self.complaint_repo.get_student_by_roll_no(data.roll_no)
        if (
            not student
            or student.department_id != data.department_id
            or student.course_id != data.course_id
            or student.class_section_id != data.class_section_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No student with this roll no. found in the selected department, course, semester and section."
            )

        category = self.complaint_repo.get_category_by_code("student_report")
        domain = self.complaint_repo.get_domain_by_id(category.domain_id) if category else None
        if not category or not domain:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student report is not configured yet. Please contact administrator."
            )

        duplicate = self.complaint_repo.find_recent_duplicate(
            filed_by_user_id=current_user.id, subject_student_id=student.id,
            title=data.title, description=data.description,
        )
        if duplicate:
            return duplicate

        rules = self.complaint_repo.get_category_rules(domain.id, category.id)
        targets = []
        seen = {current_user.id}
        for rule in rules:
            for user in self._resolve_authorities(rule, student.department_id, student.class_section_id, domain.id):
                if user.id not in seen:
                    seen.add(user.id)
                    targets.append((rule, user))

        if not targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No HOD is configured for this student's department yet. Please contact administrator."
            )

        complaint = self.complaint_repo.create_complaint(
            complaint_number=self.complaint_repo.generate_complaint_number(),
            student_id=None,
            subject_student_id=student.id,
            domain_id=domain.id,
            category_id=category.id,
            title=data.title,
            description=data.description,
            status=ComplaintStatus.SUBMITTED,
            current_escalation_level=1,
            sla_started_at=None,
            sla_deadline_at=None,
            sla_status=SLAStatus.ON_TRACK,
            complaint_type="TEACHER_STUDENT_REPORT",
            filed_by_user_id=current_user.id,
            parent_phone=data.parent_phone,
        )

        for rule, user in targets:
            self._assign_to_users(complaint, rule, [user], rule.escalation_level)

        self.complaint_repo.create_event(
            complaint_id=complaint.id,
            actor_user_id=current_user.id,
            event_type="COMPLAINT_SUBMITTED",
            new_status=ComplaintStatus.SUBMITTED.value,
            description="Student report submitted by teacher.",
        )

        # Parent ko WhatsApp (fail ho to bhi complaint save rehti hai)
        student_user = self.user_repo.get_by_id(student.user_id)
        message = self._build_parent_message(current_user, student, student_user, data)
        wa_status = whatsapp_service.send_whatsapp_message(data.parent_phone, message)
        complaint.whatsapp_status = wa_status
        self.db.commit()
        self.db.refresh(complaint)

        self.complaint_repo.create_event(
            complaint_id=complaint.id,
            actor_user_id=current_user.id,
            event_type="PARENT_NOTIFIED" if wa_status == whatsapp_service.SENT else "PARENT_NOTIFICATION_" + wa_status,
            description=f"WhatsApp message to parent ({data.parent_phone}): {wa_status}.",
        )
        return complaint

    def _build_parent_message(self, teacher: User, student, student_user, data) -> str:
        """Parent ko jane wala message hamesha ek fixed format mein banta hai (whatsapp_service mein)."""
        from app.models.department import ClassSection, Course, Department
        section = self.db.query(ClassSection).filter(ClassSection.id == student.class_section_id).first()
        course = self.db.query(Course).filter(Course.id == student.course_id).first()
        department = self.db.query(Department).filter(Department.id == student.department_id).first()
        return whatsapp_service.build_student_report_message(
            student_name=student_user.full_name if student_user else "-",
            roll_no=student.student_id,
            department=department.name if department else "-",
            course=course.name if course else "-",
            semester=section.year_or_semester if section else student.semester,
            section=section.section_name if section else "-",
            title=data.title,
            description=data.description,
            teacher_name=teacher.full_name,
        )

    def get_my_complaints(self, current_user: User):
        student = self.complaint_repo.get_student_profile_by_user_id(current_user.id)
        if not student:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can view their complaints.")
        complaints = self.complaint_repo.get_complaints_by_student(student.id)
        return self.complaint_repo.enrich_complaints(complaints)
    

    def perform_action(self, current_user: User, complaint_id: uuid.UUID, data):
        complaint = self.complaint_repo.get_by_id(complaint_id)
        if not complaint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

        if complaint.status in [ComplaintStatus.RESOLVED, ComplaintStatus.NOT_SOLVED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This complaint is already closed and cannot be modified."
            )
        old_status = complaint.status.value
        is_teacher_complaint = (complaint.complaint_type or "STUDENT") != "STUDENT"
        assignment = None  # student reject wale notification ke liye

        # ---------- STAFF ACTIONS ----------
        if data.action in ["start_review", "mark_action_taken"]:
            # Ab ek complaint ke ek se zyada active assignee ho sakte hain (jaise HOD + Director)
            my_assignment = self.complaint_repo.get_active_assignment_for_user(complaint.id, current_user.id)
            if not my_assignment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to act on this complaint."
                )

            if data.action == "start_review":
                if complaint.status not in [ComplaintStatus.SUBMITTED, ComplaintStatus.ESCALATED]:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transition.")
                self.complaint_repo.update_status(complaint, ComplaintStatus.UNDER_REVIEW)

            elif data.action == "mark_action_taken":
                if complaint.status not in [ComplaintStatus.UNDER_REVIEW, ComplaintStatus.ESCALATED]:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transition.")
                if is_teacher_complaint:
                    # Teacher ki complaint mein student confirmation nahi hota: seedha RESOLVED
                    self.complaint_repo.update_status(complaint, ComplaintStatus.RESOLVED)
                else:
                    self.complaint_repo.update_status(complaint, ComplaintStatus.PENDING_STUDENT_CONFIRMATION)

        # ---------- STUDENT ACTIONS ----------
        elif data.action in ["confirm_resolved", "reject_resolution"]:
            if is_teacher_complaint or not complaint.student_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This action is not available for this complaint."
                )
            student = self.complaint_repo.get_student_by_id(complaint.student_id)
            if not student or student.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the complaint's student can confirm this."
                )

            if complaint.status != ComplaintStatus.PENDING_STUDENT_CONFIRMATION:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Complaint is not awaiting your confirmation."
                )

            assignments_before = self.complaint_repo.get_active_assignments(complaint.id)
            assignment = assignments_before[0] if assignments_before else None

            if data.action == "confirm_resolved":
                self.complaint_repo.update_status(complaint, ComplaintStatus.RESOLVED)
                self.complaint_repo.end_all_assignments(complaint.id)

            elif data.action == "reject_resolution":
                self.complaint_repo.update_status(complaint, ComplaintStatus.NOT_SOLVED)
                self._escalate(complaint, assignment)

        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action.")

        self.complaint_repo.create_event(
            complaint_id=complaint.id,
            actor_user_id=current_user.id,
            event_type=data.action.upper(),
            previous_status=old_status,
            new_status=complaint.status.value,
            description=data.remarks,
        )
        # Notifications bhejo hisaab se
        if data.action == "confirm_resolved":
            pass  # complaint band ho gayi, koi aur notification nahi chahiye

        elif data.action == "reject_resolution":
            if assignment:
                create_notification(
                    self.db,
                    user_id=assignment.assigned_user_id,
                    complaint_id=complaint.id,
                    notif_type="STUDENT_REJECTED",
                    message=f"Student marked complaint {complaint.complaint_number} as not solved.",
                )
            for new_assignment in self.complaint_repo.get_active_assignments(complaint.id):
                create_notification(
                    self.db,
                    user_id=new_assignment.assigned_user_id,
                    complaint_id=complaint.id,
                    notif_type="COMPLAINT_ESCALATED",
                    message=f"Complaint {complaint.complaint_number} has been escalated to you.",
                )

        elif data.action == "mark_action_taken":
            if is_teacher_complaint:
                if complaint.filed_by_user_id:
                    create_notification(
                        self.db,
                        user_id=complaint.filed_by_user_id,
                        complaint_id=complaint.id,
                        notif_type="COMPLAINT_RESOLVED",
                        message=f"Action has been taken on your complaint {complaint.complaint_number}.",
                    )
            else:
                student = self.complaint_repo.get_student_by_id(complaint.student_id)
                if student:
                    create_notification(
                        self.db,
                        user_id=student.user_id,
                        complaint_id=complaint.id,
                        notif_type="ACTION_TAKEN_CONFIRM_NEEDED",
                        message=f"Action taken on complaint {complaint.complaint_number}. Please confirm if resolved.",
                    )
        return complaint

    def _escalate(self, complaint, current_assignment):
        from datetime import datetime, timedelta, timezone

        # Teacher ki complaint kabhi escalate nahi hoti (72h/48h rule sirf student complaints ke liye)
        if not complaint.student_id:
            return

        next_level = complaint.current_escalation_level + 1

        student = self.complaint_repo.get_student_by_id(complaint.student_id)
        routing_rule = self.complaint_repo.get_routing_rule(complaint.domain_id, complaint.category_id, next_level)

        if not routing_rule:
            # Maximum escalation level reach ho chuka hai — ab koi aur upar nahi hai
            complaint.status = ComplaintStatus.NOT_SOLVED
            complaint.sla_status = SLAStatus.BREACHED
            self.db.commit()
            self.db.refresh(complaint)

            # Student ko notify karo — dobara complaint file karni hogi
            student = self.complaint_repo.get_student_by_id(complaint.student_id)
            if student:
                create_notification(
                    self.db,
                    user_id=student.user_id,
                    complaint_id=complaint.id,
                    notif_type="COMPLAINT_UNRESOLVED_FINAL",
                    message=f"Complaint {complaint.complaint_number} could not be resolved. Please submit a new complaint if the issue persists.",
                )

            # Saare purane handlers (HOD, Director, etc.) ko bhi notify karo
            assignee_ids = self.complaint_repo.get_all_assignees(complaint.id)
            for user_id in assignee_ids:
                create_notification(
                    self.db,
                    user_id=user_id,
                    complaint_id=complaint.id,
                    notif_type="COMPLAINT_CLOSED_UNRESOLVED",
                    message=f"Complaint {complaint.complaint_number} has been closed as unresolved after maximum escalation.",
                )

            return

        # Is level ke saare purane assignees ko hata do
        self.complaint_repo.end_all_assignments(complaint.id)

        next_authorities = self._resolve_authorities(
            routing_rule, student.department_id, student.class_section_id, complaint.domain_id
        )
        for authority in next_authorities:
            self.complaint_repo.create_assignment(
                complaint_id=complaint.id,
                assigned_user_id=authority.id,
                routing_rule_id=routing_rule.id,
                escalation_level=next_level,
            )

        # Naya SLA window shuru karo is level ke liye (48 hours, jaisa locked requirement hai)
        now = datetime.now(timezone.utc)
        new_deadline = now + timedelta(hours=48)

        complaint.current_escalation_level = next_level
        complaint.status = ComplaintStatus.ESCALATED
        complaint.sla_started_at = now
        complaint.sla_deadline_at = new_deadline
        complaint.sla_status = SLAStatus.ON_TRACK
        self.db.commit()
        self.db.refresh(complaint)

    def upload_attachment(self, current_user: User, complaint_id: uuid.UUID, file):
        if not self.complaint_repo.is_user_authorized_for_complaint(complaint_id, current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this complaint.")

        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        errors = validate_file(file.filename, file.content_type, file_size, settings.MAX_FILE_SIZE_MB)
        if errors:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=" ".join(errors))

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        ext = os.path.splitext(file.filename)[1].lower()
        safe_filename = f"{uuid_lib.uuid4()}{ext}"
        storage_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        with open(storage_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        attachment = self.complaint_repo.create_attachment(
            complaint_id=complaint_id,
            uploaded_by=current_user.id,
            original_file_name=file.filename,
            storage_key=storage_path,
            mime_type=file.content_type,
            file_size=file_size,
        )

        return attachment

    def download_attachment(self, current_user: User, attachment_id: uuid.UUID):
        attachment = self.complaint_repo.get_attachment_by_id(attachment_id)
        if not attachment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found.")

        complaint = self.complaint_repo.get_by_id(attachment.complaint_id)
        if not complaint or not self._is_authorized_to_view(current_user, complaint):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file.")

        return attachment

    def get_assigned_complaints(self, current_user: User):
        complaints = self.complaint_repo.get_assigned_complaints(current_user.id)
        return self.complaint_repo.enrich_complaints(complaints)

    def get_visible_complaints(self, current_user: User):
        """
        User ke roles/scope ke hisaab se saari 'visible' complaints deta hai
        (sirf assigned wali nahi, balki poori department/global list bhi)
        """
        from app.repositories.user_repository import RoleRepository
        role_repo = RoleRepository(self.db)
        user_roles = role_repo.get_user_roles(current_user.id)

        all_complaints = {}

        for user_role in user_roles:
            permissions = role_repo.get_permissions_for_role(user_role.role_id)

            if "complaint.view_global" in permissions:
                # Super Admin / Director: poore college ki complaints
                complaints = self.complaint_repo.get_all_complaints()
            elif user_role.domain_id:
                # Domain wala authority (jaise Warden -> hostel): us domain ki saari complaints.
                # Scope DEPARTMENT ho to sirf us department ke students ki, GLOBAL ho to sabki.
                dept = user_role.department_id if user_role.scope_type.value == "DEPARTMENT" else None
                if user_role.scope_type.value == "DEPARTMENT" and not dept:
                    continue
                complaints = self.complaint_repo.get_domain_complaints(user_role.domain_id, dept)
            elif "complaint.view_department" in permissions and user_role.department_id:
                # HOD: apne department ke students ki saari complaints (saari domains)
                complaints = self.complaint_repo.get_department_complaints(user_role.department_id)
            else:
                continue
            for c in complaints:
                all_complaints[c.id] = c

        return self.complaint_repo.enrich_complaints(list(all_complaints.values()))

    def get_complaint_detail(self, current_user: User, complaint_id: uuid.UUID):
        complaint = self.complaint_repo.get_by_id(complaint_id)
        if not complaint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

        if not self._is_authorized_to_view(current_user, complaint):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this complaint.")

        events = self.complaint_repo.get_events_for_complaint(complaint_id)
        enriched = self.complaint_repo.enrich_complaint(complaint)
        enriched["events"] = events
        enriched["viewer_can_act"] = (
            self.complaint_repo.get_active_assignment_for_user(complaint.id, current_user.id) is not None
        )
        return enriched

    def get_attachments(self, current_user: User, complaint_id: uuid.UUID):
        complaint = self.complaint_repo.get_by_id(complaint_id)
        if not complaint or not self._is_authorized_to_view(current_user, complaint):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        return self.complaint_repo.get_attachments_for_complaint(complaint_id)

    def _is_authorized_to_view(self, current_user: User, complaint) -> bool:
        if self.complaint_repo.is_user_authorized_for_complaint(complaint.id, current_user.id):
            return True

        # Teacher ki complaint sirf us teacher aur assigned HOD/Director (upar wala check) ko dikhti hai
        if (complaint.complaint_type or "STUDENT") != "STUDENT" or not complaint.student_id:
            return False

        role_repo = RoleRepository(self.db)
        user_roles = role_repo.get_user_roles(current_user.id)
        student = self.complaint_repo.get_student_by_id(complaint.student_id)

        for user_role in user_roles:
            permissions = role_repo.get_permissions_for_role(user_role.role_id)
            if "complaint.view_global" in permissions:
                return True
            if user_role.domain_id:
                if user_role.domain_id != complaint.domain_id:
                    continue
                if user_role.scope_type.value == "GLOBAL":
                    return True
                if student and user_role.department_id == student.department_id:
                    return True
            elif (
                "complaint.view_department" in permissions
                and student
                and user_role.department_id == student.department_id
            ):
                return True

        return False
