"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Play, Pause, RotateCcw, ChevronRight,
  Timer, Layers, HelpCircle, FileText, X, CheckCircle2,
} from "lucide-react";

const phases = [
  { id: "notes", label: "Review Notes", icon: FileText, duration: 600, color: "text-accent-light" },
  { id: "flashcards", label: "Flashcards", icon: Layers, duration: 300, color: "text-cyan-400" },
  { id: "quiz", label: "Take Quiz", icon: HelpCircle, duration: 300, color: "text-emerald-400" },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function StudyMode({ onExit, onNavigate, hasNotes, hasFlashcards, hasQuiz }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(phases[0].duration);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft]);

  const toggleTimer = () => setRunning(!running);

  const resetTimer = () => {
    setRunning(false);
    setTimeLeft(phases[currentPhase].duration);
  };

  const nextPhase = () => {
    setCompleted(prev => [...prev, currentPhase]);
    const next = currentPhase + 1;
    if (next < phases.length) {
      setCurrentPhase(next);
      setTimeLeft(phases[next].duration);
      setRunning(false);
    }
  };

  const goToPhase = (index) => {
    setCurrentPhase(index);
    setTimeLeft(phases[index].duration);
    setRunning(false);
  };

  const phase = phases[currentPhase];
  const PhaseIcon = phase.icon;
  const progress = 1 - timeLeft / phase.duration;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bg-primary flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-accent-light" />
          <h2 className="text-sm font-semibold text-text-primary">Study Mode</h2>
        </div>
        <button
          onClick={onExit}
          className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center justify-center gap-2 py-4 px-6">
        {phases.map((p, i) => {
          const Icon = p.icon;
          const isActive = i === currentPhase;
          const isDone = completed.includes(i);

          return (
            <div key={p.id} className="flex items-center gap-2">
              <button
                onClick={() => goToPhase(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent/15 text-accent-light border border-accent/30"
                    : isDone
                      ? "bg-success/10 text-success border border-success/20"
                      : "text-text-muted border border-transparent hover:border-border"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {p.label}
              </button>
              {i < phases.length - 1 && (
                <ChevronRight className="w-4 h-4 text-text-muted/30" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Timer circle */}
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 160 160">
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke="#334155"
              strokeWidth="4"
            />
            <motion.circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke="#6366f1"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 80 80)"
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <PhaseIcon className={`w-6 h-6 ${phase.color} mb-2`} />
            <span className="text-3xl font-bold text-text-primary font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-text-muted mt-1">{phase.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="p-3 rounded-xl border border-border text-text-muted hover:text-text-secondary transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className="w-16 h-16 rounded-2xl bg-gradient-to-r from-accent to-accent-dark text-white flex items-center justify-center shadow-lg shadow-accent/25"
          >
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextPhase}
            disabled={currentPhase >= phases.length - 1}
            className="p-3 rounded-xl border border-border text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Go to view button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            onNavigate(phase.id === "notes" ? "notes" : phase.id);
            onExit();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all"
        >
          <PhaseIcon className="w-4 h-4" />
          Open {phase.label}
        </motion.button>
      </div>
    </motion.div>
  );
}
