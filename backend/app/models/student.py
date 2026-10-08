import uuid
from typing import Optional

from sqlalchemy import String, SmallInteger, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UUIDMixin, TimestampMixin
from app.utils.enums import StudentStatus


class StudentProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "students"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    student_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)

    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False
    )
    class_section_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("class_sections.id"), nullable=True
    )

    semester: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    academic_session: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    admission_year: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    status: Mapped[StudentStatus] = mapped_column(
        SAEnum(StudentStatus, name="student_status"), default=StudentStatus.ACTIVE
    )