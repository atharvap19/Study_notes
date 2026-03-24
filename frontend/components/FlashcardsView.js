"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Zap, BookOpen, GraduationCap } from "lucide-react";

const difficultyConfig = {
  easy: { color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: BookOpen, label: "Easy" },
  medium: { color: "text-amber-400 border-amber-400/30 bg-amber-400/10", icon: Zap, label: "Medium" },
  hard: { color: "text-rose-400 border-rose-400/30 bg-rose-400/10", icon: GraduationCap, label: "Hard" },
};

export default function FlashcardsView({ flashcards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState("all");
  const [direction, setDirection] = useState(0);

  if (!flashcards || flashcards.length === 0) return null;

  const filtered = filter === "all" ? flashcards : flashcards.filter(f => f.difficulty === filter);
  const card = filtered[index] || filtered[0];
  const total = filtered.length;

  const navigate = (dir) => {
    setDirection(dir);
    setFlipped(false);
    setIndex(prev => {
      const next = prev + dir;
      if (next < 0) return total - 1;
      if (next >= total) return 0;
      return next;
    });
  };

  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Flashcards</h2>
            <p className="text-xs text-text-muted">{flashcards.length} cards generated</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5">
          {["all", "easy", "medium", "hard"].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setIndex(0); setFlipped(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-accent/15 text-accent-light border border-accent/30"
                  : "text-text-muted hover:text-text-secondary border border-transparent"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-bg-tertiary/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      {card && (
        <div className="flex justify-center">
          <div className="w-full max-w-xl perspective-1000">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${index}-${filter}`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  onClick={() => setFlipped(!flipped)}
                  className="relative w-full min-h-[280px] cursor-pointer"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 backface-hidden bg-bg-secondary rounded-2xl border border-border p-8 flex flex-col"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-6">
                      {card.difficulty && difficultyConfig[card.difficulty] && (
                        <span className={`text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${difficultyConfig[card.difficulty].color}`}>
                          {difficultyConfig[card.difficulty].label}
                        </span>
                      )}
                      {card.topic && (
                        <span className="text-xs text-text-muted">{card.topic}</span>
                      )}
                    </div>

                    {/* Question */}
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-text-primary text-lg font-medium text-center leading-relaxed">
                        {card.question}
                      </p>
                    </div>

                    <p className="text-text-muted text-xs text-center mt-4">Click to reveal answer</p>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 rotate-y-180 bg-bg-secondary rounded-2xl border border-accent/20 p-8 flex flex-col"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent-light">Answer</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-text-primary text-base leading-relaxed">
                        {card.answer}
                      </p>
                      {card.explanation && (
                        <div className="mt-5 pt-4 border-t border-border">
                          <p className="text-text-secondary text-sm leading-relaxed">
                            <span className="text-accent-light font-medium">Explanation: </span>
                            {card.explanation}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-text-muted text-xs text-center mt-4">Click to see question</p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <span className="text-sm text-text-muted font-medium min-w-[60px] text-center">
          {index + 1} / {total}
        </span>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(1)}
          className="p-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIndex(0); setFlipped(false); }}
          className="p-2.5 rounded-xl border border-border text-text-muted hover:text-accent-light hover:border-accent/30 transition-colors ml-2"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
