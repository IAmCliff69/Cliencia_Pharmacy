from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from .utils import SECRET_KEY, ALGORITHM
from .models import User


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    # Fetch the actual user so downstream dependencies (require_admin,
    # require_staff) can check current_user.role
    db_user = db.query(User).filter(User.user_id == user_id).first()

    if db_user is None:
        raise HTTPException(
            status_code=401,
            detail="User no longer exists"
        )

    # Checked here (not just at login) so deactivation takes effect
    # immediately, even for a token that was issued before the
    # account was deactivated.
    if not db_user.is_active:
        raise HTTPException(
            status_code=401,
            detail="This account has been deactivated"
        )

    return db_user

# 🔒 Admin only
def require_admin(current_user = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# 🔒 Staff or Admin (any logged-in user)
def require_staff(current_user = Depends(get_current_user)):

    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return current_user