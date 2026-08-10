from pydantic import BaseModel, EmailStr


# -----------------------------
# User Registration Schema
# -----------------------------

class UserCreate(BaseModel):

    first_name: str
    last_name: str
    email: EmailStr
    password: str



# -----------------------------
# User Login Schema
# -----------------------------

class UserLogin(BaseModel):

    email: EmailStr
    password: str



# -----------------------------
# User Response Schema
# -----------------------------

class UserResponse(BaseModel):

    user_id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str


    class Config:
        from_attributes = True