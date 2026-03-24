"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, Loader2, CheckCircle2,
  FileSpreadsheet, Presentation, FileType,
} from "lucide-react";

const fileIcons = {
  ".pdf": FileText,
  ".pptx": Presentation,
  ".docx": FileType,
  ".xlsx": FileSpreadsheet,
};

const formatTags = [
  { ext: "PDF", color: "text-red-400 border-red-400/30 bg-red-400/10" },
  { ext: "PPTX", color: "text-orange-400 border-orange-400/30 bg-orange-400/10" },
  { ext: "DOCX", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  { ext: "XLSX", color: "text-green-400 border-green-400/30 bg-green-400/10" },
];

export default function UploadView({ onFileProcessed, loading, setLoading }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    setProgress(10);

    try {
      const { processFile } = await import("../utils/api");

      // Simulate progress during processing
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 85));
      }, 800);

      const result = await processFile(file);
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onFileProcessed(result);
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.message || "Processing failed");
      setLoading(false);
      setProgress(0);
    }
  };

  const ext = file ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  const FileIcon = fileIcons[ext] || FileText;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/30 flex items-center justify-center"
          >
            <Upload className="w-7 h-7 text-accent-light" />
          </motion.div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Upload Your Document</h2>
          <p className="text-text-muted text-sm">
            Drop a file to generate AI-powered study notes, flashcards, and more
          </p>
        </div>

        {/* Drop zone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          whileHover={{ borderColor: "rgba(99, 102, 241, 0.5)" }}
          className={`
            relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
            transition-all duration-300
            ${dragging
              ? "border-accent bg-accent/5"
              : file
                ? "border-accent/50 bg-accent/5"
                : "border-border hover:border-border-light bg-bg-secondary/50"
            }
          `}
          onClick={() => !file && document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.pptx,.docx,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <FileIcon className="w-7 h-7 text-accent-light" />
                </div>
                <div>
                  <p className="text-text-primary font-medium text-sm">{file.name}</p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-bg-tertiary/50 text-text-muted hover:text-error transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-xl bg-bg-tertiary/30 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Click to browse or drag & drop
                  </p>
                  <p className="text-text-muted text-xs mt-1">
                    PDF, PPTX, DOCX, XLSX supported
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Format tags */}
        <div className="flex justify-center gap-2 mt-4">
          {formatTags.map(tag => (
            <span key={tag.ext} className={`text-[0.65rem] font-semibold px-2.5 py-1 rounded-md border ${tag.color}`}>
              {tag.ext}
            </span>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!file || loading}
          whileHover={file && !loading ? { scale: 1.01 } : {}}
          whileTap={file && !loading ? { scale: 0.99 } : {}}
          className={`
            w-full mt-6 py-3.5 px-6 rounded-xl font-semibold text-sm
            transition-all duration-200 flex items-center justify-center gap-2
            ${file && !loading
              ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30"
              : "bg-bg-tertiary/50 text-text-muted cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Study Materials
            </>
          )}
        </motion.button>

        {/* Progress bar */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>Processing document...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {["Extracting text", "Generating notes", "Creating flashcards", "Building quiz"].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                    className="flex items-center gap-2 text-xs text-text-muted"
                  >
                    {progress > (i + 1) * 25 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : progress > i * 25 ? (
                      <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-border" />
                    )}
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Sparkles(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
