from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    question_id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=True)
    question_text = Column(Text, nullable=False)
    difficulty_level = Column(String, default="Intermediate")  # Basic, Intermediate, Advanced
    category = Column(String, default="Technical")             # Technical, Behavioral, Scenario-based
    response_time = Column(String, default="3-5 min response")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("Job", backref="interview_questions")
    candidate = relationship("Candidate", backref="assigned_questions")

    def __repr__(self):
        return f"<InterviewQuestion {self.question_id} for job {self.job_id}>"
