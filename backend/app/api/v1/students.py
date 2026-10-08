from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.student import StudentMeResponse

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me", response_model=StudentMeResponse)
def get_my_student_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.student import StudentProfile
    from app.models.department import Department, Course, ClassSection

    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")

    department = db.query(Department).filter(Department.id == student.department_id).first()
    course = db.query(Course).filter(Course.id == student.course_id).first()
    section = None
    if student.class_section_id:
        section = db.query(ClassSection).filter(ClassSection.id == student.class_section_id).first()

    return {
        "student_id": student.student_id,
        "department_name": department.name if department else "",
        "course_name": course.name if course else "",
        "class_section": section.section_name if section else None,
        "semester": student.semester,
        "academic_session": student.academic_session,
        "admission_year": student.admission_year,
        "status": student.status.value if hasattr(student.status, "value") else student.status,
    }