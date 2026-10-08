import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import (
    CheckEmailRequest,
    CreatePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    EmailStatusResponse,
    TokenResponse,
    MessageResponse,
    UserProfileResponse,
)
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/check-email", response_model=EmailStatusResponse)
def check_email(data: CheckEmailRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.check_email(data.email)
    return result


@router.post("/create-password", response_model=MessageResponse)
def create_password(data: CreatePasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.create_password(data)
    return result


@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.login(data)
    return result


@router.post("/refresh-token", response_model=TokenResponse)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.refresh_access_token(data.refresh_token)
    return result


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("10/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.forgot_password(data.email)
    return result


@router.post("/verify-otp", response_model=MessageResponse)
@limiter.limit("5/minute")
def verify_otp(request: Request, data: VerifyOTPRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.verify_otp_and_reset_password(
        data.email, data.otp, data.new_password, data.confirm_password
    )
    return result


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.repositories.user_repository import RoleRepository
    from app.models.role import Role

    role_repo = RoleRepository(db)
    user_roles = role_repo.get_user_roles(current_user.id)

    roles_info = []
    for ur in user_roles:
        role = db.query(Role).filter(Role.id == ur.role_id).first()
        roles_info.append({
            "role_name": role.name if role else "UNKNOWN",
            "department_id": ur.department_id,
            "scope_type": ur.scope_type.value,
        })

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": roles_info,
    }