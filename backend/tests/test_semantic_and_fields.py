import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.services.candidate_profiler import parse_candidate_profile
from app.services.jd_analyzer import parse_job_description
from app.services.matching_engine import evaluate_candidate_match
from app.services.skill_ontology import normalize_skill, are_skills_matching

def test_semantic_resolution_and_fields():
    print("\n=======================================================")
    print("TESTING SEMANTIC SKILL MATCHING (DSA vs DATA STRUCTURES)")
    print("AND 6-FIELD RESUME PROFILING (PROJECTS & CERTS)")
    print("=======================================================\n")

    # 1. TEST DIRECT ONTOLOGY NORMALIZATION
    print("--> 1. Testing Skill Ontology Normalization:")
    assert normalize_skill("DSA") == "Data Structures & Algorithms"
    assert normalize_skill("data structures and algorithms") == "Data Structures & Algorithms"
    assert normalize_skill("K8s") == "Kubernetes"
    assert normalize_skill("ML") == "Machine Learning"
    assert normalize_skill("NLP") == "Natural Language Processing (NLP)"
    assert are_skills_matching("DSA", "Data Structures and Algorithms") is True
    assert are_skills_matching("K8s", "Kubernetes") is True
    assert are_skills_matching("OOP", "Object-Oriented Programming") is True
    print("    [PASS] Bidirectional semantic aliases correctly resolve to canonical concepts.")

    # 2. TEST RESUME PARSING FOR ALL 6 REQUIRED FIELDS
    print("\n--> 2. Testing 6-Field Structured Resume Extraction:")
    sample_resume = """
    Priya Sharma
    priya.sharma@example.com
    +91 98765 88888

    EDUCATION
    B.Tech in Computer Science and Engineering, National Institute of Technology Trichy

    WORK EXPERIENCE
    Senior Software Engineer (4 years of experience)
    • Spearheaded core backend microservices handling 50k requests/min.

    TECHNICAL SKILLS
    Data Structures and Algorithms, Python, React, PostgreSQL, Docker, Kubernetes, FastApi, Machine Learning

    KEY PROJECTS
    • Real-Time Recommendation Engine: Built using Python, Redis, and Transformers with sub-50ms latency.
    • Distributed Task Queue: Implemented with Celery, FastAPI, and PostgreSQL for async report generation.

    CERTIFICATIONS
    AWS Certified Solutions Architect Associate
    Certified Kubernetes Application Developer (CKAD)
    """

    profile = parse_candidate_profile(sample_resume, "Priya_Sharma_Resume.pdf")

    # Verify 1. Name
    assert profile["name"] == "Priya Sharma", f"Expected 'Priya Sharma', got '{profile['name']}'"
    print(f"    [PASS] 1. Name extracted: {profile['name']}")

    # Verify 2. Education
    assert "Computer Science" in profile["education"] or "Institute" in profile["education"]
    print(f"    [PASS] 2. Education extracted: {profile['education']}")

    # Verify 3. Skills (including normalized DSA)
    assert "Data Structures & Algorithms" in profile["skills"], f"Skills found: {profile['skills']}"
    assert "Python" in profile["skills"]
    assert "Kubernetes" in profile["skills"]
    print(f"    [PASS] 3. Skills extracted & normalized ({len(profile['skills'])}): {profile['skills'][:5]}...")

    # Verify 4. Projects
    assert len(profile["projects"]) >= 2, f"Expected >= 2 projects, got {profile['projects']}"
    print(f"    [PASS] 4. Projects extracted ({len(profile['projects'])}):")
    for p in profile["projects"]:
        print(f"         • {p}")

    # Verify 5. Certifications
    assert len(profile["certifications"]) >= 1, f"Expected certifications, got {profile['certifications']}"
    print(f"    [PASS] 5. Certifications extracted: {profile['certifications']}")

    # Verify 6. Experience
    assert profile["experience_years"] >= 4.0
    print(f"    [PASS] 6. Experience extracted: {profile['experience']} ({profile['experience_years']} yrs)")

    # 3. TEST CROSS-MATCHING: JD WITH 'DSA' vs RESUME WITH 'Data Structures and Algorithms'
    print("\n--> 3. Testing Semantic Match Engine (JD with 'DSA' vs Resume with 'Data Structures and Algorithms'):")
    jd_text = """
    Job Title: Backend Algorithm Engineer
    Department: Platform Engineering
    Experience Required: 3+ years
    Requirements:
    Candidates must possess strong proficiency in DSA, Python, PostgreSQL, and Docker.
    """
    parsed_jd = parse_job_description(jd_text)
    print(f"    JD Required Skills: {parsed_jd['required_skills']}")
    assert "Data Structures & Algorithms" in parsed_jd["required_skills"]

    # Evaluate compatibility match
    match_result = evaluate_candidate_match(
        candidate_skills_raw=", ".join(profile["skills"]),
        job_skills_raw=", ".join(parsed_jd["required_skills"]),
        candidate_exp_raw=profile["experience"],
        job_exp_raw=parsed_jd["experience_required"]
    )

    print(f"    [RESULT] Match Score: {match_result['match_score']}%")
    print(f"    [RESULT] Matched Skills: {match_result['matched_skills']}")
    print(f"    [RESULT] Missing Skills: {match_result['missing_skills']}")

    assert "Data Structures & Algorithms" in match_result["matched_skills"], "DSA failed to match Data Structures and Algorithms!"
    assert len(match_result["missing_skills"]) == 0, f"Expected 0 missing skills, got: {match_result['missing_skills']}"
    assert match_result["match_score"] >= 85.0
    print("    [PASS] Full semantic equivalence verified! 'DSA' in JD successfully matched 'Data Structures and Algorithms' in resume.")

    print("\n=======================================================")
    print("*** ALL SEMANTIC RESOLUTION & 6-FIELD TESTS PASSED! ***")
    print("=======================================================\n")

if __name__ == "__main__":
    test_semantic_resolution_and_fields()
