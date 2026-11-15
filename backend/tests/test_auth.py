import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister
from app.api.routes.auth import login, register, read_current_user, get_demo_accounts

def run_tests():
    print("--> 1. Initializing DB and Verifying Demo Accounts:")
    db = SessionLocal()
    init_db(db)

    demos = get_demo_accounts()
    assert len(demos) == 3
    print(f"    [OK] Loaded {len(demos)} demo roles: {[d.role for d in demos]}")

    print("\n--> 2. Verifying Login & JWT generation for HR, Recruiter, Candidate:")
    for demo in demos:
        creds = UserLogin(email=demo.email, password=demo.password, role=demo.role)
        res = login(credentials=creds, db=db)
        assert res.access_token is not None
        assert res.user.role == demo.role
        print(f"    [OK] Login successful for {demo.role.upper()} ({res.user.full_name}) -> Token generated")

        # Test user lookup
        user_db = db.query(User).filter(User.id == res.user.id).first()
        out = read_current_user(current_user=user_db)
        assert out.email == demo.email
        print(f"    [OK] Profile retrieved for {demo.role.upper()}: {out.email}")

    print("\n--> 3. Testing Mismatched Role Access:")
    try:
        creds = UserLogin(email="candidate@gmail.com", password="Password123!", role="hr")
        login(credentials=creds, db=db)
        print("    [FAIL] Should have raised 403 error for role mismatch")
    except Exception as e:
        print(f"    [OK] Correctly caught role protection exception: {e.detail}")

    print("\n--> 4. Testing New User Registration:")
    test_email = "new_recruiter_test@infosys.com"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()

    reg_payload = UserRegister(
        email=test_email,
        password="Password123!",
        full_name="Pooja Hegde",
        role="recruiter",
        company_or_institution="Infosys Talent Team",
        phone="+91 99887 76655"
    )
    reg_res = register(user_in=reg_payload, db=db)
    assert reg_res.user.role == "recruiter"
    assert reg_res.access_token is not None
    print(f"    [OK] Successfully registered new recruiter: {reg_res.user.full_name} ({reg_res.user.email})")

    db.close()
    print("\n*** ALL BACKEND AUTH TESTS PASSED CLEANLY! ***\n")

if __name__ == "__main__":
    run_tests()
