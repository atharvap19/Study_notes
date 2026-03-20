import os
from pptx import Presentation
from PyPDF2 import PdfReader
from docx import Document
from openpyxl import load_workbook

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx", ".xlsx"}


def extract_text(file_path: str) -> str:
    """Extract text content from a supported file type."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext == ".pptx":
        return _extract_pptx(file_path)
    elif ext == ".docx":
        return _extract_docx(file_path)
    elif ext == ".xlsx":
        return _extract_xlsx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _extract_pdf(path: str) -> str:
    reader = PdfReader(path)
    text = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text.append(page_text)
    return "\n".join(text)


def _extract_pptx(path: str) -> str:
    prs = Presentation(path)
    text = []
    for slide_num, slide in enumerate(prs.slides, 1):
        slide_text = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    line = paragraph.text.strip()
                    if line:
                        slide_text.append(line)
        if slide_text:
            text.append(f"[Slide {slide_num}]\n" + "\n".join(slide_text))
    return "\n\n".join(text)


def _extract_docx(path: str) -> str:
    doc = Document(path)
    text = []
    for para in doc.paragraphs:
        if para.text.strip():
            text.append(para.text.strip())
    return "\n".join(text)


def _extract_xlsx(path: str) -> str:
    wb = load_workbook(path, data_only=True)
    text = []
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = []
        for row in ws.iter_rows(values_only=True):
            cells = [str(c) if c is not None else "" for c in row]
            if any(cells):
                rows.append(" | ".join(cells))
        if rows:
            text.append(f"[Sheet: {sheet_name}]\n" + "\n".join(rows))
    return "\n\n".join(text)
