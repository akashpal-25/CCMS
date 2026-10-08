from typing import Optional
from pydantic import BaseModel


class StudentMeResponse(BaseModel):
    student_id: str
    department_name: str
    course_name: str
    class_section: Optional[str] = None
    semester: Optional[int] = None
    academic_session: Optional[str] = None
    admission_year: Optional[int] = None
    status: str