"use client";

import { useState, useRef, useEffect } from "react";
import { chatWithDocument } from "../utils/api";
import ReactMarkdown from "react-markdown";

export default function Chat({ documentText }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!documentText) return null;

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");

    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await chatWithDocument(question, documentText, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources || [] },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Summarize the main points",
    "Explain the most important concept",
    "What are the key formulas?",
    "Compare the main topics",
  ];

  return (
    <div className="chat-section">
      <h2 className="section-title">Chat with Document</h2>
      <p className="section-subtitle">RAG-powered — retrieves relevant sections to answer your questions</p>

      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p className="chat-empty-title">Ask anything about your document</p>
              <div className="chat-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="chat-suggestion"
                    onClick={() => setInput(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${msg.role === "user" ? "chat-user" : "chat-assistant"}`}
            >
              <div className="chat-msg-label">
                {msg.role === "user" ? "You" : "AI"}
              </div>
              <div className="chat-msg-content">
                {msg.role === "assistant" ? (
                  <>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="chat-sources">
                        <span className="chat-sources-label">Sources:</span>
                        {msg.sources.map((s, j) => (
                          <span key={j} className="chat-source-tag">
                            {s.source} - {s.section} ({Math.round(s.score * 100)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg chat-assistant">
              <div className="chat-msg-label">AI</div>
              <div className="chat-msg-content">
                <div className="chat-typing">Thinking...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question about your document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
