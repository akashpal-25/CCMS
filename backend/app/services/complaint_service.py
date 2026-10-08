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
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or inactive complaint category."
                )

        # 3. Level 1 routing rule dhundo — agar nahi mila, complaint ban hi nahi sakti
        category_id = category.id if category else None
        routing_rule = self.complaint_repo.get_routing_rule(domain.id, category_id, level=1)

        if not routing_rule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This complaint type is not yet configured for routing. Please contact administrator."
            )

        # 4. Complaint number generate karo
        complaint_number = self.complaint_repo.generate_complaint_number()

        # 5. SLA timing calculate karo
        now = datetime.now(timezone.utc)
        sla_deadline = now + timedelta(hours=SLA_FIRST_RESPONSE_HOURS)

        # 6. Complaint create karo
        complaint = self.complaint_repo.create_complaint(
            complaint_number=complaint_number,
            student_id=student.id,
            domain_id=domain.id,
            category_id=category_id,
            title=data.title,
            description=data.description,
            status=ComplaintStatus.SUBMITTED,
            current_escalation_level=1,
            sla_started_at=now,
            sla_deadline_at=sla_deadline,
            sla_status=SLAStatus.ON_TRACK,
        )

        # 7. Routing Engine — actual authority dhundo aur assign karo
        assigned_user = self._resolve_authority(routing_rule, student.department_id)

        if assigned_user:
            self.complaint_repo.create_assignment(
                complaint_id=complaint.id,
                assigned_user_id=assigned_user.id,
                routing_rule_id=routing_rule.id,
                escalation_level=1,
            )

        # 8. Event log banao (audit trail)
        self.complaint_repo.create_event(
            complaint_id=complaint.id,
            actor_user_id=current_user.id,
            event_type="COMPLAINT_SUBMITTED",
            new_status=ComplaintStatus.SUBMITTED.value,
            description=f"Complaint submitted by student.",
        )

        # Notification bhejo assigned authority ko
        if assigned_user:
            create_notification(
                self.db,
                user_id=assigned_user.id,
                complaint_id=complaint.id,
                notif_type="COMPLAINT_ASSIGNED",
                message=f"New complaint {complaint.complaint_number} has been assigned to you.",
            )
        return complaint

    def _resolve_authority(self, routing_rule, student_department_id):
        """
        RoutingRule batata hai 'kaunsa ROLE chahiye'.
        Ye function batata hai 'us role wala ACTUAL insaan kaun hai'.
        """
        if routing_rule.scope_type.value == "DEPARTMENT":
            # Student ke apne department ka wahi role wala staff dhundo
            return self.user_repo.find_staff_by_role_and_department(
                routing_rule.target_role_id, student_department_id
            )
        else:
            # GLOBAL scope — koi bhi department se related nahi, sirf role match karo
            return self.user_repo.find_staff_by_role_global(routing_rule.target_role_id)

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

        # ---------- STAFF ACTIONS ----------
        if data.action in ["start_review", "mark_action_taken"]:
            assignment = self.complaint_repo.get_active_assignment(complaint.id)
            if not assignment or assignment.assigned_user_id != current_user.id:
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
                self.complaint_repo.update_status(complaint, ComplaintStatus.PENDING_STUDENT_CONFIRMATION)

        # ---------- STUDENT ACTIONS ----------
        elif data.action in ["confirm_resolved", "reject_resolution"]:
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

            assignment = self.complaint_repo.get_active_assignment(complaint.id)

            if data.action == "confirm_resolved":
                self.complaint_repo.update_status(complaint, ComplaintStatus.RESOLVED)
                if assignment:
                    self.complaint_repo.end_assignment(assignment)

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
            new_assignment = self.complaint_repo.get_active_assignment(complaint.id)
            if new_assignment:
                create_notification(
                    self.db,
                    user_id=new_assignment.assigned_user_id,
                    complaint_id=complaint.id,
                    notif_type="COMPLAINT_ESCALATED",
                    message=f"Complaint {complaint.complaint_number} has been escalated to you.",
                )

        elif data.action == "mark_action_taken":
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

        if current_assignment:
            self.complaint_repo.end_assignment(current_assignment)

        next_authority = self._resolve_authority(routing_rule, student.department_id)

        if next_authority:
            self.complaint_repo.create_assignment(
                complaint_id=complaint.id,
                assigned_user_id=next_authority.id,
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
                complaints = self.complaint_repo.get_all_complaints()
                for c in complaints:
                    all_complaints[c.id] = c

            elif "complaint.view_department" in permissions and user_role.department_id:
                complaints = self.complaint_repo.get_department_complaints(user_role.department_id)
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
        return enriched

    def get_attachments(self, current_user: User, complaint_id: uuid.UUID):
        complaint = self.complaint_repo.get_by_id(complaint_id)
        if not complaint or not self._is_authorized_to_view(current_user, complaint):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        return self.complaint_repo.get_attachments_for_complaint(complaint_id)

    def _is_authorized_to_view(self, current_user: User, complaint) -> bool:
        if self.complaint_repo.is_user_authorized_for_complaint(complaint.id, current_user.id):
            return True

        role_repo = RoleRepository(self.db)
        user_roles = role_repo.get_user_roles(current_user.id)
        student = self.complaint_repo.get_student_by_id(complaint.student_id)

        for user_role in user_roles:
            permissions = role_repo.get_permissions_for_role(user_role.role_id)
            if "complaint.view_global" in permissions:
                return True
            if "complaint.view_department" in permissions and student and user_role.department_id == student.department_id:
                return True

        return False