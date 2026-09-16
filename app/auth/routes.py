from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
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

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


# -----------------------------
# Register User
# -----------------------------

@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(
    request: Request,
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
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
            detail="An account with this email already exists"
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"profile-{new_user.user_id}-{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    new_user.profile_image_url = f"{str(request.base_url).rstrip('/')}/uploads/{filename}"
    db.commit()
    db.refresh(new_user)

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

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"profile-{current_user.user_id}-{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(contents)

    current_user.profile_image_url = f"{str(request.base_url).rstrip('/')}/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
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