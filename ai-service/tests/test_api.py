import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from skills_extractor import extract_email, extract_experience_years, extract_skills  # noqa: E402

client = TestClient(main.app)


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_skills_and_email_and_years():
    text = "Jane Doe jane@x.io\n5+ years of experience with Python, React and PostgreSQL"
    assert {"python", "react", "postgresql"} <= set(extract_skills(text))
    assert extract_email(text) == "jane@x.io"
    assert extract_experience_years(text) == 5


def test_rejects_empty_file():
    r = client.post("/parse-resume", files={"resume": ("a.pdf", b"", "application/pdf")})
    assert r.status_code == 400


def test_rejects_unsupported_type():
    r = client.post("/parse-resume", files={"resume": ("a.txt", b"hello", "text/plain")})
    assert r.status_code == 422


def test_shared_secret_enforced(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_SECRET", "s3cret")
    files = {"resume": ("a.txt", b"hello", "text/plain")}
    assert client.post("/parse-resume", files=files).status_code == 401
    assert client.post("/parse-resume", files=files, headers={"X-Internal-Secret": "bad"}).status_code == 401
    # correct secret passes auth and reaches validation (422 for unsupported type)
    assert client.post("/parse-resume", files=files, headers={"X-Internal-Secret": "s3cret"}).status_code == 422


def test_rank_scores_skills_and_experience():
    parsed = {"skills": ["python", "node.js"], "experienceYears": 2}
    r = client.post("/rank", json={"requiredSkills": ["Python", "NodeJS", "Docker"], "minExperienceYears": 4, "parsedData": parsed})
    data = r.json()["data"]
    assert data["matchedSkills"] == ["Python", "NodeJS"]
    assert data["missingSkills"] == ["Docker"]
    assert data["score"] == round(100 * (0.7 * 2 / 3 + 0.3 * 0.5), 1)


def test_rank_is_deterministic_and_null_when_unscorable():
    body = {"requiredSkills": ["python"], "parsedData": {"skills": ["python"]}}
    assert client.post("/rank", json=body).json() == client.post("/rank", json=body).json()
    assert client.post("/rank", json=body).json()["data"]["score"] == 100.0
    assert client.post("/rank", json={"requiredSkills": [], "parsedData": {"skills": []}}).json()["data"] is None
    assert client.post("/rank", json={"requiredSkills": ["x"], "parsedData": {"parseError": "bad"}}).json()["data"] is None


def test_rank_requires_secret_when_configured(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_SECRET", "s3cret")
    assert client.post("/rank", json={"requiredSkills": []}).status_code == 401


def test_name_does_not_span_lines():
    from skills_extractor import extract_name

    name = extract_name(chr(10).join(["Jane Tester", "jane@example.test", "5 years of experience with Python"]))
    assert name is not None and chr(10) not in name and "@" not in name


def test_skill_false_positives_avoided():
    assert "go" not in extract_skills("We always go the extra mile")
    assert "excel" not in extract_skills("I excel in teamwork")
    assert "go" in extract_skills("Languages: Python, Go, Rust")
    assert "go" in extract_skills("Experienced golang developer")
    assert "excel" in extract_skills("Advanced MS Excel and Power BI")


def test_experience_ignores_company_age_and_implausible_values():
    assert extract_experience_years("Founded 25 years ago. 3 years of experience in QA") == 3
    assert extract_experience_years("Company is 10 years old") is None
    assert extract_experience_years("99 years of experience") is None


def test_rank_single_criterion_is_not_capped_or_inflated():
    from ranking import rank_candidate

    assert rank_candidate(["python"], None, {"skills": ["python"]})["score"] == 100.0
    assert rank_candidate([], 3, {"skills": [], "experienceYears": 0})["score"] == 0.0
    assert rank_candidate([], 3, {"skills": [], "experienceYears": 6})["score"] == 100.0
    assert rank_candidate([], None, {"skills": ["python"]}) is None


def test_rank_matches_required_skills_found_only_in_resume_text():
    from ranking import rank_candidate

    parsed = {"skills": ["python"], "experienceYears": 4}
    text = "Product designer. Daily Figma and SAP work; also Node.js."
    r = rank_candidate(["Python", "Figma", "SAP", "NodeJS", "Rust"], 4, parsed, text)
    assert r["matchedSkills"] == ["Python", "Figma", "SAP", "NodeJS"]
    assert r["missingSkills"] == ["Rust"]
    # without text the vocabulary-only behaviour is unchanged
    assert rank_candidate(["Figma"], None, parsed)["matchedSkills"] == []
    # substrings must not match ("sap" inside "sapphire")
    assert rank_candidate(["SAP"], None, parsed, "sapphire collector")["matchedSkills"] == []


def test_rank_endpoint_uses_resume_text():
    body = {"requiredSkills": ["Figma"], "parsedData": {"skills": []}, "resumeText": "expert in figma"}
    assert client.post("/rank", json=body).json()["data"]["score"] == 100.0


def test_parse_returns_text_separately():
    from docx import Document
    import io

    doc = Document()
    doc.add_paragraph("Jane Tester")
    doc.add_paragraph("Figma and Python specialist, 5 years of experience")
    buf = io.BytesIO()
    doc.save(buf)
    r = client.post("/parse-resume", files={"resume": ("a.docx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}).json()
    assert "figma" in r["text"].lower()
    assert "text" not in r["data"]
