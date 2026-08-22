import re

import spacy

_nlp = spacy.load("en_core_web_sm")

SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "sql",
    "react", "vue", "angular", "next.js", "html", "css", "redux", "tailwind",
    "node.js", "express", "django", "flask", "fastapi", "spring", "graphql", "rest api",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "oracle",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd", "linux", "git",
    "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow", "pytorch",
    "scikit-learn", "data analysis", "power bi", "tableau", "excel",
    "project management", "agile", "scrum", "jira", "communication", "leadership", "problem solving",
]


def _build_pattern(skill):
    escaped = re.escape(skill.lower())
    return re.compile(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])")


_SKILL_PATTERNS = {skill: _build_pattern(skill) for skill in SKILLS}


def extract_skills(text):
    lowered = text.lower()
    return sorted(skill for skill, pattern in _SKILL_PATTERNS.items() if pattern.search(lowered))


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")


def extract_email(text):
    match = EMAIL_RE.search(text)
    return match.group(0) if match else None


PHONE_CANDIDATE_RE = re.compile(r"[\+\(]?\d[\d().\- ]{7,16}\d")


def extract_phone(text):
    for line in text.splitlines():
        for match in PHONE_CANDIDATE_RE.finditer(line):
            digits = re.sub(r"\D", "", match.group(0))
            if 7 <= len(digits) <= 15:
                return match.group(0).strip()
    return None


EXPERIENCE_RE = re.compile(r"(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?", re.IGNORECASE)


def extract_experience_years(text):
    matches = [int(m.group(1)) for m in EXPERIENCE_RE.finditer(text)]
    return max(matches) if matches else None


EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "ph.d", "mba", "b.s.", "b.a.", "m.s.", "m.a.",
    "associate degree", "diploma", "b.tech", "m.tech", "bsc", "msc",
]


def extract_education(text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    seen, matches = set(), []
    for line in lines:
        if any(keyword in line.lower() for keyword in EDUCATION_KEYWORDS) and line not in seen:
            seen.add(line)
            matches.append(line)
    return matches[:5]


def extract_name(text):
    for chunk in (text[:500], text[:5000]):
        doc = _nlp(chunk)
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text.strip()
    return None
