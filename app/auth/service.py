from sqlalchemy.orm import Session

from . import models, schemas, utils



# -----------------------------
# Register New User
# -----------------------------

def register_user(
    db: Session,
    user: schemas.UserCreate
):

    hashed_password = utils.hash_password(
        user.password
    )


    db_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=hashed_password,
        role="staff"
    )


    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user




# -----------------------------
# Login User
# -----------------------------

def login_user(
    db: Session,
    user: schemas.UserLogin
):

    db_user = (
        db.query(models.User)
        .filter(
            models.User.email == user.email
        )
        .first()
    )


    # User does not exist
    if not db_user:
        return None



    # Check password
    password_correct = utils.verify_password(
        user.password,
        db_user.password
    )


    if not password_correct:
        return None



    # Create JWT token
    token = utils.create_token(
        {
            "user_id": db_user.user_id,
            "email": db_user.email,
            "role": db_user.role
        }
    )


    return token