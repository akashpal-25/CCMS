from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.repositories.complaint_repository import ComplaintRepository
from app.services.complaint_service import ComplaintService
from app.services.notification_service import create_notification
from app.utils.enums import ComplaintStatus, SLAStatus
from app.models.complaint import Complaint


def check_sla_breaches():
    """
    Background job: har complaint check karta hai jiska SLA deadline
    nikal chuka hai lekin abhi bhi SUBMITTED/UNDER_REVIEW state me hai.
    Aise complaints ko automatically escalate karta hai.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        breached_complaints = (
            db.query(Complaint)
            .filter(
                Complaint.status.in_([
                    ComplaintStatus.SUBMITTED,
                    ComplaintStatus.UNDER_REVIEW,
                    ComplaintStatus.ESCALATED,
                ]),
                Complaint.sla_deadline_at < now,
                Complaint.sla_status != SLAStatus.BREACHED,
            )
            .all()
        )

        print(f"[SLA CHECK] Found {len(breached_complaints)} breached complaint(s) at {now}")

        complaint_repo = ComplaintRepository(db)
        complaint_service = ComplaintService(db)

        for complaint in breached_complaints:
            complaint.sla_status = SLAStatus.BREACHED
            db.commit()

            assignment = complaint_repo.get_active_assignment(complaint.id)

            complaint_service._escalate(complaint, assignment)

            complaint_repo.create_event(
                complaint_id=complaint.id,
                actor_user_id=None,
                event_type="SLA_BREACH_AUTO_ESCALATED",
                previous_status=complaint.status.value,
                new_status=ComplaintStatus.ESCALATED.value,
                description="Automatically escalated due to SLA breach (no response within deadline).",
            )

            new_assignment = complaint_repo.get_active_assignment(complaint.id)
            if new_assignment:
                create_notification(
                    db,
                    user_id=new_assignment.assigned_user_id,
                    complaint_id=complaint.id,
                    notif_type="SLA_BREACH_ESCALATED",
                    message=f"Complaint {complaint.complaint_number} auto-escalated due to SLA breach.",
                )

            print(f"[SLA CHECK] Escalated complaint {complaint.complaint_number}")

    except Exception as e:
        print(f"[SLA CHECK] Error: {e}")
        db.rollback()
    finally:
        db.close()