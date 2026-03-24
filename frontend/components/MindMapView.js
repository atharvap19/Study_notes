"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight, ChevronDown, Maximize2, Minimize2 } from "lucide-react";

const depthColors = [
  "border-accent/50 bg-accent/10 text-accent-light",
  "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
  "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  "border-amber-400/40 bg-amber-400/10 text-amber-300",
  "border-rose-400/40 bg-rose-400/10 text-rose-300",
  "border-purple-400/40 bg-purple-400/10 text-purple-300",
];

const connectorColors = [
  "border-accent/30",
  "border-cyan-400/25",
  "border-emerald-400/25",
  "border-amber-400/25",
  "border-rose-400/25",
  "border-purple-400/25",
];

function MindMapNode({ node, depth = 0, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showDetails, setShowDetails] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const colorClass = depthColors[depth % depthColors.length];
  const connColor = connectorColors[depth % connectorColors.length];

  const sizes = {
    0: "text-base font-bold py-3 px-4",
    1: "text-sm font-semibold py-2 px-3",
    2: "text-[0.82rem] font-medium py-1.5 px-3",
  };

  const sizeClass = sizes[Math.min(depth, 2)] || sizes[2];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
      >
        <div
          className={`
            flex items-center gap-2 rounded-xl border cursor-pointer
            transition-all duration-200 hover:shadow-md
            ${colorClass} ${sizeClass}
            ${depth === 0 ? "mb-3" : "mb-1"}
          `}
          onClick={() => hasChildren ? setExpanded(!expanded) : setShowDetails(!showDetails)}
        >
          {hasChildren && (
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          )}
          <span className="flex-1">{node.label || node.name || "Untitled"}</span>
          {hasChildren && (
            <span className="text-[0.6rem] opacity-60 bg-white/5 px-1.5 py-0.5 rounded-md">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Details tooltip */}
        <AnimatePresence>
          {showDetails && node.details && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-6 mt-1 mb-2 p-3 rounded-lg bg-bg-secondary border border-border text-xs text-text-secondary leading-relaxed"
            >
              {node.details}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`ml-5 pl-4 border-l-2 ${connColor} space-y-1`}
          >
            {node.children.map((child, i) => (
              <MindMapNode
                key={i}
                node={child}
                depth={depth + 1}
                defaultExpanded={depth < 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MindMapView({ mindmap }) {
  const [expandAll, setExpandAll] = useState(false);

  if (!mindmap) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Mind Map</h2>
            <p className="text-xs text-text-muted">Interactive knowledge tree</p>
          </div>
        </div>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {expandAll ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {expandAll ? "Collapse" : "Expand All"}
        </button>
      </div>

      {/* Tree */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6 overflow-x-auto" key={expandAll ? "expanded" : "collapsed"}>
        <MindMapNode node={mindmap} depth={0} defaultExpanded={true} />
      </div>
    </motion.div>
  );
}
