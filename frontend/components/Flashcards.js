"use client";

import { useState } from "react";

const difficultyConfig = {
  easy: { color: "#2ed573", label: "Easy" },
  medium: { color: "#ffa502", label: "Medium" },
  hard: { color: "#ff4757", label: "Hard" },
};

export default function Flashcards({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState("all");

  if (!flashcards || flashcards.length === 0) return null;

  const filtered =
    filter === "all"
      ? flashcards
      : flashcards.filter((f) => f.difficulty === filter);

  const card = filtered[currentIndex] || filtered[0];
  const diff = difficultyConfig[card?.difficulty] || difficultyConfig.medium;

  function next() {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % filtered.length);
  }

  function prev() {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + filtered.length) % filtered.length);
  }

  function handleFilterChange(f) {
    setFilter(f);
    setCurrentIndex(0);
    setFlipped(false);
  }

  if (filtered.length === 0) {
    return (
      <div className="flashcards-section">
        <h2 className="section-title">Flashcards</h2>
        <div className="fc-filters">
          {["all", "easy", "medium", "hard"].map((f) => (
            <button
              key={f}
              className={`fc-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => handleFilterChange(f)}
            >
              {f === "all" ? "All" : difficultyConfig[f].label}
            </button>
          ))}
        </div>
        <p style={{ color: "#666", textAlign: "center", padding: 40 }}>
          No {filter} flashcards found.
        </p>
      </div>
    );
  }

  return (
    <div className="flashcards-section">
      <h2 className="section-title">Flashcards</h2>
      <p className="section-subtitle">
        {flashcards.length} flashcards generated — click to flip
      </p>

      {/* Difficulty filter */}
      <div className="fc-filters">
        {["all", "easy", "medium", "hard"].map((f) => (
          <button
            key={f}
            className={`fc-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => handleFilterChange(f)}
          >
            {f === "all" ? `All (${flashcards.length})` : `${difficultyConfig[f].label} (${flashcards.filter((c) => c.difficulty === f).length})`}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="fc-card" onClick={() => setFlipped(!flipped)}>
        <div className="fc-card-meta">
          <span
            className="fc-difficulty"
            style={{
              background: `${diff.color}18`,
              color: diff.color,
              borderColor: `${diff.color}40`,
            }}
          >
            {diff.label}
          </span>
          <span className="fc-topic">{card.topic}</span>
          <span className="fc-source">{card.source}</span>
        </div>

        {!flipped ? (
          <div className="fc-question">
            <span className="fc-label">Question</span>
            <p>{card.question}</p>
          </div>
        ) : (
          <div className="fc-answer">
            <span className="fc-label">Answer</span>
            <p>{card.answer}</p>
            {card.explanation && (
              <div className="fc-explanation">
                <span className="fc-label">Explanation</span>
                <p>{card.explanation}</p>
              </div>
            )}
          </div>
        )}

        <p className="fc-flip-hint">
          {flipped ? "Click to see question" : "Click to reveal answer"}
        </p>
      </div>

      {/* Navigation */}
      <div className="fc-nav">
        <button className="fc-nav-btn" onClick={prev}>
          Previous
        </button>
        <span className="fc-counter">
          {currentIndex + 1} / {filtered.length}
        </span>
        <button className="fc-nav-btn" onClick={next}>
          Next
        </button>
      </div>
    </div>
  );
}
