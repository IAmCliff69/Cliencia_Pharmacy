from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone


# JWT Configuration
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 2


# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# -----------------------------
# Password Functions
# -----------------------------

def hash_password(password: str):
    """
    Convert plain password into a secure hashed password
    """
    return pwd_context.hash(password)



def verify_password(
    plain_password: str,
    hashed_password: str
):
    """
    Verify a normal password against stored hashed password
    """
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# -----------------------------
# JWT Token Functions
# -----------------------------

def create_token(data: dict):
    """
    Generate JWT access token
    """

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        hours=ACCESS_TOKEN_EXPIRE_HOURS
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )



def verify_token(token: str):
    """
    Decode and verify JWT token
    """

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None