"use client";

import { useState } from "react";

const diffColors = {
  easy: "#2ed573",
  medium: "#ffa502",
  hard: "#ff4757",
};

const typeLabels = {
  mcq: "Multiple Choice",
  true_false: "True / False",
  short_answer: "Short Answer",
};

export default function Quiz({ quiz }) {
  const [filter, setFilter] = useState("all");
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [showScore, setShowScore] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const filtered =
    filter === "all" ? quiz : quiz.filter((q) => q.type === filter);

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.entries(answers).filter(([idx, ans]) => {
    const q = quiz[parseInt(idx)];
    if (!q) return false;
    if (q.type === "short_answer") return null;
    return ans === q.correct_answer;
  }).length;

  function selectAnswer(globalIdx, answer) {
    if (revealed[globalIdx]) return;
    setAnswers((prev) => ({ ...prev, [globalIdx]: answer }));
  }

  function revealAnswer(globalIdx) {
    setRevealed((prev) => ({ ...prev, [globalIdx]: true }));
  }

  function resetQuiz() {
    setAnswers({});
    setRevealed({});
    setShowScore(false);
  }

  // Get the global index of a question in the original quiz array
  function getGlobalIndex(question) {
    return quiz.indexOf(question);
  }

  const mcqCount = quiz.filter((q) => q.type === "mcq").length;
  const tfCount = quiz.filter((q) => q.type === "true_false").length;
  const saCount = quiz.filter((q) => q.type === "short_answer").length;

  return (
    <div className="quiz-section">
      <h2 className="section-title">Quiz</h2>
      <p className="section-subtitle">
        {quiz.length} questions — test your understanding
      </p>

      {/* Type filter */}
      <div className="quiz-filters">
        {[
          { key: "all", label: `All (${quiz.length})` },
          { key: "mcq", label: `MCQ (${mcqCount})` },
          { key: "true_false", label: `T/F (${tfCount})` },
          { key: "short_answer", label: `Short (${saCount})` },
        ].map((f) => (
          <button
            key={f.key}
            className={`fc-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button className="quiz-reset-btn" onClick={resetQuiz}>
          Reset
        </button>
      </div>

      {/* Questions */}
      <div className="quiz-list">
        {filtered.map((q, i) => {
          const gIdx = getGlobalIndex(q);
          const userAnswer = answers[gIdx];
          const isRevealed = revealed[gIdx];
          const isCorrect = userAnswer === q.correct_answer;
          const dc = diffColors[q.difficulty] || diffColors.medium;

          return (
            <div key={gIdx} className="quiz-card">
              {/* Header */}
              <div className="quiz-card-header">
                <span className="quiz-number">Q{i + 1}</span>
                <span
                  className="quiz-type-badge"
                  style={{
                    background: "#6c63ff18",
                    color: "#a5a0ff",
                    borderColor: "#6c63ff40",
                  }}
                >
                  {typeLabels[q.type] || q.type}
                </span>
                <span
                  className="fc-difficulty"
                  style={{
                    background: `${dc}18`,
                    color: dc,
                    borderColor: `${dc}40`,
                  }}
                >
                  {q.difficulty}
                </span>
                <span className="quiz-topic">{q.topic}</span>
                <span className="quiz-source">{q.source}</span>
              </div>

              {/* Question */}
              <p className="quiz-question">{q.question}</p>

              {/* MCQ options */}
              {q.type === "mcq" && q.options && (
                <div className="quiz-options">
                  {q.options.map((opt, oi) => {
                    const selected = userAnswer === opt;
                    const correct = opt === q.correct_answer;
                    let cls = "quiz-option";
                    if (isRevealed && correct) cls += " correct";
                    else if (isRevealed && selected && !correct) cls += " wrong";
                    else if (selected) cls += " selected";

                    return (
                      <button
                        key={oi}
                        className={cls}
                        onClick={() => selectAnswer(gIdx, opt)}
                      >
                        <span className="quiz-option-letter">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False options */}
              {q.type === "true_false" && (
                <div className="quiz-options quiz-tf">
                  {["True", "False"].map((opt) => {
                    const selected = userAnswer === opt;
                    const correct = opt === q.correct_answer;
                    let cls = "quiz-option";
                    if (isRevealed && correct) cls += " correct";
                    else if (isRevealed && selected && !correct) cls += " wrong";
                    else if (selected) cls += " selected";

                    return (
                      <button
                        key={opt}
                        className={cls}
                        onClick={() => selectAnswer(gIdx, opt)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short answer - just reveal */}
              {q.type === "short_answer" && !isRevealed && (
                <button
                  className="quiz-reveal-btn"
                  onClick={() => revealAnswer(gIdx)}
                >
                  Show Model Answer
                </button>
              )}

              {/* Reveal button for MCQ/TF */}
              {(q.type === "mcq" || q.type === "true_false") &&
                userAnswer &&
                !isRevealed && (
                  <button
                    className="quiz-reveal-btn"
                    onClick={() => revealAnswer(gIdx)}
                  >
                    Check Answer
                  </button>
                )}

              {/* Explanation */}
              {isRevealed && (
                <div className="quiz-explanation">
                  {q.type === "short_answer" && (
                    <div className="quiz-model-answer">
                      <span className="quiz-exp-label">Model Answer:</span>{" "}
                      {q.correct_answer}
                    </div>
                  )}
                  {(q.type === "mcq" || q.type === "true_false") && (
                    <div
                      className="quiz-result-badge"
                      style={{ color: isCorrect ? "#2ed573" : "#ff4757" }}
                    >
                      {isCorrect ? "Correct!" : `Incorrect — Answer: ${q.correct_answer}`}
                    </div>
                  )}
                  <p className="quiz-exp-text">
                    <span className="quiz-exp-label">Explanation:</span>{" "}
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
