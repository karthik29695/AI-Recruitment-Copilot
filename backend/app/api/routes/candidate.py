from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import json

from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.recruitment import ResumeUploadResponse, CandidateSimpleOut
from app.services.resume_parser import extract_text_from_file
from app.services.candidate_profiler import parse_candidate_profile
from app.api.deps import get_current_user

router = APIRouter(prefix="/candidate", tags=["Candidate Portal"])

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
