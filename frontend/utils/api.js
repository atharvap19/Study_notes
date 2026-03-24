const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
