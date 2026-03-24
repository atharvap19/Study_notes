"use client";

const categoryColors = {
  definition: "#6c63ff",
  theorem: "#ff6b9d",
  formula: "#ffd93d",
  concept: "#4ecdc4",
  framework: "#ff8a5c",
  model: "#a78bfa",
  principle: "#34d399",
};

export default function KeyConcepts({ concepts }) {
  if (!concepts || concepts.length === 0) return null;

  return (
    <div className="key-concepts-section">
      <h2 className="section-title">Key Concepts & Definitions</h2>
      <p className="section-subtitle">
        {concepts.length} concepts extracted from your document
      </p>
      <div className="concepts-grid">
        {concepts.map((c, i) => (
          <div key={i} className="concept-card">
            <div className="concept-header">
              <span
                className="concept-category"
                style={{
                  background: `${categoryColors[c.category] || "#6c63ff"}20`,
                  color: categoryColors[c.category] || "#6c63ff",
                  borderColor: `${categoryColors[c.category] || "#6c63ff"}40`,
                }}
              >
                {c.category}
              </span>
              <span className="concept-source">{c.source}</span>
            </div>
            <h3 className="concept-term">{c.term}</h3>
            <p className="concept-definition">{c.definition}</p>
            <div className="concept-why">
              <span className="why-label">Why it matters:</span> {c.why_it_matters}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
