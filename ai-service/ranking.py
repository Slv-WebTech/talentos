import re

SKILL_WEIGHT = 0.7
EXPERIENCE_WEIGHT = 0.3


def _key(skill: str) -> str:
    # "Node.js", "nodejs" and "node js" all compare equal
    return re.sub(r"[^a-z0-9+#]", "", str(skill).lower())


def _in_text(skill: str, lowered_text: str) -> bool:
    """Whole-word search so skills outside the parser's vocabulary (Figma, SAP...) can still match."""
    # "Node.js" in the text should satisfy a required "NodeJS" (and vice versa)
    joined_text = re.sub(r"(?<=[a-z0-9])[.\-](?=[a-z0-9])", "", lowered_text)
    variants = {str(skill).lower().strip(), re.sub(r"[\s.\-]", "", str(skill).lower())}
    for v in variants:
        if not v:
            continue
        pattern = rf"(?<![a-z0-9]){re.escape(v)}(?![a-z0-9])"
        if re.search(pattern, lowered_text) or re.search(pattern, joined_text):
            return True
    return False


def rank_candidate(required_skills, min_experience_years, parsed_data, resume_text=None):
    """Deterministic 0-100 score: skill overlap (70%) + experience fit (30%).

    Returns None when the job has no criteria to score against or the resume
    could not be parsed.
    """
    if not parsed_data or parsed_data.get("parseError"):
        return None

    required = [s for s in (required_skills or []) if _key(s)]
    has_skill_criteria = bool(required)
    has_exp_criteria = bool(min_experience_years)
    if not has_skill_criteria and not has_exp_criteria:
        return None

    candidate_keys = {_key(s) for s in parsed_data.get("skills") or []}
    lowered_text = (resume_text or "").lower()

    def has(skill):
        return _key(skill) in candidate_keys or (bool(lowered_text) and _in_text(skill, lowered_text))

    matched = [s for s in required if has(s)]
    missing = [s for s in required if not has(s)]

    # Only criteria the job actually sets are scored; weights are re-normalised so a job with a
    # single criterion isn't capped at 70% (or inflated to 70% for a candidate who fails it).
    parts = []
    if has_skill_criteria:
        parts.append((SKILL_WEIGHT, len(matched) / len(required)))
    if has_exp_criteria:
        years = parsed_data.get("experienceYears")
        parts.append((EXPERIENCE_WEIGHT, min(1.0, (years or 0) / min_experience_years)))
    total_weight = sum(w for w, _ in parts)
    score = round(100 * sum(w * v for w, v in parts) / total_weight, 1)
    return {"score": score, "matchedSkills": matched, "missingSkills": missing}
