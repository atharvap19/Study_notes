"use client";

import { useState, useRef } from "react";
import { processFile } from "../utils/api";
import NotesDisplay from "../components/NotesDisplay";

export default function Home() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showText, setShowText] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setNotes("");
    setExtractedText("");
    setShowText(false);

    try {
      const result = await processFile(file);
      setNotes(result.notes);
      setExtractedText(result.text);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError("");
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const fileIcon = (name) => {
    if (!name) return "";
    const ext = name.split(".").pop().toLowerCase();
    const icons = { pdf: "PDF", pptx: "PPT", docx: "DOC", xlsx: "XLS" };
    return icons[ext] || "FILE";
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <div style={styles.logo}>DN</div>
            <h1 style={styles.title}>DocNotes AI</h1>
          </div>
          <p style={styles.subtitle}>
            Upload any document and get AI-powered study notes instantly.
          </p>
        </div>

        {/* Upload Area */}
        <form onSubmit={handleSubmit}>
          {!file ? (
            <div
              className={`upload-zone ${dragging ? "dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div style={styles.uploadIcon}>+</div>
              <p style={styles.uploadTitle}>
                Drop your file here or click to browse
              </p>
              <div className="formats">
                <span className="format-tag">PDF</span>
                <span className="format-tag">PPTX</span>
                <span className="format-tag">DOCX</span>
                <span className="format-tag">XLSX</span>
              </div>
            </div>
          ) : (
            <div style={styles.fileSelected}>
              <div className="file-badge">
                <span style={styles.fileType}>{fileIcon(file.name)}</span>
                <span>{file.name}</span>
                <button type="button" onClick={removeFile} title="Remove file">
                  x
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.docx,.xlsx"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={loading}
          />

          <button
            type="submit"
            className="generate-btn"
            disabled={loading || !file}
            style={{ marginTop: 16 }}
          >
            {loading ? "Generating Notes..." : "Generate Notes"}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            <p style={{ color: "#999", fontSize: "0.9rem" }}>
              Extracting text and generating study notes...
            </p>
            <p style={{ color: "#555", fontSize: "0.8rem", marginTop: 4 }}>
              This usually takes 5-15 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-box">{error}</div>}

        {/* Notes */}
        {notes && (
          <div>
            <NotesDisplay notes={notes} />

            <button
              onClick={() => setShowText((v) => !v)}
              className="toggle-btn"
            >
              {showText ? "Hide Extracted Text" : "Show Extracted Text"}
            </button>

            {showText && (
              <div className="extracted-text-box">
                <p>{extractedText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
  },
  container: {
    width: "100%",
    maxWidth: "820px",
  },
  header: {
    marginBottom: 32,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6c63ff, #4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 800,
    fontSize: "0.85rem",
    letterSpacing: "0.05em",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
  },
  subtitle: {
    color: "#666",
    fontSize: "0.95rem",
    margin: 0,
    marginTop: 4,
  },
  uploadIcon: {
    fontSize: "2rem",
    color: "#444",
    marginBottom: 8,
    fontWeight: 300,
  },
  uploadTitle: {
    color: "#777",
    fontSize: "0.95rem",
    margin: "0 0 4px 0",
  },
  fileSelected: {
    padding: "16px 0",
  },
  fileType: {
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
  },
};
