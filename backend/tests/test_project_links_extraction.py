import sys
import os
import json
import pdfplumber

sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.services.candidate_profiler import parse_candidate_profile, extract_sections, extract_projects

def test_resume_projects_and_links():
    print("\n=======================================================")
    print("VERIFYING RESUME PROJECT & GITHUB LINK EXTRACTION")
    print("=======================================================\n")

    resume_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "uploads", "resumes", "Resume.pdf")
    assert os.path.exists(resume_path), f"Resume.pdf not found at {resume_path}"

    text = ""
    with pdfplumber.open(resume_path) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"

    assert len(text) > 500, "Failed to extract text from Resume.pdf"
    
    profile = parse_candidate_profile(text, "Resume.pdf")

    print(f"--> Candidate Profile Extracted:")
    print(f"    Name: {profile['name']}")
    print(f"    Email: {profile['email']}")
    print(f"    Phone: {profile['phone']}")
    print(f"    Education: {profile['education']}")
    print(f"    Skills ({len(profile['skills'])}): {profile['skills'][:5]}...")
    print(f"    Certifications ({len(profile['certifications'])}): {profile['certifications']}")

    # Assert projects
    projects = profile["projects"]
    print(f"\n--> Extracted Projects Count: {len(projects)}")
    assert len(projects) == 3, f"Expected 3 projects, but got {len(projects)}"

    expected_projects = [
        {
            "name": "LytQueue",
            "link": "https://github.com/karthik29695/LytQueue",
        },
        {
            "name": "JurisAI",
            "link": "https://github.com/karthik29695/JurisAI",
        },
        {
            "name": "Surveillance",
            "link": "https://github.com/karthik29695/Surveillance-System",
        }
    ]

    for idx, (proj, expected) in enumerate(zip(projects, expected_projects)):
        print(f"\n    [{idx + 1}] Title: {proj['title']}")
        print(f"        Link: {proj['link']}")
        print(f"        Highlights Count: {len(proj['highlights'])}")
        for h in proj["highlights"]:
            print(f"        • {h[:80]}...")

        assert expected["name"].lower() in proj["title"].lower(), f"Expected '{expected['name']}' in title '{proj['title']}'"
        assert proj["link"] == expected["link"], f"Expected link '{expected['link']}', got '{proj['link']}'"
        assert len(proj["highlights"]) >= 2, f"Expected at least 2 highlights for project {idx+1}"

    print("\n=======================================================")
    print("*** ALL PROJECT & GITHUB LINK EXTRACTION TESTS PASSED! ***")
    print("=======================================================\n")

if __name__ == "__main__":
    test_resume_projects_and_links()
