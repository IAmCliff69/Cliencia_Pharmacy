import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 2

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set. Add it to your .env file.")



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