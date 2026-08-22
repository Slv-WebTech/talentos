from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from resume_parser import ResumeExtractionError, extract_text
from skills_extractor import (
    extract_education,
    extract_email,
    extract_experience_years,
    extract_name,
    extract_phone,
    extract_skills,
)

app = FastAPI(title="ATS AI Service")
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": {"message": exc.detail}})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": {"message": "invalid request"}})


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/parse-resume")
async def parse_resume(resume: UploadFile = File(...)):
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
    return {"data": parsed_data}
