from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserOut,
    TokenResponse,
    DemoAccount
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with role: 'hr', 'recruiter', or 'candidate'."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{user_in.email}' already exists."
        )

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        company_or_institution=user_in.company_or_institution,
        phone=user_in.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If registered role is candidate, create an initial candidate profile row
    if new_user.role == "candidate":
        cand = Candidate(
            user_id=new_user.id,
            name=new_user.full_name,
            email=new_user.email,
            phone=new_user.phone or "",
            education=new_user.company_or_institution or "",
            experience="",
            skills="",
            resume_path=""
        )
        db.add(cand)
        db.commit()

    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Log in with email, password, and optionally enforce portal role validation."""
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is currently deactivated."
        )

    # If the login request specifies a portal role (e.g. Logging in via HR tab)
    if credentials.role and credentials.role != user.role:
        role_labels = {
            "hr": "HR Manager",
            "recruiter": "Recruiter",
            "candidate": "Candidate"
        }
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as '{role_labels.get(user.role, user.role)}'. Please use the {role_labels.get(user.role, user.role)} login portal."
        )

    access_token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get the authenticated user's profile details."""
    return UserOut.model_validate(current_user)

@router.get("/demo-accounts", response_model=List[DemoAccount])
def get_demo_accounts():
    """Retrieve pre-configured sample credentials for testing each role."""
    return [
        DemoAccount(
            role="hr",
            label="HR Manager",
            email="hr@infosys.com",
            password="Password123!",
            description="Access corporate hiring pipelines, approval workflows & talent analytics."
        ),
        DemoAccount(
            role="recruiter",
            label="Talent Recruiter",
            email="recruiter@infosys.com",
            password="Password123!",
            description="Screen incoming resumes, compute match scores, and generate interview questions."
        ),
        DemoAccount(
            role="candidate",
            label="Job Candidate",
            email="candidate@gmail.com",
            password="Password123!",
            description="Upload resumes, view skill gap recommendations, and participate in interview simulations."
        )
    ]
