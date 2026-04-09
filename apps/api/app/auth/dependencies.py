from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.cognito import validate_cognito_token
from app.database import get_db
from app.models import User

_bearer = HTTPBearer(auto_error=True)

VALID_ROLES = {"docente", "alumno", "director", "inspector"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        claims = validate_cognito_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    sub = claims.get("sub")
    groups: list = claims.get("cognito:groups", [])
    role = next((g for g in groups if g in VALID_ROLES), None)

    if not sub or role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No valid role assigned in Cognito",
        )

    name = claims.get("name") or claims.get("cognito:username") or sub
    email = claims.get("email", f"{sub}@cognito.local")

    user = db.query(User).filter(User.sub == sub).first()
    if user is None:
        # Seeded user exists without sub — link it on first login
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.sub = sub
            # Only update name if not already set (avoids Cognito encoding issues)
            if not user.name:
                user.name = name
            user.role = role
        else:
            user = User(sub=sub, name=name, role=role, email=email)
            db.add(user)
        db.commit()
        db.refresh(user)

    return user
