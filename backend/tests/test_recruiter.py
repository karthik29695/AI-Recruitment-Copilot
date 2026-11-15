import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.routes.recruiter import get_jobs, post_job, get_job_candidates, get_candidate_analysis, regenerate_candidate_questions
from app.schemas.recruitment import JobCreate

def run_recruiter_tests():
    print("--> 1. Initializing DB with jobs and candidate applications:")
    db = SessionLocal()
    init_db(db)

    print("\n--> 2. Testing get_jobs():")
    jobs = get_jobs(db=db)
    assert len(jobs) >= 2, f"Expected at least 2 jobs, got {len(jobs)}"
    for j in jobs:
        print(f"    [OK] Job: '{j.job_title}' ({j.department}) - Applicants: {j.applicants_count}")

    first_job = jobs[0]
    print(f"\n--> 3. Testing get_job_candidates() for Job ID {first_job.job_id} ('{first_job.job_title}'):")
    candidates = get_job_candidates(job_id=first_job.job_id, db=db)
    assert len(candidates) > 0, "Expected ranked candidates"
    print(f"    [OK] Retrieved {len(candidates)} ranked candidates:")
    for idx, c in enumerate(candidates, 1):
        print(f"       #{idx} {c.name}: Match {c.match_score}% | Hiring Score: {c.hiring_score}/100 | {c.recommendation}")

    top_candidate = candidates[0]
    print(f"\n--> 4. Testing get_candidate_analysis() for Candidate {top_candidate.name}:")
    analysis = get_candidate_analysis(job_id=first_job.job_id, candidate_id=top_candidate.candidate_id, db=db)
    print(f"    [OK] Matched Skills ({len(analysis.matched_skills)}): {analysis.matched_skills}")
    print(f"    [OK] Missing Skills ({len(analysis.missing_skills)}): {analysis.missing_skills}")
    print(f"    [OK] Learning Recommendation Notes: {analysis.recommendation_notes}")
    print(f"    [OK] Generated Questions ({len(analysis.questions)}):")
    for q in analysis.questions:
        print(f"       • [{q.category} - {q.difficulty_level}] {q.question_text[:70]}...")

    print("\n--> 5. Testing post_job() to create a new Job Description:")
    new_job_data = JobCreate(
        job_title="Cloud DevOps Engineer",
        department="Infrastructure",
        required_skills="Docker, Kubernetes, AWS, Terraform, CI/CD, Python",
        experience_required="4+ years",
        job_description="Responsible for scalable cloud infrastructure, container orchestration, and automated CI/CD pipelines."
    )
    created_job = post_job(job_in=new_job_data, db=db, current_user=None)
    assert created_job.job_id is not None
    print(f"    [OK] Created new job: '{created_job.job_title}' with {created_job.applicants_count} auto-evaluated applicants")

    print("\n--> 6. Testing regenerate_candidate_questions():")
    new_qs = regenerate_candidate_questions(job_id=first_job.job_id, candidate_id=top_candidate.candidate_id, db=db)
    assert len(new_qs) > 0
    print(f"    [OK] Regenerated {len(new_qs)} customized questions successfully")

    # Cleanup test job
    if created_job and created_job.job_id:
        from app.models.job import Job
        db.query(Job).filter(Job.job_id == created_job.job_id).delete()
        db.commit()

    db.close()
    print("\n*** ALL RECRUITER BACKEND TESTS PASSED CLEANLY! ***\n")

if __name__ == "__main__":
    run_recruiter_tests()
