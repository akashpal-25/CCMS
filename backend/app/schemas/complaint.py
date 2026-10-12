import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


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
    student_course_name: Optional[str] = None
    student_semester: Optional[int] = None
    student_section: Optional[str] = None
    department_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_role: Optional[str] = None
    complaint_type: Optional[str] = "STUDENT"
    filed_by_name: Optional[str] = None
    whatsapp_status: Optional[str] = None

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
    # Kya abhi dekhne wala user is complaint par action (review / action taken) kar sakta hai
    viewer_can_act: bool = True


# ---------- TEACHER COMPLAINTS ----------

class TeacherComplaintCreateRequest(BaseModel):
    """Teacher ki apni complaint: koi dropdown nahi, sirf category (general/hod), title, description."""
    category_code: str
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10)


class StudentReportCreateRequest(BaseModel):
    """Teacher ki taraf se student ki complaint/report (HOD + parent ko jati hai)."""
    department_id: uuid.UUID
    course_id: uuid.UUID
    class_section_id: uuid.UUID
    roll_no: str = Field(min_length=2, max_length=30)
    parent_phone: str
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10)

    @field_validator("roll_no")
    @classmethod
    def clean_roll_no(cls, value):
        return value.strip()

    @field_validator("parent_phone")
    @classmethod
    def valid_phone(cls, value):
        from app.services.whatsapp_service import normalize_phone
        normalized = normalize_phone(value)
        if not normalized:
            raise ValueError("Enter a valid parent phone number (10-digit mobile number).")
        return normalized
