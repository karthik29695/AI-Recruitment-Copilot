from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.candidate_match import CandidateMatch
from app.models.skill_gap import SkillGapReport
from app.models.interview_question import InterviewQuestion
from app.core.security import get_password_hash
from app.services.matching_engine import evaluate_candidate_match, parse_skills
from app.services.question_engine import generate_interview_questions_for_role

def init_db(db: Session):
    Base.metadata.create_all(bind=engine)

    # Ensure SQLite columns exist if previously initialized without them
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check is_demo on jobs
            res = conn.execute(text("PRAGMA table_info(jobs)")).fetchall()
            job_cols = [r[1] for r in res]
            if "is_demo" not in job_cols:
                conn.execute(text("ALTER TABLE jobs ADD COLUMN is_demo BOOLEAN DEFAULT 0"))
                conn.commit()

            # Check is_demo, uploaded_by_user_id, projects, certifications on candidates
            res_c = conn.execute(text("PRAGMA table_info(candidates)")).fetchall()
            cand_cols = [r[1] for r in res_c]
            if "is_demo" not in cand_cols:
                conn.execute(text("ALTER TABLE candidates ADD COLUMN is_demo BOOLEAN DEFAULT 0"))
                conn.commit()
            if "uploaded_by_user_id" not in cand_cols:
                conn.execute(text("ALTER TABLE candidates ADD COLUMN uploaded_by_user_id INTEGER"))
                conn.commit()
            if "projects" not in cand_cols:
                conn.execute(text("ALTER TABLE candidates ADD COLUMN projects TEXT"))
                conn.commit()
            if "certifications" not in cand_cols:
                conn.execute(text("ALTER TABLE candidates ADD COLUMN certifications TEXT"))
                conn.commit()
    except Exception as e:
        pass
    
    # 1. Seed demo users
    demo_users = [
        {
            "email": "hr@infosys.com",
            "password": "Password123!",
            "full_name": "Deepika Sharma",
            "role": "hr",
            "company_or_institution": "Corporate Human Resources",
            "phone": "+91 98765 43210"
        },
        {
            "email": "recruiter@infosys.com",
            "password": "Password123!",
            "full_name": "Arun Kumar",
            "role": "recruiter",
            "company_or_institution": "Talent Acquisition Group",
            "phone": "+91 98765 43211"
        },
        {
            "email": "candidate@gmail.com",
            "password": "Password123!",
            "full_name": "Sarah Johnson",
            "role": "candidate",
            "company_or_institution": "B.Tech Computer Science Graduate",
            "phone": "+91 98765 43212"
        }
    ]

    for user_data in demo_users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                company_or_institution=user_data["company_or_institution"],
                phone=user_data["phone"],
                is_active=True
            )
            db.add(user)
    db.commit()

    # 2. Seed initial Jobs if none exist
    if db.query(Job).count() == 0:
        recruiter = db.query(User).filter(User.role == "recruiter").first()
        recruiter_id = recruiter.id if recruiter else None

        job1 = Job(
            job_title="Senior Machine Learning Engineer",
            department="AI & Advanced Analytics",
            required_skills="Python, TensorFlow, PyTorch, Kubernetes, MLOps, AWS SageMaker, SQL",
            experience_required="5+ years",
            job_description="Lead the design and productionization of large-scale predictive and generative models, establish end-to-end MLOps pipelines, and collaborate with engineering teams for seamless deployment.",
            created_by_user_id=recruiter_id,
            is_demo=True
        )
        job2 = Job(
            job_title="Full Stack Software Engineer",
            department="Cloud Applications",
            required_skills="React, TypeScript, Node.js, FastAPI, PostgreSQL, Docker, Git",
            experience_required="3+ years",
            job_description="Architect resilient microservices and responsive web user interfaces. Build robust RESTful APIs with FastAPI and craft delightful UI components with modern React and Tailwind CSS.",
            created_by_user_id=recruiter_id,
            is_demo=True
        )
        db.add_all([job1, job2])
        db.commit()

    # 3. Seed & update Candidates from project slides
    cand_user = db.query(User).filter(User.email == "candidate@gmail.com").first()

    candidates_data = [
        {
            "user_id": cand_user.id if cand_user else None,
            "name": "Sarah Johnson",
            "email": "sarah.johnson@example.com",
            "phone": "(555) 123-4567",
            "education": "MS Computer Science, Stanford University",
            "experience": "5 years",
            "skills": "Python, Machine Learning, TensorFlow, SQL, Data Analysis, Natural Language Processing, Data Structures & Algorithms",
            "projects": "Predictive Healthcare Triage System with Transformer Models; Automated Document NLP Extraction Pipeline; Real-Time Fraud Detection Engine with Redis & Kafka",
            "certifications": "AWS Certified Machine Learning Specialist; TensorFlow Developer Certificate; Stanford Deep Learning Specialization",
            "resume_path": "Sarah_Johnson_Resume.pdf"
        },
        {
            "user_id": None,
            "name": "Michael Chen",
            "email": "michael.chen@example.com",
            "phone": "(555) 234-5678",
            "education": "BS Software Engineering, UC Berkeley",
            "experience": "8 years",
            "skills": "PyTorch, Computer Vision, Deep Learning, Python, Docker, C++, Kubernetes",
            "projects": "Autonomous Vehicle Edge Vision Processing using TensorRT; High-Throughput Real-time Video Analytics Pipeline; Distributed Model Serving on K8s",
            "certifications": "Certified Kubernetes Administrator (CKA); NVIDIA Deep Learning Institute Computer Vision Certification",
            "resume_path": "Michael_Chen_Resume.pdf"
        },
        {
            "user_id": None,
            "name": "Emily Rodriguez",
            "email": "emily.rodriguez@example.com",
            "phone": "(555) 345-6789",
            "education": "MS Data Analytics, Georgia Tech",
            "experience": "4 years",
            "skills": "R, Statistics, Data Viz, SQL, Python, Tableau, Power BI",
            "projects": "Enterprise Supply Chain Optimization Analytics; Customer Churn Survival Modeling; Interactive Executive KPI Dashboards",
            "certifications": "Google Data Analytics Professional; Tableau Desktop Certified Specialist",
            "resume_path": "Emily_Rodriguez_Resume.pdf"
        },
        {
            "user_id": None,
            "name": "David Park",
            "email": "david.park@example.com",
            "phone": "(555) 456-7890",
            "education": "B.Tech Computer Science, UT Austin",
            "experience": "3 years",
            "skills": "React, TypeScript, Node.js, FastAPI, PostgreSQL, Tailwind, Docker, Data Structures & Algorithms",
            "projects": "Collaborative Real-time Canvas Tool with WebSockets; Microservices E-Commerce API Gateway with FastAPI; Modern Design System UI Library",
            "certifications": "AWS Certified Developer Associate; Meta Front-End Developer Professional",
            "resume_path": "David_Park_Resume.pdf"
        }
    ]

    for c_data in candidates_data:
        existing_c = db.query(Candidate).filter(Candidate.email == c_data["email"]).first()
        if not existing_c:
            c = Candidate(
                user_id=c_data["user_id"],
                name=c_data["name"],
                email=c_data["email"],
                phone=c_data["phone"],
                education=c_data["education"],
                experience=c_data["experience"],
                skills=c_data["skills"],
                projects=c_data["projects"],
                certifications=c_data["certifications"],
                resume_path=c_data["resume_path"],
                is_demo=True
            )
            db.add(c)
        else:
            if not existing_c.projects:
                existing_c.projects = c_data["projects"]
            if not existing_c.certifications:
                existing_c.certifications = c_data["certifications"]
            if "Data Structures & Algorithms" not in (existing_c.skills or ""):
                existing_c.skills = c_data["skills"]
    db.commit()

    # 4. Generate Candidate Matches and Skill Gap Reports for all active jobs
    jobs = db.query(Job).all()
    candidates = db.query(Candidate).all()

    for job in jobs:
        for cand in candidates:
            match = db.query(CandidateMatch).filter(
                CandidateMatch.job_id == job.job_id,
                CandidateMatch.candidate_id == cand.candidate_id
            ).first()

            eval_res = evaluate_candidate_match(
                candidate_skills_raw=cand.skills,
                job_skills_raw=job.required_skills,
                candidate_exp_raw=cand.experience,
                job_exp_raw=job.experience_required
            )

            if not match:
                match = CandidateMatch(
                    candidate_id=cand.candidate_id,
                    job_id=job.job_id,
                    match_score=eval_res["match_score"],
                    hiring_score=eval_res["hiring_score"],
                    status="Screened"
                )
                db.add(match)

            # Skill gap report
            gap_report = db.query(SkillGapReport).filter(
                SkillGapReport.job_id == job.job_id,
                SkillGapReport.candidate_id == cand.candidate_id
            ).first()

            if not gap_report:
                import json
                gap_report = SkillGapReport(
                    candidate_id=cand.candidate_id,
                    job_id=job.job_id,
                    matched_skills=json.dumps(eval_res["matched_skills"]),
                    missing_skills=json.dumps(eval_res["missing_skills"]),
                    recommended_courses=json.dumps(eval_res["recommended_courses"])
                )
                db.add(gap_report)

    db.commit()
