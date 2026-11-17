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
from app.core.company import get_user_company, get_job_company, companies_match

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
    """Retrieve HR leadership analytics strictly scoped to the HR user's organization."""
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
            organization=current_user.company_or_institution or "Infosys"
        )

    # Scoped strictly to the logged-in HR's company
    hr_comp = get_user_company(current_user)
    
    # 1. Non-demo jobs matching this HR's company
    all_non_demo_jobs = db.query(Job).filter(Job.is_demo == False).all()
    matching_jobs = [j for j in all_non_demo_jobs if companies_match(get_job_company(j), hr_comp)]
    matching_jobs_count = len(matching_jobs)
    job_ids = [j.job_id for j in matching_jobs]

    # 2. Recruiters belonging to this HR's company
    all_recruiters = db.query(User).filter(
        User.role == "recruiter",
        User.email != "recruiter@infosys.com"
    ).all()
    matching_recruiters = [r for r in all_recruiters if companies_match(get_user_company(r), hr_comp)]
    matching_recruiters_count = len(matching_recruiters)

    # 3. Candidates who applied to this company's jobs
    if job_ids:
        matching_cand_count = db.query(CandidateMatch).filter(
            CandidateMatch.job_id.in_(job_ids)
        ).distinct(CandidateMatch.candidate_id).count()
    else:
        matching_cand_count = 0

    accuracy_val = "97%" if matching_cand_count > 0 else "Ready"
    display_org = hr_comp or current_user.company_or_institution or "Your Organization"

    return HRAnalyticsOut(
        is_demo=False,
        total_requisitions=matching_jobs_count,
        requisitions_sub=f"{matching_jobs_count} active requisition(s)",
        active_recruiters=matching_recruiters_count,
        recruiters_sub=f"{matching_recruiters_count} recruiter(s) in {display_org}",
        screening_accuracy=accuracy_val,
        accuracy_sub=f"{matching_cand_count} applicant(s) evaluated" if matching_cand_count > 0 else "Candidates will appear once applied",
        ats_status="Online",
        ats_sub="Real-time candidate sync",
        organization=display_org
    )

@router.get("/requisitions", response_model=List[JobOut])
def get_hr_requisitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve organizational job requisitions for HR review, scoped to HR's company."""
    is_demo = current_user.email.lower() == DEMO_HR_EMAIL.lower()
    hr_comp = get_user_company(current_user)

    if is_demo:
        all_jobs = db.query(Job).order_by(Job.created_at.desc()).all()
        jobs = [j for j in all_jobs if j.is_demo or companies_match(get_job_company(j), "Infosys")]
    else:
        all_jobs = db.query(Job).filter(Job.is_demo == False).order_by(Job.created_at.desc()).all()
        jobs = [j for j in all_jobs if companies_match(get_job_company(j), hr_comp)]

    result = []
    for j in jobs:
        count = db.query(CandidateMatch).filter(CandidateMatch.job_id == j.job_id).count()
        result.append(JobOut(
            job_id=j.job_id,
            job_title=j.job_title,
            department=j.department,
            company=get_job_company(j),
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
    """Retrieve evaluated candidate matches across jobs belonging to the HR's organization."""
    is_demo = current_user.email.lower() == DEMO_HR_EMAIL.lower()
    hr_comp = get_user_company(current_user)
    
    query = (
        db.query(CandidateMatch, Candidate, Job)
        .join(Candidate, CandidateMatch.candidate_id == Candidate.candidate_id)
        .join(Job, CandidateMatch.job_id == Job.job_id)
    )
    if is_demo:
        all_matches = query.order_by(CandidateMatch.created_at.desc()).all()
        matches = [(m, c, j) for (m, c, j) in all_matches if j.is_demo or companies_match(get_job_company(j), "Infosys")]
    else:
        all_matches = query.filter(Job.is_demo == False).order_by(CandidateMatch.created_at.desc()).all()
        matches = [(m, c, j) for (m, c, j) in all_matches if companies_match(get_job_company(j), hr_comp)]

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
            company=get_job_company(job),
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
    """HR decision to approve, shortlist, extend offer, or reject a candidate within their company."""
    match = db.query(CandidateMatch).filter(CandidateMatch.match_id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Candidate application not found")
    
    job = db.query(Job).filter(Job.job_id == match.job_id).first()
    is_demo = current_user.email.lower() == DEMO_HR_EMAIL.lower()
    hr_comp = get_user_company(current_user)

    if not is_demo and job:
        job_comp = get_job_company(job)
        if not companies_match(job_comp, hr_comp):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only update applications for jobs belonging to your organization."
            )

    match.status = status_in.status
    db.commit()
    db.refresh(match)
    return {
        "status": "success", 
        "message": f"Application status updated to '{match.status}'", 
        "match_id": match.match_id, 
        "new_status": match.status
    }
