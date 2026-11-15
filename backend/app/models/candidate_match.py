from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class CandidateMatch(Base):
    __tablename__ = "candidate_matches"

    match_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    match_score = Column(Float, default=0.0)      # Percentage match e.g. 92.0
    hiring_score = Column(Float, default=0.0)     # Composite score out of 100
    status = Column(String, default="Screened")   # Screened, Shortlisted, In Review, Rejected
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate", backref="matches")
    job = relationship("Job", backref="candidate_matches")

    def __repr__(self):
        return f"<CandidateMatch cand={self.candidate_id} job={self.job_id} score={self.match_score}>"
