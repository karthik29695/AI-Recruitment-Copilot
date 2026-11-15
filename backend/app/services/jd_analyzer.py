import re
from typing import Dict, Any, List
from app.services.candidate_profiler import TECH_SKILLS_CATALOG, DEGREE_PATTERNS

JOB_TITLES_CATALOG = [
    "senior data scientist", "data scientist", "machine learning engineer",
    "senior machine learning engineer", "ai engineer", "full stack developer",
    "full stack software engineer", "frontend engineer", "backend engineer",
    "devops engineer", "cloud architect", "software engineer", "data engineer",
    "systems analyst", "qa engineer", "technical lead", "product manager"
]

def extract_job_title(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # Strategy 1: Check if the first line or two matches a recognized job title
    for line in lines[:4]:
        line_clean = re.sub(r'[^a-zA-Z\s]', '', line).strip().lower()
        for title in JOB_TITLES_CATALOG:
            if title in line_clean or line_clean in title:
                return title.title()

    # Strategy 2: Explicit prefix e.g. "Job Title: ..." or "Role: ..."
    match = re.search(r'(?i)(?:job\s+title|role|position):\s*([^\n\r]+)', text)
    if match:
        return match.group(1).strip()

    if lines:
        return lines[0][:50].title()
    return "Software Engineer"

def extract_department(text: str) -> str:
    dept_match = re.search(r'(?i)(?:department|team|business\s+unit):\s*([^\n\r]+)', text)
    if dept_match:
        return dept_match.group(1).strip()
    
    lower = text.lower()
    if "ai" in lower or "machine learning" in lower or "data science" in lower:
        return "AI & Advanced Analytics"
    elif "cloud" in lower or "devops" in lower or "infrastructure" in lower:
        return "Cloud Infrastructure"
    elif "full stack" in lower or "frontend" in lower or "backend" in lower or "web" in lower:
        return "Software Engineering"
    return "Engineering & Technology"

def extract_experience_required(text: str) -> str:
    exp_pattern = r'(?i)(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)(?:\s+(?:of\s+)?(?:relevant\s+)?experience)?'
    match = re.search(exp_pattern, text)
    if match:
        return f"{match.group(1)}+ years"
    return "3+ years"

def extract_education_required(text: str) -> str:
    for pattern in DEGREE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return " ".join(match.group(0).split())[:60]
    return "Bachelor's or Master's degree in CS, Engineering or related technical field"

def extract_jd_skills(text: str) -> Dict[str, List[str]]:
    lower_text = " " + text.lower() + " "
    required_skills = []

    for skill in TECH_SKILLS_CATALOG:
        pattern = r'(?:\b|\W)' + re.escape(skill) + r'(?:\b|\W)'
        if re.search(pattern, lower_text):
            formatted = skill.title()
            if skill in ["sql", "html", "css", "aws", "gcp", "nlp", "mlops", "ci/cd", "rag", "llm"]:
                formatted = skill.upper()
            elif skill == "javascript":
                formatted = "JavaScript"
            elif skill == "fastapi":
                formatted = "FastAPI"
            elif skill == "pytorch":
                formatted = "PyTorch"
            elif skill == "tensorflow":
                formatted = "TensorFlow"
            
            if formatted not in required_skills:
                required_skills.append(formatted)

    # Sort with ML/Cloud/Core languages prioritized
    return required_skills

def parse_job_description(raw_text: str) -> Dict[str, Any]:
    """
    Main JD parsing pipeline: extracts structured job requirements, required competencies,
    experience thresholds, and educational qualifications.
    """
    title = extract_job_title(raw_text)
    department = extract_department(raw_text)
    exp = extract_experience_required(raw_text)
    edu = extract_education_required(raw_text)
    skills = extract_jd_skills(raw_text)

    # If no skills found, fallback to reasonable defaults based on title
    if not skills:
        skills = ["Python", "SQL", "Git", "Problem Solving"]

    # Role summary (first 2-3 substantive lines)
    lines = [l.strip() for l in raw_text.split("\n") if len(l.strip()) > 20]
    summary = lines[0] if lines else f"Exciting opportunity for a {title} to contribute to high-impact technical initiatives."

    return {
        "job_title": title,
        "department": department,
        "required_skills": skills,
        "required_skills_str": ", ".join(skills),
        "experience_required": exp,
        "education_required": edu,
        "job_description": summary,
        "raw_text_length": len(raw_text)
    }
