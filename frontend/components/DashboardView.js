"use client";

import { motion } from "framer-motion";
import {
  BarChart3, FileText, Layers, HelpCircle, Brain,
  TrendingUp, CheckCircle2, Target, Clock, Sparkles,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardView({ notes, flashcards, quiz, keyConcepts, highlights, mindmap, hasDocument }) {
  const stats = [
    {
      label: "Document Loaded",
      value: hasDocument ? "Yes" : "No",
      icon: FileText,
      color: "text-accent-light",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      label: "Flashcards",
      value: flashcards?.length || 0,
      icon: Layers,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10 border-cyan-400/20",
    },
    {
      label: "Quiz Questions",
      value: quiz?.length || 0,
      icon: HelpCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
    },
    {
      label: "Key Concepts",
      value: keyConcepts?.length || 0,
      icon: Brain,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
  ];

  // Analyze quiz difficulty distribution
  const quizTypes = {};
  (quiz || []).forEach(q => {
    const t = q.type || "unknown";
    quizTypes[t] = (quizTypes[t] || 0) + 1;
  });

  // Analyze flashcard difficulty
  const fcDifficulty = { easy: 0, medium: 0, hard: 0 };
  (flashcards || []).forEach(f => {
    const d = f.difficulty?.toLowerCase() || "medium";
    if (fcDifficulty[d] !== undefined) fcDifficulty[d]++;
  });

  // Highlight score distribution
  const highScoreHighlights = (highlights || []).filter(h => (h.importance_score || 0) >= 8);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-accent-light" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Dashboard</h2>
          <p className="text-xs text-text-muted">Your study overview at a glance</p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 rounded-2xl bg-bg-secondary border border-border hover:border-border-light transition-all"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Flashcard difficulty breakdown */}
        {flashcards && flashcards.length > 0 && (
          <motion.div variants={item} className="p-5 rounded-2xl bg-bg-secondary border border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Flashcard Difficulty
            </h3>
            <div className="space-y-3">
              {Object.entries(fcDifficulty).map(([level, count]) => {
                const total = flashcards.length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                const colors = {
                  easy: "bg-emerald-400",
                  medium: "bg-amber-400",
                  hard: "bg-rose-400",
                };
                return (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary capitalize">{level}</span>
                      <span className="text-text-muted">{count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${colors[level]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quiz type breakdown */}
        {quiz && quiz.length > 0 && (
          <motion.div variants={item} className="p-5 rounded-2xl bg-bg-secondary border border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Quiz Composition
            </h3>
            <div className="space-y-3">
              {Object.entries(quizTypes).map(([type, count]) => {
                const total = quiz.length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                const labels = {
                  multiple_choice: "Multiple Choice",
                  true_false: "True / False",
                  short_answer: "Short Answer",
                };
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{labels[type] || type}</span>
                      <span className="text-text-muted">{count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Top Highlights */}
        {highScoreHighlights.length > 0 && (
          <motion.div variants={item} className="p-5 rounded-2xl bg-bg-secondary border border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Focus Areas (Score 8+)
            </h3>
            <div className="space-y-2">
              {highScoreHighlights.slice(0, 4).map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-tertiary/30 transition-colors">
                  <span className="w-6 h-6 rounded-md bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xs font-bold text-amber-400">
                    {h.importance_score}
                  </span>
                  <span className="text-xs text-text-secondary flex-1 line-clamp-1">{h.topic}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Study tips */}
        <motion.div variants={item} className="p-5 rounded-2xl bg-bg-secondary border border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-light" />
            Study Tips
          </h3>
          <div className="space-y-2.5">
            {[
              { text: "Review flashcards using spaced repetition", icon: Clock },
              { text: "Focus on high-score highlights first", icon: Target },
              { text: "Take the quiz after reviewing notes", icon: CheckCircle2 },
              { text: "Use the mind map to see connections", icon: Brain },
            ].map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div key={i} className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <TipIcon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  {tip.text}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Empty state */}
      {!hasDocument && (
        <motion.div variants={item} className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center">
            <FileText className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm font-medium">No document processed yet</p>
          <p className="text-text-muted text-xs mt-1">Upload a document to see your study dashboard</p>
        </motion.div>
      )}
    </motion.div>
  );
}
