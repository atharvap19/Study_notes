<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-6366f1?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/ChromaDB-FF6F00?style=for-the-badge&logo=databricks&logoColor=white" />
</p>

<h1 align="center">VidNotes AI</h1>

<p align="center">
  <b>AI-powered document-to-study-material pipeline</b><br/>
  Upload any document. Get notes, flashcards, quizzes, mind maps, and an AI tutor — instantly.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## What is VidNotes AI?

VidNotes AI transforms raw documents (PDFs, PowerPoints, Word docs, Excel files) into a complete study toolkit. Instead of passively reading, you actively learn through AI-generated flashcards, quizzes, and interactive mind maps — with a RAG-powered AI tutor that can answer questions grounded in your document.

Think **NotebookLM** meets **Anki** meets **Duolingo**.

---

## Features

### Core Pipeline
| Feature | Description |
|---------|-------------|
| **Smart Notes** | 10-section exam-focused study notes generated from any document |
| **Flashcards** | 10-20 Q&A cards with difficulty levels (Easy/Medium/Hard) and explanations |
| **Quiz Generation** | MCQ, True/False, and Short Answer questions with scoring |
| **Mind Maps** | Interactive, expandable knowledge tree with color-coded depth |
| **Key Concepts** | Auto-extracted definitions, theorems, formulas with category tags |
| **Highlights** | Top 5-10 critical passages ranked by importance (1-10 scale) |

### AI Chat (RAG-Powered)
- Ask questions about your document
- Answers grounded in semantic search via ChromaDB
- Source citations with relevance scores
- Conversation history support

### Utilities
| Feature | Description |
|---------|-------------|
| **Multi-language Translation** | Translate notes to Hindi, Marathi, Spanish, French, German, Japanese, Chinese |
| **PDF Export** | Download a complete study pack (notes + concepts + flashcards + quiz) |
| **Excel Intelligence** | Upload `.xlsx` files for statistical analysis — correlations, trends, missing data |
| **Study Mode** | Timed focus flow: Notes → Flashcards → Quiz with progress tracking |
| **Dashboard** | Track documents processed, flashcards completed, quiz scores, weak topics |

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────────────────┐
│                 │  REST   │              FastAPI Backend              │
│   Next.js 14    │◄───────►│                                          │
│   React + TW    │         │  ┌──────────┐  ┌───────────┐            │
│                 │         │  │ file_utils│  │ summarizer│            │
│  ┌───────────┐  │         │  │ (chunking)│  │ (Groq LLM)│           │
│  │ Sidebar   │  │         │  └─────┬────┘  └─────┬─────┘            │
│  │ Main View │  │         │        │              │                  │
│  │ RightPanel│  │         │        ▼              ▼                  │
│  └───────────┘  │         │  ┌──────────┐  ┌───────────┐            │
│                 │         │  │ ChromaDB  │  │ 6 Parallel│            │
│                 │         │  │ (vectors) │  │ LLM Calls │            │
└─────────────────┘         │  └──────────┘  └───────────┘            │
                            └──────────────────────────────────────────┘
```

### Data Flow

1. **Upload** → User uploads PDF/PPTX/DOCX/XLSX
2. **Chunk** → Smart chunking by headings, slides, or sections
3. **Index** → Chunks embedded and stored in ChromaDB
4. **Generate** → 6 LLM calls run in parallel via `ThreadPoolExecutor`:
   - Notes, Key Concepts, Highlights, Flashcards, Mind Map, Quiz
5. **Respond** → All results returned in a single JSON response
6. **Interact** → Chat, translate, export, study mode

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Groq API Key** — Get one free at [console.groq.com](https://console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/atharvap19/Study_notes.git
cd Study_notes
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# Start the server
uvicorn main:app --reload --port 8000
```

> **Note:** On first run, ChromaDB will download the `all-MiniLM-L6-v2` embedding model (~80MB). This is a one-time download.

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

### 4. Open the app

Navigate to [http://localhost:3000](http://localhost:3000) and upload a document.

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | REST API server with async support |
| **Groq** | LLM inference (Llama 3.3-70B-Versatile) |
| **ChromaDB** | In-memory vector database for RAG |
| **all-MiniLM-L6-v2** | Sentence embeddings for semantic search |
| **pandas** | Excel statistical analysis |
| **fpdf2** | PDF study pack generation |
| **PyPDF2 / python-pptx / python-docx** | Document parsing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 14** | React framework with App Router |
| **Tailwind CSS** | Utility-first styling (dark mode) |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icon system |
| **React Flow** | Interactive mind map visualization |
| **react-markdown** | Markdown rendering for notes |

---

## Project Structure

```
vidnotes-ai/
├── backend/
│   ├── main.py              # FastAPI server + endpoints
│   ├── summarizer.py         # LLM prompts + Groq integration
│   ├── rag.py                # ChromaDB vector store
│   ├── file_utils.py         # Document parsing + smart chunking
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.js           # Main page + state management
│   │   ├── layout.js         # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── Sidebar.js        # Navigation sidebar
│   │   ├── RightPanel.js     # Concepts + highlights panel
│   │   ├── UploadView.js     # File upload with drag-drop
│   │   ├── NotesView.js      # Study notes display
│   │   ├── FlashcardsView.js # Flashcard review UI
│   │   ├── QuizView.js       # Quiz interface
│   │   ├── MindMapView.js    # Interactive mind map
│   │   ├── ChatView.js       # RAG-powered chat
│   │   ├── DashboardView.js  # Progress dashboard
│   │   ├── StudyMode.js      # Timed study sessions
│   │   └── LoadingSkeleton.js# Loading placeholders
│   └── utils/
│       └── api.js            # Backend API client
│
└── README.md
```

---

## API Reference

### `POST /process-file`
Upload and process a document. Returns all study materials.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "text": "raw extracted text",
  "chunks": ["chunk1", "chunk2"],
  "notes": "## Section 1\n...",
  "key_concepts": [{"term": "...", "definition": "...", "category": "..."}],
  "highlights": [{"text": "...", "importance": 9, "reason": "..."}],
  "flashcards": [{"question": "...", "answer": "...", "difficulty": "medium"}],
  "mindmap": {"label": "Root", "children": [...]},
  "quiz": [{"type": "mcq", "question": "...", "options": [...], "answer": "..."}],
  "excel_analysis": null
}
```

### `POST /chat`
RAG-powered Q&A with the uploaded document.

**Request:**
```json
{
  "question": "What is the main thesis?",
  "document_text": "...",
  "chat_history": []
}
```

### `POST /translate`
Translate content to a target language.

**Request:**
```json
{
  "text": "Study notes content...",
  "target_language": "Spanish"
}
```

### `POST /export-pdf`
Generate a downloadable PDF study pack.

**Request:**
```json
{
  "notes": "...",
  "key_concepts": [...],
  "flashcards": [...],
  "quiz": [...]
}
```

---

## Supported File Types

| Format | Chunking Strategy |
|--------|------------------|
| **PDF** | By detected headings (numbered sections, ALL CAPS) or by page |
| **PPTX** | Each slide as a separate chunk with title |
| **DOCX** | By Word heading styles (Heading 1, 2, etc.) |
| **XLSX** | Each sheet as a chunk + pandas statistical analysis |

---

## Performance

- **Parallel LLM calls** — 6 content generation tasks run concurrently via `ThreadPoolExecutor`
- **Processing time** — ~15-25 seconds per document (dependent on Groq API latency)
- **RAG retrieval** — Sub-second semantic search with ChromaDB in-memory vectors
- **Embedding model** — `all-MiniLM-L6-v2` (384-dim, fast inference)

---

## Environment Variables

### Backend (`backend/.env`)
```
GROQ_API_KEY=gsk_your_key_here
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## License

MIT

---

<p align="center">
  Built with Groq, ChromaDB, Next.js, and FastAPI
</p>
