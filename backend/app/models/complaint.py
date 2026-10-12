import uuid
from typing import Optional

from sqlalchemy import String, Boolean, Text, ForeignKey, SmallInteger, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UUIDMixin, TimestampMixin
from app.utils.enums import ScopeType
from datetime import datetime
from sqlalchemy import DateTime, Text

from app.utils.enums import ComplaintStatus, SLAStatus


class ComplaintDomain(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaint_domains"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class ComplaintCategory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaint_categories"

    domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_domains.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # STUDENT = students ko dikhegi | TEACHER = teacher form mein dikhegi | SYSTEM = kisi ko dropdown mein nahi dikhegi
    audience: Mapped[str] = mapped_column(String(20), default="STUDENT", server_default="STUDENT", nullable=False)

class RoutingRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "routing_rules"

    domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_domains.id"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_categories.id"), nullable=True)

    escalation_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    target_role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    scope_type: Mapped[ScopeType] = mapped_column(SAEnum(ScopeType, name="routing_scope_type"), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)    


    from datetime import datetime
from sqlalchemy import DateTime, Text

from app.utils.enums import ComplaintStatus, SLAStatus


class Complaint(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaints"

    complaint_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)

    # Student ki complaint mein student_id bhara hota hai; teacher ki complaint mein khali (NULL)
    student_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_domains.id"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_categories.id"), nullable=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[ComplaintStatus] = mapped_column(SAEnum(ComplaintStatus, name="complaint_status"), default=ComplaintStatus.SUBMITTED)
    current_escalation_level: Mapped[int] = mapped_column(SmallInteger, default=1)

    sla_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_deadline_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_status: Mapped[SLAStatus] = mapped_column(SAEnum(SLAStatus, name="sla_status"), default=SLAStatus.ON_TRACK)

    # STUDENT (purani complaints) | TEACHER (teacher ki apni complaint) | TEACHER_STUDENT_REPORT (teacher ne student ki report ki)
    complaint_type: Mapped[str] = mapped_column(String(30), default="STUDENT", server_default="STUDENT", nullable=False)
    filed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    subject_student_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    parent_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    whatsapp_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)


class ComplaintAssignment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "complaint_assignments"

    complaint_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False)
    assigned_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    routing_rule_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("routing_rules.id"), nullable=True)

    escalation_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class ComplaintEvent(Base, UUIDMixin):
    __tablename__ = "complaint_events"

    complaint_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False)
    actor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    previous_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")