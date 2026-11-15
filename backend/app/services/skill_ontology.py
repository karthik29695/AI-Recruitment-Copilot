"""
Comprehensive Canonical Skill Ontology & Semantic Alias Map
Resolves technical abbreviations, acronyms, and variations (e.g. DSA <-> Data Structures & Algorithms,
ML <-> Machine Learning, K8s <-> Kubernetes) to unified canonical concepts.
"""

from typing import Dict, List, Set, Optional
import re

# Comprehensive semantic alias map: variant (lowercase stripped) -> Canonical Representation
SKILL_ALIAS_MAP: Dict[str, str] = {
    # Core Computer Science & Algorithmic Foundations
    "dsa": "Data Structures & Algorithms",
    "data structures and algorithms": "Data Structures & Algorithms",
    "data structures & algorithms": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "data structure": "Data Structures & Algorithms",
    "algorithm": "Data Structures & Algorithms",
    "algo": "Data Structures & Algorithms",
    "oop": "Object-Oriented Programming (OOP)",
    "oops": "Object-Oriented Programming (OOP)",
    "object oriented programming": "Object-Oriented Programming (OOP)",
    "object-oriented programming": "Object-Oriented Programming (OOP)",
    "system design": "System Design",
    "low level design": "Low-Level Design (LLD)",
    "lld": "Low-Level Design (LLD)",
    "high level design": "High-Level Design (HLD)",
    "hld": "High-Level Design (HLD)",
    "distributed systems": "Distributed Systems",
    "microservices": "Microservices",
    "microservices architecture": "Microservices",
    "design patterns": "Software Design Patterns",
    "os": "Operating Systems",
    "operating systems": "Operating Systems",
    "operating system": "Operating Systems",
    "cn": "Computer Networks",
    "computer networks": "Computer Networks",
    "networking": "Computer Networks",
    "dbms": "Database Management (DBMS)",
    "rdbms": "Relational Databases (RDBMS)",
    
    # Machine Learning & AI
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "ai": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "nlp": "Natural Language Processing (NLP)",
    "natural language processing": "Natural Language Processing (NLP)",
    "cv": "Computer Vision",
    "computer vision": "Computer Vision",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "genai": "Generative AI",
    "gen ai": "Generative AI",
    "generative ai": "Generative AI",
    "llm": "Large Language Models (LLM)",
    "llms": "Large Language Models (LLM)",
    "large language models": "Large Language Models (LLM)",
    "large language model": "Large Language Models (LLM)",
    "rag": "Retrieval-Augmented Generation (RAG)",
    "retrieval augmented generation": "Retrieval-Augmented Generation (RAG)",
    "mlops": "MLOps",
    "machine learning operations": "MLOps",
    "data science": "Data Science",
    "data analytics": "Data Analytics",
    "data analysis": "Data Analysis",
    "data visualization": "Data Visualization",
    "data viz": "Data Visualization",
    "prompt engineering": "Prompt Engineering",

    # Frameworks & AI Tooling
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "keras": "Keras",
    "scikit-learn": "Scikit-Learn",
    "scikit learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "opencv": "OpenCV",
    "spacy": "spaCy",
    "hugging face": "Hugging Face Transformers",
    "huggingface": "Hugging Face Transformers",
    "transformers": "Hugging Face Transformers",
    "langchain": "LangChain",
    "llama": "Llama",
    "llamaindex": "LlamaIndex",
    "mistral": "Mistral AI",

    # Programming Languages
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "es6": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "java": "Java",
    "core java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "c": "C",
    "golang": "Golang (Go)",
    "go": "Golang (Go)",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",
    "dart": "Dart",
    "bash": "Shell / Bash Scripting",
    "shell": "Shell / Bash Scripting",
    "powershell": "PowerShell",

    # Web & Full Stack Technologies
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "next": "Next.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "express.js": "Express.js",
    "expressjs": "Express.js",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "asp.net": "ASP.NET Core",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "graphql": "GraphQL",
    "rest": "RESTful APIs",
    "rest api": "RESTful APIs",
    "restful": "RESTful APIs",
    "restful api": "RESTful APIs",
    "websockets": "WebSockets",

    # Databases & Caching
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "cassandra": "Apache Cassandra",
    "dynamodb": "AWS DynamoDB",
    "elasticsearch": "Elasticsearch",
    "snowflake": "Snowflake",
    "bigquery": "Google BigQuery",
    "oracle": "Oracle Database",
    "kafka": "Apache Kafka",
    "rabbitmq": "RabbitMQ",

    # Cloud & DevOps
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "Amazon Web Services (AWS)",
    "amazon web services": "Amazon Web Services (AWS)",
    "azure": "Microsoft Azure",
    "microsoft azure": "Microsoft Azure",
    "ms azure": "Microsoft Azure",
    "gcp": "Google Cloud Platform (GCP)",
    "google cloud": "Google Cloud Platform (GCP)",
    "google cloud platform": "Google Cloud Platform (GCP)",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "ci/cd": "CI/CD",
    "ci cd": "CI/CD",
    "continuous integration": "CI/CD",
    "continuous deployment": "CI/CD",
    "git": "Git",
    "github": "Git",
    "gitlab": "Git",
    "linux": "Linux",
    "prometheus": "Prometheus",
    "grafana": "Grafana",
    "sagemaker": "AWS SageMaker",
    "aws sagemaker": "AWS SageMaker",

    # Analytics & Business Intelligence
    "tableau": "Tableau",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "excel": "Microsoft Excel",
    "statistics": "Statistical Analysis",

    # Methodologies
    "agile": "Agile Methodology",
    "scrum": "Scrum Framework",
    "jira": "Jira"
}

def clean_skill_string(skill: str) -> str:
    """Normalize skill string by removing punctuation and excess whitespace."""
    cleaned = re.sub(r'[\r\n\t]+', ' ', skill)
    cleaned = re.sub(r'[\(\)\[\]\{\}]', ' ', cleaned)
    return " ".join(cleaned.strip().split())

def normalize_skill(skill_raw: str) -> str:
    """
    Map any raw skill token or variant (e.g. 'DSA', 'data structures and algorithms', 'k8s')
    to its canonical standard representation.
    """
    if not skill_raw:
        return ""
    clean = clean_skill_string(skill_raw)
    lower_key = clean.lower()

    # 1. Direct exact alias match
    if lower_key in SKILL_ALIAS_MAP:
        return SKILL_ALIAS_MAP[lower_key]

    # 2. Check without trailing punctuation (e.g. 'DSA,' or 'Python;')
    stripped_key = re.sub(r'[^a-zA-Z0-9+#.\s]', '', lower_key).strip()
    if stripped_key in SKILL_ALIAS_MAP:
        return SKILL_ALIAS_MAP[stripped_key]

    # 3. Check common plurals (e.g. 'algorithms' -> 'algorithm')
    if lower_key.endswith('s') and lower_key[:-1] in SKILL_ALIAS_MAP:
        return SKILL_ALIAS_MAP[lower_key[:-1]]

    # 4. Fallback formatting: if capitalized acronym keep uppercase, else titlecase
    if len(clean) <= 4 and clean.isupper():
        return clean
    return clean.title()

def normalize_skill_list(skills: List[str]) -> List[str]:
    """Given a list of raw skills, return deduplicated canonical skill names."""
    canonical_set: Set[str] = set()
    result: List[str] = []

    for s in skills:
        norm = normalize_skill(s)
        if norm and norm.lower() not in [c.lower() for c in canonical_set]:
            canonical_set.add(norm)
            result.append(norm)

    return sorted(result)

def are_skills_matching(skill_a: str, skill_b: str) -> bool:
    """
    Check if two skills represent the same competency semantically.
    Handles 'DSA' == 'Data Structures and Algorithms', 'K8s' == 'Kubernetes', etc.
    """
    norm_a = normalize_skill(skill_a).lower()
    norm_b = normalize_skill(skill_b).lower()

    if norm_a == norm_b:
        return True

    # Check substring containment for compound skills (e.g. 'AWS' in 'Amazon Web Services (AWS)')
    clean_a = clean_skill_string(skill_a).lower()
    clean_b = clean_skill_string(skill_b).lower()

    if clean_a == clean_b:
        return True

    # If both mapped to the same root concept
    root_a = SKILL_ALIAS_MAP.get(clean_a, norm_a)
    root_b = SKILL_ALIAS_MAP.get(clean_b, norm_b)
    if root_a.lower() == root_b.lower():
        return True

    return False
