"use client";

import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Layers,
  Brain,
  HelpCircle,
  MessageSquare,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "mindmap", label: "Mind Map", icon: Brain },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "study", label: "Study Mode", icon: BookOpen },
];

export default function Sidebar({ activeView, onViewChange, collapsed, onToggle, hasDocument }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-bg-secondary border-r border-border flex flex-col overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-border min-h-[64px]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <h1 className="text-base font-bold text-text-primary whitespace-nowrap">DocNotes AI</h1>
            <p className="text-[0.65rem] text-text-muted whitespace-nowrap">AI Study Assistant</p>
          </motion.div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const isDisabled = item.id !== "upload" && item.id !== "dashboard" && !hasDocument;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => !isDisabled && onViewChange(item.id)}
              whileHover={!isDisabled ? { x: 2 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 relative
                ${collapsed ? "justify-center" : ""}
                ${isActive
                  ? "bg-accent/15 text-accent-light"
                  : isDisabled
                    ? "text-text-muted/40 cursor-not-allowed"
                    : "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary cursor-pointer"
                }
              `}
              disabled={isDisabled}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-accent-light" : ""}`} />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/50 transition-colors text-xs"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
