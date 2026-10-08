import uuid
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.department import Department, Course, ClassSection


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def save(self, obj):
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    # ---------- DEPARTMENTS ----------

    def get_department_by_id(self, department_id: uuid.UUID) -> Optional[Department]:
        return self.db.query(Department).filter(Department.id == department_id).first()

    def get_department_by_code(self, code: str) -> Optional[Department]:
        return self.db.query(Department).filter(func.upper(Department.code) == code.upper()).first()

    def get_department_by_name(self, name: str) -> Optional[Department]:
        return self.db.query(Department).filter(func.lower(Department.name) == name.lower()).first()

    def list_departments(self) -> list[Department]:
        return self.db.query(Department).order_by(Department.name).all()

    def create_department(self, code: str, name: str) -> Department:
        return self.save(Department(code=code, name=name, is_active=True))

    # ---------- COURSES ----------

    def get_course_by_id(self, course_id: uuid.UUID) -> Optional[Course]:
        return self.db.query(Course).filter(Course.id == course_id).first()

    def get_course_by_code(self, code: str) -> Optional[Course]:
        return self.db.query(Course).filter(func.upper(Course.code) == code.upper()).first()

    def get_course_by_name_in_department(self, department_id: uuid.UUID, name: str) -> Optional[Course]:
        return self.db.query(Course).filter(
            Course.department_id == department_id,
            func.lower(Course.name) == name.lower(),
        ).first()

    def list_courses(self, department_id: Optional[uuid.UUID] = None) -> list[Course]:
        query = self.db.query(Course)
        if department_id:
            query = query.filter(Course.department_id == department_id)
        return query.order_by(Course.name).all()

    def create_course(self, department_id: uuid.UUID, code: str, name: str) -> Course:
        return self.save(Course(department_id=department_id, code=code, name=name, is_active=True))

    # ---------- CLASS SECTIONS ----------

    def get_class_section_by_id(self, section_id: uuid.UUID) -> Optional[ClassSection]:
        return self.db.query(ClassSection).filter(ClassSection.id == section_id).first()

    def find_class_section(self, course_id: uuid.UUID, year_or_semester: int, section_name: str) -> Optional[ClassSection]:
        return self.db.query(ClassSection).filter(
            ClassSection.course_id == course_id,
            ClassSection.year_or_semester == year_or_semester,
            func.upper(ClassSection.section_name) == section_name.upper(),
        ).first()

    def list_class_sections(self, course_id: Optional[uuid.UUID] = None) -> list[ClassSection]:
        query = self.db.query(ClassSection)
        if course_id:
            query = query.filter(ClassSection.course_id == course_id)
        return query.order_by(ClassSection.year_or_semester, ClassSection.section_name).all()

    def create_class_section(self, course_id: uuid.UUID, year_or_semester: int, section_name: str) -> ClassSection:
        return self.save(
            ClassSection(
                course_id=course_id,
                year_or_semester=year_or_semester,
                section_name=section_name,
                is_active=True,
            )
        )

    # ---------- COMPLAINT DOMAINS ----------

    def get_domain_by_id(self, domain_id: uuid.UUID):
        from app.models.complaint import ComplaintDomain
        return self.db.query(ComplaintDomain).filter(ComplaintDomain.id == domain_id).first()

    def get_domain_by_code(self, code: str):
        from app.models.complaint import ComplaintDomain
        return self.db.query(ComplaintDomain).filter(func.upper(ComplaintDomain.code) == code.upper()).first()

    def list_domains(self):
        from app.models.complaint import ComplaintDomain
        return self.db.query(ComplaintDomain).order_by(ComplaintDomain.name).all()

    def create_domain(self, code: str, name: str, description):
        from app.models.complaint import ComplaintDomain
        return self.save(ComplaintDomain(code=code, name=name, description=description, is_active=True))

    def deactivate_categories_for_domain(self, domain_id: uuid.UUID):
        from app.models.complaint import ComplaintCategory
        self.db.query(ComplaintCategory).filter(
            ComplaintCategory.domain_id == domain_id, ComplaintCategory.is_active == True
        ).update({"is_active": False})
        self.db.commit()

    # ---------- COMPLAINT CATEGORIES ----------

    def get_category_by_id(self, category_id: uuid.UUID):
        from app.models.complaint import ComplaintCategory
        return self.db.query(ComplaintCategory).filter(ComplaintCategory.id == category_id).first()

    def get_category_by_code(self, code: str):
        from app.models.complaint import ComplaintCategory
        return self.db.query(ComplaintCategory).filter(func.upper(ComplaintCategory.code) == code.upper()).first()

    def list_categories(self, domain_id: Optional[uuid.UUID] = None):
        from app.models.complaint import ComplaintCategory
        query = self.db.query(ComplaintCategory)
        if domain_id:
            query = query.filter(ComplaintCategory.domain_id == domain_id)
        return query.order_by(ComplaintCategory.name).all()

    def create_category(self, domain_id: uuid.UUID, code: str, name: str, description):
        from app.models.complaint import ComplaintCategory
        return self.save(
            ComplaintCategory(domain_id=domain_id, code=code, name=name, description=description, is_active=True)
        )

    # ---------- ROUTING RULES ----------

    def get_routing_rule_by_id(self, rule_id: uuid.UUID):
        from app.models.complaint import RoutingRule
        return self.db.query(RoutingRule).filter(RoutingRule.id == rule_id).first()

    def find_exact_rule(self, domain_id, category_id, escalation_level):
        from app.models.complaint import RoutingRule
        return self.db.query(RoutingRule).filter(
            RoutingRule.domain_id == domain_id,
            RoutingRule.category_id == category_id,
            RoutingRule.escalation_level == escalation_level,
        ).first()

    def list_routing_rules(self, domain_id: Optional[uuid.UUID] = None):
        from app.models.complaint import RoutingRule
        query = self.db.query(RoutingRule)
        if domain_id:
            query = query.filter(RoutingRule.domain_id == domain_id)
        return query.order_by(RoutingRule.escalation_level).all()

    def create_routing_rule(self, **kwargs):
        from app.models.complaint import RoutingRule
        return self.save(RoutingRule(**kwargs, is_active=True))

    # ---------- ROLES ----------

    def get_role_by_id(self, role_id: uuid.UUID):
        from app.models.role import Role
        return self.db.query(Role).filter(Role.id == role_id).first()

    def list_roles(self):
        from app.models.role import Role
        return self.db.query(Role).order_by(Role.name).all()

    # ---------- STAFF / USER / ROLE ----------

    def get_user_by_email(self, email: str):
        from app.models.user import User
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, email: str, full_name: str, mobile_number):
        from app.models.user import User
        user = User(email=email, full_name=full_name, mobile_number=mobile_number, is_active=True)
        return self.save(user)

    def get_staff_profile_by_employee_id(self, employee_id: str):
        from app.models.staff_profile import StaffProfile
        from sqlalchemy import func
        return self.db.query(StaffProfile).filter(func.upper(StaffProfile.employee_id) == employee_id.upper()).first()

    def create_staff_profile(self, user_id, employee_id, designation, department_id):
        from app.models.staff_profile import StaffProfile
        profile = StaffProfile(
            user_id=user_id, employee_id=employee_id, designation=designation,
            department_id=department_id, is_active=True,
        )
        return self.save(profile)

    def get_user_role(self, user_id, role_id, department_id):
        from app.models.user import UserRole
        return self.db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id,
            UserRole.department_id == department_id,
        ).first()

    def create_user_role(self, user_id, role_id, department_id, scope_type):
        from app.models.user import UserRole
        user_role = UserRole(
            user_id=user_id, role_id=role_id, department_id=department_id, scope_type=scope_type,
        )
        return self.save(user_role)

    def get_student_by_user_id(self, user_id):
        from app.models.student import StudentProfile
        return self.db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()

    def generate_employee_id(self) -> str:
        from sqlalchemy import text
        result = self.db.execute(text("SELECT nextval('staff_employee_id_seq')")).scalar()
        return f"EMP-{result:05d}"

        # ---------- BULK IMPORT HELPERS ----------

    def get_student_by_student_id(self, student_id: str):
        from app.models.student import StudentProfile
        from sqlalchemy import func
        return self.db.query(StudentProfile).filter(
            func.upper(StudentProfile.student_id) == student_id.upper()
        ).first()

    def create_student_profile(self, user_id, student_id, department_id, course_id, class_section_id,
                                semester, academic_session, admission_year):
        from app.models.student import StudentProfile
        profile = StudentProfile(
            user_id=user_id, student_id=student_id, department_id=department_id,
            course_id=course_id, class_section_id=class_section_id,
            semester=semester, academic_session=academic_session,
            admission_year=admission_year, status="ACTIVE",
        )
        return self.save(profile)

    def get_role_by_name(self, name: str):
        from app.models.role import Role
        return self.db.query(Role).filter(Role.name == name).first()

        # ---------- USERS ----------

    def list_all_users(self):
        from app.models.user import User
        return self.db.query(User).order_by(User.full_name).all()

    def get_user_by_id(self, user_id: uuid.UUID):
        from app.models.user import User
        return self.db.query(User).filter(User.id == user_id).first()