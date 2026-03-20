const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Uploads a file to the backend and returns extracted text + notes.
 * @param {File} file - The uploaded file
 * @returns {Promise<{text: string, notes: string}>}
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

  return response.json(); // { text, notes }
}
