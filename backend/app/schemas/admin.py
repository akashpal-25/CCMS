import uuid
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from app.utils.enums import ScopeType
from pydantic import EmailStr


def _clean_code(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    cleaned = value.strip().upper()
    if not cleaned:
        raise ValueError("Value cannot be empty.")
    return cleaned


def _clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    cleaned = " ".join(value.split())
    if not cleaned:
        raise ValueError("Value cannot be empty.")
    return cleaned


CODE_PATTERN = r"^[A-Za-z0-9_-]+$"
SECTION_PATTERN = r"^[A-Za-z0-9-]+$"


# ---------- DEPARTMENT ----------

class DepartmentCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=20, pattern=CODE_PATTERN)
    name: str = Field(min_length=3, max_length=150)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value):
        return _clean_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class DepartmentUpdateRequest(BaseModel):
    code: Optional[str] = Field(default=None, min_length=2, max_length=20, pattern=CODE_PATTERN)
    name: Optional[str] = Field(default=None, min_length=3, max_length=150)
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value):
        return _clean_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True


# ---------- COURSE ----------

class CourseCreateRequest(BaseModel):
    department_id: uuid.UUID
    code: str = Field(min_length=2, max_length=30, pattern=CODE_PATTERN)
    name: str = Field(min_length=2, max_length=150)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value):
        return _clean_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class CourseUpdateRequest(BaseModel):
    code: Optional[str] = Field(default=None, min_length=2, max_length=30, pattern=CODE_PATTERN)
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value):
        return _clean_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class CourseResponse(BaseModel):
    id: uuid.UUID
    department_id: uuid.UUID
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True


# ---------- CLASS SECTION ----------

class ClassSectionCreateRequest(BaseModel):
    course_id: uuid.UUID
    year_or_semester: int = Field(ge=1, le=12)
    section_name: str = Field(min_length=1, max_length=10, pattern=SECTION_PATTERN)

    @field_validator("section_name")
    @classmethod
    def normalize_section(cls, value):
        return _clean_code(value)


class ClassSectionUpdateRequest(BaseModel):
    section_name: Optional[str] = Field(default=None, min_length=1, max_length=10, pattern=SECTION_PATTERN)
    is_active: Optional[bool] = None

    @field_validator("section_name")
    @classmethod
    def normalize_section(cls, value):
        return _clean_code(value)


class ClassSectionResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    year_or_semester: int
    section_name: str
    is_active: bool

    class Config:
        from_attributes = True

# ---------- COMPLAINT DOMAIN ----------

class DomainCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=50, pattern=CODE_PATTERN)
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value):
        return _clean_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class DomainUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class DomainResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ---------- COMPLAINT CATEGORY ----------

class CategoryCreateRequest(BaseModel):
    domain_id: uuid.UUID
    code: str = Field(min_length=2, max_length=50, pattern=CODE_PATTERN)
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value):
        return _clean_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)


class CategoryResponse(BaseModel):
    id: uuid.UUID
    domain_id: uuid.UUID
    code: str
    name: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ---------- ROUTING RULE ----------

class RoutingRuleCreateRequest(BaseModel):
    domain_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    escalation_level: int = Field(ge=1, le=10)
    target_role_id: uuid.UUID
    scope_type: ScopeType


class RoutingRuleUpdateRequest(BaseModel):
    target_role_id: Optional[uuid.UUID] = None
    scope_type: Optional[ScopeType] = None
    is_active: Optional[bool] = None


class RoutingRuleResponse(BaseModel):
    id: uuid.UUID
    domain_id: uuid.UUID
    category_id: Optional[uuid.UUID]
    escalation_level: int
    target_role_id: uuid.UUID
    scope_type: ScopeType
    is_active: bool

    class Config:
        from_attributes = True


# ---------- ROLE (dropdown ke liye) ----------

class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ---------- STAFF CREATION ----------

class StaffCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    mobile_number: Optional[str] = Field(default=None, max_length=15)
    employee_id: Optional[str] = Field(default=None, min_length=2, max_length=30)
    designation: str = Field(min_length=2, max_length=100)
    department_id: Optional[uuid.UUID] = None

    role_id: uuid.UUID
    scope_type: ScopeType

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)

    @field_validator("employee_id")
    @classmethod
    def normalize_employee_id(cls, value):
        return _clean_code(value)


class StaffResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    employee_id: str
    designation: str
    department_id: Optional[uuid.UUID]
    role_name: str
    scope_type: ScopeType


# ---------- ROLE ASSIGNMENT (generic) ----------

class RoleAssignRequest(BaseModel):
    user_id: uuid.UUID
    role_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    scope_type: ScopeType


class UserRoleResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    department_id: Optional[uuid.UUID]
    scope_type: ScopeType

    class Config:
        from_attributes = True

class BulkImportRowError(BaseModel):
    row_number: int
    email: Optional[str] = None
    error: str


class BulkImportResult(BaseModel):
    total_rows: int
    success_count: int
    failed_count: int
    errors: list[BulkImportRowError]

class StudentCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    mobile_number: Optional[str] = Field(default=None, max_length=15)
    student_id: str = Field(min_length=2, max_length=30)
    department_id: uuid.UUID
    course_id: uuid.UUID
    class_section_id: Optional[uuid.UUID] = None
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    academic_session: Optional[str] = Field(default=None, max_length=20)
    admission_year: Optional[int] = Field(default=None, ge=2000, le=2100)

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value):
        return _clean_text(value)

    @field_validator("student_id")
    @classmethod
    def normalize_student_id(cls, value):
        return _clean_code(value)


class StudentResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    student_id: str
    department_id: uuid.UUID
    course_id: uuid.UUID
    class_section_id: Optional[uuid.UUID]

class UserListItemResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    roles: list[str] = []