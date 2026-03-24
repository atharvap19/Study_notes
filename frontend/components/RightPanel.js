"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Star, TrendingUp, ChevronDown, ChevronUp,
  BookOpen, Zap, Target, Award, CheckCircle2,
} from "lucide-react";

const categoryColors = {
  definition: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  theorem: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  formula: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  concept: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  principle: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  default: "text-text-muted border-border bg-bg-tertiary/30",
};

function getScoreColor(score) {
  if (score >= 8) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 5) return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  return "text-rose-400 border-rose-400/30 bg-rose-400/10";
}

export default function RightPanel({ keyConcepts, highlights, flashcards, quiz }) {
  const [conceptsExpanded, setConceptsExpanded] = useState(true);
  const [highlightsExpanded, setHighlightsExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);

  const hasContent = keyConcepts?.length > 0 || highlights?.length > 0;

  if (!hasContent) return null;

  // Calculate study progress
  const totalCards = flashcards?.length || 0;
  const totalQuiz = quiz?.length || 0;
  const totalItems = totalCards + totalQuiz;

  return (
    <aside className="w-80 h-screen border-l border-border bg-bg-secondary overflow-y-auto flex-shrink-0 hidden lg:block">
      <div className="p-4 space-y-3">
        {/* Section: Key Concepts */}
        {keyConcepts && keyConcepts.length > 0 && (
          <div>
            <button
              onClick={() => setConceptsExpanded(!conceptsExpanded)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-text-muted uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Key Concepts ({keyConcepts.length})
              </span>
              {conceptsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {conceptsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {keyConcepts.slice(0, 8).map((concept, i) => {
                    const cat = concept.category?.toLowerCase() || "default";
                    const colorClass = categoryColors[cat] || categoryColors.default;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="p-3 rounded-xl bg-bg-primary border border-border hover:border-border-light transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-text-primary leading-snug">
                            {concept.term}
                          </h4>
                          <span className={`text-[0.6rem] font-semibold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${colorClass}`}>
                            {concept.category || "concept"}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                          {concept.definition}
                        </p>
                        {concept.why_it_matters && (
                          <p className="text-[0.7rem] text-accent-light mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                            {concept.why_it_matters}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Divider */}
        {keyConcepts?.length > 0 && highlights?.length > 0 && (
          <div className="border-t border-border" />
        )}

        {/* Section: Highlights */}
        {highlights && highlights.length > 0 && (
          <div>
            <button
              onClick={() => setHighlightsExpanded(!highlightsExpanded)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-text-muted uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                Highlights ({highlights.length})
              </span>
              {highlightsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {highlightsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {highlights.slice(0, 6).map((h, i) => {
                    const score = h.importance_score || 0;
                    const scoreColor = getScoreColor(score);

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="p-3 rounded-xl bg-bg-primary border border-border hover:border-border-light transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${scoreColor}`}>
                            {score}
                          </span>
                          <h4 className="text-sm font-medium text-text-primary leading-snug flex-1 line-clamp-1">
                            {h.topic}
                          </h4>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                          {h.summary}
                        </p>
                        <p className="text-[0.65rem] text-text-muted mt-1">
                          {h.source}
                        </p>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Divider */}
        {(keyConcepts?.length > 0 || highlights?.length > 0) && totalItems > 0 && (
          <div className="border-t border-border" />
        )}

        {/* Section: Study Progress */}
        {totalItems > 0 && (
          <div>
            <button
              onClick={() => setProgressExpanded(!progressExpanded)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-text-muted uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Study Materials
              </span>
              {progressExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {progressExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2.5 overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-border">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-accent-light" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{totalCards}</p>
                      <p className="text-[0.65rem] text-text-muted">Flashcards</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-border">
                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{totalQuiz}</p>
                      <p className="text-[0.65rem] text-text-muted">Quiz Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-border">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{keyConcepts?.length || 0}</p>
                      <p className="text-[0.65rem] text-text-muted">Key Concepts</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </aside>
  );
}
