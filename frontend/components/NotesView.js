"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Globe, Download, Loader2, ChevronDown, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

const languages = [
  { code: "", label: "Original" },
  { code: "hindi", label: "Hindi" },
  { code: "marathi", label: "Marathi" },
  { code: "spanish", label: "Spanish" },
  { code: "french", label: "French" },
  { code: "german", label: "German" },
  { code: "japanese", label: "Japanese" },
  { code: "chinese", label: "Chinese" },
];

export default function NotesView({ notes, onTranslate, onExport, translating, exporting }) {
  const [showRaw, setShowRaw] = useState(false);
  const [targetLang, setTargetLang] = useState("");

  if (!notes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Study Notes</h2>
            <p className="text-xs text-text-muted">AI-generated from your document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Translate */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="appearance-none bg-bg-secondary border border-border rounded-lg px-3 py-2 pr-8 text-xs text-text-secondary cursor-pointer hover:border-border-light focus:border-accent focus:outline-none transition-colors"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
            <button
              onClick={() => targetLang && onTranslate(targetLang)}
              disabled={!targetLang || translating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-accent-light hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Translate
            </button>
          </div>

          {/* Export */}
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-dark text-white text-xs font-semibold hover:shadow-lg hover:shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export PDF
          </button>

          {/* Raw toggle */}
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`p-2 rounded-lg border transition-colors ${showRaw ? "border-accent/30 text-accent-light bg-accent/10" : "border-border text-text-muted hover:text-text-secondary"}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes content */}
      <motion.div
        layout
        className="bg-bg-secondary rounded-2xl border border-border p-6 sm:p-8"
      >
        {showRaw ? (
          <pre className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
            {notes}
          </pre>
        ) : (
          <div className="prose-notes">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
