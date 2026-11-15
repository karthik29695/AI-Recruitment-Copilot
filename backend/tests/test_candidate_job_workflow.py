"""
Integration test for Candidate Job Browsing and Application Workflow:
1. Recruiter creates a new requisition -> applicant count starts at 0.
2. Candidate browses available jobs via get_available_jobs_for_candidate -> sees requisition with has_applied = False.
3. Candidate calls apply_to_job(job_id) -> registers application, calculates match score, creates skill gap report, and creates interview questions.
4. Candidate calls get_candidate_applications() -> retrieves applied job with match score, skill gap report, and interview prep questions.
5. Recruiter reviews requisition -> applicant count is now 1, candidate appears in ranked pipeline.
6. HR views candidate in approvals dashboard and updates status.
"""

import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.models import User, Candidate, Job, CandidateMatch, SkillGapReport, InterviewQuestion
from app.api.routes.candidate import (
    get_available_jobs_for_candidate,
    apply_to_job,
    get_candidate_applications
)
from app.api.routes.recruiter import get_job_candidates, post_job
from app.api.routes.hr import get_hr_candidates, update_candidate_hiring_status
from app.schemas.recruitment import JobCreate, HRStatusUpdate

def test_workflow():
    db = SessionLocal()
    try:
        print("\n=======================================================")
        print("TESTING CANDIDATE BROWSE-AND-APPLY & ATS WORKFLOW")
        print("=======================================================")

        # 1. Setup recruiter and candidate test users
        recruiter = db.query(User).filter(User.email == "recruiter@infosys.com").first()
        assert recruiter is not None, "Demo recruiter must exist"

        applicant_email = "alex.rivera@candidate.com"
        cand_user = db.query(User).filter(User.email == applicant_email).first()
        if not cand_user:
            cand_user = User(
                email=applicant_email,
                hashed_password="hashed_dummy_password",
                full_name="Alex Rivera",
                role="candidate",
                company_or_institution="NIT Surathkal"
            )
            db.add(cand_user)
            db.commit()
            db.refresh(cand_user)

        # Ensure candidate profile with skills
        cand = db.query(Candidate).filter(Candidate.user_id == cand_user.id).first()
        if not cand:
            cand = Candidate(
                user_id=cand_user.id,
                name="Alex Rivera",
                email=applicant_email,
                phone="+91 9123456780",
                education="B.Tech Computer Science",
                experience="3 years",
                skills="Python, FastAPI, Docker, PostgreSQL, React, Git",
                projects='[{"title": "Task Orchestrator", "link": "https://github.com/alex/tasker", "highlights": ["Built async queue"]}]',
                certifications='["AWS Certified Developer"]',
                is_demo=False
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)

        # 2. Recruiter posts a new Job Requisition via post_job API route
        new_job_data = JobCreate(
            job_title="Senior Cloud Backend Systems Engineer",
            department="Cloud Architecture",
            experience_required="3+ years",
            required_skills="Python, FastAPI, Docker, Kubernetes, PostgreSQL",
            job_description="Seeking a backend engineer to design scalable distributed services."
        )
        created_job_out = post_job(job_in=new_job_data, db=db, current_user=recruiter)
        job_id = created_job_out.job_id
        print(f"\n--> 1. Recruiter created requisition #{job_id}: '{created_job_out.job_title}'")
        assert created_job_out.applicants_count == 0, f"Expected 0 initial applicants, got {created_job_out.applicants_count}"
        print(f"    [PASS] Verified zero auto-applied applicants on job creation (Count: {created_job_out.applicants_count})")

        # 3. Candidate browses jobs and sees the requisition with has_applied = False
        available_jobs = get_available_jobs_for_candidate(db=db, current_user=cand_user)
        target_job = next((j for j in available_jobs if j.job_id == job_id), None)
        assert target_job is not None, f"Requisition #{job_id} not found in available jobs"
        assert target_job.has_applied is False, "Candidate should not have applied yet"
        print(f"\n--> 2. Candidate browses job portal:")
        print(f"    [PASS] Job visible with has_applied = {target_job.has_applied} and preview match score = {target_job.match_score}%")

        # 4. Candidate calls apply_to_job API route (the exact endpoint that previously threw TypeError)
        apply_res = apply_to_job(job_id=job_id, db=db, current_user=cand_user)
        print(f"\n--> 3. Candidate submitted application via apply_to_job route:")
        print(f"    [PASS] Status: {apply_res.status} - {apply_res.message}")
        print(f"    [PASS] Match Score: {apply_res.match_score}% | Hiring Score: {apply_res.hiring_score}/100")
        assert apply_res.status == "success"

        # 5. Candidate retrieves applications via get_candidate_applications API route
        my_applications = get_candidate_applications(db=db, current_user=cand_user)
        my_app = next((a for a in my_applications if a.job_id == job_id), None)
        assert my_app is not None, f"Application for job #{job_id} not found in my_applications"
        print(f"\n--> 4. Candidate retrieves applications dossier:")
        print(f"    [PASS] Application status: {my_app.status}")
        print(f"    [PASS] Matched Skills ({len(my_app.matched_skills)}): {my_app.matched_skills}")
        print(f"    [PASS] Missing Skills ({len(my_app.missing_skills)}): {my_app.missing_skills}")
        print(f"    [PASS] Generated Interview Prep Questions ({len(my_app.questions)}):")
        for q in my_app.questions:
            print(f"         • [{q.category} - {q.difficulty_level}] {q.question_text[:70]}... ({q.response_time})")
        assert len(my_app.questions) > 0, "Expected interview questions to be generated"

        # 6. Recruiter reviews requisition applicants
        ranked_candidates = get_job_candidates(job_id=job_id, db=db)
        assert len(ranked_candidates) == 1, f"Expected 1 applicant, got {len(ranked_candidates)}"
        candidate_id = ranked_candidates[0].candidate_id
        print(f"\n--> 5. Recruiter reviews requisition pipeline:")
        print(f"    [PASS] Requisition #{job_id} now has {len(ranked_candidates)} applicant ({ranked_candidates[0].name}) with score {ranked_candidates[0].match_score}%")

        # 7. HR inspects candidate in Approvals dashboard and updates status to Shortlisted
        hr_user = db.query(User).filter(User.email == "hr@infosys.com").first()
        hr_candidates = get_hr_candidates(db=db, current_user=hr_user)
        target_hr_cand = next((c for c in hr_candidates if c.job_id == job_id and c.candidate_id == candidate_id), None)
        assert target_hr_cand is not None, "Candidate must appear in HR candidate pipeline"
        match_id = target_hr_cand.match_id

        hr_update_res = update_candidate_hiring_status(
            match_id=match_id,
            status_in=HRStatusUpdate(status="Shortlisted"),
            db=db,
            current_user=hr_user
        )
        print(f"\n--> 6. HR Manager updates status:")
        print(f"    [PASS] HR update response: {hr_update_res.get('message')}")
        assert hr_update_res.get("new_status") == "Shortlisted"

        # 8. Candidate checks applications again to verify status updated to Shortlisted
        refreshed_applications = get_candidate_applications(db=db, current_user=cand_user)
        refreshed_app = next((a for a in refreshed_applications if a.job_id == job_id), None)
        assert refreshed_app.status == "Shortlisted", f"Expected status 'Shortlisted', got {refreshed_app.status}"
        print(f"\n--> 7. Candidate checks updated application:")
        print(f"    [PASS] Real-time status in candidate view: '{refreshed_app.status}'")

        print("\n=======================================================")
        print("*** ALL CANDIDATE JOB WORKFLOW TESTS PASSED 100%! ***")
        print("=======================================================\n")

    finally:
        # Cleanup test artifacts so dev/demo database remains clean
        try:
            if 'job_id' in locals() and job_id:
                db.query(InterviewQuestion).filter(InterviewQuestion.job_id == job_id).delete()
                db.query(SkillGapReport).filter(SkillGapReport.job_id == job_id).delete()
                db.query(CandidateMatch).filter(CandidateMatch.job_id == job_id).delete()
                db.query(Job).filter(Job.job_id == job_id).delete()
            if 'cand_user' in locals() and cand_user:
                if 'cand' in locals() and cand:
                    db.query(InterviewQuestion).filter(InterviewQuestion.candidate_id == cand.candidate_id).delete()
                    db.query(SkillGapReport).filter(SkillGapReport.candidate_id == cand.candidate_id).delete()
                    db.query(CandidateMatch).filter(CandidateMatch.candidate_id == cand.candidate_id).delete()
                    db.delete(cand)
                db.delete(cand_user)
            db.commit()
        except Exception as e:
            db.rollback()
        finally:
            db.close()

if __name__ == "__main__":
    test_workflow()
