import hmac
import os

from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field

from ranking import rank_candidate
from resume_parser import ResumeExtractionError, extract_text
from skills_extractor import (
    extract_education,
    extract_email,
    extract_experience_years,
    extract_name,
    extract_phone,
    extract_skills,
)

app = FastAPI(title="TalentOS AI Service")
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
MAX_TEXT_CHARS = 50000


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": {"message": exc.detail}})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": {"message": "invalid request"}})


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


def _check_secret(provided):
    expected = os.environ.get("AI_SERVICE_SECRET")
    if expected and not hmac.compare_digest(provided or "", expected):
        raise HTTPException(status_code=401, detail="unauthorized")


class RankRequest(BaseModel):
    requiredSkills: list[str] = Field(default_factory=list, max_length=100)
    minExperienceYears: int | None = Field(default=None, ge=0, le=60)
    parsedData: dict | None = None
    resumeText: str | None = Field(default=None, max_length=60000)


@app.post("/rank")
def rank(body: RankRequest, x_internal_secret: str | None = Header(default=None)):
    _check_secret(x_internal_secret)
    result = rank_candidate(body.requiredSkills, body.minExperienceYears, body.parsedData, body.resumeText)
    return {"data": result}


@app.post("/parse-resume")
async def parse_resume(resume: UploadFile = File(...), x_internal_secret: str | None = Header(default=None)):
    expected = os.environ.get("AI_SERVICE_SECRET")
    if expected and not hmac.compare_digest(x_internal_secret or "", expected):
        raise HTTPException(status_code=401, detail="unauthorized")

    file_bytes = await resume.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="uploaded file is empty")
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="resume file must be 5MB or smaller")

    try:
        text = extract_text(file_bytes, resume.filename)
    except ResumeExtractionError as err:
        return JSONResponse(status_code=422, content={"error": {"message": str(err)}})

    parsed_data = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "experienceYears": extract_experience_years(text),
        "education": extract_education(text),
    }
    # Full text is returned separately so the server can store it outside the list-facing parsed JSON.
    return {"data": parsed_data, "text": text[:MAX_TEXT_CHARS]}
