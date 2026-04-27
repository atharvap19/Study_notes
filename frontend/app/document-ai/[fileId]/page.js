"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, AlertCircle,
  FileText, Layers, HelpCircle, Brain, Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { callDocumentAI } from "../../../utils/api";
import FlashcardsView  from "../../../components/FlashcardsView";
import QuizView        from "../../../components/QuizView";
import MindMapView     from "../../../components/MindMapView";
import Highlights      from "../../../components/Highlights";
import LoadingSkeleton from "../../../components/LoadingSkeleton";

// ── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "notes",      label: "Notes",      Icon: FileText   },
  { id: "flashcards", label: "Flashcards", Icon: Layers     },
  { id: "quiz",       label: "Quiz",       Icon: HelpCircle },
  { id: "mindmap",    label: "Mind Map",   Icon: Brain      },
  { id: "highlights", label: "Highlights", Icon: Sparkles   },
];

// ── Loading skeleton ────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-secondary border-b border-border px-6 py-4 flex items-center gap-4">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton h-5 w-48 rounded" />
      </div>

      {/* Tab bar */}
      <div className="border-b border-border bg-bg-secondary px-6 flex gap-1 py-2">
        {TABS.map(t => (
          <div key={t.id} className="skeleton h-8 w-20 rounded-lg" />
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton w-8 h-8 rounded-xl" />
          <div className="skeleton h-5 w-32 rounded" />
        </div>
        <LoadingSkeleton type="notes" />
      </div>
    </div>
  );
}

// ── Error state ─────────────────────────────────────────────────────────────
function PageError({ message, onBack, onRetry }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-bg-secondary rounded-2xl border border-error/30 p-8 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-error" />
        </div>
        <h2 className="text-base font-semibold text-text-primary mb-2">Failed to load Document AI</h2>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
function DocumentAIPage() {
  const { fileId }   = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [data,      setData]      = useState(null);
  const [activeTab, setActiveTab] = useState("notes");

  useEffect(() => {
    // Accept token from URL query param (passed by the HTML dashboard on port 3000)
    // and persist it at this origin so subsequent calls work.
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      localStorage.setItem("role",  "student");
    }

    const token = urlToken || localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    if (!token || role !== "student") {
      router.replace("/");
      return;
    }
    fetchAI(token);
  }, [fileId]);                              // re-fetch if fileId changes

  async function fetchAI(token) {
    setLoading(true);
    setError("");
    try {
      const result = await callDocumentAI(Number(fileId), token);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    const token = localStorage.getItem("token");
    if (token) fetchAI(token);
  }

  // ── States ──────────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;
  if (error)   return (
    <PageError
      message={error}
      onBack={() => router.back()}
      onRetry={handleRetry}
    />
  );
  if (!data)   return null;

  const { material, summary, flashcards, quiz, mindmap, highlights } = data;

  const tabHasContent = {
    notes:      !!summary,
    flashcards: flashcards?.length > 0,
    quiz:       quiz?.length > 0,
    mindmap:    !!mindmap,
    highlights: highlights?.length > 0,
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-bg-secondary border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-border-light transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-text-primary truncate">
            {material?.title ?? `Document #${fileId}`}
          </h1>
          <p className="text-[0.7rem] text-text-muted">🤖 Document AI Results</p>
        </div>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <nav className="bg-bg-secondary border-b border-border px-4 sm:px-6 flex gap-0.5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium
              whitespace-nowrap transition-colors border-b-2 -mb-px
              ${activeTab === id
                ? "text-accent-light border-accent"
                : "text-text-muted border-transparent hover:text-text-secondary"
              }
              ${!tabHasContent[id] ? "opacity-40" : ""}
            `}
            disabled={!tabHasContent[id]}
            title={!tabHasContent[id] ? "Not generated" : ""}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {tabHasContent[id] && id === "flashcards" && (
              <span className="ml-1 text-[0.6rem] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded-full">
                {flashcards.length}
              </span>
            )}
            {tabHasContent[id] && id === "quiz" && (
              <span className="ml-1 text-[0.6rem] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded-full">
                {quiz.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >

              {/* Notes ─────────────────────────────────────────────────── */}
              {activeTab === "notes" && (
                summary ? (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-accent-light" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-text-primary">Study Notes</h2>
                        <p className="text-xs text-text-muted">AI-generated summary</p>
                      </div>
                    </div>
                    <div className="bg-bg-secondary rounded-2xl border border-border p-6 sm:p-8">
                      <div className="prose-notes">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyTab label="Notes" />
                )
              )}

              {/* Flashcards ─────────────────────────────────────────────── */}
              {activeTab === "flashcards" && (
                flashcards?.length
                  ? <FlashcardsView flashcards={flashcards} />
                  : <EmptyTab label="Flashcards" />
              )}

              {/* Quiz ───────────────────────────────────────────────────── */}
              {activeTab === "quiz" && (
                quiz?.length
                  ? <QuizView quiz={quiz} />
                  : <EmptyTab label="Quiz" />
              )}

              {/* Mind Map ───────────────────────────────────────────────── */}
              {activeTab === "mindmap" && (
                mindmap
                  ? <MindMapView mindmap={mindmap} />
                  : <EmptyTab label="Mind Map" />
              )}

              {/* Highlights ─────────────────────────────────────────────── */}
              {activeTab === "highlights" && (
                highlights?.length
                  ? <Highlights highlights={highlights} />
                  : <EmptyTab label="Highlights" />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}

// ── Suspense-wrapped default export ────────────────────────────────────────
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DocumentAIPage />
    </Suspense>
  );
}

// ── Empty tab placeholder ───────────────────────────────────────────────────
function EmptyTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
      <div className="text-4xl mb-3">🤖</div>
      <p className="text-sm">{label} could not be generated for this document.</p>
    </div>
  );
}
