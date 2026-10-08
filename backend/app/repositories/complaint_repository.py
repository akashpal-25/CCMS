import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.complaint import ComplaintDomain, ComplaintCategory, Complaint, RoutingRule
from app.models.student import StudentProfile


class ComplaintRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_domain_by_code(self, code: str) -> Optional[ComplaintDomain]:
        return self.db.query(ComplaintDomain).filter(
            ComplaintDomain.code == code, ComplaintDomain.is_active == True
        ).first()

    def get_category_by_code(self, code: str) -> Optional[ComplaintCategory]:
        return self.db.query(ComplaintCategory).filter(
            ComplaintCategory.code == code, ComplaintCategory.is_active == True
        ).first()

    def get_student_profile_by_user_id(self, user_id: uuid.UUID) -> Optional[StudentProfile]:
        return self.db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()

    def get_routing_rule(self, domain_id: uuid.UUID, category_id: Optional[uuid.UUID], level: int) -> Optional[RoutingRule]:
        # Pehle specific category ka rule dhundo
        if category_id:
            rule = self.db.query(RoutingRule).filter(
                RoutingRule.domain_id == domain_id,
                RoutingRule.category_id == category_id,
                RoutingRule.escalation_level == level,
                RoutingRule.is_active == True,
            ).first()
            if rule:
                return rule

        # Nahi mila to domain-level default rule dhundo
        return self.db.query(RoutingRule).filter(
            RoutingRule.domain_id == domain_id,
            RoutingRule.category_id.is_(None),
            RoutingRule.escalation_level == level,
            RoutingRule.is_active == True,
        ).first()

    def generate_complaint_number(self) -> str:
        from sqlalchemy import text
        from datetime import datetime, timezone
        result = self.db.execute(text("SELECT nextval('complaint_number_seq')")).scalar()
        year = datetime.now(timezone.utc).year
        return f"CCMS-{year}-{result:06d}"

    def create_complaint(self, **kwargs) -> Complaint:
        complaint = Complaint(**kwargs)
        self.db.add(complaint)
        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def get_by_id(self, complaint_id: uuid.UUID) -> Optional[Complaint]:
        return self.db.query(Complaint).filter(Complaint.id == complaint_id).first()

    def get_complaints_by_student(self, student_id: uuid.UUID) -> list[Complaint]:
        return self.db.query(Complaint).filter(Complaint.student_id == student_id).order_by(Complaint.created_at.desc()).all()

    def create_assignment(self, **kwargs):
        from app.models.complaint import ComplaintAssignment
        assignment = ComplaintAssignment(**kwargs)
        self.db.add(assignment)
        self.db.commit()
        return assignment

    def create_event(self, **kwargs):
        from app.models.complaint import ComplaintEvent
        event = ComplaintEvent(**kwargs)
        self.db.add(event)
        self.db.commit()
        return event

    def update_status(self, complaint, new_status, new_level=None):
        complaint.status = new_status
        if new_level is not None:
            complaint.current_escalation_level = new_level
        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def get_active_assignment(self, complaint_id):
        from app.models.complaint import ComplaintAssignment
        return self.db.query(ComplaintAssignment).filter(
            ComplaintAssignment.complaint_id == complaint_id,
            ComplaintAssignment.is_active == True,
        ).first()

    def end_assignment(self, assignment):
        from datetime import datetime, timezone
        assignment.is_active = False
        assignment.ended_at = datetime.now(timezone.utc)
        self.db.commit()

    def get_student_by_id(self, student_id):
        from app.models.student import StudentProfile
        return self.db.query(StudentProfile).filter(StudentProfile.id == student_id).first()

    def create_attachment(self, **kwargs):
        from app.models.attachment import ComplaintAttachment
        attachment = ComplaintAttachment(**kwargs)
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        return attachment

    def get_attachment_by_id(self, attachment_id):
        from app.models.attachment import ComplaintAttachment
        return self.db.query(ComplaintAttachment).filter(ComplaintAttachment.id == attachment_id).first()

    def is_user_authorized_for_complaint(self, complaint_id, user_id) -> bool:
        complaint = self.get_by_id(complaint_id)
        if not complaint:
            return False

        student = self.get_student_by_id(complaint.student_id)
        if student and student.user_id == user_id:
            return True

        assignment = self.get_active_assignment(complaint_id)
        if assignment and assignment.assigned_user_id == user_id:
            return True

        # Purane assignees (history me kabhi assign the) bhi dekh sakte hain
        all_assignees = self.get_all_assignees(complaint_id)
        if user_id in all_assignees:
            return True

        return False

    def get_assigned_complaints(self, user_id):
        from app.models.complaint import ComplaintAssignment
        return (
            self.db.query(Complaint)
            .join(ComplaintAssignment, ComplaintAssignment.complaint_id == Complaint.id)
            .filter(
                ComplaintAssignment.assigned_user_id == user_id,
                ComplaintAssignment.is_active == True,
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )

    def get_all_assignees(self, complaint_id):
        from app.models.complaint import ComplaintAssignment
        assignments = self.db.query(ComplaintAssignment).filter(
            ComplaintAssignment.complaint_id == complaint_id
        ).all()
        user_ids = list(set(a.assigned_user_id for a in assignments))
        return user_ids

    def get_department_complaints(self, department_id):
        from app.models.student import StudentProfile
        return (
            self.db.query(Complaint)
            .join(StudentProfile, StudentProfile.id == Complaint.student_id)
            .filter(StudentProfile.department_id == department_id)
            .order_by(Complaint.created_at.desc())
            .all()
        )

    def get_all_complaints(self):
        return self.db.query(Complaint).order_by(Complaint.created_at.desc()).all()

    def get_events_for_complaint(self, complaint_id):
        from app.models.complaint import ComplaintEvent
        return (
            self.db.query(ComplaintEvent)
            .filter(ComplaintEvent.complaint_id == complaint_id)
            .order_by(ComplaintEvent.created_at.asc())
            .all()
        )

    def get_attachments_for_complaint(self, complaint_id):
        from app.models.attachment import ComplaintAttachment
        return self.db.query(ComplaintAttachment).filter(
            ComplaintAttachment.complaint_id == complaint_id
        ).all()

    def enrich_complaint(self, complaint) -> dict:
        from app.models.complaint import ComplaintDomain, ComplaintCategory, RoutingRule
        from app.models.student import StudentProfile
        from app.models.department import Department
        from app.models.user import User
        from app.models.role import Role

        domain = self.db.query(ComplaintDomain).filter(ComplaintDomain.id == complaint.domain_id).first()
        category = None
        if complaint.category_id:
            category = self.db.query(ComplaintCategory).filter(ComplaintCategory.id == complaint.category_id).first()

        student = self.db.query(StudentProfile).filter(StudentProfile.id == complaint.student_id).first()
        student_user = None
        department = None
        if student:
            student_user = self.db.query(User).filter(User.id == student.user_id).first()
            department = self.db.query(Department).filter(Department.id == student.department_id).first()

        assignment = self.get_active_assignment(complaint.id)
        assigned_name = None
        assigned_role = None
        if assignment:
            assigned_user = self.db.query(User).filter(User.id == assignment.assigned_user_id).first()
            assigned_name = assigned_user.full_name if assigned_user else None
            if assignment.routing_rule_id:
                rule = self.db.query(RoutingRule).filter(RoutingRule.id == assignment.routing_rule_id).first()
                if rule:
                    role = self.db.query(Role).filter(Role.id == rule.target_role_id).first()
                    assigned_role = role.name if role else None

        return {
            "id": complaint.id,
            "complaint_number": complaint.complaint_number,
            "title": complaint.title,
            "description": complaint.description,
            "status": complaint.status.value if hasattr(complaint.status, "value") else complaint.status,
            "current_escalation_level": complaint.current_escalation_level,
            "created_at": complaint.created_at,
            "sla_deadline_at": complaint.sla_deadline_at,
            "sla_status": complaint.sla_status.value if hasattr(complaint.sla_status, "value") else complaint.sla_status,
            "domain_name": domain.name if domain else None,
            "category_name": category.name if category else None,
            "student_name": student_user.full_name if student_user else None,
            "student_college_id": student.student_id if student else None,
            "department_name": department.name if department else None,
            "assigned_to_name": assigned_name,
            "assigned_to_role": assigned_role,
        }

    def enrich_complaints(self, complaints: list) -> list[dict]:
        return [self.enrich_complaint(c) for c in complaints]