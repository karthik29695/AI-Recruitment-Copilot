import json
import re
from typing import Dict, List, Any

def parse_skills(skills_data: Any) -> List[str]:
    """Normalize and extract a clean list of skills from comma-separated or JSON text."""
    if not skills_data:
        return []
    if isinstance(skills_data, list):
        return [str(s).strip() for s in skills_data if str(s).strip()]
    if isinstance(skills_data, str):
        try:
            parsed = json.loads(skills_data)
            if isinstance(parsed, list):
                return [str(s).strip() for s in parsed if str(s).strip()]
        except Exception:
            pass
        # Fallback to comma / semicolon / newline splitting
        tokens = re.split(r'[,;\n/]+', skills_data)
        return [t.strip() for t in tokens if t.strip()]
    return []

def extract_years_experience(exp_text: str) -> float:
    """Extract numeric years of experience from experience string (e.g. '5 years', '3+ yrs')."""
    if not exp_text:
        return 0.0
    match = re.search(r'(\d+(?:\.\d+)?)\s*(?:years?|yrs?|\+)?', exp_text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return 0.0
    return 0.0

def evaluate_candidate_match(candidate_skills_raw: str, job_skills_raw: str, candidate_exp_raw: str, job_exp_raw: str) -> Dict[str, Any]:
    """
    Computes candidate-job compatibility:
    - Match score (%)
    - Hiring score (out of 100)
    - Matched vs Missing skills
    - Upskilling learning path recommendations
    """
    candidate_skills = parse_skills(candidate_skills_raw)
    job_skills = parse_skills(job_skills_raw)

    # Normalized lookup maps
    cand_map = {s.lower(): s for s in candidate_skills}
    job_map = {s.lower(): s for s in job_skills}

    matched_keys = set(cand_map.keys()) & set(job_map.keys())
    missing_keys = set(job_map.keys()) - set(cand_map.keys())
    extra_keys = set(cand_map.keys()) - set(job_map.keys())

    matched_skills = [job_map[k] for k in matched_keys]
    missing_skills = [job_map[k] for k in missing_keys]
    extra_skills = [cand_map[k] for k in extra_keys]

    # Skill match ratio
    if job_skills:
        skill_ratio = len(matched_skills) / len(job_skills)
    else:
        skill_ratio = 1.0

    # Experience match ratio
    cand_years = extract_years_experience(candidate_exp_raw)
    req_years = extract_years_experience(job_exp_raw)
    
    if req_years > 0:
        exp_ratio = min(cand_years / req_years, 1.25)
    else:
        exp_ratio = 1.0

    # Composite scores
    # Match percentage represents qualification coverage:
    raw_match_score = (skill_ratio * 0.75 + min(exp_ratio, 1.0) * 0.25) * 100
    match_score = round(max(min(raw_match_score, 99.0), 30.0), 1)

    # Hiring score represents overall candidate strength
    hiring_score = round(min(match_score * 0.92 + (len(extra_skills) * 1.5), 98.0), 1)

    # Recommendation category
    if match_score >= 85:
        recommendation = "Highly Recommended"
        recommendation_badge = "success"
    elif match_score >= 70:
        recommendation = "Recommended"
        recommendation_badge = "primary"
    elif match_score >= 50:
        recommendation = "Consider with Training"
        recommendation_badge = "warning"
    else:
        recommendation = "Underqualified"
        recommendation_badge = "danger"

    # Learning path narrative
    if missing_skills:
        courses = [f"{s} Mastery & Hands-on Certification" for s in missing_skills[:3]]
        recommendation_notes = (
            f"Candidate displays strong domain capability in {', '.join(matched_skills[:3]) if matched_skills else 'core fundamentals'}. "
            f"Bridge competency gaps by prioritizing training in: {', '.join(missing_skills)}. "
            f"Estimated upskilling duration: 3-4 weeks."
        )
    else:
        courses = ["Advanced System Design", "Enterprise Leadership Track"]
        recommendation_notes = "Candidate satisfies all mandatory and preferred skill criteria for this role."

    return {
        "match_score": match_score,
        "hiring_score": hiring_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "extra_skills": extra_skills,
        "recommendation": recommendation,
        "recommendation_badge": recommendation_badge,
        "recommended_courses": courses,
        "recommendation_notes": recommendation_notes,
    }
