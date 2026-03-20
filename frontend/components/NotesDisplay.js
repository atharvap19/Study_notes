"use client";

import ReactMarkdown from "react-markdown";

export default function NotesDisplay({ notes }) {
  if (!notes) return null;

  return (
    <div className="notes-output">
      <ReactMarkdown>{notes}</ReactMarkdown>
    </div>
  );
}
