from app.core.database import SessionLocal
from app.models.role import Role, RolePermission
from app.models.permission import Permission
from app.models.department import Department, Course
from app.models.complaint import ComplaintDomain, ComplaintCategory, RoutingRule
from app.utils.enums import ScopeType

db = SessionLocal()

print("Seeding Roles...")
roles_data = [
    "STUDENT", "CLASS_TEACHER", "HOD", "EXAM_ADMIN",
    "HR_FINANCE", "WARDEN", "TRANSPORT_SUPERVISOR", "DIRECTOR", "SUPER_ADMIN"
]
roles = {}
for name in roles_data:
    role = db.query(Role).filter(Role.name == name).first()
    if not role:
        role = Role(name=name, description=f"{name} role", is_active=True)
        db.add(role)
        db.commit()
        db.refresh(role)
    roles[name] = role
    print(f"  - {name}")

print("Seeding Permissions...")
permissions_data = [
    "complaint.create",
    "complaint.view_own",
    "complaint.view_department",
    "complaint.view_global",
    "complaint.assign",
    "complaint.escalate",
    "complaint.resolve",
    # Super Admin management permissions
    "department.manage",
    "course.manage",
    "domain.manage",
    "routing.manage",
    "user.manage",
]
permissions = {}
for code in permissions_data:
    perm = db.query(Permission).filter(Permission.code == code).first()
    if not perm:
        perm = Permission(code=code, description=code.replace("_", " ").title())
        db.add(perm)
        db.commit()
        db.refresh(perm)
    permissions[code] = perm
    print(f"  - {code}")

print("Linking Role -> Permissions...")
role_permission_map = {
    "STUDENT": ["complaint.create", "complaint.view_own"],
    "CLASS_TEACHER": ["complaint.resolve"],
    "HOD": ["complaint.view_department", "complaint.assign", "complaint.resolve", "complaint.escalate"],
    "EXAM_ADMIN": ["complaint.resolve"],
    "HR_FINANCE": ["complaint.resolve"],
    "WARDEN": ["complaint.resolve"],
    "TRANSPORT_SUPERVISOR": ["complaint.resolve"],
    "DIRECTOR": ["complaint.view_global", "complaint.escalate", "complaint.resolve"],
    "SUPER_ADMIN": list(permissions.keys()),
}
for role_name, perm_codes in role_permission_map.items():
    role = roles[role_name]
    for code in perm_codes:
        perm = permissions[code]
        exists = db.query(RolePermission).filter(
            RolePermission.role_id == role.id, RolePermission.permission_id == perm.id
        ).first()
        if not exists:
            db.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.commit()
    print(f"  - {role_name}: {perm_codes}")

print("Seeding Departments...")
departments_data = [
    ("AITM", "Axis Institute of Technology and Management"),
    ("AIHE", "Axis Institute of Higher Education"),
]
departments = {}
for code, name in departments_data:
    dept = db.query(Department).filter(Department.code == code).first()
    if not dept:
        dept = Department(code=code, name=name, is_active=True)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    departments[code] = dept
    print(f"  - {code}: {name}")

print("Seeding Courses...")
courses_data = [
    ("BTECH_CSE", "B.Tech CSE", "AITM"),
    ("BCA", "BCA", "AIHE"),
]
for code, name, dept_code in courses_data:
    course = db.query(Course).filter(Course.code == code).first()
    if not course:
        course = Course(code=code, name=name, department_id=departments[dept_code].id, is_active=True)
        db.add(course)
        db.commit()
    print(f"  - {code}: {name}")

print("Seeding Complaint Domains...")
domains_data = [
    ("academic", "Academic"),
    ("examination", "Examination"),
    ("library", "Library"),
    ("finance", "Finance / Fees"),
    ("general", "General"),
    ("hostel", "Hostel"),
    ("transport", "Transport"),
]
domains = {}
for code, name in domains_data:
    domain = db.query(ComplaintDomain).filter(ComplaintDomain.code == code).first()
    if not domain:
        domain = ComplaintDomain(code=code, name=name, is_active=True)
        db.add(domain)
        db.commit()
        db.refresh(domain)
    domains[code] = domain
    print(f"  - {code}: {name}")

print("Seeding Complaint Categories...")
categories_data = [
    ("classroom", "Classroom", "academic"),
    ("faculty", "Faculty / Teacher", "academic"),
    ("timetable", "Timetable", "academic"),
]
categories = {}
for code, name, domain_code in categories_data:
    cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == code).first()
    if not cat:
        cat = ComplaintCategory(code=code, name=name, domain_id=domains[domain_code].id, is_active=True)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    categories[code] = cat
    print(f"  - {code}: {name}")

print("Seeding Routing Rules...")


def add_rule(domain_code, category_code, level, role_name, scope):
    domain = domains[domain_code]
    category_id = categories[category_code].id if category_code else None

    exists = db.query(RoutingRule).filter(
        RoutingRule.domain_id == domain.id,
        RoutingRule.category_id == category_id,
        RoutingRule.escalation_level == level,
    ).first()

    if not exists:
        rule = RoutingRule(
            domain_id=domain.id,
            category_id=category_id,
            escalation_level=level,
            target_role_id=roles[role_name].id,
            scope_type=ScopeType[scope],
            is_active=True,
        )
        db.add(rule)
        db.commit()
    print(f"  - domain={domain_code}, category={category_code}, level={level} -> {role_name} ({scope})")


# Academic - default flow (Classroom, Timetable, etc.)
add_rule("academic", None, 1, "CLASS_TEACHER", "DEPARTMENT")
add_rule("academic", None, 2, "HOD", "DEPARTMENT")
add_rule("academic", None, 3, "DIRECTOR", "GLOBAL")

# Academic - Faculty complaint override (skip Class Teacher)
add_rule("academic", "faculty", 1, "HOD", "DEPARTMENT")
add_rule("academic", "faculty", 2, "DIRECTOR", "GLOBAL")

# Examination
add_rule("examination", None, 1, "EXAM_ADMIN", "GLOBAL")
add_rule("examination", None, 2, "DIRECTOR", "GLOBAL")

# Library
add_rule("library", None, 1, "HOD", "DEPARTMENT")
add_rule("library", None, 2, "DIRECTOR", "GLOBAL")

# Finance
add_rule("finance", None, 1, "HR_FINANCE", "GLOBAL")
add_rule("finance", None, 2, "DIRECTOR", "GLOBAL")

# General
add_rule("general", None, 1, "HOD", "DEPARTMENT")
add_rule("general", None, 2, "DIRECTOR", "GLOBAL")

# Hostel
add_rule("hostel", None, 1, "WARDEN", "GLOBAL")
add_rule("hostel", None, 2, "DIRECTOR", "GLOBAL")

# Transport
add_rule("transport", None, 1, "TRANSPORT_SUPERVISOR", "GLOBAL")
add_rule("transport", None, 2, "DIRECTOR", "GLOBAL")

db.close()
print("\n✅ Seeding complete!")