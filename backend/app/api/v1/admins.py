import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import require_permission
from app.models.user import User
from app.schemas.admin import (
    DepartmentCreateRequest, DepartmentUpdateRequest, DepartmentResponse,
    CourseCreateRequest, CourseUpdateRequest, CourseResponse,
    ClassSectionCreateRequest, ClassSectionUpdateRequest, ClassSectionResponse,
    DomainCreateRequest, DomainUpdateRequest, DomainResponse,
    CategoryCreateRequest, CategoryUpdateRequest, CategoryResponse,
    RoutingRuleCreateRequest, RoutingRuleUpdateRequest, RoutingRuleResponse,
    RoleResponse, StaffCreateRequest, StaffResponse,
    RoleAssignRequest, UserRoleResponse, BulkImportResult,StudentCreateRequest, StudentResponse, UserListItemResponse,
    ClassTeacherItem, ClassTeacherAssignRequest,
    RoleCreateRequest, RoleUpdateRequest, PermissionResponse,
    RolePermissionsUpdateRequest, RolePermissionsResponse,
)
from app.services.admin_service import AdminService


router = APIRouter(prefix="/admin", tags=["Super Admin"])


# ---------- DEPARTMENTS ----------

@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(
    current_user: User = Depends(require_permission("department.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_departments()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreateRequest,
    current_user: User = Depends(require_permission("department.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_department(current_user, data)


@router.patch("/departments/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: uuid.UUID,
    data: DepartmentUpdateRequest,
    current_user: User = Depends(require_permission("department.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_department(current_user, department_id, data)


# ---------- COURSES ----------

@router.get("/courses", response_model=list[CourseResponse])
def list_courses(
    department_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(require_permission("course.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_courses(department_id)


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreateRequest,
    current_user: User = Depends(require_permission("course.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_course(current_user, data)


@router.patch("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: uuid.UUID,
    data: CourseUpdateRequest,
    current_user: User = Depends(require_permission("course.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_course(current_user, course_id, data)


# ---------- CLASS SECTIONS ----------

@router.get("/class-sections", response_model=list[ClassSectionResponse])
def list_class_sections(
    course_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(require_permission("course.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_class_sections(course_id)


@router.post("/class-sections", response_model=ClassSectionResponse, status_code=status.HTTP_201_CREATED)
def create_class_section(
    data: ClassSectionCreateRequest,
    current_user: User = Depends(require_permission("course.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_class_section(current_user, data)


@router.patch("/class-sections/{section_id}", response_model=ClassSectionResponse)
def update_class_section(
    section_id: uuid.UUID,
    data: ClassSectionUpdateRequest,
    current_user: User = Depends(require_permission("course.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_class_section(current_user, section_id, data)

# ---------- COMPLAINT DOMAINS ----------

@router.get("/domains", response_model=list[DomainResponse])
def list_domains(
    current_user: User = Depends(require_permission("domain.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_domains()


@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
def create_domain(
    data: DomainCreateRequest,
    current_user: User = Depends(require_permission("domain.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_domain(current_user, data)


@router.patch("/domains/{domain_id}", response_model=DomainResponse)
def update_domain(
    domain_id: uuid.UUID,
    data: DomainUpdateRequest,
    current_user: User = Depends(require_permission("domain.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_domain(current_user, domain_id, data)


# ---------- COMPLAINT CATEGORIES ----------

@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(
    domain_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(require_permission("domain.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_categories(domain_id)


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreateRequest,
    current_user: User = Depends(require_permission("domain.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_category(current_user, data)


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdateRequest,
    current_user: User = Depends(require_permission("domain.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_category(current_user, category_id, data)

# ---------- ROLES (dropdown helper) ----------

@router.get("/roles", response_model=list[RoleResponse])
def list_roles(
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_roles()


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    data: RoleCreateRequest,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_role(current_user, data)


@router.patch("/roles/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: uuid.UUID,
    data: RoleUpdateRequest,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_role(current_user, role_id, data)


@router.get("/permissions", response_model=list[PermissionResponse])
def list_permissions(
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_permissions()


@router.get("/roles/{role_id}/permissions", response_model=RolePermissionsResponse)
def get_role_permissions(
    role_id: uuid.UUID,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).get_role_permissions(role_id)


@router.put("/roles/{role_id}/permissions", response_model=RolePermissionsResponse)
def set_role_permissions(
    role_id: uuid.UUID,
    data: RolePermissionsUpdateRequest,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).set_role_permissions(current_user, role_id, data.permission_codes)


# ---------- CLASS TEACHERS ----------

@router.get("/class-teachers", response_model=list[ClassTeacherItem])
def list_class_teachers(
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_class_teachers()


@router.put("/class-teachers/{section_id}")
def set_class_teacher(
    section_id: uuid.UUID,
    data: ClassTeacherAssignRequest,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).set_class_teacher(current_user, section_id, data.user_id)


@router.delete("/class-teachers/{section_id}")
def remove_class_teacher(
    section_id: uuid.UUID,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).remove_class_teacher(current_user, section_id)


# ---------- ROUTING RULES ----------

@router.get("/routing-rules", response_model=list[RoutingRuleResponse])
def list_routing_rules(
    domain_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_routing_rules(domain_id)


@router.post("/routing-rules", response_model=RoutingRuleResponse, status_code=status.HTTP_201_CREATED)
def create_routing_rule(
    data: RoutingRuleCreateRequest,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_routing_rule(current_user, data)


@router.patch("/routing-rules/{rule_id}", response_model=RoutingRuleResponse)
def update_routing_rule(
    rule_id: uuid.UUID,
    data: RoutingRuleUpdateRequest,
    current_user: User = Depends(require_permission("routing.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).update_routing_rule(current_user, rule_id, data)

# ---------- STAFF & ROLE MANAGEMENT ----------

@router.post("/staff", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    data: StaffCreateRequest,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_staff(current_user, data)


@router.post("/roles/assign", response_model=UserRoleResponse, status_code=status.HTTP_201_CREATED)
def assign_role(
    data: RoleAssignRequest,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).assign_role(current_user, data)


@router.post("/students/{user_id}/ensure-role", response_model=UserRoleResponse)
def ensure_student_role(
    user_id: uuid.UUID,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).ensure_student_role(current_user, user_id)

@router.post("/students/bulk-import", response_model=BulkImportResult)
def bulk_import_students(
    file: UploadFile = File(...),
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files are allowed.")

    content = file.file.read().decode("utf-8-sig")
    return AdminService(db).import_students_csv(current_user, content)

@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreateRequest,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).create_student(current_user, data)

@router.get("/users", response_model=list[UserListItemResponse])
def list_users(
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    return AdminService(db).list_users()


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: uuid.UUID,
    current_user: User = Depends(require_permission("user.manage")),
    db: Session = Depends(get_db),
):
    user = AdminService(db).toggle_user_active(current_user, user_id)
    return {"id": user.id, "is_active": user.is_active}