import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(
    base_url=os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    api_key=os.environ.get("GROQ_API_KEY"),
)

NOTES_PROMPT = """You are an expert educator, researcher, and top-tier note-maker.

Your task is to convert the provided document into deep, structured, exam-ready study notes that emphasize understanding, clarity, and insight — not just extraction.

STRICT INSTRUCTIONS:
* Do NOT skip any section of the document
* Do NOT be generic — every point must be specific to the document
* Prioritize clarity, intuition, and connections between ideas
* Where possible, simplify complex ideas into easy-to-understand explanations
* Highlight what is IMPORTANT for exams, interviews, or real-world application

---

## 1. Document Structure & Topics
* List ALL main topics and subtopics in a clean hierarchical format
* Preserve the logical flow of the document

---

## 2. Deep Key Points (Highly Detailed)
* Extract ALL important points
* Include:
  * Definitions, concepts, and explanations
  * Data, numbers, metrics, formulas
  * Algorithms, models, and techniques
  * Tools, technologies, and frameworks
* Add mini explanations for each point (not just bullets)
* Mark important points, common mistakes, and frequently asked concepts

---

## 3. Conceptual Understanding (Core Section)
* Explain ALL major concepts in a teach-like manner
* Include:
  * Intuition (why it works)
  * Real-world analogies (if possible)
  * When and where it is used
* Break down complex topics step-by-step

---

## 4. Processes, Methods & Workflows
* Convert all processes into:
  * Step-by-step explanations
  * Flow-style breakdowns
* Include parameters, configurations, and conditions mentioned

---

## 5. Formulas, Algorithms & Models
* List all formulas and explain:
  * What each variable represents
  * When to use the formula
* For algorithms/models:
  * Explain working mechanism
  * Advantages & limitations

---

## 6. Results, Data & Insights
* Extract ALL results, comparisons, and findings
* Include:
  * Accuracy, metrics, benchmarks
  * Observations from graphs/tables (describe them clearly)
* Add interpretation: what these results actually mean

---

## 7. Connections & Big Picture
* Explain how different topics relate to each other
* Show cause-effect relationships
* Link concepts across sections

---

## 8. Exam-Focused Revision Section
* Create:
  * Quick revision bullets
  * Important definitions
  * Likely exam questions (conceptual + theoretical)
* Include tricky areas students often misunderstand

---

## 9. Summary (Insightful)
* 5-7 sentences covering:
  * Purpose of the document
  * Core ideas
  * Key insights
  * Practical importance

---

## 10. Simplified Version
* Provide a very simple explanation (ELI5 style) for the most complex topic in the document

---

TONE: Clear, structured, and easy to revise. Avoid fluff. Make it feel like high-quality topper notes.

INPUT DOCUMENT:
{transcript}
"""

KEY_CONCEPTS_PROMPT = """You are an expert educator and knowledge extractor.

Analyze the following document and extract ALL key concepts, definitions, theorems, formulas, and important statements.

For EACH concept, provide:
1. **term**: The concept/definition name
2. **definition**: A clear, concise explanation
3. **source**: The page/slide/section where it appears (use the [Page X] or [Slide X] markers from the input)
4. **category**: One of: "definition", "theorem", "formula", "concept", "framework", "model", "principle"
5. **why_it_matters**: One sentence on why this concept is important (for exams, real-world, or understanding)

STRICT RULES:
* Extract EVERY key concept — do not skip any
* Be specific to the document, not generic
* Keep definitions concise but complete
* Output ONLY valid JSON — no markdown, no extra text

Output format (JSON array):
[
  {{
    "term": "...",
    "definition": "...",
    "source": "Page 3",
    "category": "definition",
    "why_it_matters": "..."
  }}
]

INPUT DOCUMENT:
{transcript}"""

HIGHLIGHTS_PROMPT = """You are an expert document analyst specializing in identifying the most important and exam-relevant content.

Analyze the following document and identify the TOP 5-10 most important segments — the parts a student MUST know.

For EACH highlight, provide:
1. **topic**: The topic/title of this important segment
2. **source**: The page/slide/section where it appears (use the [Page X] or [Slide X] markers from the input)
3. **summary**: A 2-3 sentence summary of what makes this segment critical
4. **importance_score**: A score from 1-10 (10 = absolutely essential)
5. **reason**: Why this is a highlight — e.g., "core definition", "likely exam question", "foundational concept", "key result"

STRICT RULES:
* Rank by true importance, not by order of appearance
* Be specific — reference actual content from the document
* Score honestly — not everything should be 10
* Output ONLY valid JSON — no markdown, no extra text

Output format (JSON array):
[
  {{
    "topic": "...",
    "source": "Page 2",
    "summary": "...",
    "importance_score": 9,
    "reason": "..."
  }}
]

INPUT DOCUMENT:
{transcript}"""


FLASHCARDS_PROMPT = """You are an expert educator who creates high-quality flashcards for exam preparation.

Analyze the following document and generate 10-20 flashcards covering ALL important topics.

For EACH flashcard, provide:
1. **question**: A clear, specific question (not vague or overly broad)
2. **answer**: A concise but complete answer
3. **explanation**: A brief explanation that adds context or helps understanding (1-2 sentences)
4. **source**: The page/slide/section where the answer can be found (use the [Page X] or [Slide X] markers)
5. **difficulty**: One of: "easy", "medium", "hard"
6. **topic**: The topic/category this flashcard belongs to

STRICT RULES:
* Cover ALL major topics from the document — don't focus on just one section
* Mix question types: definitions, concepts, comparisons, applications, formulas
* Include at least 2-3 "hard" questions that test deep understanding
* Questions should be exam-worthy — the kind a professor would ask
* Answers should be concise enough to memorize but complete enough to score full marks
* Output ONLY valid JSON — no markdown, no extra text

Output format (JSON array):
[
  {{
    "question": "...",
    "answer": "...",
    "explanation": "...",
    "source": "Page 3",
    "difficulty": "medium",
    "topic": "..."
  }}
]

INPUT DOCUMENT:
{transcript}"""


MINDMAP_PROMPT = """You are an expert educator who creates visual mind maps for study material.

Analyze the following document and generate a hierarchical mind map structure.

The output must be a JSON object representing a tree:
- **label**: The node's text (short, concise)
- **children**: An array of child nodes (same structure, recursive)

Rules:
* The root node should be the document's main topic
* First level children = major sections/topics
* Second level = subtopics and key concepts
* Third level (if needed) = specific details, formulas, examples
* Keep labels SHORT (3-8 words max)
* Aim for 3-6 children per node, no more
* Cover ALL major topics from the document
* Go 2-3 levels deep, not more
* Output ONLY valid JSON — no markdown, no extra text

Output format (JSON object):
{{
  "label": "Main Topic",
  "children": [
    {{
      "label": "Subtopic 1",
      "children": [
        {{ "label": "Detail A", "children": [] }},
        {{ "label": "Detail B", "children": [] }}
      ]
    }},
    {{
      "label": "Subtopic 2",
      "children": [
        {{ "label": "Detail C", "children": [] }}
      ]
    }}
  ]
}}

INPUT DOCUMENT:
{transcript}"""

QUIZ_PROMPT = """You are an expert educator who creates comprehensive quizzes for exam preparation.

Analyze the following document and generate a quiz with THREE types of questions:

1. **MCQ** (Multiple Choice) — 5-8 questions
2. **true_false** (True/False) — 3-5 questions
3. **short_answer** (Short Answer) — 3-5 questions

For EACH question, provide:
- **type**: One of "mcq", "true_false", "short_answer"
- **question**: Clear, specific question text
- **options**: Array of 4 choices (MCQ only, omit for others)
- **correct_answer**: The correct answer (for MCQ: the exact option text, for T/F: "True" or "False", for short answer: a model answer)
- **explanation**: Why this is the correct answer (1-2 sentences)
- **difficulty**: "easy", "medium", or "hard"
- **topic**: The topic this question covers
- **source**: Page/slide where the answer is found

STRICT RULES:
* Cover ALL major topics — don't focus on just one section
* MCQ distractors should be plausible, not obviously wrong
* True/False should include tricky statements that test real understanding
* Short answer questions should require 1-3 sentence responses
* Mix difficulty levels across all types
* Output ONLY valid JSON — no markdown, no extra text

Output format (JSON array):
[
  {{
    "type": "mcq",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "B",
    "explanation": "...",
    "difficulty": "medium",
    "topic": "...",
    "source": "Page 3"
  }},
  {{
    "type": "true_false",
    "question": "...",
    "correct_answer": "False",
    "explanation": "...",
    "difficulty": "easy",
    "topic": "...",
    "source": "Page 1"
  }},
  {{
    "type": "short_answer",
    "question": "...",
    "correct_answer": "...",
    "explanation": "...",
    "difficulty": "hard",
    "topic": "...",
    "source": "Page 5"
  }}
]

INPUT DOCUMENT:
{transcript}"""


def _call_groq(prompt: str, temperature: float = 0.4, max_tokens: int = 16384) -> str:
    """Call Groq via OpenAI-compatible endpoint with streaming."""
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    completion = _client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    result = []
    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue
        if chunk.choices and chunk.choices[0].delta.content is not None:
            result.append(chunk.choices[0].delta.content)
    return "".join(result).strip()


def generate_notes(transcript: str) -> str:
    """
    Sends the transcript to Groq's LLM and returns structured study notes.
    """
    prompt = NOTES_PROMPT.format(transcript=transcript)
    return _call_groq(prompt)


def extract_key_concepts(transcript: str) -> list[dict]:
    """
    Extract key concepts, definitions, theorems, and formulas from the document.
    Returns a list of concept dicts with term, definition, source, category, why_it_matters.
    """
    import json

    prompt = KEY_CONCEPTS_PROMPT.format(transcript=transcript)
    raw = _call_groq(prompt, temperature=0.3)

    # Try to parse JSON from the response (handle markdown code blocks if present)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Remove markdown code fences
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        concepts = json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: try to find JSON array in the response
        start = cleaned.find("[")
        end = cleaned.rfind("]") + 1
        if start != -1 and end > start:
            concepts = json.loads(cleaned[start:end])
        else:
            raise ValueError("Failed to parse key concepts from LLM response")

    return concepts


def detect_highlights(transcript: str) -> list[dict]:
    """
    Identify the most important segments in the document.
    Returns a list of highlight dicts with topic, source, summary, importance_score, reason.
    """
    import json

    prompt = HIGHLIGHTS_PROMPT.format(transcript=transcript)
    raw = _call_groq(prompt, temperature=0.3)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        highlights = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("[")
        end = cleaned.rfind("]") + 1
        if start != -1 and end > start:
            highlights = json.loads(cleaned[start:end])
        else:
            raise ValueError("Failed to parse highlights from LLM response")

    # Sort by importance score descending
    highlights.sort(key=lambda h: h.get("importance_score", 0), reverse=True)
    return highlights


def generate_flashcards(transcript: str) -> list[dict]:
    """
    Generate exam-focused flashcards from the document.
    Returns a list of flashcard dicts with question, answer, explanation, source, difficulty, topic.
    """
    import json

    prompt = FLASHCARDS_PROMPT.format(transcript=transcript)
    raw = _call_groq(prompt, temperature=0.3)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        flashcards = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("[")
        end = cleaned.rfind("]") + 1
        if start != -1 and end > start:
            flashcards = json.loads(cleaned[start:end])
        else:
            raise ValueError("Failed to parse flashcards from LLM response")

    return flashcards


def generate_mindmap(transcript: str) -> dict:
    """
    Generate a hierarchical mind map from the document.
    Returns a tree dict with label and children.
    """
    import json

    prompt = MINDMAP_PROMPT.format(transcript=transcript)
    raw = _call_groq(prompt, temperature=0.3)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        mindmap = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            mindmap = json.loads(cleaned[start:end])
        else:
            raise ValueError("Failed to parse mind map from LLM response")

    return mindmap


def generate_quiz(transcript: str) -> list[dict]:
    """
    Generate a comprehensive quiz with MCQ, True/False, and Short Answer questions.
    """
    import json

    prompt = QUIZ_PROMPT.format(transcript=transcript)
    raw = _call_groq(prompt, temperature=0.3)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        quiz = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("[")
        end = cleaned.rfind("]") + 1
        if start != -1 and end > start:
            quiz = json.loads(cleaned[start:end])
        else:
            raise ValueError("Failed to parse quiz from LLM response")

    return quiz


def chat_with_document(document_text: str, question: str, chat_history: list[dict] = None) -> str:
    """
    Answer a question about the document using the full text as context.
    Supports conversational follow-ups via chat_history.
    """
    system_msg = f"""You are a helpful study assistant. Answer questions about the following document.
Be specific, cite page/slide numbers when possible, and explain concepts clearly.
If the answer is not in the document, say so honestly.

DOCUMENT:
{document_text}"""

    messages = [{"role": "system", "content": system_msg}]

    # Add chat history for conversational context
    if chat_history:
        for msg in chat_history[-6:]:  # Last 6 messages to stay within context
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})

    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    completion = _client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.4,
        max_tokens=8192,
        stream=True,
    )
    result = []
    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue
        if chunk.choices and chunk.choices[0].delta.content is not None:
            result.append(chunk.choices[0].delta.content)
    return "".join(result).strip()


def translate_text(text: str, target_language: str) -> str:
    """Translate text to the target language using the LLM."""
    prompt = f"""Translate the following content to {target_language}.
Keep all formatting (markdown, bullet points, headings) intact.
Translate the content accurately — do not summarize or skip anything.
Output ONLY the translated text, nothing else.

CONTENT TO TRANSLATE:
{text}"""

    return _call_groq(prompt, temperature=0.2, max_tokens=8192)


def analyze_excel_data(file_path: str) -> dict:
    """
    Analyze an Excel file using pandas to extract statistical insights.
    Returns a dict with sheets, each containing stats and insights.
    """
    import pandas as pd

    xls = pd.ExcelFile(file_path)
    analysis = {}

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        if df.empty:
            continue

        sheet_info = {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "numeric_columns": [],
            "insights": [],
        }

        # Analyze numeric columns
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        for col in numeric_cols:
            stats = {
                "name": col,
                "mean": round(float(df[col].mean()), 2) if not df[col].isna().all() else None,
                "min": round(float(df[col].min()), 2) if not df[col].isna().all() else None,
                "max": round(float(df[col].max()), 2) if not df[col].isna().all() else None,
                "median": round(float(df[col].median()), 2) if not df[col].isna().all() else None,
                "std": round(float(df[col].std()), 2) if not df[col].isna().all() else None,
            }
            sheet_info["numeric_columns"].append(stats)

        # Generate insights
        if len(numeric_cols) >= 2:
            # Find correlations
            corr = df[numeric_cols].corr()
            for i in range(len(numeric_cols)):
                for j in range(i + 1, len(numeric_cols)):
                    c = corr.iloc[i, j]
                    if abs(c) > 0.7:
                        direction = "positive" if c > 0 else "negative"
                        sheet_info["insights"].append(
                            f"Strong {direction} correlation ({c:.2f}) between '{numeric_cols[i]}' and '{numeric_cols[j]}'"
                        )

        # Trend detection for first numeric column
        if numeric_cols:
            col = numeric_cols[0]
            values = df[col].dropna().tolist()
            if len(values) >= 3:
                first_half = sum(values[: len(values) // 2]) / (len(values) // 2)
                second_half = sum(values[len(values) // 2 :]) / (len(values) - len(values) // 2)
                if second_half > first_half * 1.1:
                    pct = ((second_half - first_half) / first_half) * 100
                    sheet_info["insights"].append(
                        f"'{col}' shows an upward trend: {pct:.1f}% increase from first to second half"
                    )
                elif second_half < first_half * 0.9:
                    pct = ((first_half - second_half) / first_half) * 100
                    sheet_info["insights"].append(
                        f"'{col}' shows a downward trend: {pct:.1f}% decrease from first to second half"
                    )

        # Check for missing values
        missing = df.isnull().sum()
        cols_with_missing = missing[missing > 0]
        if len(cols_with_missing) > 0:
            sheet_info["insights"].append(
                f"Missing values found in: {', '.join([f'{c} ({n})' for c, n in cols_with_missing.items()])}"
            )

        analysis[sheet_name] = sheet_info

    return analysis
