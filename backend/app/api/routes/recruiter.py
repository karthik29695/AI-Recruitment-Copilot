from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json

from app.db.session import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.candidate_match import CandidateMatch
from app.models.skill_gap import SkillGapReport
from app.models.interview_question import InterviewQuestion
from app.models.user import User
from app.schemas.recruitment import (
    JobCreate,
    JobOut,
    CandidateMatchItem,
    CandidateDetailedEvaluation,
    CandidateSimpleOut,
    QuestionItem,
    ResumeUploadResponse,
    JDUploadResponse
)
from app.services.matching_engine import evaluate_candidate_match, parse_skills
from app.services.question_engine import generate_interview_questions_for_role
from app.services.resume_parser import extract_text_from_file
from app.services.candidate_profiler import parse_candidate_profile
from app.services.jd_analyzer import parse_job_description
from app.api.deps import get_current_user, get_current_user_optional
from app.core.company import get_job_company, get_user_company

router = APIRouter(prefix="/recruiter", tags=["Recruiter Operations"])

DEMO_RECRUITER_EMAIL = "recruiter@infosys.com"

def is_demo_recruiter(user: Optional[User]) -> bool:
    """Check if current requester is the seeded demo recruiter or unauthenticated test client."""
    if not isinstance(user, User):
        return True
    return user.email.lower() == DEMO_RECRUITER_EMAIL.lower()

@router.get("/jobs", response_model=List[JobOut])
def get_jobs(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """List posted jobs with applicant metrics scoped by account."""
    user = current_user if isinstance(current_user, User) else None
    if is_demo_recruiter(user):
        # Demo recruiter sees pre-seeded demo jobs and any jobs created by them
        if user:
            jobs = db.query(Job).filter(
                (Job.is_demo == True) | (Job.created_by_user_id == user.id)
            ).order_by(Job.created_at.desc()).all()
        else:
            jobs = db.query(Job).filter(Job.is_demo == True).order_by(Job.created_at.desc()).all()
    else:
        # Non-demo recruiters strictly see only jobs they created (zero mock data)
        jobs = db.query(Job).filter(
            Job.created_by_user_id == user.id,
            Job.is_demo == False
        ).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        if is_demo_recruiter(user):
            count = db.query(CandidateMatch).filter(CandidateMatch.job_id == job.job_id).count()
        else:
            # Count only non-demo candidates for non-demo recruiter
            count = (
                db.query(CandidateMatch)
                .join(Candidate, CandidateMatch.candidate_id == Candidate.candidate_id)
                .filter(
                    CandidateMatch.job_id == job.job_id,
                    Candidate.is_demo == False
                )
                .count()
            )
        job_dict = {
            "job_id": job.job_id,
            "job_title": job.job_title,
            "department": job.department,
            "company": get_job_company(job),
            "required_skills": job.required_skills,
            "experience_required": job.experience_required,
            "job_description": job.job_description,
            "created_at": job.created_at,
            "applicants_count": count
        }
        result.append(JobOut(**job_dict))
    return result

@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def post_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Upload or post a new Job Description. Candidate applications are submitted through the candidate portal."""
    user = current_user if isinstance(current_user, User) else None
    company_val = (job_in.company or "").strip() or get_user_company(user) or "Infosys"
    new_job = Job(
        job_title=job_in.job_title,
        department=job_in.department,
        company=company_val,
        required_skills=job_in.required_skills,
        experience_required=job_in.experience_required,
        job_description=job_in.job_description,
        created_by_user_id=user.id if user else None,
        is_demo=False
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return JobOut(
        job_id=new_job.job_id,
        job_title=new_job.job_title,
        department=new_job.department,
        company=get_job_company(new_job),
        required_skills=new_job.required_skills,
        experience_required=new_job.experience_required,
        job_description=new_job.job_description,
        created_at=new_job.created_at,
        applicants_count=0
    )

@router.get("/jobs/{job_id}/candidates", response_model=List[CandidateMatchItem])
def get_job_candidates(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get candidate rankings for a specific job, sorted by compatibility match score descending."""
    user = current_user if isinstance(current_user, User) else None
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not is_demo_recruiter(user):
        if job.created_by_user_id != user.id or job.is_demo:
            raise HTTPException(status_code=404, detail="Job not found or access restricted")

    query = (
        db.query(CandidateMatch, Candidate)
        .join(Candidate, CandidateMatch.candidate_id == Candidate.candidate_id)
        .filter(CandidateMatch.job_id == job_id)
    )

    if not is_demo_recruiter(user):
        # Exclude mock demo candidates for non-demo recruiters
        query = query.filter(
            Candidate.is_demo == False,
            (Candidate.uploaded_by_user_id == user.id) | (Candidate.user_id.isnot(None))
        )

    matches = query.order_by(CandidateMatch.match_score.desc()).all()

    ranked_list = []
    for match, cand in matches:
        eval_res = evaluate_candidate_match(
            candidate_skills_raw=cand.skills,
            job_skills_raw=job.required_skills,
            candidate_exp_raw=cand.experience,
            job_exp_raw=job.experience_required
        )
        cand_skills = parse_skills(cand.skills)
        ranked_list.append(CandidateMatchItem(
            candidate_id=cand.candidate_id,
            name=cand.name,
            email=cand.email,
            experience=cand.experience,
            education=cand.education,
            resume_path=cand.resume_path,
            key_skills=cand_skills[:5],
            match_score=match.match_score,
            hiring_score=match.hiring_score,
            status=match.status,
            recommendation=eval_res["recommendation"],
            recommendation_badge=eval_res["recommendation_badge"]
        ))

    return ranked_list

@router.get("/jobs/{job_id}/candidates/{candidate_id}/analysis", response_model=CandidateDetailedEvaluation)
def get_candidate_analysis(
    job_id: int,
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get in-depth analysis of a candidate against a job:
    - Full resume/profile details
    - Match score & Hiring score
    - Matched skills & Missing skills (Skill Gap Analysis)
    - Learning recommendations
    - Role-specific interview questions
    """
    user = current_user if isinstance(current_user, User) else None
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not is_demo_recruiter(user):
        if job.created_by_user_id != user.id or job.is_demo:
            raise HTTPException(status_code=404, detail="Job not found or access restricted")

    cand = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not is_demo_recruiter(user) and cand.is_demo:
        raise HTTPException(status_code=404, detail="Candidate not found or access restricted")

    match = db.query(CandidateMatch).filter(
        CandidateMatch.job_id == job_id,
        CandidateMatch.candidate_id == candidate_id
    ).first()

    eval_res = evaluate_candidate_match(
        candidate_skills_raw=cand.skills,
        job_skills_raw=job.required_skills,
        candidate_exp_raw=cand.experience,
        job_exp_raw=job.experience_required
    )

    # Fetch or generate interview questions
    saved_questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.job_id == job_id,
        InterviewQuestion.candidate_id == candidate_id
    ).all()

    if not saved_questions:
        # Generate and persist tailored interview questions
        job_skills = parse_skills(job.required_skills)
        generated = generate_interview_questions_for_role(
            job_title=job.job_title,
            required_skills=job_skills,
            missing_skills=eval_res["missing_skills"]
        )
        for q in generated:
            iq = InterviewQuestion(
                job_id=job.job_id,
                candidate_id=cand.candidate_id,
                question_text=q["question_text"],
                difficulty_level=q["difficulty_level"],
                category=q["category"],
                response_time=q["response_time"]
            )
            db.add(iq)
        db.commit()
        saved_questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.job_id == job_id,
            InterviewQuestion.candidate_id == candidate_id
        ).all()

    question_items = [
        QuestionItem(
            question_text=q.question_text,
            difficulty_level=q.difficulty_level,
            category=q.category,
            response_time=q.response_time
        )
        for q in saved_questions
    ]

    return CandidateDetailedEvaluation(
        candidate=CandidateSimpleOut.model_validate(cand),
        job_id=job.job_id,
        job_title=job.job_title,
        match_score=match.match_score if match else eval_res["match_score"],
        hiring_score=match.hiring_score if match else eval_res["hiring_score"],
        status=match.status if match else "Screened",
        recommendation=eval_res["recommendation"],
        recommendation_badge=eval_res["recommendation_badge"],
        matched_skills=eval_res["matched_skills"],
        missing_skills=eval_res["missing_skills"],
        extra_skills=eval_res["extra_skills"],
        recommendation_notes=eval_res["recommendation_notes"],
        recommended_courses=eval_res["recommended_courses"],
        questions=question_items
    )

@router.post("/jobs/{job_id}/candidates/{candidate_id}/generate-questions", response_model=List[QuestionItem])
def regenerate_candidate_questions(
    job_id: int,
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Regenerate customized interview questions tailored to the candidate and job."""
    user = current_user if isinstance(current_user, User) else None
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not is_demo_recruiter(user):
        if job.created_by_user_id != user.id or job.is_demo:
            raise HTTPException(status_code=404, detail="Job not found or access restricted")

    cand = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not is_demo_recruiter(user) and cand.is_demo:
        raise HTTPException(status_code=404, detail="Candidate not found or access restricted")

    eval_res = evaluate_candidate_match(
        candidate_skills_raw=cand.skills,
        job_skills_raw=job.required_skills,
        candidate_exp_raw=cand.experience,
        job_exp_raw=job.experience_required
    )

    # Delete previous questions for this candidate
    db.query(InterviewQuestion).filter(
        InterviewQuestion.job_id == job_id,
        InterviewQuestion.candidate_id == candidate_id
    ).delete()

    job_skills = parse_skills(job.required_skills)
    generated = generate_interview_questions_for_role(
        job_title=job.job_title,
        required_skills=job_skills,
        missing_skills=eval_res["missing_skills"]
    )

    new_questions = []
    for q in generated:
        iq = InterviewQuestion(
            job_id=job.job_id,
            candidate_id=cand.candidate_id,
            question_text=q["question_text"],
            difficulty_level=q["difficulty_level"],
            category=q["category"],
            response_time=q["response_time"]
        )
        db.add(iq)
        new_questions.append(QuestionItem(
            question_text=q["question_text"],
            difficulty_level=q["difficulty_level"],
            category=q["category"],
            response_time=q["response_time"]
        ))
    db.commit()

    return new_questions


@router.post("/upload_resume", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Ingest a candidate resume (PDF or DOCX), extract text, parse structured candidate profile,
    and persist into the candidate database.
    """
    user = current_user if isinstance(current_user, User) else None
    filename = file.filename or "resume.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload a PDF or DOCX resume."
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded resume file is empty.")

    # Save to uploads storage
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes"))
    os.makedirs(upload_dir, exist_ok=True)
    saved_path = os.path.join(upload_dir, filename)
    with open(saved_path, "wb") as f:
        f.write(content)

    # 1. Text extraction using pdfplumber / python-docx
    raw_text = extract_text_from_file(content, filename)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded document.")

    # 2. Extract structured candidate profile
    profile = parse_candidate_profile(raw_text, filename)

    proj_str = json.dumps(profile["projects"]) if profile.get("projects") else ""
    cert_str = "; ".join(profile["certifications"]) if profile.get("certifications") else ""

    # 3. Save or update Candidate record
    cand = db.query(Candidate).filter(Candidate.email == profile["email"]).first()
    if not cand:
        cand = Candidate(
            name=profile["name"],
            email=profile["email"],
            phone=profile["phone"],
            education=profile["education"],
            experience=profile["experience"],
            skills=", ".join(profile["skills"]),
            projects=proj_str,
            certifications=cert_str,
            resume_path=filename,
            uploaded_by_user_id=user.id if user else None,
            is_demo=False
        )
        db.add(cand)
    else:
        cand.name = profile["name"]
        cand.phone = profile["phone"]
        cand.education = profile["education"]
        cand.experience = profile["experience"]
        cand.skills = ", ".join(profile["skills"])
        cand.projects = proj_str or cand.projects
        cand.certifications = cert_str or cand.certifications
        cand.resume_path = filename
        if user:
            cand.uploaded_by_user_id = user.id
        cand.is_demo = False
    db.commit()
    db.refresh(cand)

    # 4. Automatically match against relevant active jobs
    if is_demo_recruiter(user):
        jobs = db.query(Job).filter(
            (Job.is_demo == True) |
            (Job.created_by_user_id == (user.id if user else None))
        ).all()
    else:
        # Non-demo recruiter: strictly matches only against this recruiter's non-demo jobs
        jobs = db.query(Job).filter(
            Job.created_by_user_id == user.id,
            Job.is_demo == False
        ).all()

    for job in jobs:
        eval_res = evaluate_candidate_match(
            candidate_skills_raw=cand.skills,
            job_skills_raw=job.required_skills,
            candidate_exp_raw=cand.experience,
            job_exp_raw=job.experience_required
        )
        match = db.query(CandidateMatch).filter(
            CandidateMatch.job_id == job.job_id,
            CandidateMatch.candidate_id == cand.candidate_id
        ).first()

        if not match:
            match = CandidateMatch(
                candidate_id=cand.candidate_id,
                job_id=job.job_id,
                match_score=eval_res["match_score"],
                hiring_score=eval_res["hiring_score"],
                status="Screened"
            )
            db.add(match)
        else:
            match.match_score = eval_res["match_score"]
            match.hiring_score = eval_res["hiring_score"]

        # Skill gap report
        gap = db.query(SkillGapReport).filter(
            SkillGapReport.job_id == job.job_id,
            SkillGapReport.candidate_id == cand.candidate_id
        ).first()

        if not gap:
            gap = SkillGapReport(
                candidate_id=cand.candidate_id,
                job_id=job.job_id,
                matched_skills=json.dumps(eval_res["matched_skills"]),
                missing_skills=json.dumps(eval_res["missing_skills"]),
                recommended_courses=json.dumps(eval_res["recommended_courses"])
            )
            db.add(gap)
        else:
            gap.matched_skills = json.dumps(eval_res["matched_skills"])
            gap.missing_skills = json.dumps(eval_res["missing_skills"])
            gap.recommended_courses = json.dumps(eval_res["recommended_courses"])

    db.commit()

    return ResumeUploadResponse(
        status="success",
        filename=filename,
        candidate_id=cand.candidate_id,
        name=profile["name"],
        email=profile["email"],
        phone=profile["phone"],
        education=profile["education"],
        experience=profile["experience"],
        skills=profile["skills"],
        projects=profile.get("projects", []),
        certifications=profile.get("certifications", []),
        extraction_accuracy=profile["extraction_accuracy"],
        message=f"Resume parsed successfully with {profile['extraction_accuracy']}% confidence score."
    )

@router.post("/upload_jd", response_model=JDUploadResponse)
async def upload_jd(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Ingest a Job Description from either a file upload (.pdf, .docx, .txt) or pasted raw text,
    extract structured requirements (skills, experience, education), and publish the Job.
    """
    user = current_user if isinstance(current_user, User) else None
    jd_content = ""
    filename = "uploaded_jd.txt"

    if file:
        filename = file.filename or "uploaded_jd.txt"
        file_bytes = await file.read()
        jd_content = extract_text_from_file(file_bytes, filename)
    elif raw_text:
        jd_content = raw_text
    else:
        raise HTTPException(status_code=400, detail="Please upload a JD document or provide raw text.")

    if not jd_content.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from Job Description.")

    # 1. Parse structured job requirements
    parsed_jd = parse_job_description(jd_content)

    # 2. Create Job in database
    company_val = get_user_company(user) or "Infosys"
    new_job = Job(
        job_title=parsed_jd["job_title"],
        department=parsed_jd["department"],
        company=company_val,
        required_skills=parsed_jd["required_skills_str"],
        experience_required=parsed_jd["experience_required"],
        job_description=parsed_jd["job_description"],
        created_by_user_id=user.id if user else None,
        is_demo=False
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return JDUploadResponse(
        status="success",
        job_id=new_job.job_id,
        job_title=new_job.job_title,
        department=new_job.department,
        experience_required=new_job.experience_required,
        education_required=parsed_jd["education_required"],
        required_skills=parsed_jd["required_skills"],
        job_description=new_job.job_description,
        applicants_evaluated=0
    )
