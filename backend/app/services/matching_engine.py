import json
import re
from typing import Dict, List, Any
from app.services.skill_ontology import normalize_skill, are_skills_matching

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
    Computes candidate-job compatibility using semantic skill ontology resolution:
    - Resolves acronyms (e.g. DSA <-> Data Structures & Algorithms, K8s <-> Kubernetes)
    - Match score (%)
    - Hiring score (out of 100)
    - Matched vs Missing skills
    - Upskilling learning path recommendations
    """
    raw_cand_skills = parse_skills(candidate_skills_raw)
    raw_job_skills = parse_skills(job_skills_raw)

    # Normalize to canonical taxonomy
    cand_canonical_map: Dict[str, str] = {}
    for s in raw_cand_skills:
        canonical = normalize_skill(s)
        if canonical:
            cand_canonical_map[canonical.lower()] = canonical

    job_canonical_map: Dict[str, str] = {}
    for s in raw_job_skills:
        canonical = normalize_skill(s)
        if canonical:
            job_canonical_map[canonical.lower()] = canonical

    matched_canonical = set()
    for j_key, j_val in job_canonical_map.items():
        if j_key in cand_canonical_map:
            matched_canonical.add(j_key)
            continue
        # Check semantic equivalence
        for c_key, c_val in cand_canonical_map.items():
            if are_skills_matching(j_val, c_val):
                matched_canonical.add(j_key)
                break

    missing_canonical = set(job_canonical_map.keys()) - matched_canonical
    extra_canonical = set(cand_canonical_map.keys()) - matched_canonical

    matched_skills = [job_canonical_map[k] for k in matched_canonical]
    missing_skills = [job_canonical_map[k] for k in missing_canonical]
    extra_skills = [cand_canonical_map[k] for k in extra_canonical]

    # Skill match ratio
    if job_canonical_map:
        skill_ratio = len(matched_skills) / len(job_canonical_map)
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
