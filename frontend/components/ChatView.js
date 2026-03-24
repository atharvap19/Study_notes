"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, Bot, User, BookOpen, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatWithDocument } from "../utils/api";

const suggestions = [
  "Summarize the main points",
  "Explain the most important concept",
  "What are the key takeaways?",
  "Compare the main topics",
  "What should I focus on for an exam?",
];

export default function ChatView({ documentText }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!documentText) return null;

  async function handleSend(text) {
    const question = (text || input).trim();
    if (!question || loading) return;
    setInput("");

    const userMsg = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await chatWithDocument(question, documentText, history);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources || [] },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Sorry, I encountered an error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-accent-light" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Chat with Document</h2>
          <p className="text-xs text-text-muted">RAG-powered — retrieves relevant sections</p>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 bg-bg-secondary rounded-2xl border border-border flex flex-col overflow-hidden min-h-[500px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-accent-light" />
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-sm font-medium mb-1">Ask anything about your document</p>
                <p className="text-text-muted text-xs">Get AI-powered answers with source citations</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSend(s)}
                    className="px-3 py-2 rounded-xl border border-border text-xs text-text-muted hover:text-accent-light hover:border-accent/30 transition-all bg-bg-primary/50"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-accent-light" />
                </div>
              )}

              <div className={`max-w-[75%] ${msg.role === "user" ? "order-first" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-bg-primary border border-border rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose-notes text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {msg.sources.map((s, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent-light"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        {s.source} - {s.section} ({Math.round(s.score * 100)}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-text-secondary" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-accent-light" />
              </div>
              <div className="bg-bg-primary border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-accent/60"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-muted ml-1">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3 border-t border-border bg-bg-primary/50"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask a question about your document..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-primary text-sm placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              whileHover={input.trim() ? { scale: 1.05 } : {}}
              whileTap={input.trim() ? { scale: 0.95 } : {}}
              className="p-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-white disabled:opacity-30 transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
