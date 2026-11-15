from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class SkillGapReport(Base):
    __tablename__ = "skill_gap_reports"

    report_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    matched_skills = Column(Text, nullable=True)        # JSON string of matching competencies
    missing_skills = Column(Text, nullable=True)        # JSON string of missing competencies
    recommended_courses = Column(Text, nullable=True)   # Narrative & suggested courses
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate", backref="skill_gap_reports")
    job = relationship("Job", backref="skill_gap_reports")

    def __repr__(self):
        return f"<SkillGapReport cand={self.candidate_id} job={self.job_id}>"
