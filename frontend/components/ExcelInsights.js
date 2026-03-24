"use client";

export default function ExcelInsights({ analysis }) {
  if (!analysis || Object.keys(analysis).length === 0) return null;

  return (
    <div className="excel-section">
      <h2 className="section-title">Excel Intelligence</h2>
      <p className="section-subtitle">
        Auto-detected statistics, trends, and correlations
      </p>

      {Object.entries(analysis).map(([sheetName, data]) => (
        <div key={sheetName} className="excel-sheet-card">
          <div className="excel-sheet-header">
            <h3 className="excel-sheet-name">{sheetName}</h3>
            <span className="excel-sheet-meta">
              {data.rows} rows x {data.columns} columns
            </span>
          </div>

          {/* Column names */}
          <div className="excel-columns">
            {data.column_names.map((col, i) => (
              <span key={i} className="excel-col-tag">
                {col}
              </span>
            ))}
          </div>

          {/* Numeric stats */}
          {data.numeric_columns && data.numeric_columns.length > 0 && (
            <div className="excel-stats">
              <h4 className="excel-subsection">Statistics</h4>
              <div className="excel-stats-grid">
                {data.numeric_columns.map((col, i) => (
                  <div key={i} className="excel-stat-card">
                    <div className="excel-stat-name">{col.name}</div>
                    <div className="excel-stat-row">
                      <span className="excel-stat-label">Mean</span>
                      <span className="excel-stat-value">{col.mean ?? "N/A"}</span>
                    </div>
                    <div className="excel-stat-row">
                      <span className="excel-stat-label">Min</span>
                      <span className="excel-stat-value">{col.min ?? "N/A"}</span>
                    </div>
                    <div className="excel-stat-row">
                      <span className="excel-stat-label">Max</span>
                      <span className="excel-stat-value">{col.max ?? "N/A"}</span>
                    </div>
                    <div className="excel-stat-row">
                      <span className="excel-stat-label">Median</span>
                      <span className="excel-stat-value">{col.median ?? "N/A"}</span>
                    </div>
                    <div className="excel-stat-row">
                      <span className="excel-stat-label">Std Dev</span>
                      <span className="excel-stat-value">{col.std ?? "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {data.insights && data.insights.length > 0 && (
            <div className="excel-insights">
              <h4 className="excel-subsection">Insights</h4>
              {data.insights.map((insight, i) => (
                <div key={i} className="excel-insight">
                  <span className="excel-insight-icon">*</span>
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
