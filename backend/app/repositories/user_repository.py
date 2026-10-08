import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.student import StudentProfile
from app.models.staff_profile import StaffProfile
from app.models.auth_security import RefreshToken
from app.models.auth_security import PasswordResetOTP
from app.models.role import Role, RolePermission
from app.models.permission import Permission
from app.models.user import UserRole


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_student_profile(self, user_id: uuid.UUID) -> Optional[StudentProfile]:
        return self.db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()

    def get_staff_profile(self, user_id: uuid.UUID) -> Optional[StaffProfile]:
        return self.db.query(StaffProfile).filter(StaffProfile.user_id == user_id).first()

    def update_password(self, user: User, password_hash: str) -> User:
        user.password_hash = password_hash
        self.db.commit()
        self.db.refresh(user)
        return user

    def increment_failed_login(self, user: User) -> User:
        user.failed_login_count += 1
        self.db.commit()
        self.db.refresh(user)
        return user

    def reset_failed_login(self, user: User) -> User:
        user.failed_login_count = 0
        user.locked_until = None
        self.db.commit()
        self.db.refresh(user)
        return user

    def lock_account(self, user: User, locked_until) -> User:
        user.locked_until = locked_until
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_last_login(self, user: User, login_time) -> User:
        user.last_login_at = login_time
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def find_staff_by_role_and_department(self, role_id: uuid.UUID, department_id: uuid.UUID):
        from app.models.user import UserRole
        from app.models.staff_profile import StaffProfile

        user_role = (
            self.db.query(UserRole)
            .filter(UserRole.role_id == role_id, UserRole.department_id == department_id)
            .first()
        )
        if not user_role:
            return None
        return self.db.query(User).filter(User.id == user_role.user_id).first()

    def find_staff_by_role_global(self, role_id: uuid.UUID):
        from app.models.user import UserRole

        user_role = self.db.query(UserRole).filter(UserRole.role_id == role_id).first()
        if not user_role:
            return None
        return self.db.query(User).filter(User.id == user_role.user_id).first()


class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: uuid.UUID, token_hash: str, expires_at) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token

    def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        return self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    def revoke(self, token: RefreshToken):
        token.is_revoked = True
        self.db.commit()

    def revoke_all_for_user(self, user_id: uuid.UUID):
        self.db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})
        self.db.commit()


class OTPRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: uuid.UUID, otp_hash: str, expires_at) -> PasswordResetOTP:
        otp = PasswordResetOTP(
            user_id=user_id,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )
        self.db.add(otp)
        self.db.commit()
        self.db.refresh(otp)
        return otp

    def get_latest_valid_otp(self, user_id: uuid.UUID):
        return (
            self.db.query(PasswordResetOTP)
            .filter(
                PasswordResetOTP.user_id == user_id,
                PasswordResetOTP.is_used == False,
            )
            .order_by(PasswordResetOTP.created_at.desc())
            .first()
        )

    def mark_used(self, otp: PasswordResetOTP):
        otp.is_used = True
        self.db.commit()

    def increment_attempt(self, otp: PasswordResetOTP):
        otp.attempt_count += 1
        self.db.commit()

    def invalidate_all_for_user(self, user_id: uuid.UUID):
        self.db.query(PasswordResetOTP).filter(
            PasswordResetOTP.user_id == user_id, PasswordResetOTP.is_used == False
        ).update({"is_used": True})
        self.db.commit()


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_roles(self, user_id: uuid.UUID) -> list[UserRole]:
        return self.db.query(UserRole).filter(UserRole.user_id == user_id).all()

    def get_permissions_for_role(self, role_id: uuid.UUID) -> list[str]:
        results = (
            self.db.query(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .filter(RolePermission.role_id == role_id)
            .all()
        )
        return [r[0] for r in results]

    def get_role_by_name(self, name: str):
        return self.db.query(Role).filter(Role.name == name).first()

class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def log(self, actor_user_id, action, entity_type, entity_id=None, old_value=None, new_value=None, metadata=None):
        from app.models.audit import AuditLog
        entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            extra_metadata=metadata,
        )
        self.db.add(entry)
        self.db.commit()
        return entry