from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class JobCreate(BaseModel):
    job_title: str
    department: Optional[str] = "Engineering"
    required_skills: str  # Comma-separated or bullet list
    experience_required: Optional[str] = "3+ years"
    job_description: Optional[str] = ""

class JobOut(BaseModel):
    job_id: int
    job_title: str
    department: Optional[str] = None
    required_skills: Optional[str] = None
    experience_required: Optional[str] = None
    job_description: Optional[str] = None
    created_at: Optional[datetime] = None
    applicants_count: int = 0

    class Config:
        from_attributes = True

class CandidateSimpleOut(BaseModel):
    candidate_id: int
    name: str
    email: str
    phone: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    resume_path: Optional[str] = None

    class Config:
        from_attributes = True

class CandidateMatchItem(BaseModel):
    candidate_id: int
    name: str
    email: str
    experience: Optional[str] = None
    education: Optional[str] = None
    resume_path: Optional[str] = None
    key_skills: List[str] = []
    match_score: float
    hiring_score: float
    status: str
    recommendation: str
    recommendation_badge: str

class QuestionItem(BaseModel):
    question_text: str
    difficulty_level: str
    category: str
    response_time: str

class CandidateDetailedEvaluation(BaseModel):
    candidate: CandidateSimpleOut
    job_id: int
    job_title: str
    match_score: float
    hiring_score: float
    status: str
    recommendation: str
    recommendation_badge: str
    matched_skills: List[str]
    missing_skills: List[str]
    extra_skills: List[str]
    recommendation_notes: str
    recommended_courses: List[str]
    questions: List[QuestionItem]


class ResumeUploadResponse(BaseModel):
    status: str
    filename: str
    candidate_id: int
    name: str
    email: str
    phone: str
    education: str
    experience: str
    skills: List[str]
    certifications: List[str]
    extraction_accuracy: float
    message: str

class JDUploadResponse(BaseModel):
    status: str
    job_id: int
    job_title: str
    department: str
    experience_required: str
    education_required: str
    required_skills: List[str]
    job_description: str
    applicants_evaluated: int
