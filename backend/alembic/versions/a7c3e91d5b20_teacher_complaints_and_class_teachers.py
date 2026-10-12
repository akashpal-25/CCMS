"""teacher complaints, class teacher mapping, new roles and routing rules

Ye migration IDEMPOTENT hai (IF NOT EXISTS / WHERE NOT EXISTS), yaani
agar tumne yahi SQL pehle pgAdmin mein chala diya ho to bhi dobara
chalane par koi error nahi aayega aur koi data double nahi banega.

Revision ID: a7c3e91d5b20
Revises: 842fffcf7ade
Create Date: 2026-10-10
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'a7c3e91d5b20'
down_revision: Union[str, Sequence[str], None] = '842fffcf7ade'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ----------------------------------------------------------------------
# PART 1: TABLES / COLUMNS
# ----------------------------------------------------------------------
SCHEMA_SQL = [
    # complaint_categories: kis ko dikhegi (STUDENT / TEACHER / SYSTEM)
    """ALTER TABLE complaint_categories
       ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'STUDENT'""",

    # complaints: teacher ki complaint mein student_id nahi hota
    """ALTER TABLE complaints ALTER COLUMN student_id DROP NOT NULL""",
    """ALTER TABLE complaints
       ADD COLUMN IF NOT EXISTS complaint_type VARCHAR(30) NOT NULL DEFAULT 'STUDENT'""",
    """ALTER TABLE complaints
       ADD COLUMN IF NOT EXISTS filed_by_user_id UUID REFERENCES users(id)""",
    """ALTER TABLE complaints
       ADD COLUMN IF NOT EXISTS subject_student_id UUID REFERENCES students(id)""",
    """ALTER TABLE complaints ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20)""",
    """ALTER TABLE complaints ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR(20)""",
    """CREATE INDEX IF NOT EXISTS ix_complaints_filed_by_user_id
       ON complaints (filed_by_user_id)""",

    # class teacher <-> class section (ek section ka sirf ek teacher)
    """CREATE TABLE IF NOT EXISTS class_teacher_assignments (
           id UUID PRIMARY KEY,
           user_id UUID NOT NULL REFERENCES users(id),
           class_section_id UUID NOT NULL UNIQUE REFERENCES class_sections(id),
           created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
           updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )""",
    """CREATE INDEX IF NOT EXISTS ix_class_teacher_assignments_user_id
       ON class_teacher_assignments (user_id)""",

    # user_roles: staff kis complaint domain ka authority hai (khali = sab domains)
    """ALTER TABLE user_roles
       ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES complaint_domains(id)""",
]

# ----------------------------------------------------------------------
# PART 2: DATA (roles, permission, categories, routing rules)
# ----------------------------------------------------------------------
DATA_SQL = [
    # --- naye roles ---
    """INSERT INTO roles (id, name, description, is_active)
       SELECT gen_random_uuid(), 'TEACHER', 'Teacher - can file own complaints', true
       WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'TEACHER')""",
    """INSERT INTO roles (id, name, description, is_active)
       SELECT gen_random_uuid(), 'CAMPUS_SUPERVISOR', 'Campus Supervisor - general campus complaints', true
       WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CAMPUS_SUPERVISOR')""",

    # --- nayi permission: staff apni complaint file kar sake ---
    """INSERT INTO permissions (id, code, description)
       SELECT gen_random_uuid(), 'complaint.file_as_staff', 'Complaint.File As Staff'
       WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'complaint.file_as_staff')""",

    # TEACHER aur CLASS_TEACHER: complaint file kar sakte hain
    """INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id FROM roles r, permissions p
       WHERE r.name IN ('TEACHER', 'CLASS_TEACHER') AND p.code = 'complaint.file_as_staff'
         AND NOT EXISTS (SELECT 1 FROM role_permissions rp
                         WHERE rp.role_id = r.id AND rp.permission_id = p.id)""",
    # CAMPUS_SUPERVISOR: complaint resolve kar sakta hai (WARDEN jaisa)
    """INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id FROM roles r, permissions p
       WHERE r.name = 'CAMPUS_SUPERVISOR' AND p.code = 'complaint.resolve'
         AND NOT EXISTS (SELECT 1 FROM role_permissions rp
                         WHERE rp.role_id = r.id AND rp.permission_id = p.id)""",

    # --- teacher categories (academic domain ke andar) ---
    """INSERT INTO complaint_categories (id, domain_id, name, code, description, is_active, audience)
       SELECT gen_random_uuid(), d.id, 'General', 'teacher_general',
              'Teacher complaint - goes to HOD and Director', true, 'TEACHER'
       FROM complaint_domains d
       WHERE d.code = 'academic'
         AND NOT EXISTS (SELECT 1 FROM complaint_categories WHERE code = 'teacher_general')""",
    """INSERT INTO complaint_categories (id, domain_id, name, code, description, is_active, audience)
       SELECT gen_random_uuid(), d.id, 'Against HOD', 'teacher_hod',
              'Teacher complaint against HOD - goes only to Director', true, 'TEACHER'
       FROM complaint_domains d
       WHERE d.code = 'academic'
         AND NOT EXISTS (SELECT 1 FROM complaint_categories WHERE code = 'teacher_hod')""",
    """INSERT INTO complaint_categories (id, domain_id, name, code, description, is_active, audience)
       SELECT gen_random_uuid(), d.id, 'Student Report', 'student_report',
              'Teacher report about a student - goes to HOD and parent', true, 'SYSTEM'
       FROM complaint_domains d
       WHERE d.code = 'academic'
         AND NOT EXISTS (SELECT 1 FROM complaint_categories WHERE code = 'student_report')""",

    # --- routing rules ---
    # teacher_general: HOD (apna department) + Director dono ko
    """INSERT INTO routing_rules (id, domain_id, category_id, escalation_level, target_role_id, scope_type, is_active)
       SELECT gen_random_uuid(), c.domain_id, c.id, 1, r.id, 'DEPARTMENT', true
       FROM complaint_categories c, roles r
       WHERE c.code = 'teacher_general' AND r.name = 'HOD'
         AND NOT EXISTS (SELECT 1 FROM routing_rules x
                         WHERE x.domain_id = c.domain_id AND x.category_id = c.id AND x.escalation_level = 1)""",
    """INSERT INTO routing_rules (id, domain_id, category_id, escalation_level, target_role_id, scope_type, is_active)
       SELECT gen_random_uuid(), c.domain_id, c.id, 2, r.id, 'GLOBAL', true
       FROM complaint_categories c, roles r
       WHERE c.code = 'teacher_general' AND r.name = 'DIRECTOR'
         AND NOT EXISTS (SELECT 1 FROM routing_rules x
                         WHERE x.domain_id = c.domain_id AND x.category_id = c.id AND x.escalation_level = 2)""",
    # teacher_hod: sirf Director ko
    """INSERT INTO routing_rules (id, domain_id, category_id, escalation_level, target_role_id, scope_type, is_active)
       SELECT gen_random_uuid(), c.domain_id, c.id, 1, r.id, 'GLOBAL', true
       FROM complaint_categories c, roles r
       WHERE c.code = 'teacher_hod' AND r.name = 'DIRECTOR'
         AND NOT EXISTS (SELECT 1 FROM routing_rules x
                         WHERE x.domain_id = c.domain_id AND x.category_id = c.id AND x.escalation_level = 1)""",
    # student_report: student ke department ka HOD
    """INSERT INTO routing_rules (id, domain_id, category_id, escalation_level, target_role_id, scope_type, is_active)
       SELECT gen_random_uuid(), c.domain_id, c.id, 1, r.id, 'DEPARTMENT', true
       FROM complaint_categories c, roles r
       WHERE c.code = 'student_report' AND r.name = 'HOD'
         AND NOT EXISTS (SELECT 1 FROM routing_rules x
                         WHERE x.domain_id = c.domain_id AND x.category_id = c.id AND x.escalation_level = 1)""",

    # --- general domain: HOD ki jagah CAMPUS_SUPERVISOR (sirf tab jab abhi bhi purana default HOD rule ho) ---
    """UPDATE routing_rules
       SET target_role_id = (SELECT id FROM roles WHERE name = 'CAMPUS_SUPERVISOR'),
           scope_type = 'GLOBAL'
       WHERE escalation_level = 1
         AND category_id IS NULL
         AND domain_id = (SELECT id FROM complaint_domains WHERE code = 'general')
         AND target_role_id = (SELECT id FROM roles WHERE name = 'HOD')
         AND EXISTS (SELECT 1 FROM roles WHERE name = 'CAMPUS_SUPERVISOR')""",
]


def upgrade() -> None:
    for stmt in SCHEMA_SQL + DATA_SQL:
        op.execute(stmt)


def downgrade() -> None:
    # Data (roles/rules) ko hum jaan-boojh kar delete nahi karte.
    op.execute("ALTER TABLE user_roles DROP COLUMN IF EXISTS domain_id")
    op.execute("DROP TABLE IF EXISTS class_teacher_assignments")
    op.execute("DROP INDEX IF EXISTS ix_complaints_filed_by_user_id")
    for col in ("whatsapp_status", "parent_phone", "subject_student_id", "filed_by_user_id", "complaint_type"):
        op.execute(f"ALTER TABLE complaints DROP COLUMN IF EXISTS {col}")
    op.execute("ALTER TABLE complaint_categories DROP COLUMN IF EXISTS audience")