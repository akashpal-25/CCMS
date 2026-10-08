import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.utils.validators import validate_password_strength


# ---------- REQUEST SCHEMAS ----------

class CheckEmailRequest(BaseModel):
    email: EmailStr


class CreatePasswordRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, value: str) -> str:
        errors = validate_password_strength(value)
        if errors:
            raise ValueError(" ".join(errors))
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def password_must_be_strong(cls, value: str) -> str:
        errors = validate_password_strength(value)
        if errors:
            raise ValueError(" ".join(errors))
        return value


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ---------- RESPONSE SCHEMAS ----------

class EmailStatusResponse(BaseModel):
    exists: bool
    has_password: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_email_verified: bool

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str

class UserRoleInfo(BaseModel):
    role_name: str
    department_id: Optional[uuid.UUID] = None
    scope_type: str


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    roles: list[UserRoleInfo]