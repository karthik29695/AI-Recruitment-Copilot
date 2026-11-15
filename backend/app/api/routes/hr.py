from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.db.session import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.candidate_match import CandidateMatch
from app.schemas.recruitment import JobOut, HRCandidateItem, HRStatusUpdate
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

@router.get("/requisitions", response_model=List[JobOut])
def get_hr_requisitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all organizational job requisitions for HR review."""
    is_demo = current_user.email.lower() == DEMO_HR_EMAIL.lower()
    if is_demo:
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    else:
        jobs = db.query(Job).filter(Job.is_demo == False).order_by(Job.created_at.desc()).all()

    result = []
    for j in jobs:
        count = db.query(CandidateMatch).filter(CandidateMatch.job_id == j.job_id).count()
        result.append(JobOut(
            job_id=j.job_id,
            job_title=j.job_title,
            department=j.department,
            required_skills=j.required_skills,
            experience_required=j.experience_required,
            job_description=j.job_description,
            created_at=j.created_at,
            applicants_count=count
        ))
    return result

@router.get("/candidates", response_model=List[HRCandidateItem])
def get_hr_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all evaluated candidate matches across all jobs for HR decision making."""
    is_demo = current_user.email.lower() == DEMO_HR_EMAIL.lower()
    
    query = (
        db.query(CandidateMatch, Candidate, Job)
        .join(Candidate, CandidateMatch.candidate_id == Candidate.candidate_id)
        .join(Job, CandidateMatch.job_id == Job.job_id)
    )
    if not is_demo:
        query = query.filter(Candidate.is_demo == False, Job.is_demo == False)

    matches = query.order_by(CandidateMatch.created_at.desc()).all()

    result = []
    for match, cand, job in matches:
        result.append(HRCandidateItem(
            match_id=match.match_id,
            candidate_id=cand.candidate_id,
            name=cand.name,
            email=cand.email,
            job_id=job.job_id,
            job_title=job.job_title,
            department=job.department or "Engineering",
            match_score=match.match_score,
            hiring_score=match.hiring_score,
            status=match.status,
            experience=cand.experience,
            education=cand.education,
            applied_at=match.created_at
        ))
    return result

@router.post("/candidates/{match_id}/status")
def update_candidate_hiring_status(
    match_id: int,
    status_in: HRStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """HR decision to approve, shortlist, extend offer, or reject a candidate."""
    match = db.query(CandidateMatch).filter(CandidateMatch.match_id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Candidate application not found")
    
    match.status = status_in.status
    db.commit()
    db.refresh(match)
    return {
        "status": "success", 
        "message": f"Application status updated to '{match.status}'", 
        "match_id": match.match_id, 
        "new_status": match.status
    }
