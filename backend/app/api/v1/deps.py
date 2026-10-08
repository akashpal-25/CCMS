import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from typing import Optional
from app.repositories.user_repository import RoleRepository

security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(uuid.UUID(user_id))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    return user


def require_permission(permission_code: str, department_id: Optional[uuid.UUID] = None):
    def checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        role_repo = RoleRepository(db)
        user_roles = role_repo.get_user_roles(current_user.id)

        if not user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No roles assigned to this account.",
            )

        for user_role in user_roles:
            permissions = role_repo.get_permissions_for_role(user_role.role_id)

            if permission_code in permissions:
                # Scope check: GLOBAL role hamesha allowed hai,
                # DEPARTMENT role sirf apne department ke liye allowed hai
                if user_role.scope_type.value == "GLOBAL":
                    return current_user

                if department_id is not None and user_role.department_id == department_id:
                    return current_user

                if department_id is None:
                    return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission: {permission_code}",
        )

    return checker