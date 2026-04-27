import os
import io
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from file_utils import extract_text, extract_chunks, format_chunks, ALLOWED_EXTENSIONS
from summarizer import (
    generate_notes, extract_key_concepts, detect_highlights,
    generate_flashcards, generate_mindmap, generate_quiz,
    chat_with_document, translate_text, analyze_excel_data,
)
from rag import index_document, retrieve, get_current_collection

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
    excel_analysis = None
    try:
        print(f"[1/2] Extracting text from: {file.filename}")
        chunks = extract_chunks(tmp_path)
        structured_text = format_chunks(chunks)
        if not structured_text.strip():
            raise ValueError("No text could be extracted from the file.")
        print(f"      Extracted {len(chunks)} chunks, {len(structured_text)} chars")

        # Excel intelligence: run pandas analysis for xlsx files
        if ext == ".xlsx":
            try:
                print("      Running Excel intelligence analysis...")
                excel_analysis = analyze_excel_data(tmp_path)
                print(f"      Analyzed {len(excel_analysis)} sheets.")
            except Exception as e:
                print(f"      Excel analysis failed (non-fatal): {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Text extraction failed: {str(e)}")
    finally:
        os.remove(tmp_path)

    # --- Index chunks in ChromaDB for RAG ---
    try:
        import hashlib
        doc_id = hashlib.md5(file.filename.encode()).hexdigest()[:12]
        collection_name = index_document(doc_id, chunks)
        print(f"      Indexed {len(chunks)} chunks in ChromaDB (collection: {collection_name})")
    except Exception as e:
        print(f"      ChromaDB indexing failed (non-fatal): {str(e)}")

    # --- Steps 2-7: Run all LLM calls in parallel ---
    notes = ""
    key_concepts = []
    highlights = []
    flashcards = []
    mindmap = None
    quiz = []

    print("[2/2] Running all 6 LLM calls in parallel with Groq...")

    def _run_notes():
        return generate_notes(structured_text)

    def _run_concepts():
        return extract_key_concepts(structured_text)

    def _run_highlights():
        return detect_highlights(structured_text)

    def _run_flashcards():
        return generate_flashcards(structured_text)

    def _run_mindmap():
        return generate_mindmap(structured_text)

    def _run_quiz():
        return generate_quiz(structured_text)

    with ThreadPoolExecutor(max_workers=6) as executor:
        future_notes = executor.submit(_run_notes)
        future_concepts = executor.submit(_run_concepts)
        future_highlights = executor.submit(_run_highlights)
        future_flashcards = executor.submit(_run_flashcards)
        future_mindmap = executor.submit(_run_mindmap)
        future_quiz = executor.submit(_run_quiz)

        # Notes is the only critical one
        try:
            notes = future_notes.result()
            print("      Notes generated successfully.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Note generation failed: {str(e)}")

        # All others are non-fatal
        try:
            key_concepts = future_concepts.result()
            print(f"      Extracted {len(key_concepts)} key concepts.")
        except Exception as e:
            print(f"      Key concepts extraction failed (non-fatal): {str(e)}")

        try:
            highlights = future_highlights.result()
            print(f"      Detected {len(highlights)} highlights.")
        except Exception as e:
            print(f"      Highlight detection failed (non-fatal): {str(e)}")

        try:
            flashcards = future_flashcards.result()
            print(f"      Generated {len(flashcards)} flashcards.")
        except Exception as e:
            print(f"      Flashcard generation failed (non-fatal): {str(e)}")

        try:
            mindmap = future_mindmap.result()
            print("      Mind map generated successfully.")
        except Exception as e:
            print(f"      Mind map generation failed (non-fatal): {str(e)}")

        try:
            quiz = future_quiz.result()
            print(f"      Generated {len(quiz)} quiz questions.")
        except Exception as e:
            print(f"      Quiz generation failed (non-fatal): {str(e)}")

    print("      All parallel tasks complete.")

    # Return chunks metadata for frontend
    chunks_meta = [{"section": c["section"], "source": c["source"]} for c in chunks]
    return {
        "text": structured_text,
        "notes": notes,
        "chunks": chunks_meta,
        "key_concepts": key_concepts,
        "highlights": highlights,
        "flashcards": flashcards,
        "mindmap": mindmap,
        "quiz": quiz,
        "excel_analysis": excel_analysis,
    }


# --- Chat with document ---

class ChatRequest(BaseModel):
    question: str
    document_text: str
    chat_history: list[dict] = []


@app.post("/chat")
async def chat(req: ChatRequest):
    """Answer a question using RAG — retrieve relevant chunks, then generate answer."""
    try:
        # Step 1: Retrieve relevant chunks from ChromaDB
        retrieved_chunks = retrieve(req.question, top_k=5)

        if retrieved_chunks:
            # Build focused context from retrieved chunks
            context_parts = []
            sources_used = []
            for chunk in retrieved_chunks:
                context_parts.append(
                    f"[{chunk['source']}] {chunk['section']}\n{chunk['content']}"
                )
                sources_used.append(f"{chunk['source']} ({chunk['section']}, relevance: {chunk['score']})")

            rag_context = "\n\n---\n\n".join(context_parts)
            print(f"      RAG: Retrieved {len(retrieved_chunks)} chunks for: '{req.question[:50]}...'")
            print(f"      Sources: {', '.join(sources_used)}")

            # Step 2: Generate answer using retrieved context
            answer = chat_with_document(rag_context, req.question, req.chat_history)
        else:
            # Fallback: use full document text if no RAG results
            print("      RAG: No indexed chunks found, falling back to full context")
            answer = chat_with_document(req.document_text, req.question, req.chat_history)

        return {
            "answer": answer,
            "sources": [
                {"source": c["source"], "section": c["section"], "score": c["score"]}
                for c in retrieved_chunks
            ] if retrieved_chunks else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


# --- Translation ---

class TranslateRequest(BaseModel):
    text: str
    target_language: str


@app.post("/translate")
async def translate(req: TranslateRequest):
    """Translate content to a target language."""
    try:
        translated = translate_text(req.text, req.target_language)
        return {"translated": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


# --- PDF Export ---

class ExportRequest(BaseModel):
    notes: str = ""
    key_concepts: list[dict] = []
    highlights: list[dict] = []
    flashcards: list[dict] = []
    quiz: list[dict] = []


@app.post("/export-pdf")
async def export_pdf(req: ExportRequest):
    """Generate and return a PDF study pack."""
    from fpdf import FPDF

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Title page
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 24)
    pdf.cell(0, 40, "DocNotes AI", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 14)
    pdf.cell(0, 10, "Study Pack", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(20)

    # Helper to write section headers
    def section_header(title):
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(108, 99, 255)
        pdf.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(4)

    def body_text(text):
        pdf.set_font("Helvetica", "", 10)
        # Clean markdown-ish formatting for PDF
        cleaned = text.replace("**", "").replace("##", "").replace("# ", "")
        for line in cleaned.split("\n"):
            line = line.strip()
            if not line:
                pdf.ln(3)
                continue
            if line.startswith("- ") or line.startswith("* "):
                pdf.cell(5)
                pdf.multi_cell(0, 5, f"  {line}")
            else:
                pdf.multi_cell(0, 5, line)

    # 1. Study Notes
    if req.notes:
        pdf.add_page()
        section_header("Study Notes")
        body_text(req.notes)

    # 2. Key Concepts
    if req.key_concepts:
        pdf.add_page()
        section_header("Key Concepts & Definitions")
        for c in req.key_concepts:
            pdf.set_font("Helvetica", "B", 11)
            pdf.multi_cell(0, 6, f"{c.get('term', '')} [{c.get('category', '')}]")
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, f"  {c.get('definition', '')}")
            pdf.set_font("Helvetica", "I", 9)
            pdf.multi_cell(0, 5, f"  Source: {c.get('source', '')} | Why: {c.get('why_it_matters', '')}")
            pdf.ln(4)

    # 3. Highlights
    if req.highlights:
        pdf.add_page()
        section_header("Document Highlights")
        for h in req.highlights:
            pdf.set_font("Helvetica", "B", 11)
            pdf.multi_cell(0, 6, f"[{h.get('importance_score', '?')}/10] {h.get('topic', '')}")
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, f"  {h.get('summary', '')}")
            pdf.set_font("Helvetica", "I", 9)
            pdf.multi_cell(0, 5, f"  {h.get('source', '')} - {h.get('reason', '')}")
            pdf.ln(4)

    # 4. Flashcards
    if req.flashcards:
        pdf.add_page()
        section_header("Flashcards")
        for i, f_card in enumerate(req.flashcards, 1):
            pdf.set_font("Helvetica", "B", 10)
            pdf.multi_cell(0, 6, f"Q{i}. {f_card.get('question', '')} [{f_card.get('difficulty', '')}]")
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, f"  A: {f_card.get('answer', '')}")
            if f_card.get("explanation"):
                pdf.set_font("Helvetica", "I", 9)
                pdf.multi_cell(0, 5, f"  {f_card.get('explanation', '')}")
            pdf.ln(3)

    # 5. Quiz
    if req.quiz:
        pdf.add_page()
        section_header("Quiz")
        for i, q in enumerate(req.quiz, 1):
            qtype = q.get("type", "").replace("_", " ").title()
            pdf.set_font("Helvetica", "B", 10)
            pdf.multi_cell(0, 6, f"Q{i}. [{qtype}] {q.get('question', '')}")
            if q.get("options"):
                pdf.set_font("Helvetica", "", 10)
                for j, opt in enumerate(q["options"]):
                    pdf.multi_cell(0, 5, f"    {chr(65+j)}) {opt}")
            pdf.set_font("Helvetica", "I", 9)
            pdf.multi_cell(0, 5, f"  Answer: {q.get('correct_answer', '')}")
            pdf.multi_cell(0, 5, f"  {q.get('explanation', '')}")
            pdf.ln(3)

    # Output to bytes
    pdf_bytes = pdf.output()
    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=DocNotes_StudyPack.pdf"},
    )


# ---------------------------------------------------------------------------
# /process-document  — called by Node.js auth backend (server-to-server)
# Accepts a server-side file path instead of a multipart upload.
# The existing /process-file endpoint is intentionally untouched.
# ---------------------------------------------------------------------------

class ProcessDocumentRequest(BaseModel):
    file_path: str


@app.post("/process-document")
async def process_document(req: ProcessDocumentRequest):
    """
    Process a document that already exists on the server filesystem.
    Called by the Node.js backend after a teacher uploads a file.
    Returns identical shape to /process-file.
    """
    file_path = req.file_path

    if not os.path.isabs(file_path) or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_name = os.path.basename(file_path)

    # ── Extract chunks ────────────────────────────────────────────────────
    excel_analysis = None
    try:
        print(f"[process-document] Extracting: {file_name}")
        chunks = extract_chunks(file_path)
        structured_text = format_chunks(chunks)
        if not structured_text.strip():
            raise ValueError("No text could be extracted from the file.")
        print(f"  -> {len(chunks)} chunks, {len(structured_text)} chars")

        if ext == ".xlsx":
            try:
                excel_analysis = analyze_excel_data(file_path)
            except Exception as e:
                print(f"  -> Excel analysis failed (non-fatal): {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Text extraction failed: {str(e)}")

    # ── Index in ChromaDB ─────────────────────────────────────────────────
    try:
        import hashlib
        doc_id = hashlib.md5(file_name.encode()).hexdigest()[:12]
        index_document(doc_id, chunks)
        print(f"  -> Indexed in ChromaDB (doc_id={doc_id})")
    except Exception as e:
        print(f"  → ChromaDB indexing failed (non-fatal): {e}")

    # ── Run 6 LLM calls in parallel ───────────────────────────────────────
    notes = ""
    key_concepts, highlights, flashcards, quiz = [], [], [], []
    mindmap = None

    print("[process-document] Running parallel LLM calls…")
    with ThreadPoolExecutor(max_workers=6) as executor:
        f_notes      = executor.submit(generate_notes,         structured_text)
        f_concepts   = executor.submit(extract_key_concepts,   structured_text)
        f_highlights = executor.submit(detect_highlights,      structured_text)
        f_flashcards = executor.submit(generate_flashcards,    structured_text)
        f_mindmap    = executor.submit(generate_mindmap,       structured_text)
        f_quiz       = executor.submit(generate_quiz,          structured_text)

        try:
            notes = f_notes.result()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Note generation failed: {str(e)}")

        for future, name in [
            (f_concepts,   "key_concepts"),
            (f_highlights, "highlights"),
            (f_flashcards, "flashcards"),
            (f_mindmap,    "mindmap"),
            (f_quiz,       "quiz"),
        ]:
            try:
                result = future.result()
                if   name == "key_concepts": key_concepts = result
                elif name == "highlights":   highlights   = result
                elif name == "flashcards":   flashcards   = result
                elif name == "mindmap":      mindmap      = result
                elif name == "quiz":         quiz         = result
            except Exception as e:
                print(f"  -> {name} failed (non-fatal): {e}")

    print("[process-document] Done.")
    chunks_meta = [{"section": c["section"], "source": c["source"]} for c in chunks]
    return {
        "text":           structured_text,
        "notes":          notes,
        "chunks":         chunks_meta,
        "key_concepts":   key_concepts,
        "highlights":     highlights,
        "flashcards":     flashcards,
        "mindmap":        mindmap,
        "quiz":           quiz,
        "excel_analysis": excel_analysis,
    }
