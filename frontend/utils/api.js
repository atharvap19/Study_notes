const BACKEND_URL  = process.env.NEXT_PUBLIC_BACKEND_URL      || "http://localhost:8000";
const AUTH_URL     = process.env.NEXT_PUBLIC_AUTH_BACKEND_URL || "http://localhost:3000";

/**
 * Uploads a file to the backend and returns extracted text + notes.
 */
export async function processFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/process-file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Chat with the document — ask questions about uploaded content.
 */
export async function chatWithDocument(question, documentText, chatHistory = []) {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      document_text: documentText,
      chat_history: chatHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Chat error: ${response.status}`);
  }

  return response.json();
}

/**
 * Translate content to a target language.
 */
export async function translateContent(text, targetLanguage) {
  const response = await fetch(`${BACKEND_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Translation error: ${response.status}`);
  }

  return response.json();
}

// ── Auth-backend helpers (Express on :3000) ─────────────────────────────

/**
 * Log in via the Express auth backend. Returns { token, role, name }.
 */
export async function loginUser(email, password) {
  const res = await fetch(`${AUTH_URL}/api/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Login failed: ${res.status}`);
  return data;
}

/**
 * Fetch the list of study materials a student can access.
 * Requires a valid JWT token.
 */
export async function fetchMaterials(token) {
  const res = await fetch(`${AUTH_URL}/api/student/materials`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Failed to fetch materials: ${res.status}`);
  return data; // { materials: [...] }
}

/**
 * Send a file_id to the Node.js backend, which calls the Python Document AI pipeline.
 * Returns { material, summary, flashcards, quiz, key_concepts, highlights, mindmap }.
 */
export async function callDocumentAI(fileId, token) {
  const res = await fetch(`${AUTH_URL}/api/student/document-ai`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ file_id: fileId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Document AI failed: ${res.status}`);
  return data;
}

/**
 * Export study pack as PDF — returns a Blob.
 */
export async function exportPDF(data) {
  const response = await fetch(`${BACKEND_URL}/export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Export error: ${response.status}`);
  }

  return response.blob();
}
