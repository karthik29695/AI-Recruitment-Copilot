import sys
import os
from fastapi import HTTPException

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.candidate_match import CandidateMatch
from app.schemas.recruitment import HRStatusUpdate
from app.api.routes.hr import (
    get_hr_requisitions,
    get_hr_candidates,
    get_hr_analytics,
    update_candidate_hiring_status
)

def test_hr_company_isolation():
    db = SessionLocal()
    try:
        print("\n=======================================================")
        print("TESTING HR COMPANY ISOLATION & ACCESS CONTROL")
        print("=======================================================")

        # 1. Fetch HR users
        hr_cmr = db.query(User).filter(User.email == "hr@gmail.com").first()
        hr_infosys = db.query(User).filter(User.email == "hr@infosys.com").first()
        assert hr_cmr is not None, "CMR HR user (hr@gmail.com) must exist"
        assert hr_infosys is not None, "Infosys HR user (hr@infosys.com) must exist"

        # 2. Test CMR HR Requisitions
        cmr_reqs = get_hr_requisitions(db=db, current_user=hr_cmr)
        cmr_titles = [j.job_title for j in cmr_reqs]
        print(f"CMR HR Requisitions ({len(cmr_reqs)}): {cmr_titles}")
        
        # Verify CMR HR only sees CMR jobs
        for job in cmr_reqs:
            assert job.company == "CMR", f"Expected CMR company, got '{job.company}'"
        assert "Junior SDE Intern" in cmr_titles
        assert "AI Intern" in cmr_titles
        assert "Senior Machine Learning Engineer" not in cmr_titles
        assert "Full Stack Software Engineer" not in cmr_titles
        print("✓ CMR HR strictly sees only CMR requisitions (no Infosys jobs)")

        # 3. Test Infosys HR Requisitions
        infosys_reqs = get_hr_requisitions(db=db, current_user=hr_infosys)
        infosys_titles = [j.job_title for j in infosys_reqs]
        print(f"Infosys HR Requisitions ({len(infosys_reqs)}): {infosys_titles}")
        assert "Senior Machine Learning Engineer" in infosys_titles
        assert "Full Stack Software Engineer" in infosys_titles
        assert "Junior SDE Intern" not in infosys_titles
        print("✓ Infosys HR strictly sees demo Infosys requisitions")

        # 4. Test CMR HR Analytics
        cmr_analytics = get_hr_analytics(db=db, current_user=hr_cmr)
        assert cmr_analytics.is_demo is False
        assert cmr_analytics.organization == "CMR"
        assert cmr_analytics.total_requisitions == len(cmr_reqs)
        print(f"✓ CMR HR Analytics scoped to CMR: total_requisitions={cmr_analytics.total_requisitions}, org={cmr_analytics.organization}")

        # 5. Test Cross-Company Status Update Forbidden (403)
        # Find an Infosys match
        infosys_job = db.query(Job).filter(Job.company == "Infosys").first()
        assert infosys_job is not None
        infosys_match = db.query(CandidateMatch).filter(CandidateMatch.job_id == infosys_job.job_id).first()
        
        if infosys_match:
            try:
                update_candidate_hiring_status(
                    match_id=infosys_match.match_id,
                    status_in=HRStatusUpdate(status="Offer Extended"),
                    db=db,
                    current_user=hr_cmr
                )
                assert False, "Should have raised 403 Forbidden"
            except HTTPException as exc:
                assert exc.status_code == 403
                print("✓ Cross-company candidate status update correctly raised 403 Forbidden!")

        print("\nALL HR COMPANY ISOLATION TESTS PASSED SUCCESSFULLY!")

    finally:
        db.close()

if __name__ == "__main__":
    test_hr_company_isolation()
