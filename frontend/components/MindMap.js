"use client";

import { useState } from "react";

const COLORS = [
  "#6c63ff", "#ff6b9d", "#4ecdc4", "#ffd93d",
  "#ff8a5c", "#a78bfa", "#34d399", "#f472b6",
];

function MindMapNode({ node, depth = 0, colorIndex = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div className="mm-node-wrapper">
      <div
        className={`mm-node ${depth === 0 ? "mm-root" : ""}`}
        style={{
          borderLeftColor: depth > 0 ? color : "transparent",
          borderLeftWidth: depth > 0 ? 3 : 0,
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="mm-node-content">
          {hasChildren && (
            <span className={`mm-toggle ${expanded ? "expanded" : ""}`}>
              {expanded ? "-" : "+"}
            </span>
          )}
          <span
            className="mm-label"
            style={{
              color: depth === 0 ? "#fff" : depth === 1 ? color : "#bbb",
              fontWeight: depth <= 1 ? 600 : 400,
              fontSize: depth === 0 ? "1.1rem" : depth === 1 ? "0.95rem" : "0.85rem",
            }}
          >
            {node.label}
          </span>
          {hasChildren && !expanded && (
            <span className="mm-count">{node.children.length}</span>
          )}
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mm-children" style={{ marginLeft: depth === 0 ? 0 : 16 }}>
          {node.children.map((child, i) => (
            <MindMapNode
              key={i}
              node={child}
              depth={depth + 1}
              colorIndex={depth === 0 ? i : colorIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindMap({ mindmap }) {
  if (!mindmap) return null;

  return (
    <div className="mindmap-section">
      <h2 className="section-title">Mind Map</h2>
      <p className="section-subtitle">
        Interactive topic hierarchy — click to expand/collapse
      </p>
      <div className="mm-container">
        <MindMapNode node={mindmap} depth={0} />
      </div>
    </div>
  );
}
