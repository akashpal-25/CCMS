import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UUIDMixin, TimestampMixin


class ClassTeacherAssignment(Base, UUIDMixin, TimestampMixin):
    """
    Ek class section ka sirf EK class teacher (class_section_id unique hai).
    Ek teacher ke paas multiple sections ho sakte hain.
    """
    __tablename__ = "class_teacher_assignments"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    class_section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("class_sections.id"), nullable=False, unique=True
    )
