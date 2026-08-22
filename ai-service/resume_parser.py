import io

from docx import Document
import pdfplumber


class ResumeExtractionError(Exception):
    pass


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return _extract_pdf(file_bytes)
    if ext == "docx":
        return _extract_docx(file_bytes)
    if ext == "doc":
        raise ResumeExtractionError(
            "legacy .doc format isn't supported for parsing — please re-save as PDF or DOCX and re-upload"
        )
    raise ResumeExtractionError(f"unsupported file type: .{ext}")


def _extract_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    text = "\n".join(text_parts).strip()
    if not text:
        raise ResumeExtractionError("could not extract text from this PDF (it may be a scanned image)")
    return text


def _extract_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    text = "\n".join(p.text for p in document.paragraphs if p.text.strip())
    if not text.strip():
        raise ResumeExtractionError("could not extract text from this DOCX file")
    return text
