from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

UserRole = Literal["hr", "recruiter", "candidate"]

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    company_or_institution: Optional[str] = None
    phone: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[UserRole] = None  # Optional check if user is logging into a specific role portal

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    company_or_institution: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class DemoAccount(BaseModel):
    role: str
    label: str
    email: str
    password: str
    description: str
