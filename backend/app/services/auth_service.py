import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import (
    UserRepository,
    RefreshTokenRepository,
    OTPRepository,
    AuditLogRepository,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    generate_otp,
)
from app.schemas.auth import CreatePasswordRequest, LoginRequest
from app.services.notification_service import send_otp_email

OTP_VALIDITY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
REFRESH_TOKEN_VALIDITY_DAYS = 90


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.refresh_token_repo = RefreshTokenRepository(db)
        self.otp_repo = OTPRepository(db)
        self.audit_repo = AuditLogRepository(db)

    def check_email(self, email: str) -> dict:
        user = self.user_repo.get_by_email(email)
        if not user:
            return {"exists": False, "has_password": False}
        return {"exists": True, "has_password": user.password_hash is not None}

    def create_password(self, data: CreatePasswordRequest) -> dict:
        user = self.user_repo.get_by_email(data.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email."
            )

        if user.password_hash is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password already set. Please use login or forgot password."
            )

        if data.password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password and confirm password do not match."
            )

        password_hash = hash_password(data.password)
        self.user_repo.update_password(user, password_hash)

        return {"message": "Password created successfully. You can now log in."}

    def login(self, data: LoginRequest) -> dict:
        user = self.user_repo.get_by_email(data.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account temporarily locked due to multiple failed attempts. Try again later."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Contact administrator."
            )

        if user.password_hash is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password not set. Please create your password first."
            )

        if not verify_password(data.password, user.password_hash):
            self.user_repo.increment_failed_login(user)
            self.audit_repo.log(actor_user_id=user.id, action="LOGIN_FAILED", entity_type="User", entity_id=user.id)

            if user.failed_login_count + 1 >= MAX_FAILED_ATTEMPTS:
                lock_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                self.user_repo.lock_account(user, lock_until)
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Too many failed attempts. Account locked for 15 minutes."
                )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        # Successful login
        self.user_repo.reset_failed_login(user)
        self.user_repo.update_last_login(user, datetime.now(timezone.utc))
        self.audit_repo.log(actor_user_id=user.id, action="LOGIN_SUCCESS", entity_type="User", entity_id=user.id)

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        refresh_expiry = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_VALIDITY_DAYS)
        self.refresh_token_repo.create(user.id, hash_token(refresh_token), refresh_expiry)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def refresh_access_token(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )

        token_hash = hash_token(refresh_token)
        stored_token = self.refresh_token_repo.get_by_hash(token_hash)

        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not recognized."
            )

        if stored_token.is_revoked:
            self.refresh_token_repo.revoke_all_for_user(stored_token.user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security alert: token reuse detected. Please log in again."
            )

        user_id = stored_token.user_id
        user = self.user_repo.get_by_id(user_id)

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive."
            )

        self.refresh_token_repo.revoke(stored_token)

        new_access_token = create_access_token(subject=str(user.id))
        new_refresh_token = create_refresh_token(subject=str(user.id))

        new_expiry = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_VALIDITY_DAYS)
        self.refresh_token_repo.create(user.id, hash_token(new_refresh_token), new_expiry)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    def forgot_password(self, email: str) -> dict:
        user = self.user_repo.get_by_email(email)

        if not user:
            return {"message": "If this email is registered, an OTP has been sent."}

        otp = generate_otp()
        otp_hash = hash_token(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_VALIDITY_MINUTES)

        self.otp_repo.invalidate_all_for_user(user.id)
        self.otp_repo.create(user.id, otp_hash, expires_at)

        send_otp_email(user.email, otp)

        return {"message": "If this email is registered, an OTP has been sent."}

    def verify_otp_and_reset_password(self, email: str, otp: str, new_password: str, confirm_password: str) -> dict:
        user = self.user_repo.get_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP or email."
            )

        stored_otp = self.otp_repo.get_latest_valid_otp(user.id)

        if not stored_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid OTP found. Please request a new one."
            )

        if stored_otp.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one."
            )

        if stored_otp.attempt_count >= MAX_OTP_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect attempts. Please request a new OTP."
            )

        if hash_token(otp) != stored_otp.otp_hash:
            self.otp_repo.increment_attempt(stored_otp)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect OTP."
            )

        if new_password != confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password and confirm password do not match."
            )

        password_hash = hash_password(new_password)
        self.user_repo.update_password(user, password_hash)
        self.otp_repo.mark_used(stored_otp)
        self.audit_repo.log(actor_user_id=user.id, action="PASSWORD_RESET_VIA_OTP", entity_type="User", entity_id=user.id)

        # Security: password reset hone pe sabhi refresh tokens revoke kardo
        self.refresh_token_repo.revoke_all_for_user(user.id)

        return {"message": "Password reset successful. Please log in with your new password."}