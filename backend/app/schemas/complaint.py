import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ComplaintCreateRequest(BaseModel):
    domain_code: str
    category_code: Optional[str] = None
    title: str
    description: str


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    complaint_number: str
    title: str
    description: str
    status: str
    current_escalation_level: int
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintListResponse(BaseModel):
    id: uuid.UUID
    complaint_number: str
    title: str
    status: str
    created_at: datetime
    sla_deadline_at: Optional[datetime] = None
    sla_status: Optional[str] = None
    domain_name: Optional[str] = None
    category_name: Optional[str] = None
    student_name: Optional[str] = None
    student_college_id: Optional[str] = None
    department_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_role: Optional[str] = None

class ComplaintActionRequest(BaseModel):
    action: str  # staff: "start_review", "mark_action_taken"
                 # student: "confirm_resolved", "reject_resolution"
    remarks: Optional[str] = None

class AttachmentResponse(BaseModel):
    id: uuid.UUID
    original_file_name: str
    mime_type: str
    file_size: int

    class Config:
        from_attributes = True

class ComplaintEventResponse(BaseModel):
    id: uuid.UUID
    event_type: str
    previous_status: Optional[str]
    new_status: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintDetailResponse(ComplaintListResponse):
    description: str
    current_escalation_level: int
    events: list[ComplaintEventResponse] = []