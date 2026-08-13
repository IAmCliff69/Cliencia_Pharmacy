from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db

from . import schemas, service
from .dependencies import require_admin
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