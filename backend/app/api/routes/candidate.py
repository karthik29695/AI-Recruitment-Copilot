from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json

from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.models.job import Job
from app.models.candidate_match import CandidateMatch
from app.models.skill_gap import SkillGapReport
from app.models.interview_question import InterviewQuestion
from app.schemas.recruitment import (
    ResumeUploadResponse, 
    CandidateSimpleOut, 
    CandidateJobItem, 
    CandidateApplicationOut, 
    ApplicationResponse,
    QuestionItem
)
from app.services.resume_parser import extract_text_from_file
from app.services.candidate_profiler import parse_candidate_profile
from app.services.matching_engine import evaluate_candidate_match, parse_skills
from app.services.question_engine import generate_interview_questions_for_role
from app.api.deps import get_current_user

router = APIRouter(prefix="/candidate", tags=["Candidate Portal"])

def safe_json_loads(data, default=None):
    """Safely decode JSON string to Python list/object with fallback to plain string or default."""
    if default is None:
        default = []
    if not data:
        return default
    if isinstance(data, list):
        return data
    try:
        parsed = json.loads(data)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception:
        if isinstance(data, str) and data.strip():
            tokens = [t.strip() for t in data.split(',') if t.strip()]
            return tokens if tokens else [data.strip()]
        return default

@router.get("/profile", response_model=CandidateSimpleOut)
def get_candidate_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the authenticated candidate's active profile."""
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not cand:
        cand = db.query(Candidate).filter(Candidate.email == current_user.email).first()
    if not cand:
        cand = Candidate(
            user_id=current_user.id,
            name=current_user.full_name,
            email=current_user.email,
            phone=current_user.phone or "",
            education=current_user.company_or_institution or "",
            experience="",
            skills="",
            resume_path="",
            is_demo=False
        )
        db.add(cand)
        db.commit()
        db.refresh(cand)
    return CandidateSimpleOut.model_validate(cand)

@router.post("/upload_resume", response_model=ResumeUploadResponse)
async def upload_candidate_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allow candidate to upload or replace their resume (PDF/DOCX), parse information,
    and update candidate profile.
    """
    filename = file.filename or "resume.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Please upload a PDF or DOCX file."
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Save to uploads/resumes/
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes"))
    os.makedirs(upload_dir, exist_ok=True)
    saved_path = os.path.join(upload_dir, filename)
    with open(saved_path, "wb") as f:
        f.write(content)

    # 1. Extract text from document
    raw_text = extract_text_from_file(content, filename)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from document.")

    # 2. Parse profile
    profile = parse_candidate_profile(raw_text, filename)

    # 3. Locate existing candidate record for this user or email
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not cand:
        cand = db.query(Candidate).filter(Candidate.email == current_user.email).first()

    proj_str = json.dumps(profile["projects"]) if profile.get("projects") else ""
    cert_str = "; ".join(profile["certifications"]) if profile.get("certifications") else ""

    if not cand:
        cand = Candidate(
            user_id=current_user.id,
            name=profile["name"] if profile["name"] and profile["name"] != "N/A" else current_user.full_name,
            email=current_user.email,
            phone=profile["phone"] if profile["phone"] != "N/A" else (current_user.phone or ""),
            education=profile["education"] or current_user.company_or_institution or "",
            experience=profile["experience"] or "",
            skills=", ".join(profile["skills"]),
            projects=proj_str,
            certifications=cert_str,
            resume_path=filename,
            is_demo=False
        )
        db.add(cand)
    else:
        cand.user_id = current_user.id
        if profile["name"] and profile["name"] != "N/A":
            cand.name = profile["name"]
        cand.phone = profile["phone"] if profile["phone"] != "N/A" else cand.phone
        cand.education = profile["education"] or cand.education
        cand.experience = profile["experience"] or cand.experience
        cand.skills = ", ".join(profile["skills"])
        cand.projects = proj_str or cand.projects
        cand.certifications = cert_str or cand.certifications
        cand.resume_path = filename
        cand.is_demo = False

    db.commit()
    db.refresh(cand)

    return ResumeUploadResponse(
        status="success",
        filename=filename,
        candidate_id=cand.candidate_id,
        name=cand.name,
        email=cand.email,
        phone=cand.phone or "N/A",
        education=cand.education or "N/A",
        experience=cand.experience or "N/A",
        skills=profile["skills"],
        projects=profile.get("projects", []),
        certifications=profile.get("certifications", []),
        extraction_accuracy=profile["extraction_accuracy"],
        message=f"Resume uploaded and processed successfully with {profile['extraction_accuracy']}% confidence!"
    )

@router.get("/jobs", response_model=List[CandidateJobItem])
def get_available_jobs_for_candidate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active jobs available for candidates to browse and apply.
    Indicates whether the current candidate has already applied to each job,
    and computes a preview match score based on candidate's profile skills.
    """
    cand = db.query(Candidate).filter(
        (Candidate.user_id == current_user.id) | (Candidate.email == current_user.email)
    ).first()

    is_demo = current_user.email.lower() == "candidate@gmail.com"
    if is_demo:
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    else:
        # Non-demo candidate only sees real posted jobs (zero mock demo jobs)
        jobs = db.query(Job).filter(Job.is_demo == False).order_by(Job.created_at.desc()).all()

    applied_map = {}
    if cand:
        matches = db.query(CandidateMatch).filter(CandidateMatch.candidate_id == cand.candidate_id).all()
        for m in matches:
            applied_map[m.job_id] = m

    result = []
    cand_skills = cand.skills if cand else ""
    cand_exp = cand.experience if cand else ""

    for job in jobs:
        match_record = applied_map.get(job.job_id)
        has_applied = match_record is not None
        app_status = match_record.status if match_record else None
        
        if match_record:
            score = match_record.match_score
        elif cand_skills and job.required_skills:
            eval_res = evaluate_candidate_match(
                candidate_skills_raw=cand_skills,
                job_skills_raw=job.required_skills,
                candidate_exp_raw=cand_exp,
                job_exp_raw=job.experience_required
            )
            score = eval_res["match_score"]
        else:
            score = None

        result.append(CandidateJobItem(
            job_id=job.job_id,
            job_title=job.job_title,
            department=job.department,
            required_skills=job.required_skills,
            experience_required=job.experience_required,
            job_description=job.job_description,
            created_at=job.created_at,
            has_applied=has_applied,
            application_status=app_status,
            match_score=score
        ))

    return result

@router.post("/jobs/{job_id}/apply", response_model=ApplicationResponse)
def apply_to_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Candidate submits an application to a specific job requisition.
    Automatically scores the application, generates a skill gap report,
    and initializes role-specific interview preparation questions.
    """
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cand = db.query(Candidate).filter(
        (Candidate.user_id == current_user.id) | (Candidate.email == current_user.email)
    ).first()

    if not cand:
        cand = Candidate(
            user_id=current_user.id,
            name=current_user.full_name,
            email=current_user.email,
            phone=current_user.phone or "",
            education=current_user.company_or_institution or "",
            experience="",
            skills="",
            resume_path="",
            is_demo=False
        )
        db.add(cand)
        db.commit()
        db.refresh(cand)

    # Evaluate compatibility match
    eval_res = evaluate_candidate_match(
        candidate_skills_raw=cand.skills,
        job_skills_raw=job.required_skills,
        candidate_exp_raw=cand.experience,
        job_exp_raw=job.experience_required
    )

    # Check if already applied
    existing_match = db.query(CandidateMatch).filter(
        CandidateMatch.candidate_id == cand.candidate_id,
        CandidateMatch.job_id == job_id
    ).first()

    if existing_match:
        existing_match.match_score = eval_res["match_score"]
        existing_match.hiring_score = eval_res["hiring_score"]
        if existing_match.status == "Rejected":
            existing_match.status = "Applied"
        db.commit()
        match_obj = existing_match
    else:
        match_obj = CandidateMatch(
            candidate_id=cand.candidate_id,
            job_id=job.job_id,
            match_score=eval_res["match_score"],
            hiring_score=eval_res["hiring_score"],
            status="Applied"
        )
        db.add(match_obj)
        db.commit()
        db.refresh(match_obj)

    # Ensure Skill Gap Report exists
    gap = db.query(SkillGapReport).filter(
        SkillGapReport.candidate_id == cand.candidate_id,
        SkillGapReport.job_id == job.job_id
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

    # Ensure customized interview questions exist
    existing_q_count = db.query(InterviewQuestion).filter(
        InterviewQuestion.candidate_id == cand.candidate_id,
        InterviewQuestion.job_id == job.job_id
    ).count()

    if existing_q_count == 0:
        questions = generate_interview_questions_for_role(
            job_title=job.job_title,
            required_skills=eval_res["matched_skills"] or ["Software Engineering"],
            missing_skills=eval_res["missing_skills"]
        )
        for q in questions:
            iq = InterviewQuestion(
                candidate_id=cand.candidate_id,
                job_id=job.job_id,
                question_text=q["question_text"],
                category=q["category"],
                difficulty_level=q["difficulty_level"],
                response_time=q.get("response_time", "3-5 min response")
            )
            db.add(iq)

    db.commit()

    return ApplicationResponse(
        status="success",
        message=f"Successfully applied to {job.job_title}!",
        job_id=job.job_id,
        job_title=job.job_title,
        match_score=eval_res["match_score"],
        hiring_score=eval_res["hiring_score"],
        application_status=match_obj.status
    )

@router.get("/applications", response_model=List[CandidateApplicationOut])
def get_candidate_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all job applications submitted by the current candidate,
    complete with AI evaluation scores, skill gaps, and interview prep questions.
    """
    cand = db.query(Candidate).filter(
        (Candidate.user_id == current_user.id) | (Candidate.email == current_user.email)
    ).first()

    if not cand:
        return []

    matches = (
        db.query(CandidateMatch, Job)
        .join(Job, CandidateMatch.job_id == Job.job_id)
        .filter(CandidateMatch.candidate_id == cand.candidate_id)
        .order_by(CandidateMatch.created_at.desc())
        .all()
    )

    results = []
    for match, job in matches:
        gap = db.query(SkillGapReport).filter(
            SkillGapReport.candidate_id == cand.candidate_id,
            SkillGapReport.job_id == job.job_id
        ).first()

        matched_skills = safe_json_loads(gap.matched_skills) if gap else []
        missing_skills = safe_json_loads(gap.missing_skills) if gap else []
        recommended_courses = safe_json_loads(gap.recommended_courses) if gap else []

        eval_res = evaluate_candidate_match(
            candidate_skills_raw=cand.skills,
            job_skills_raw=job.required_skills,
            candidate_exp_raw=cand.experience,
            job_exp_raw=job.experience_required
        )
        recommendation_notes = eval_res.get("recommendation_notes", "")

        q_records = db.query(InterviewQuestion).filter(
            InterviewQuestion.candidate_id == cand.candidate_id,
            InterviewQuestion.job_id == job.job_id
        ).all()

        questions = [
            QuestionItem(
                question_text=q.question_text,
                difficulty_level=q.difficulty_level,
                category=q.category,
                response_time=q.response_time or "3-5 min response"
            )
            for q in q_records
        ]

        results.append(CandidateApplicationOut(
            match_id=match.match_id,
            job_id=job.job_id,
            job_title=job.job_title,
            department=job.department,
            experience_required=job.experience_required,
            required_skills=job.required_skills,
            job_description=job.job_description,
            applied_at=match.created_at,
            status=match.status,
            match_score=match.match_score,
            hiring_score=match.hiring_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            recommendation_notes=recommendation_notes,
            recommended_courses=recommended_courses,
            questions=questions
        ))

    return results
