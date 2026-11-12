from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    required_skills = Column(Text, nullable=True)
    experience_required = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", backref="created_jobs")

    def __repr__(self):
        return f"<Job {self.job_title} ({self.department})>"
