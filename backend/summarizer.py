import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client using the API key from .env
_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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

def generate_notes(transcript: str) -> str:
    """
    Sends the transcript to Groq's LLM and returns structured study notes.
    Uses llama3-8b-8192 — fast and capable for summarization tasks.
    """
    prompt = NOTES_PROMPT.format(transcript=transcript)

    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.4,        # Lower temperature = more factual, structured output
        max_tokens=8192,
    )

    notes = response.choices[0].message.content.strip()
    return notes
