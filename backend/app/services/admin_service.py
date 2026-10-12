import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.department import Department, Course, ClassSection
from app.repositories.admin_repository import AdminRepository
from app.repositories.user_repository import AuditLogRepository
from app.models.role import Role

from app.utils.enums import ScopeType

class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdminRepository(db)
        self.audit_repo = AuditLogRepository(db)

    # ---------- HELPERS ----------

    @staticmethod
    def _clean_changes(data) -> dict:
        changes = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        if not changes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided to update."
            )
        return changes

    @staticmethod
    def _conflict(message: str):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)

    @staticmethod
    def _department_snapshot(dept: Department) -> dict:
        return {"code": dept.code, "name": dept.name, "is_active": dept.is_active}

    @staticmethod
    def _course_snapshot(course: Course) -> dict:
        return {
            "department_id": str(course.department_id),
            "code": course.code,
            "name": course.name,
            "is_active": course.is_active,
        }

    @staticmethod
    def _section_snapshot(section: ClassSection) -> dict:
        return {
            "course_id": str(section.course_id),
            "year_or_semester": section.year_or_semester,
            "section_name": section.section_name,
            "is_active": section.is_active,
        }

    def _audit(self, actor: User, action: str, entity_type: str, entity_id, old=None, new=None):
        self.audit_repo.log(
            actor_user_id=actor.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old,
            new_value=new,
        )

    def _get_department_or_404(self, department_id: uuid.UUID) -> Department:
        department = self.repo.get_department_by_id(department_id)
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")
        return department

    def _get_course_or_404(self, course_id: uuid.UUID) -> Course:
        course = self.repo.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
        return course

    def _get_section_or_404(self, section_id: uuid.UUID) -> ClassSection:
        section = self.repo.get_class_section_by_id(section_id)
        if not section:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class section not found.")
        return section

    # ---------- DEPARTMENTS ----------

    def list_departments(self):
        return self.repo.list_departments()

    def create_department(self, actor: User, data) -> Department:
        if self.repo.get_department_by_code(data.code):
            raise self._conflict(f"Department code '{data.code}' already exists.")
        if self.repo.get_department_by_name(data.name):
            raise self._conflict(f"Department name '{data.name}' already exists.")

        department = self.repo.create_department(code=data.code, name=data.name)
        self._audit(actor, "DEPARTMENT_CREATED", "Department", department.id,
                    new=self._department_snapshot(department))
        return department

    def update_department(self, actor: User, department_id: uuid.UUID, data) -> Department:
        department = self._get_department_or_404(department_id)
        changes = self._clean_changes(data)
        old = self._department_snapshot(department)

        if "code" in changes:
            existing = self.repo.get_department_by_code(changes["code"])
            if existing and existing.id != department.id:
                raise self._conflict(f"Department code '{changes['code']}' already exists.")

        if "name" in changes:
            existing = self.repo.get_department_by_name(changes["name"])
            if existing and existing.id != department.id:
                raise self._conflict(f"Department name '{changes['name']}' already exists.")

        for field, value in changes.items():
            setattr(department, field, value)
        department = self.repo.save(department)

        self._audit(actor, "DEPARTMENT_UPDATED", "Department", department.id,
                    old=old, new=self._department_snapshot(department))
        return department

    # ---------- COURSES ----------

    def list_courses(self, department_id=None):
        return self.repo.list_courses(department_id)

    def create_course(self, actor: User, data) -> Course:
        department = self._get_department_or_404(data.department_id)
        if not department.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add a course to an inactive department."
            )

        if self.repo.get_course_by_code(data.code):
            raise self._conflict(f"Course code '{data.code}' already exists.")
        if self.repo.get_course_by_name_in_department(department.id, data.name):
            raise self._conflict(f"Course '{data.name}' already exists in this department.")

        course = self.repo.create_course(department_id=department.id, code=data.code, name=data.name)
        self._audit(actor, "COURSE_CREATED", "Course", course.id, new=self._course_snapshot(course))
        return course

    def update_course(self, actor: User, course_id: uuid.UUID, data) -> Course:
        course = self._get_course_or_404(course_id)
        changes = self._clean_changes(data)
        old = self._course_snapshot(course)

        if "code" in changes:
            existing = self.repo.get_course_by_code(changes["code"])
            if existing and existing.id != course.id:
                raise self._conflict(f"Course code '{changes['code']}' already exists.")

        if "name" in changes:
            existing = self.repo.get_course_by_name_in_department(course.department_id, changes["name"])
            if existing and existing.id != course.id:
                raise self._conflict(f"Course '{changes['name']}' already exists in this department.")

        for field, value in changes.items():
            setattr(course, field, value)
        course = self.repo.save(course)

        self._audit(actor, "COURSE_UPDATED", "Course", course.id,
                    old=old, new=self._course_snapshot(course))
        return course

    # ---------- CLASS SECTIONS ----------

    def list_class_sections(self, course_id=None):
        return self.repo.list_class_sections(course_id)

    def create_class_section(self, actor: User, data) -> ClassSection:
        course = self._get_course_or_404(data.course_id)
        if not course.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add a section to an inactive course."
            )

        if self.repo.find_class_section(course.id, data.year_or_semester, data.section_name):
            raise self._conflict("This section already exists for the given course and year/semester.")

        section = self.repo.create_class_section(
            course_id=course.id,
            year_or_semester=data.year_or_semester,
            section_name=data.section_name,
        )
        self._audit(actor, "CLASS_SECTION_CREATED", "ClassSection", section.id,
                    new=self._section_snapshot(section))
        return section

    def update_class_section(self, actor: User, section_id: uuid.UUID, data) -> ClassSection:
        section = self._get_section_or_404(section_id)
        changes = self._clean_changes(data)
        old = self._section_snapshot(section)

        if "section_name" in changes:
            existing = self.repo.find_class_section(
                section.course_id, section.year_or_semester, changes["section_name"]
            )
            if existing and existing.id != section.id:
                raise self._conflict("This section already exists for the given course and year/semester.")

        for field, value in changes.items():
            setattr(section, field, value)
        section = self.repo.save(section)

        self._audit(actor, "CLASS_SECTION_UPDATED", "ClassSection", section.id,
                    old=old, new=self._section_snapshot(section))
        return section

    @staticmethod
    def _domain_snapshot(domain) -> dict:
        return {"code": domain.code, "name": domain.name, "description": domain.description, "is_active": domain.is_active}

    @staticmethod
    def _category_snapshot(category) -> dict:
        return {
            "domain_id": str(category.domain_id),
            "code": category.code,
            "name": category.name,
            "description": category.description,
            "is_active": category.is_active,
        }

    def _get_domain_or_404(self, domain_id: uuid.UUID):
        domain = self.repo.get_domain_by_id(domain_id)
        if not domain:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found.")
        return domain

    def _get_category_or_404(self, category_id: uuid.UUID):
        category = self.repo.get_category_by_id(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        return category

    # ---------- DOMAINS ----------

    def list_domains(self):
        return self.repo.list_domains()

    def create_domain(self, actor: User, data):
        if self.repo.get_domain_by_code(data.code):
            raise self._conflict(f"Domain code '{data.code}' already exists.")

        domain = self.repo.create_domain(code=data.code, name=data.name, description=data.description)
        self._audit(actor, "DOMAIN_CREATED", "ComplaintDomain", domain.id, new=self._domain_snapshot(domain))
        return domain

    def update_domain(self, actor: User, domain_id: uuid.UUID, data):
        domain = self._get_domain_or_404(domain_id)
        changes = self._clean_changes(data)
        old = self._domain_snapshot(domain)

        was_active = domain.is_active
        for field, value in changes.items():
            setattr(domain, field, value)
        domain = self.repo.save(domain)

        if was_active and changes.get("is_active") is False:
            self.repo.deactivate_categories_for_domain(domain.id)

        self._audit(actor, "DOMAIN_UPDATED", "ComplaintDomain", domain.id, old=old, new=self._domain_snapshot(domain))
        return domain

    # ---------- CATEGORIES ----------

    def list_categories(self, domain_id=None):
        return self.repo.list_categories(domain_id)

    def create_category(self, actor: User, data):
        domain = self._get_domain_or_404(data.domain_id)
        if not domain.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add a category to an inactive domain."
            )

        if self.repo.get_category_by_code(data.code):
            raise self._conflict(f"Category code '{data.code}' already exists.")

        category = self.repo.create_category(
            domain_id=domain.id, code=data.code, name=data.name, description=data.description
        )
        self._audit(actor, "CATEGORY_CREATED", "ComplaintCategory", category.id, new=self._category_snapshot(category))
        return category

    def update_category(self, actor: User, category_id: uuid.UUID, data):
        category = self._get_category_or_404(category_id)
        changes = self._clean_changes(data)
        old = self._category_snapshot(category)

        for field, value in changes.items():
            setattr(category, field, value)
        category = self.repo.save(category)

        self._audit(actor, "CATEGORY_UPDATED", "ComplaintCategory", category.id, old=old, new=self._category_snapshot(category))
        return category

    @staticmethod
    def _routing_rule_snapshot(rule) -> dict:
        return {
            "domain_id": str(rule.domain_id),
            "category_id": str(rule.category_id) if rule.category_id else None,
            "escalation_level": rule.escalation_level,
            "target_role_id": str(rule.target_role_id),
            "scope_type": rule.scope_type.value,
            "is_active": rule.is_active,
        }

    def list_roles(self):
        return self.repo.list_roles()

    def list_routing_rules(self, domain_id=None):
        return self.repo.list_routing_rules(domain_id)

    def create_routing_rule(self, actor: User, data):
        domain = self._get_domain_or_404(data.domain_id)
        if not domain.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add a routing rule to an inactive domain."
            )

        if data.category_id:
            category = self._get_category_or_404(data.category_id)
            if category.domain_id != domain.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This category does not belong to the given domain."
                )

        role = self.repo.get_role_by_id(data.target_role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")

        existing = self.repo.find_exact_rule(data.domain_id, data.category_id, data.escalation_level)
        if existing:
            raise self._conflict(
                "A routing rule already exists for this domain/category/escalation level combination."
            )

        rule = self.repo.create_routing_rule(
            domain_id=data.domain_id,
            category_id=data.category_id,
            escalation_level=data.escalation_level,
            target_role_id=data.target_role_id,
            scope_type=data.scope_type,
        )
        self._audit(actor, "ROUTING_RULE_CREATED", "RoutingRule", rule.id, new=self._routing_rule_snapshot(rule))
        return rule

    def update_routing_rule(self, actor: User, rule_id: uuid.UUID, data):
        from app.models.complaint import RoutingRule
        rule = self.repo.get_routing_rule_by_id(rule_id)
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routing rule not found.")

        changes = self._clean_changes(data)
        old = self._routing_rule_snapshot(rule)

        if "target_role_id" in changes:
            role = self.repo.get_role_by_id(changes["target_role_id"])
            if not role:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")

        for field, value in changes.items():
            setattr(rule, field, value)
        rule = self.repo.save(rule)

        self._audit(actor, "ROUTING_RULE_UPDATED", "RoutingRule", rule.id, old=old, new=self._routing_rule_snapshot(rule))
        return rule

    STUDENT_ROLE_NAME = "STUDENT"

    def _resolve_scope(self, scope_type, department_id):
        if scope_type == ScopeType.DEPARTMENT and not department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="department_id is required when scope_type is DEPARTMENT."
            )
        if scope_type == ScopeType.GLOBAL:
            department_id = None
        return department_id

    CLASS_TEACHER_ROLE_NAME = "CLASS_TEACHER"
    # In roles ko department zaroori hai (GLOBAL scope allowed nahi)
    DEPARTMENT_ONLY_ROLES = {"CLASS_TEACHER", "TEACHER"}

    # In roles ke liye domain ka matlab nahi (class teacher apni class, teacher apni complaint, super admin sab)
    NO_DOMAIN_ROLES = {"CLASS_TEACHER", "TEACHER", "SUPER_ADMIN"}

    def _resolve_domain(self, role, domain_id):
        """Staff ki domain: valid ho to uska id, nahi to None (None = sab domains)."""
        if role.name in self.NO_DOMAIN_ROLES or not domain_id:
            return None
        return self._get_domain_or_404(domain_id).id

    def _prepare_class_teacher(self, role, scope_type, class_section_id):
        """
        Role CLASS_TEACHER ho to class section check karta hai.
        Returns (section, department_id). Baaki roles ke liye (None, None).
        """
        if role.name != self.CLASS_TEACHER_ROLE_NAME:
            return None, None

        if scope_type != ScopeType.DEPARTMENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class Teacher must have DEPARTMENT scope."
            )
        if not class_section_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department, course, semester and section are required for a Class Teacher."
            )
        section = self._get_section_or_404(class_section_id)
        course = self._get_course_or_404(section.course_id)

        from app.models.class_teacher import ClassTeacherAssignment
        existing = self.db.query(ClassTeacherAssignment).filter(
            ClassTeacherAssignment.class_section_id == section.id
        ).first()
        if existing:
            teacher = self.repo.get_user_by_id(existing.user_id)
            raise self._conflict(
                f"This class already has a Class Teacher ({teacher.full_name if teacher else 'unknown'}). "
                "Only one class teacher is allowed per class."
            )
        return section, course.department_id

    def _save_class_teacher(self, user_id, section_id):
        from app.models.class_teacher import ClassTeacherAssignment
        row = ClassTeacherAssignment(user_id=user_id, class_section_id=section_id)
        return self.repo.save(row)

    def create_staff(self, actor: User, data):
        if self.repo.get_user_by_email(data.email):
            raise self._conflict(f"A user with email '{data.email}' already exists.")

        employee_id = data.employee_id
        if employee_id:
            if self.repo.get_staff_profile_by_employee_id(employee_id):
                raise self._conflict(f"Employee ID '{employee_id}' already exists.")
        else:
            employee_id = self.repo.generate_employee_id()

        role = self.repo.get_role_by_id(data.role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")

        scope_type = data.scope_type
        department_input = data.department_id

        # Super Admin hamesha GLOBAL hota hai
        if role.name == "SUPER_ADMIN":
            scope_type = ScopeType.GLOBAL
            department_input = None

        if role.name in self.DEPARTMENT_ONLY_ROLES and scope_type != ScopeType.DEPARTMENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{role.name.replace('_', ' ').title()} must have DEPARTMENT scope."
            )

        # Class teacher: section se department nikalta hai aur sab validate karta hai
        section, section_department_id = self._prepare_class_teacher(role, scope_type, data.class_section_id)
        if section_department_id:
            if department_input and department_input != section_department_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This class section does not belong to the selected department."
                )
            department_input = section_department_id

        if department_input:
            self._get_department_or_404(department_input)

        department_id = self._resolve_scope(scope_type, department_input)
        domain_id = self._resolve_domain(role, data.domain_id)

        user = self.repo.create_user(email=data.email, full_name=data.full_name, mobile_number=data.mobile_number)
        self.repo.create_staff_profile(
            user_id=user.id, employee_id=employee_id,
            designation=data.designation, department_id=department_id,
        )
        user_role = self.repo.create_user_role(
            user_id=user.id, role_id=role.id, department_id=department_id, scope_type=scope_type,
            domain_id=domain_id,
        )
        if section:
            self._save_class_teacher(user.id, section.id)

        self._audit(actor, "STAFF_CREATED", "User", user.id, new={
            "email": user.email, "employee_id": data.employee_id,
            "role": role.name, "department_id": str(department_id) if department_id else None,
            "domain_id": str(domain_id) if domain_id else None,
            "class_section_id": str(section.id) if section else None,
        })

        return {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "employee_id": employee_id,
            "designation": data.designation,
            "department_id": department_id,
            "domain_id": domain_id,
            "role_name": role.name,
            "scope_type": user_role.scope_type,
        }

    def assign_role(self, actor: User, data):
        from app.models.user import User as UserModel
        target_user = self.db.query(UserModel).filter(UserModel.id == data.user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        role = self.repo.get_role_by_id(data.role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")

        scope_type = data.scope_type
        department_input = data.department_id
        if role.name == "SUPER_ADMIN":
            scope_type = ScopeType.GLOBAL
            department_input = None

        if role.name in self.DEPARTMENT_ONLY_ROLES and scope_type != ScopeType.DEPARTMENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{role.name.replace('_', ' ').title()} must have DEPARTMENT scope."
            )

        section, section_department_id = self._prepare_class_teacher(role, scope_type, data.class_section_id)
        if section_department_id:
            if department_input and department_input != section_department_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This class section does not belong to the selected department."
                )
            department_input = section_department_id

        if department_input:
            self._get_department_or_404(department_input)

        department_id = self._resolve_scope(scope_type, department_input)

        domain_id = self._resolve_domain(role, data.domain_id)

        existing = self.repo.get_user_role(data.user_id, data.role_id, department_id, domain_id)
        if existing:
            raise self._conflict("This user already has this role for the given department scope and domain.")

        user_role = self.repo.create_user_role(
            user_id=data.user_id, role_id=data.role_id, department_id=department_id, scope_type=scope_type,
            domain_id=domain_id,
        )
        if section:
            self._save_class_teacher(data.user_id, section.id)

        self._audit(actor, "ROLE_ASSIGNED", "UserRole", user_role.id, new={
            "user_id": str(data.user_id), "role": role.name,
            "department_id": str(department_id) if department_id else None,
            "domain_id": str(domain_id) if domain_id else None,
            "class_section_id": str(section.id) if section else None,
        })
        return user_role

    # ---------- CLASS TEACHER MAPPING ----------

    def list_class_teachers(self):
        from app.models.class_teacher import ClassTeacherAssignment
        sections = (
            self.db.query(ClassSection)
            .filter(ClassSection.is_active == True)
            .order_by(ClassSection.course_id, ClassSection.year_or_semester, ClassSection.section_name)
            .all()
        )
        result = []
        for section in sections:
            course = self.db.query(Course).filter(Course.id == section.course_id).first()
            if not course:
                continue
            department = self.db.query(Department).filter(Department.id == course.department_id).first()
            assignment = self.db.query(ClassTeacherAssignment).filter(
                ClassTeacherAssignment.class_section_id == section.id
            ).first()
            teacher = self.repo.get_user_by_id(assignment.user_id) if assignment else None
            result.append({
                "class_section_id": section.id,
                "course_id": course.id,
                "course_name": course.name,
                "department_id": course.department_id,
                "department_name": department.name if department else "",
                "year_or_semester": section.year_or_semester,
                "section_name": section.section_name,
                "teacher_user_id": teacher.id if teacher else None,
                "teacher_name": teacher.full_name if teacher else None,
                "teacher_email": teacher.email if teacher else None,
            })
        return result

    def set_class_teacher(self, actor: User, section_id: uuid.UUID, user_id: uuid.UUID):
        """Is class ka class teacher set / badal deta hai (ek class ka sirf ek teacher)."""
        from app.models.class_teacher import ClassTeacherAssignment
        from app.models.user import UserRole

        section = self._get_section_or_404(section_id)
        course = self._get_course_or_404(section.course_id)

        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        role = self.repo.get_role_by_name(self.CLASS_TEACHER_ROLE_NAME)
        has_role = role and self.db.query(UserRole).filter(
            UserRole.user_id == user_id, UserRole.role_id == role.id
        ).first()
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user does not have the Class Teacher role."
            )
        # Class teacher apne hi department ki class ka ho sakta hai
        if has_role.department_id and has_role.department_id != course.department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This teacher belongs to a different department than the class."
            )

        row = self.db.query(ClassTeacherAssignment).filter(
            ClassTeacherAssignment.class_section_id == section_id
        ).first()
        old_user_id = row.user_id if row else None
        if row:
            row.user_id = user_id
            self.repo.save(row)
        else:
            self._save_class_teacher(user_id, section_id)

        self._audit(actor, "CLASS_TEACHER_SET", "ClassSection", section_id,
                    old={"user_id": str(old_user_id) if old_user_id else None},
                    new={"user_id": str(user_id)})
        return {"detail": "Class teacher updated."}

    def remove_class_teacher(self, actor: User, section_id: uuid.UUID):
        from app.models.class_teacher import ClassTeacherAssignment
        row = self.db.query(ClassTeacherAssignment).filter(
            ClassTeacherAssignment.class_section_id == section_id
        ).first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No class teacher assigned to this class.")
        old_user_id = row.user_id
        self.db.delete(row)
        self.db.commit()
        self._audit(actor, "CLASS_TEACHER_REMOVED", "ClassSection", section_id,
                    old={"user_id": str(old_user_id)})
        return {"detail": "Class teacher removed."}

    # ---------- ROLE & PERMISSION MANAGEMENT ----------

    LOCKED_ROLES = {"SUPER_ADMIN"}          # permissions badal nahi sakte
    PROTECTED_ROLES = {"SUPER_ADMIN", "STUDENT"}  # deactivate nahi kar sakte

    def create_role(self, actor: User, data):
        if self.repo.get_role_by_name(data.name):
            raise self._conflict(f"Role '{data.name}' already exists.")
        role = Role(name=data.name, description=data.description or f"{data.name} role", is_active=True)
        role = self.repo.save(role)
        self._audit(actor, "ROLE_CREATED", "Role", role.id, new={"name": role.name})
        return role

    def update_role(self, actor: User, role_id: uuid.UUID, data):
        role = self.repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        changes = self._clean_changes(data)
        if changes.get("is_active") is False and role.name in self.PROTECTED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{role.name} role cannot be deactivated."
            )
        old = {"description": role.description, "is_active": role.is_active}
        for field, value in changes.items():
            setattr(role, field, value)
        role = self.repo.save(role)
        self._audit(actor, "ROLE_UPDATED", "Role", role.id, old=old,
                    new={"description": role.description, "is_active": role.is_active})
        return role

    def list_permissions(self):
        from app.models.permission import Permission
        return self.db.query(Permission).order_by(Permission.code).all()

    def get_role_permissions(self, role_id: uuid.UUID):
        from app.models.role import RolePermission
        from app.models.permission import Permission
        role = self.repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        codes = [
            r[0] for r in self.db.query(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .filter(RolePermission.role_id == role_id)
            .order_by(Permission.code).all()
        ]
        return {"role_id": role.id, "permission_codes": codes}

    def set_role_permissions(self, actor: User, role_id: uuid.UUID, codes: list):
        from app.models.role import RolePermission
        from app.models.permission import Permission
        role = self.repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
        if role.name in self.LOCKED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Permissions of {role.name} cannot be changed."
            )

        wanted = set(codes)
        permissions = self.db.query(Permission).filter(Permission.code.in_(wanted)).all() if wanted else []
        found = {p.code for p in permissions}
        unknown = wanted - found
        if unknown:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown permission(s): {', '.join(sorted(unknown))}"
            )

        old = self.get_role_permissions(role_id)["permission_codes"]
        self.db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        for permission in permissions:
            self.db.add(RolePermission(role_id=role_id, permission_id=permission.id))
        self.db.commit()

        self._audit(actor, "ROLE_PERMISSIONS_UPDATED", "Role", role_id, old={"codes": old}, new={"codes": sorted(found)})
        return self.get_role_permissions(role_id)

    def ensure_student_role(self, actor: User, user_id: uuid.UUID):
        """
        Student ko STUDENT role missing ho to assign karta hai.
        Student registration/import ke time use hoga.
        """
        student = self.repo.get_student_by_user_id(user_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found for this user.")

        role = self.db.query(Role).filter(Role.name == self.STUDENT_ROLE_NAME).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="STUDENT role not seeded.")

        existing = self.repo.get_user_role(user_id, role.id, student.department_id)
        if existing:
            return existing

        user_role = self.repo.create_user_role(
            user_id=user_id, role_id=role.id, department_id=student.department_id, scope_type=ScopeType.DEPARTMENT,
        )
        self._audit(actor, "STUDENT_ROLE_ASSIGNED", "UserRole", user_role.id, new={"user_id": str(user_id)})
        return user_role
    
    STUDENT_CSV_REQUIRED_COLUMNS = {"email", "full_name", "student_id", "department_code", "course_code", "section_name"}

    def import_students_csv(self, actor: User, csv_text: str):
        import csv
        import io

        reader = csv.DictReader(io.StringIO(csv_text))

        if reader.fieldnames is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file is empty or invalid.")

        missing_columns = self.STUDENT_CSV_REQUIRED_COLUMNS - set(reader.fieldnames)
        # Semester ka column "semester" ya purana naam "year_or_semester" dono chalte hain
        if "semester" not in reader.fieldnames and "year_or_semester" not in reader.fieldnames:
            missing_columns = set(missing_columns) | {"semester"}
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV missing required columns: {', '.join(sorted(missing_columns))}"
            )

        student_role = self.repo.get_role_by_name("STUDENT")
        if not student_role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="STUDENT role not seeded.")

        total = 0
        success = 0
        errors = []
        seen_emails = set()
        seen_student_ids = set()

        for row_number, row in enumerate(reader, start=2):
            total += 1
            email = (row.get("email") or "").strip().lower()
            full_name = " ".join((row.get("full_name") or "").split())
            student_id_value = (row.get("student_id") or "").strip().upper()
            department_code = (row.get("department_code") or "").strip().upper()
            course_code = (row.get("course_code") or "").strip().upper()
            section_name = (row.get("section_name") or "").strip().upper() or None
            mobile_number = (row.get("mobile_number") or "").strip() or None

            try:
                if not email or not full_name or not student_id_value or not department_code or not course_code:
                    raise ValueError("One or more required fields are empty.")
                if not section_name:
                    raise ValueError("section_name is required.")

                if email in seen_emails:
                    raise ValueError("Duplicate email within this file.")
                if student_id_value in seen_student_ids:
                    raise ValueError("Duplicate student_id within this file.")

                if self.repo.get_user_by_email(email):
                    raise ValueError(f"Email '{email}' already exists in the system.")
                if self.repo.get_student_by_student_id(student_id_value):
                    raise ValueError(f"Student ID '{student_id_value}' already exists in the system.")

                department = self.repo.get_department_by_code(department_code)
                if not department or not department.is_active:
                    raise ValueError(f"Department code '{department_code}' not found or inactive.")

                course = self.repo.get_course_by_code(course_code)
                if not course or not course.is_active or course.department_id != department.id:
                    raise ValueError(f"Course code '{course_code}' not found in department '{department_code}'.")

                semester_text = (row.get("semester") or row.get("year_or_semester") or "").strip()
                if not semester_text:
                    raise ValueError("semester is required.")
                semester_value = int(semester_text)
                section = self.repo.find_class_section(course.id, semester_value, section_name)
                if not section:
                    raise ValueError(f"Class section '{section_name}' (semester {semester_value}) not found for this course.")
                class_section_id = section.id

                semester = section.year_or_semester
                admission_year = int(row["admission_year"]) if row.get("admission_year") else None
                academic_session = (row.get("academic_session") or "").strip() or None

                # Saari validations pass ho gayin — ab actual creation
                user = self.repo.create_user(email=email, full_name=full_name, mobile_number=mobile_number)
                self.repo.create_student_profile(
                    user_id=user.id, student_id=student_id_value, department_id=department.id,
                    course_id=course.id, class_section_id=class_section_id,
                    semester=semester, academic_session=academic_session, admission_year=admission_year,
                )
                self.repo.create_user_role(
                    user_id=user.id, role_id=student_role.id, department_id=department.id,
                    scope_type=ScopeType.DEPARTMENT,
                )

                seen_emails.add(email)
                seen_student_ids.add(student_id_value)
                success += 1

            except Exception as e:
                errors.append({"row_number": row_number, "email": email or None, "error": str(e)})

        self._audit(actor, "STUDENTS_BULK_IMPORTED", "StudentProfile", None,
                    new={"total_rows": total, "success_count": success, "failed_count": len(errors)})

        return {
            "total_rows": total,
            "success_count": success,
            "failed_count": len(errors),
            "errors": errors,
        }

    def create_student(self, actor: User, data):
        if self.repo.get_user_by_email(data.email):
            raise self._conflict(f"A user with email '{data.email}' already exists.")

        if self.repo.get_student_by_student_id(data.student_id):
            raise self._conflict(f"Student ID '{data.student_id}' already exists.")

        department = self._get_department_or_404(data.department_id)
        if not department.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department is inactive.")

        course = self._get_course_or_404(data.course_id)
        if course.department_id != department.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This course does not belong to the given department."
            )
        if not course.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course is inactive.")

        section = self.repo.get_class_section_by_id(data.class_section_id)
        if not section or section.course_id != course.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This class section does not belong to the given course."
            )

        student_role = self.repo.get_role_by_name("STUDENT")
        if not student_role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="STUDENT role not seeded.")

        user = self.repo.create_user(email=data.email, full_name=data.full_name, mobile_number=data.mobile_number)

        self.repo.create_student_profile(
            user_id=user.id, student_id=data.student_id, department_id=department.id,
            course_id=course.id, class_section_id=data.class_section_id,
            semester=section.year_or_semester, academic_session=data.academic_session,
            admission_year=data.admission_year,
        )

        self.repo.create_user_role(
            user_id=user.id, role_id=student_role.id, department_id=department.id,
            scope_type=ScopeType.DEPARTMENT,
        )

        self._audit(actor, "STUDENT_CREATED", "User", user.id, new={
            "email": user.email, "student_id": data.student_id, "department_id": str(department.id),
        })

        return {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "student_id": data.student_id,
            "department_id": department.id,
            "course_id": course.id,
            "class_section_id": data.class_section_id,
        }

    def list_users(self):
        from app.models.user import UserRole
        from app.models.role import Role

        users = self.repo.list_all_users()
        result = []
        for u in users:
            role_rows = self.db.query(UserRole).filter(UserRole.user_id == u.id).all()
            role_names = []
            for r in role_rows:
                role = self.db.query(Role).filter(Role.id == r.role_id).first()
                if role:
                    role_names.append(role.name)
            result.append({
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "roles": role_names,
            })
        return result

    def toggle_user_active(self, actor: User, user_id: uuid.UUID):
        if actor.id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account."
            )
        user = self.repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        old_active = user.is_active
        user.is_active = not user.is_active
        self.db.commit()
        self.db.refresh(user)
        self._audit(actor, "USER_STATUS_TOGGLED", "User", user.id, old={"is_active": old_active}, new={"is_active": user.is_active})
        return user
