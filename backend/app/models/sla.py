import uuid
from typing import Optional

from sqlalchemy import Boolean, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, UUIDMixin, TimestampMixin


class SLAPolicy(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sla_policies"

    domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_domains.id"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("complaint_categories.id"), nullable=True)

    first_response_hours: Mapped[int] = mapped_column(SmallInteger, default=72)
    escalation_hours: Mapped[int] = mapped_column(SmallInteger, default=48)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)