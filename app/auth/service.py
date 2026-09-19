import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from . import models, schemas, utils


PASSWORD_RESET_TTL_MINUTES = 30


# -----------------------------
# Register New User
# -----------------------------

def register_user(db: Session, user: schemas.UserCreate):
    hashed_password = utils.hash_password(user.password)

    db_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=hashed_password,
        role="staff",
        is_active=False,  # requires admin approval before login is allowed
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# -----------------------------
# Login User
# -----------------------------

def login_user(db: Session, user: schemas.UserLogin):
    db_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

    if not db_user:
        return None

    password_correct = utils.verify_password(user.password, db_user.password)
    if not password_correct:
        return None

    if not db_user.is_active:
        return "inactive"

    token = utils.create_token({
        "user_id": db_user.user_id,
        "email": db_user.email,
        "role": db_user.role,
    })

    return token


def request_password_reset(db: Session, email: str):
    db_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if not db_user or not db_user.is_active:
        return None

    reset_token = secrets.token_urlsafe(32)
    db_user.password_reset_token_hash = hashlib.sha256(
        reset_token.encode("utf-8")
    ).hexdigest()
    db_user.password_reset_expires_at = datetime.utcnow() + timedelta(
        minutes=PASSWORD_RESET_TTL_MINUTES
    )
    db.commit()
    return reset_token


def reset_password(db: Session, token: str, password: str):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    db_user = (
        db.query(models.User)
        .filter(models.User.password_reset_token_hash == token_hash)
        .first()
    )

    if (
        not db_user
        or not db_user.password_reset_expires_at
        or db_user.password_reset_expires_at <= datetime.utcnow()
    ):
        return False

    db_user.password = utils.hash_password(password)
    db_user.password_reset_token_hash = None
    db_user.password_reset_expires_at = None
    db.commit()
    return True