"use client";

function getScoreColor(score) {
  if (score >= 9) return "#ff4757";
  if (score >= 7) return "#ffa502";
  if (score >= 5) return "#2ed573";
  return "#70a1ff";
}

export default function Highlights({ highlights }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="highlights-section">
      <h2 className="section-title">Document Highlights</h2>
      <p className="section-subtitle">
        Top {highlights.length} most important segments ranked by importance
      </p>
      <div className="highlights-list">
        {highlights.map((h, i) => (
          <div key={i} className="highlight-card">
            <div className="highlight-score-col">
              <div
                className="highlight-score"
                style={{
                  background: `${getScoreColor(h.importance_score)}18`,
                  color: getScoreColor(h.importance_score),
                  borderColor: `${getScoreColor(h.importance_score)}40`,
                }}
              >
                {h.importance_score}
              </div>
              <span className="score-label">/ 10</span>
            </div>
            <div className="highlight-content">
              <div className="highlight-header">
                <h3 className="highlight-topic">{h.topic}</h3>
                <span className="highlight-source">{h.source}</span>
              </div>
              <p className="highlight-summary">{h.summary}</p>
              <span className="highlight-reason">{h.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
