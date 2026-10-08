import getpass
import sys

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.staff_profile import StaffProfile
from app.models.role import Role
from app.utils.enums import ScopeType
from app.utils.validators import validate_password_strength


def main():
    db = SessionLocal()
    try:
        role = db.query(Role).filter(Role.name == "SUPER_ADMIN").first()
        if not role:
            print("SUPER_ADMIN role not found. Run first: python -m app.seed_data")
            sys.exit(1)

        email = input("Super Admin email: ").strip().lower()
        full_name = input("Full name: ").strip()

        if db.query(User).filter(User.email == email).first():
            print("A user with this email already exists.")
            sys.exit(1)

        password = getpass.getpass("Password: ")
        confirm = getpass.getpass("Confirm password: ")

        if password != confirm:
            print("Passwords do not match.")
            sys.exit(1)

        errors = validate_password_strength(password)
        if errors:
            print("Password too weak:")
            for e in errors:
                print(" -", e)
            sys.exit(1)

        user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            is_email_verified=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        db.add(StaffProfile(
            user_id=user.id,
            employee_id="EMP-SUPERADMIN",
            designation="Super Administrator",
            department_id=None,
            is_active=True,
        ))
        db.add(UserRole(
            user_id=user.id,
            role_id=role.id,
            department_id=None,
            scope_type=ScopeType.GLOBAL,
        ))
        db.commit()
        print(f"Super Admin created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()