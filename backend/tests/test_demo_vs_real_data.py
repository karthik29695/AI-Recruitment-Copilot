import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.schemas.auth import UserLogin, UserRegister
from app.schemas.recruitment import JobCreate
from app.api.routes.auth import login, register
from app.api.routes.recruiter import get_jobs, post_job, get_job_candidates
from app.api.routes.candidate import get_candidate_profile
from app.api.routes.hr import get_hr_analytics

def test_demo_vs_real_data_separation():
    print("\n=======================================================")
    print("VERIFYING DEMO VS REAL DATA ISOLATION ACROSS ALL ROLES")
    print("=======================================================\n")

    db = SessionLocal()
    init_db(db)

    # 1. VERIFY DEMO RECRUITER (recruiter@infosys.com)
    print("--> 1. Verifying Demo Recruiter (recruiter@infosys.com):")
    demo_recruiter = db.query(User).filter(User.email == "recruiter@infosys.com").first()
    assert demo_recruiter is not None
    demo_jobs = get_jobs(db=db, current_user=demo_recruiter)
    assert len(demo_jobs) >= 2, f"Demo recruiter should see demo jobs, found {len(demo_jobs)}"
    print(f"    [PASS] Demo recruiter sees {len(demo_jobs)} demo job requisitions.")

    first_job_id = demo_jobs[0].job_id
    demo_cands = get_job_candidates(job_id=first_job_id, db=db, current_user=demo_recruiter)
    assert len(demo_cands) > 0
    print(f"    [PASS] Demo recruiter sees {len(demo_cands)} evaluated candidates for demo job.")

    # 2. VERIFY NON-DEMO RECRUITER (ZERO MOCK DATA)
    print("\n--> 2. Verifying Non-Demo Recruiter (zero mock data):")
    reg_email = "alex.recruiter@company.com"
    prev = db.query(User).filter(User.email == reg_email).first()
    if prev:
        db.query(Job).filter(Job.created_by_user_id == prev.id).delete()
        db.delete(prev)
        db.commit()

    reg_payload = UserRegister(
        email=reg_email,
        password="Password123!",
        full_name="Alex Miller",
        role="recruiter",
        company_or_institution="NextGen Software"
    )
    reg_res = register(user_in=reg_payload, db=db)
    new_recruiter = db.query(User).filter(User.id == reg_res.user.id).first()

    # Newly registered recruiter MUST see 0 jobs (NO demo jobs)
    new_jobs = get_jobs(db=db, current_user=new_recruiter)
    assert len(new_jobs) == 0, f"Expected 0 jobs for new recruiter, got {len(new_jobs)}"
    print("    [PASS] Newly registered recruiter sees 0 jobs (zero mock data shown).")

    # Post a real job as this new recruiter
    new_job_data = JobCreate(
        job_title="React Frontend Specialist",
        department="UI Platform",
        required_skills="React, Tailwind, JavaScript, HTML5",
        experience_required="2+ years",
        job_description="Building modern interfaces."
    )
    posted_job = post_job(job_in=new_job_data, db=db, current_user=new_recruiter)
    print(f"    [PASS] Non-demo recruiter created job ID {posted_job.job_id}.")

    # Check candidates for this new job -> MUST NOT see demo candidates
    new_job_cands = get_job_candidates(job_id=posted_job.job_id, db=db, current_user=new_recruiter)
    for c in new_job_cands:
        assert c.email not in [
            "sarah.johnson@example.com",
            "michael.chen@example.com",
            "emily.rodriguez@example.com",
            "david.park@example.com"
        ], f"Mock candidate {c.name} leaked into non-demo recruiter pool!"
    print(f"    [PASS] Non-demo job contains 0 mock candidates (evaluated count: {len(new_job_cands)}).")

    # 3. VERIFY DEMO CANDIDATE (candidate@gmail.com)
    print("\n--> 3. Verifying Demo Candidate (candidate@gmail.com):")
    demo_candidate_user = db.query(User).filter(User.email == "candidate@gmail.com").first()
    assert demo_candidate_user is not None
    cand_profile = get_candidate_profile(db=db, current_user=demo_candidate_user)
    assert "Python" in cand_profile.skills
    assert cand_profile.name == "Sarah Johnson"
    print(f"    [PASS] Demo candidate retains Sarah Johnson profile with skills: {cand_profile.skills[:45]}...")

    # 4. VERIFY NON-DEMO CANDIDATE (ZERO MOCK SKILLS)
    print("\n--> 4. Verifying Non-Demo Candidate (zero mock skills):")
    new_cand_email = "new.candidate.verify@gmail.com"
    prev_c = db.query(User).filter(User.email == new_cand_email).first()
    if prev_c:
        db.query(Candidate).filter(Candidate.user_id == prev_c.id).delete()
        db.delete(prev_c)
        db.commit()

    cand_payload = UserRegister(
        email=new_cand_email,
        password="Password123!",
        full_name="Rohan Verma",
        role="candidate",
        company_or_institution="National Institute of Technology"
    )
    cand_res = register(user_in=cand_payload, db=db)
    new_cand_user = db.query(User).filter(User.id == cand_res.user.id).first()

    new_profile = get_candidate_profile(db=db, current_user=new_cand_user)
    assert new_profile.skills == "" or new_profile.skills is None, f"Expected empty skills, got {new_profile.skills}"
    assert new_profile.experience == "" or new_profile.experience is None, f"Expected empty exp, got {new_profile.experience}"
    assert new_profile.resume_path == "" or new_profile.resume_path is None, f"Expected empty resume, got {new_profile.resume_path}"
    print("    [PASS] Newly registered candidate profile has 0 mock skills and empty experience until resume upload.")

    # 5. VERIFY DEMO HR (hr@infosys.com)
    print("\n--> 5. Verifying Demo HR (hr@infosys.com):")
    demo_hr_user = db.query(User).filter(User.email == "hr@infosys.com").first()
    demo_hr_data = get_hr_analytics(db=db, current_user=demo_hr_user)
    assert demo_hr_data.is_demo is True
    assert demo_hr_data.total_requisitions == 42
    assert demo_hr_data.active_recruiters == 12
    print("    [PASS] Demo HR retains leadership benchmark metrics (42 requisitions, 12 recruiters, 97%).")

    # 6. VERIFY NON-DEMO HR (REAL METRICS)
    print("\n--> 6. Verifying Non-Demo HR (real live metrics):")
    new_hr_email = "new.hr.director@enterprise.com"
    prev_h = db.query(User).filter(User.email == new_hr_email).first()
    if prev_h:
        db.delete(prev_h)
        db.commit()

    hr_payload = UserRegister(
        email=new_hr_email,
        password="Password123!",
        full_name="Catherine Reed",
        role="hr",
        company_or_institution="Enterprise Corp"
    )
    hr_reg_res = register(user_in=hr_payload, db=db)
    new_hr_user = db.query(User).filter(User.id == hr_reg_res.user.id).first()

    new_hr_data = get_hr_analytics(db=db, current_user=new_hr_user)
    assert new_hr_data.is_demo is False
    print(f"    [PASS] Non-demo HR receives real platform counts: {new_hr_data.total_requisitions} requisitions, {new_hr_data.active_recruiters} active recruiters.")

    # Clean up test records
    u1 = db.query(User).filter(User.email == reg_email).first()
    if u1:
        db.query(Job).filter(Job.created_by_user_id == u1.id).delete()
        db.delete(u1)
    u2 = db.query(User).filter(User.email == new_cand_email).first()
    if u2:
        db.query(Candidate).filter(Candidate.user_id == u2.id).delete()
        db.delete(u2)
    u3 = db.query(User).filter(User.email == new_hr_email).first()
    if u3:
        db.delete(u3)
    db.commit()
    db.close()

    print("\n=======================================================")
    print("*** ALL DEMO VS REAL DATA ISOLATION TESTS PASSED! ***")
    print("=======================================================\n")

if __name__ == "__main__":
    test_demo_vs_real_data_separation()
