from typing import List, Dict, Any

def generate_interview_questions_for_role(job_title: str, required_skills: List[str], missing_skills: List[str] = None) -> List[Dict[str, Any]]:
    """
    Generates customized, high-yield interview questions for candidate evaluation.
    Includes technical deep-dives, scenario-based architecture queries, and behavioral questions.
    """
    job_lower = (job_title or "").lower()
    top_skill = required_skills[0] if required_skills else "software engineering"
    second_skill = required_skills[1] if len(required_skills) > 1 else "system architecture"

    questions = []

    # 1. Technical / Deep-dive question
    if "machine learning" in job_lower or "ai" in job_lower or "data science" in job_lower:
        questions.append({
            "question_text": f"Describe a project where you utilized {top_skill} to optimize model accuracy or throughput. What loss functions and evaluation metrics did you track?",
            "difficulty_level": "Advanced",
            "category": "Technical",
            "response_time": "3-5 min response"
        })
        questions.append({
            "question_text": f"How would you approach deploying a {second_skill} pipeline in a low-latency production environment? What strategies would you use for monitoring data drift?",
            "difficulty_level": "Advanced",
            "category": "Scenario-based",
            "response_time": "4-6 min response"
        })
    elif "frontend" in job_lower or "full stack" in job_lower or "react" in job_lower:
        questions.append({
            "question_text": f"Explain your approach to state management and performance optimization in large-scale applications using {top_skill}. How do you prevent unnecessary re-renders?",
            "difficulty_level": "Intermediate",
            "category": "Technical",
            "response_time": "3-4 min response"
        })
        questions.append({
            "question_text": f"Walk us through how you would architect a resilient client-server data synchronization strategy with error boundary fallbacks.",
            "difficulty_level": "Intermediate",
            "category": "Scenario-based",
            "response_time": "4-5 min response"
        })
    elif "cloud" in job_lower or "devops" in job_lower or "infrastructure" in job_lower:
        questions.append({
            "question_text": f"How do you implement CI/CD observability and zero-downtime rolling deployments using {top_skill} and automated rollback gates?",
            "difficulty_level": "Advanced",
            "category": "Technical",
            "response_time": "3-5 min response"
        })
        questions.append({
            "question_text": "Describe your incident response workflow when a critical production cluster fails during peak traffic. How do you isolate the root cause?",
            "difficulty_level": "Advanced",
            "category": "Scenario-based",
            "response_time": "4-6 min response"
        })
    else:
        questions.append({
            "question_text": f"Can you detail your technical workflow when tackling complex requirements involving {top_skill}? What design patterns do you rely on?",
            "difficulty_level": "Intermediate",
            "category": "Technical",
            "response_time": "3-5 min response"
        })
        questions.append({
            "question_text": f"In a distributed system, how would you ensure data consistency and graceful degradation if a service dependency fails?",
            "difficulty_level": "Intermediate",
            "category": "Scenario-based",
            "response_time": "4-5 min response"
        })

    # 2. Targeted gap or skill verification question
    if missing_skills and len(missing_skills) > 0:
        gap_skill = missing_skills[0]
        questions.append({
            "question_text": f"The job specification emphasizes {gap_skill}. While your resume highlights {top_skill}, have you had exposure to {gap_skill} or related paradigms? How quickly can you adapt?",
            "difficulty_level": "Intermediate",
            "category": "Skill Gap Verification",
            "response_time": "2-3 min response"
        })

    # 3. Behavioral / Leadership question
    questions.append({
        "question_text": "Tell me about a time when you had to explain complex technical concepts or trade-offs to non-technical stakeholders. How did you ensure alignment?",
        "difficulty_level": "Intermediate",
        "category": "Behavioral",
        "response_time": "2-4 min response"
    })

    return questions
