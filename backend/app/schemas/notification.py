import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    complaint_id: Optional[uuid.UUID]
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True