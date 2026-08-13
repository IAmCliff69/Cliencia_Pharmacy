from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db

from . import schemas, service
from .dependencies import require_admin, require_staff
from .models import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -----------------------------
# Register User
# -----------------------------

@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    try:
        new_user = service.register_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    return new_user



# -----------------------------
# Login User
# -----------------------------

@router.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    token = service.login_user(
        db,
        user
    )


    if token is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if token == "inactive":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact an admin."
        )


    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -----------------------------
# Promote a user to admin (admin only)
# -----------------------------

@router.put(
    "/promote/{user_id}",
    response_model=schemas.UserResponse
)
def promote_to_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = "admin"

    db.commit()
    db.refresh(user)

    return user


# -----------------------------
# Get current logged-in user's own profile
# -----------------------------

@router.get(
    "/me",
    response_model=schemas.UserResponse
)
def get_my_profile(
    current_user: User = Depends(require_staff)
):
    return current_user


# -----------------------------
# List all users (admin only)
# -----------------------------

@router.get(
    "/users",
    response_model=list[schemas.UserResponse]
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(User).all()


# -----------------------------
# Deactivate a user (admin only) -- soft delete
# -----------------------------
# We never hard-delete users: their user_id is referenced by sales
# and audit_logs, and removing the row would either break that
# history or be rejected by the database's foreign keys. Deactivating
# blocks login and revokes access immediately, while preserving
# everything they're linked to.

@router.delete(
    "/users/{user_id}",
    response_model=schemas.UserResponse
)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = False

    db.commit()
    db.refresh(user)

    return user


# -----------------------------
# Reactivate a user (admin only)
# -----------------------------

@router.patch(
    "/users/{user_id}/activate",
    response_model=schemas.UserResponse
)
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = True

    db.commit()
    db.refresh(user)

    return user