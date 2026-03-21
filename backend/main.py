import os
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from file_utils import extract_text, extract_chunks, format_chunks, ALLOWED_EXTENSIONS
from summarizer import generate_notes

app = FastAPI(title="DocNotes AI", version="2.0.0")

# Allow requests from the Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "DocNotes AI backend is running"}


@app.post("/process-file")
async def process_file(file: UploadFile = File(...)):
    """
    Full pipeline:
      1. Save uploaded file temporarily
      2. Extract text from PDF / PPTX / DOCX / XLSX
      3. Generate structured notes with Groq LLM
      4. Return extracted text + notes
    """
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Save to a temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # --- Step 1: Extract chunks ---
    try:
        print(f"[1/2] Extracting text from: {file.filename}")
        chunks = extract_chunks(tmp_path)
        structured_text = format_chunks(chunks)
        if not structured_text.strip():
            raise ValueError("No text could be extracted from the file.")
        print(f"      Extracted {len(chunks)} chunks, {len(structured_text)} chars")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Text extraction failed: {str(e)}")
    finally:
        os.remove(tmp_path)

    # --- Step 2: Generate notes ---
    try:
        print("[2/2] Generating structured notes with Groq...")
        notes = generate_notes(structured_text)
        print("      Notes generated successfully.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Note generation failed: {str(e)}")

    # Return chunks metadata for frontend
    chunks_meta = [{"section": c["section"], "source": c["source"]} for c in chunks]
    return {"text": structured_text, "notes": notes, "chunks": chunks_meta}
