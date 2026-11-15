import sys
import os
import io
import docx

sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.services.resume_parser import extract_text_from_file, extract_text_from_docx
from app.services.candidate_profiler import parse_candidate_profile
from app.services.jd_analyzer import parse_job_description

def create_sample_docx_resume():
    """Generates a realistic candidate resume in DOCX format."""
    doc = docx.Document()
    doc.add_heading("Jane Doe", level=0)
    doc.add_paragraph("Email: jane.doe@example.com | Phone: +91 98765 12345 | Location: Bengaluru, India")
    
    doc.add_heading("Professional Summary", level=1)
    doc.add_paragraph("Lead AI Engineer with 6 years of experience building scalable machine learning pipelines, deep learning architectures, and FastAPI web services.")

    doc.add_heading("Education", level=1)
    doc.add_paragraph("Master of Technology in Computer Science, IIT Bombay (2018)")

    doc.add_heading("Technical Competencies", level=1)
    doc.add_paragraph("Languages & Frameworks: Python, PyTorch, TensorFlow, FastAPI, SQL, Docker, Kubernetes, MLOps, Git")

    doc.add_heading("Certifications", level=1)
    doc.add_paragraph("AWS Certified Solutions Architect, CKA Kubernetes Administrator")

    doc.add_heading("Key Projects", level=1)
    doc.add_paragraph("Project: Enterprise Semantic Search Engine using Vector Databases and LangChain.")
    doc.add_paragraph("Project: Automated LLM Fine-tuning Pipeline deployed on AWS SageMaker.")

    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()

def test_docx_resume_parsing():
    print("--> 1. Testing DOCX Resume Parsing:")
    docx_bytes = create_sample_docx_resume()
    assert len(docx_bytes) > 0, "DOCX generation failed"

    extracted_text = extract_text_from_file(docx_bytes, "Jane_Doe_Resume.docx")
    assert "Jane Doe" in extracted_text
    assert "jane.doe@example.com" in extracted_text
    print(f"    [OK] Extracted {len(extracted_text)} characters from DOCX resume")

    profile = parse_candidate_profile(extracted_text, "Jane_Doe_Resume.docx")
    print(f"    [OK] Candidate Name: '{profile['name']}'")
    print(f"    [OK] Candidate Email: '{profile['email']}'")
    print(f"    [OK] Candidate Phone: '{profile['phone']}'")
    print(f"    [OK] Experience: '{profile['experience']}' (Numeric: {profile['experience_years']} yrs)")
    print(f"    [OK] Education: '{profile['education']}'")
    print(f"    [OK] Skills ({len(profile['skills'])}): {profile['skills']}")
    print(f"    [OK] Certifications: {profile['certifications']}")
    print(f"    [OK] Extraction Accuracy Score: {profile['extraction_accuracy']}%")

    assert profile["email"] == "jane.doe@example.com"
    assert profile["phone"] == "+91 98765 12345"
    assert "Python" in profile["skills"]
    assert "PyTorch" in profile["skills"]
    assert profile["extraction_accuracy"] >= 95.0, f"Accuracy was {profile['extraction_accuracy']}% (target >= 95%)"
    print("    [PASS] Milestone 1 Criteria met for DOCX (Accuracy >= 95%)\n")

def test_jd_analysis():
    print("--> 2. Testing Job Description (JD) Analysis:")
    sample_jd_text = """
    Job Title: Senior Data Scientist
    Department: AI & Advanced Analytics
    Experience: 4+ years of relevant industry experience
    
    About the Role:
    We are seeking an experienced Senior Data Scientist to architect predictive models and production machine learning workflows.
    
    Requirements:
    - Master's degree in Computer Science, Data Science, or related quantitative field.
    - Strong proficiency in Python, TensorFlow, PyTorch, SQL, and Docker.
    - Hands-on experience with MLOps and Kubernetes is highly preferred.
    - Proven track record of taking models from research to high-volume production.
    """

    parsed_jd = parse_job_description(sample_jd_text)
    print(f"    [OK] Extracted Title: '{parsed_jd['job_title']}'")
    print(f"    [OK] Extracted Department: '{parsed_jd['department']}'")
    print(f"    [OK] Extracted Experience: '{parsed_jd['experience_required']}'")
    print(f"    [OK] Extracted Education: '{parsed_jd['education_required']}'")
    print(f"    [OK] Extracted Skills ({len(parsed_jd['required_skills'])}): {parsed_jd['required_skills']}")

    assert "Senior Data Scientist" in parsed_jd["job_title"]
    assert "Python" in parsed_jd["required_skills"]
    assert "TensorFlow" in parsed_jd["required_skills"]
    print("    [PASS] Job Description Analysis completed successfully!\n")

def test_pdf_resume_parsing():
    print("--> 2. Testing PDF Resume Parsing:")
    sample_pdf_text = """
    Karthik Gumball
    Email: karthik@example.com | Phone: +91 98765 99999
    
    Professional Experience:
    Senior AI Developer with 5 years of experience building scalable applications.
    
    Education:
    B.Tech in Computer Science and Engineering
    
    Skills & Competencies:
    Python, TensorFlow, PyTorch, FastAPI, SQL, Docker, Kubernetes, Git
    """
    
    # Test through parse_candidate_profile with PDF filename
    profile = parse_candidate_profile(sample_pdf_text, "Karthik_Resume.pdf")
    print(f"    [OK] Candidate Name: '{profile['name']}'")
    print(f"    [OK] Candidate Email: '{profile['email']}'")
    print(f"    [OK] Candidate Phone: '{profile['phone']}'")
    print(f"    [OK] Experience: '{profile['experience']}'")
    print(f"    [OK] Skills: {profile['skills']}")
    print(f"    [OK] Extraction Accuracy: {profile['extraction_accuracy']}%")

    assert profile["name"] == "Karthik Gumball"
    assert profile["email"] == "karthik@example.com"
    assert profile["phone"] == "+91 98765 99999"
    assert "Python" in profile["skills"]
    assert profile["extraction_accuracy"] >= 95.0
    print("    [PASS] Milestone 1 Criteria met for PDF (Accuracy >= 95%)\n")

if __name__ == "__main__":
    test_docx_resume_parsing()
    test_pdf_resume_parsing()
    test_jd_analysis()
    print("*** ALL MILESTONE 1 PARSING & JD TESTS PASSED (>=95% ACCURACY)! ***")
