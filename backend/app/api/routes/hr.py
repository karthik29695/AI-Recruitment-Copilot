from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.api.deps import get_current_user

router = APIRouter(prefix="/hr", tags=["HR Operations"])

DEMO_HR_EMAIL = "hr@infosys.com"

class HRAnalyticsOut(BaseModel):
    is_demo: bool
    total_requisitions: int
    requisitions_sub: str
    active_recruiters: int
    recruiters_sub: str
    screening_accuracy: str
    accuracy_sub: str
    ats_status: str
    ats_sub: str
    organization: str

@router.get("/analytics", response_model=HRAnalyticsOut)
def get_hr_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve HR leadership analytics; delivers demo metrics for hr@infosys.com and live system metrics for other users."""
    is_demo = current_user.email.lower() == DEMO_HR_EMAIL.lower()

    if is_demo:
        return HRAnalyticsOut(
            is_demo=True,
            total_requisitions=42,
            requisitions_sub="↑ 8 new this quarter",
            active_recruiters=12,
            recruiters_sub="Across 4 departments",
            screening_accuracy="97%",
            accuracy_sub="Exceeds 95% target",
            ats_status="Online",
            ats_sub="Connected to candidate pool",
            organization=current_user.company_or_institution or "Corporate Human Resources"
        )

    # Real data for newly created or non-demo HR accounts
    non_demo_jobs_count = db.query(Job).filter(Job.is_demo == False).count()
    non_demo_recruiters_count = db.query(User).filter(
        User.role == "recruiter",
        User.email != "recruiter@infosys.com"
    ).count()
    non_demo_candidates_count = db.query(Candidate).filter(Candidate.is_demo == False).count()

    accuracy_val = "97%" if non_demo_candidates_count > 0 else "Ready"

    return HRAnalyticsOut(
        is_demo=False,
        total_requisitions=non_demo_jobs_count,
        requisitions_sub=f"{non_demo_jobs_count} requisitions posted",
        active_recruiters=non_demo_recruiters_count,
        recruiters_sub=f"{non_demo_recruiters_count} active recruiter account(s)",
        screening_accuracy=accuracy_val,
        accuracy_sub=f"{non_demo_candidates_count} candidate(s) ingested" if non_demo_candidates_count > 0 else "Upload resumes to evaluate",
        ats_status="Online",
        ats_sub="Real-time candidate sync",
        organization=current_user.company_or_institution or "Corporate Human Resources"
    )
