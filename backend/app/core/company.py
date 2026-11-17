import re
from typing import Optional
from app.models.job import Job
from app.models.user import User

COMMON_SUFFIXES = [
    r'\bhuman\s+resources\b',
    r'\bhr\b',
    r'\btalent\s+acquisition\b',
    r'\btalent\s+team\b',
    r'\binstitute\s+of\s+technology\b',
    r'\bengineering\s+college\b',
    r'\buniversity\b',
    r'\bcollege\b',
    r'\btechnologies\b',
    r'\btechnology\b',
    r'\bsolutions\b',
    r'\bcorporation\b',
    r'\bcorp\b',
    r'\bltd\b',
    r'\blimited\b',
    r'\bpvt\b',
    r'\bprivate\b',
    r'\binc\b',
    r'\bllc\b',
    r'\bgroup\b'
]

PUBLIC_EMAIL_DOMAINS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "example.com"}

def normalize_company(name: Optional[str]) -> str:
    """
    Normalizes company/institution names for case-insensitive, department-agnostic matching.
    e.g. 'Infosys Human Resources' -> 'infosys'
         'Infosys Ltd - Talent Acquisition' -> 'infosys'
         'CMR Institute of Technology' -> 'cmr'
         'CMR' -> 'cmr'
    """
    if not name:
        return ""
    cleaned = name.lower().strip()
    for s in COMMON_SUFFIXES:
        cleaned = re.sub(s, '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[\-_,./|]+', ' ', cleaned).strip()
    tokens = [t for t in cleaned.split() if t]
    return " ".join(tokens)

def get_user_company(user: Optional[User]) -> str:
    """
    Retrieves the company name for a User.
    Falls back to email domain if company_or_institution is blank (excluding public webmail).
    """
    if not user:
        return ""
    if user.company_or_institution and user.company_or_institution.strip():
        return user.company_or_institution.strip()
    if user.email and "@" in user.email:
        domain = user.email.split("@")[1].lower()
        if domain not in PUBLIC_EMAIL_DOMAINS:
            company_token = domain.split(".")[0]
            return company_token.capitalize()
    return ""

def get_job_company(job: Job) -> str:
    """
    Returns the company name for a Job.
    Checks job.company, then job.creator.company_or_institution, and defaults demo jobs to 'Infosys'.
    """
    if getattr(job, "company", None) and job.company.strip():
        return job.company.strip()
    if getattr(job, "creator", None) and job.creator:
        c = get_user_company(job.creator)
        if c:
            return c
    if getattr(job, "is_demo", False):
        return "Infosys"
    return ""

def companies_match(comp1: Optional[str], comp2: Optional[str]) -> bool:
    """
    Check if two company names refer to the same organization.
    Supports exact, normalized, prefix, and word-set matches.
    """
    if not comp1 or not comp2:
        return False
    c1 = comp1.strip().lower()
    c2 = comp2.strip().lower()
    if c1 == c2:
        return True
    
    n1 = normalize_company(comp1)
    n2 = normalize_company(comp2)
    if not n1 or not n2:
        # Fallback to direct lowercase comparison
        return c1 == c2 or c1 in c2 or c2 in c1

    if n1 == n2:
        return True
    if n1 in n2 or n2 in n1:
        return True

    words1 = set(n1.split())
    words2 = set(n2.split())
    if words1 and words2 and (words1.issubset(words2) or words2.issubset(words1)):
        return True

    return False
