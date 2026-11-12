from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.models.user import User
from app.core.security import get_password_hash

def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    
    # Check if demo users already exist
    demo_users = [
        {
            "email": "hr@infosys.com",
            "password": "Password123!",
            "full_name": "Deepika Sharma",
            "role": "hr",
            "company_or_institution": "Infosys Human Resources",
            "phone": "+91 98765 43210"
        },
        {
            "email": "recruiter@infosys.com",
            "password": "Password123!",
            "full_name": "Arun Kumar",
            "role": "recruiter",
            "company_or_institution": "Infosys Talent Acquisition",
            "phone": "+91 98765 43211"
        },
        {
            "email": "candidate@gmail.com",
            "password": "Password123!",
            "full_name": "Sarah Johnson",
            "role": "candidate",
            "company_or_institution": "B.Tech Computer Science Graduate",
            "phone": "+91 98765 43212"
        }
    ]

    for user_data in demo_users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                company_or_institution=user_data["company_or_institution"],
                phone=user_data["phone"],
                is_active=True
            )
            db.add(user)
    db.commit()
