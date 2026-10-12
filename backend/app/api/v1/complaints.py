import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_permission
from app.models.user import User
from app.services.complaint_service import ComplaintService
from app.schemas.complaint import ComplaintCreateRequest, ComplaintResponse, ComplaintListResponse, ComplaintActionRequest

from fastapi import UploadFile, File
from fastapi.responses import FileResponse
from app.schemas.complaint import AttachmentResponse
from app.schemas.complaint import (
    TeacherComplaintCreateRequest,
    StudentReportCreateRequest,
    ComplaintCreateRequest,
    ComplaintResponse,
    ComplaintListResponse,
    ComplaintActionRequest,
    ComplaintDetailResponse,
    AttachmentResponse,
)
from app.schemas.admin import DomainResponse, CategoryResponse

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("/domains", response_model=list[DomainResponse])
def list_active_domains(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.complaint import ComplaintDomain
    return db.query(ComplaintDomain).filter(ComplaintDomain.is_active == True).order_by(ComplaintDomain.name).all()


@router.get("/categories", response_model=list[CategoryResponse])
def list_active_categories(
    domain_code: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.complaint import ComplaintDomain, ComplaintCategory
    query = db.query(ComplaintCategory).filter(
        ComplaintCategory.is_active == True,
        ComplaintCategory.audience == "STUDENT",
    )
    if domain_code:
        domain = db.query(ComplaintDomain).filter(ComplaintDomain.code == domain_code).first()
        if domain:
            query = query.filter(ComplaintCategory.domain_id == domain.id)
    return query.order_by(ComplaintCategory.name).all()


@router.post("/", response_model=ComplaintResponse)
def submit_complaint(
    data: ComplaintCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    complaint = service.submit_complaint(current_user, data)
    return complaint


@router.get("/my", response_model=list[ComplaintListResponse])
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.get_my_complaints(current_user)

# ---------- TEACHER COMPLAINTS ----------
# (ye routes "/{complaint_id}" wale routes se pehle rakhe hain)

@router.get("/teacher/categories", response_model=list[CategoryResponse])
def list_teacher_categories(
    current_user: User = Depends(require_permission("complaint.file_as_staff")),
    db: Session = Depends(get_db),
):
    return ComplaintService(db).get_teacher_categories()


@router.post("/teacher/complaint", response_model=ComplaintResponse)
def file_teacher_complaint(
    data: TeacherComplaintCreateRequest,
    current_user: User = Depends(require_permission("complaint.file_as_staff")),
    db: Session = Depends(get_db),
):
    return ComplaintService(db).file_teacher_complaint(current_user, data)


@router.post("/teacher/student-report", response_model=ComplaintResponse)
def file_student_report(
    data: StudentReportCreateRequest,
    current_user: User = Depends(require_permission("complaint.file_as_staff")),
    db: Session = Depends(get_db),
):
    return ComplaintService(db).file_student_report(current_user, data)


@router.get("/teacher/my", response_model=list[ComplaintListResponse])
def get_teacher_complaints(
    current_user: User = Depends(require_permission("complaint.file_as_staff")),
    db: Session = Depends(get_db),
):
    return ComplaintService(db).get_teacher_complaints(current_user)


@router.post("/{complaint_id}/action", response_model=ComplaintResponse)
def complaint_action(
    complaint_id: uuid.UUID,
    data: ComplaintActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.perform_action(current_user, complaint_id, data)

@router.post("/{complaint_id}/attachments", response_model=AttachmentResponse)
def upload_attachment(
    complaint_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.upload_attachment(current_user, complaint_id, file)


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    attachment = service.download_attachment(current_user, attachment_id)
    return FileResponse(
        path=attachment.storage_key,
        filename=attachment.original_file_name,
        media_type=attachment.mime_type,
    )

@router.get("/assigned-to-me", response_model=list[ComplaintListResponse])
def get_assigned_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.get_assigned_complaints(current_user)

@router.get("/department-view", response_model=list[ComplaintListResponse])
def get_department_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.get_visible_complaints(current_user)

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.get_complaint_detail(current_user, complaint_id)

@router.get("/{complaint_id}/attachments", response_model=list[AttachmentResponse])
def list_attachments(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ComplaintService(db)
    return service.get_attachments(current_user, complaint_id)

