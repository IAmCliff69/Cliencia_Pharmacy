from io import BytesIO
from pathlib import Path
from uuid import uuid4

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import os

from database import get_db
from . import schemas, service
from .dependencies import require_admin, require_staff
from .models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

# -----------------------------
# Configure Cloudinary
# (reads from environment variables set on Render)
# -----------------------------
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


def upload_profile_image_to_cloudinary(contents: bytes, user_id: int) -> str:
    """
    Upload image bytes to Cloudinary and return the permanent URL.
    The public_id ensures each user has one image slot — re-uploading
    overwrites the old one automatically.
    """
    result = cloudinary.uploader.upload(
        BytesIO(contents),
        public_id=f"cliencia/profiles/user-{user_id}",
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]


# -----------------------------
# Register
# -----------------------------

@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: Request,
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    extension = ALLOWED_IMAGE_TYPES.get(image.content_type or "")
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A JPG, PNG, or WEBP profile image is required.",
        )

    contents = await image.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile images must be 5 MB or smaller.",
        )

    user = schemas.UserCreate(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=password,
    )

    try:
        new_user = service.register_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    new_user.profile_image_url = upload_profile_image_to_cloudinary(contents, new_user.user_id)
    db.commit()
    db.refresh(new_user)

    return new_user


# -----------------------------
# Login
# -----------------------------

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    token = service.login_user(db, user)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if token == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval. Please contact your administrator.",
        )

    return {"access_token": token, "token_type": "bearer"}


@router.post("/password-reset/request")
def request_password_reset(
    reset_request: schemas.PasswordResetRequest,
    db: Session = Depends(get_db),
):
    reset_token = service.request_password_reset(db, reset_request.email)
    response = {
        "message": "If an active account exists for that email, a reset link has been created.",
    }

    # This token is returned for the local development flow. Replace this
    # response field with an email delivery service before production use.
    if reset_token:
        response["reset_token"] = reset_token

    return response


@router.post("/password-reset/confirm")
def confirm_password_reset(
    reset_request: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    if len(reset_request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    if not service.reset_password(db, reset_request.token, reset_request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has expired.",
        )

    return {"message": "Password reset successfully. You can now sign in."}


# -----------------------------
# Current user profile
# -----------------------------

@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: User = Depends(require_staff)):
    return current_user


@router.post("/me/profile-image", response_model=schemas.UserResponse)
async def upload_profile_image(
    request: Request,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    extension = ALLOWED_IMAGE_TYPES.get(image.content_type or "")
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are supported.",
        )

    contents = await image.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile images must be 5 MB or smaller.",
        )

    current_user.profile_image_url = upload_profile_image_to_cloudinary(contents, current_user.user_id)
    db.commit()
    db.refresh(current_user)
    return current_user


# -----------------------------
# Admin — list all active users
# -----------------------------

@router.get("/users", response_model=list[schemas.UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.query(User).filter(User.is_active == True).all()  # noqa: E712


# -----------------------------
# Admin — list pending users
# -----------------------------

@router.get("/users/pending", response_model=list[schemas.UserResponse])
def list_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.query(User).filter(User.is_active == False).all()  # noqa: E712


# -----------------------------
# Admin — approve a pending user
# -----------------------------

@router.patch("/users/{user_id}/approve", response_model=schemas.UserResponse)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already active.")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


# -----------------------------
# Admin — reject a pending user
# -----------------------------

@router.delete("/users/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending users can be rejected.",
        )

    db.delete(user)
    db.commit()
    return None


# -----------------------------
# Admin — promote to admin
# -----------------------------

@router.put("/promote/{user_id}", response_model=schemas.UserResponse)
def promote_to_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already an admin.")
    user.role = "admin"
    db.commit()
    db.refresh(user)
    return user


# -----------------------------
# Admin — deactivate a user
# -----------------------------

@router.delete("/users/{user_id}", response_model=schemas.UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


# -----------------------------
# Admin — reactivate a user
# -----------------------------

@router.patch("/users/{user_id}/activate", response_model=schemas.UserResponse)
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user