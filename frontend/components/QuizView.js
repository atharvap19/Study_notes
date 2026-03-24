"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, ChevronRight, ChevronLeft, CheckCircle2,
  XCircle, RotateCcw, Trophy, Target,
} from "lucide-react";

const typeConfig = {
  multiple_choice: { label: "MCQ", color: "text-accent-light border-accent/30 bg-accent/10" },
  true_false: { label: "T/F", color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" },
  short_answer: { label: "Short", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
};

export default function QuizView({ quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [filter, setFilter] = useState("all");
  const [shortInputs, setShortInputs] = useState({});

  if (!quiz || quiz.length === 0) return null;

  const filtered = filter === "all" ? quiz : quiz.filter(q => q.type === filter);
  const question = filtered[currentIndex];
  const total = filtered.length;

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(a => a.correct).length;

  const handleAnswer = (qIndex, answer) => {
    if (revealed[qIndex]) return;

    const q = filtered[qIndex];
    let isCorrect = false;

    if (q.type === "multiple_choice") {
      isCorrect = answer === q.correct_answer;
    } else if (q.type === "true_false") {
      isCorrect = answer.toLowerCase() === String(q.correct_answer).toLowerCase();
    }

    setAnswers(prev => ({ ...prev, [qIndex]: { answer, correct: isCorrect } }));
    setRevealed(prev => ({ ...prev, [qIndex]: true }));
  };

  const handleShortAnswer = (qIndex) => {
    const userAnswer = shortInputs[qIndex] || "";
    setAnswers(prev => ({ ...prev, [qIndex]: { answer: userAnswer, correct: null } }));
    setRevealed(prev => ({ ...prev, [qIndex]: true }));
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setRevealed({});
    setShortInputs({});
  };

  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

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
            <HelpCircle className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Quiz</h2>
            <p className="text-xs text-text-muted">{quiz.length} questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          {["all", "multiple_choice", "true_false", "short_answer"].map(f => {
            const label = f === "all" ? "All" : typeConfig[f]?.label || f;
            return (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentIndex(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? "bg-accent/15 text-accent-light border border-accent/30"
                    : "text-text-muted hover:text-text-secondary border border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}

          <button
            onClick={resetQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/30 text-error text-xs hover:bg-error/10 transition-colors ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Score bar */}
      {answeredCount > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-bg-secondary border border-border">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-text-secondary">
              Score: <span className="text-text-primary font-semibold">{correctCount}/{answeredCount}</span>
            </span>
          </div>
          <div className="flex-1 h-1.5 bg-bg-tertiary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: answeredCount > 0 ? `${(correctCount / answeredCount) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-xs text-text-muted">
            {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="w-full h-1 bg-bg-tertiary/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question card */}
      {question && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-bg-secondary rounded-2xl border border-border p-6"
          >
            {/* Question header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-accent-light">Q{currentIndex + 1}</span>
              {question.type && typeConfig[question.type] && (
                <span className={`text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeConfig[question.type].color}`}>
                  {typeConfig[question.type].label}
                </span>
              )}
              {question.topic && (
                <span className="text-xs text-text-muted ml-auto">{question.topic}</span>
              )}
            </div>

            {/* Question text */}
            <p className="text-text-primary font-medium leading-relaxed mb-5">
              {question.question}
            </p>

            {/* MCQ Options */}
            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-2">
                {question.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = answers[currentIndex]?.answer === opt;
                  const isRevealed = revealed[currentIndex];
                  const isCorrect = opt === question.correct_answer;

                  let optionClass = "border-border hover:border-border-light hover:bg-bg-tertiary/30";
                  if (isRevealed) {
                    if (isCorrect) optionClass = "border-success/50 bg-success/10";
                    else if (isSelected && !isCorrect) optionClass = "border-error/50 bg-error/10";
                  } else if (isSelected) {
                    optionClass = "border-accent/50 bg-accent/10";
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={!isRevealed ? { scale: 1.01 } : {}}
                      whileTap={!isRevealed ? { scale: 0.99 } : {}}
                      onClick={() => handleAnswer(currentIndex, opt)}
                      disabled={isRevealed}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${optionClass}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0
                        ${isRevealed && isCorrect ? "bg-success/20 text-success" : isRevealed && isSelected ? "bg-error/20 text-error" : "bg-bg-tertiary/50 text-text-muted"}
                      `}>
                        {isRevealed ? (isCorrect ? <CheckCircle2 className="w-4 h-4" /> : isSelected ? <XCircle className="w-4 h-4" /> : letter) : letter}
                      </span>
                      <span className={`text-sm ${isRevealed && isCorrect ? "text-success font-medium" : isRevealed && isSelected ? "text-error" : "text-text-secondary"}`}>
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {question.type === "true_false" && (
              <div className="flex gap-3">
                {["True", "False"].map(opt => {
                  const isSelected = answers[currentIndex]?.answer === opt;
                  const isRevealed = revealed[currentIndex];
                  const isCorrect = opt.toLowerCase() === String(question.correct_answer).toLowerCase();

                  let optClass = "border-border hover:border-border-light";
                  if (isRevealed) {
                    if (isCorrect) optClass = "border-success/50 bg-success/10";
                    else if (isSelected) optClass = "border-error/50 bg-error/10";
                  }

                  return (
                    <motion.button
                      key={opt}
                      whileTap={!isRevealed ? { scale: 0.97 } : {}}
                      onClick={() => handleAnswer(currentIndex, opt)}
                      disabled={isRevealed}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${optClass} ${isRevealed && isCorrect ? "text-success" : isRevealed && isSelected ? "text-error" : "text-text-secondary"}`}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {question.type === "short_answer" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={shortInputs[currentIndex] || ""}
                  onChange={(e) => setShortInputs(prev => ({ ...prev, [currentIndex]: e.target.value }))}
                  disabled={revealed[currentIndex]}
                  placeholder="Type your answer..."
                  className="w-full p-3 rounded-xl bg-bg-primary border border-border text-text-primary text-sm placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                />
                {!revealed[currentIndex] && (
                  <button
                    onClick={() => handleShortAnswer(currentIndex)}
                    disabled={!shortInputs[currentIndex]?.trim()}
                    className="px-4 py-2 rounded-lg bg-accent/15 text-accent-light text-xs font-medium border border-accent/30 hover:bg-accent/25 disabled:opacity-40 transition-colors"
                  >
                    Check Answer
                  </button>
                )}
              </div>
            )}

            {/* Explanation */}
            <AnimatePresence>
              {revealed[currentIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0 }}
                  className="mt-5 pt-4 border-t border-border"
                >
                  {question.type === "short_answer" && (
                    <p className="text-sm text-text-primary mb-2">
                      <span className="text-success font-medium">Model Answer: </span>
                      {question.correct_answer}
                    </p>
                  )}
                  {question.explanation && (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      <span className="text-accent-light font-medium">Explanation: </span>
                      {question.explanation}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="p-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-border-light disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <span className="text-sm text-text-muted font-medium min-w-[60px] text-center">
          {currentIndex + 1} / {total}
        </span>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentIndex(prev => Math.min(total - 1, prev + 1))}
          disabled={currentIndex >= total - 1}
          className="p-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-border-light disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
