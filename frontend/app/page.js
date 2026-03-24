"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { translateContent, exportPDF } from "../utils/api";

import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import UploadView from "../components/UploadView";
import NotesView from "../components/NotesView";
import FlashcardsView from "../components/FlashcardsView";
import MindMapView from "../components/MindMapView";
import QuizView from "../components/QuizView";
import ChatView from "../components/ChatView";
import DashboardView from "../components/DashboardView";
import StudyMode from "../components/StudyMode";

export default function Home() {
  // Data state
  const [notes, setNotes] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [mindmap, setMindmap] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [excelAnalysis, setExcelAnalysis] = useState(null);

  // UI state
  const [activeView, setActiveView] = useState("upload");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
  const [error, setError] = useState("");

  const hasDocument = !!notes;

  function handleFileProcessed(result) {
    setNotes(result.notes || "");
    setExtractedText(result.text || "");
    setKeyConcepts(result.key_concepts || []);
    setHighlights(result.highlights || []);
    setFlashcards(result.flashcards || []);
    setMindmap(result.mindmap || null);
    setQuiz(result.quiz || []);
    setExcelAnalysis(result.excel_analysis || null);
    setActiveView("notes");
  }

  async function handleTranslate(targetLang) {
    if (!targetLang || !notes || translating) return;
    setTranslating(true);
    try {
      const result = await translateContent(notes, targetLang);
      setNotes(result.translated);
    } catch (err) {
      setError(`Translation failed: ${err.message}`);
    } finally {
      setTranslating(false);
    }
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await exportPDF({
        notes,
        key_concepts: keyConcepts,
        highlights,
        flashcards,
        quiz,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DocNotes_StudyPack.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  const renderView = () => {
    switch (activeView) {
      case "upload":
        return (
          <UploadView
            onFileProcessed={handleFileProcessed}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case "notes":
        return (
          <NotesView
            notes={notes}
            onTranslate={handleTranslate}
            onExport={handleExport}
            translating={translating}
            exporting={exporting}
          />
        );
      case "flashcards":
        return <FlashcardsView flashcards={flashcards} />;
      case "mindmap":
        return <MindMapView mindmap={mindmap} />;
      case "quiz":
        return <QuizView quiz={quiz} />;
      case "chat":
        return <ChatView documentText={extractedText} />;
      case "dashboard":
        return (
          <DashboardView
            notes={notes}
            flashcards={flashcards}
            quiz={quiz}
            keyConcepts={keyConcepts}
            highlights={highlights}
            mindmap={mindmap}
            hasDocument={hasDocument}
          />
        );
      case "study":
        setShowStudyMode(true);
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          if (view === "study") {
            setShowStudyMode(true);
          } else {
            setActiveView(view);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        hasDocument={hasDocument}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className={`${activeView === "upload" ? "h-full flex" : "max-w-4xl mx-auto p-6 sm:p-8"}`}>
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-error/60 hover:text-error ml-4">
                  &times;
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className={activeView === "upload" ? "flex-1 flex" : ""}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Right panel */}
      {hasDocument && activeView !== "upload" && activeView !== "dashboard" && activeView !== "chat" && (
        <RightPanel
          keyConcepts={keyConcepts}
          highlights={highlights}
          flashcards={flashcards}
          quiz={quiz}
        />
      )}

      {/* Study Mode overlay */}
      <AnimatePresence>
        {showStudyMode && (
          <StudyMode
            onExit={() => setShowStudyMode(false)}
            onNavigate={(view) => setActiveView(view)}
            hasNotes={!!notes}
            hasFlashcards={flashcards.length > 0}
            hasQuiz={quiz.length > 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
