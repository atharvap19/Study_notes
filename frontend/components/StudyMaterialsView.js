"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Loader2, FileText, LogIn, X, ExternalLink } from "lucide-react";

import { loginUser, fetchMaterials } from "../utils/api";

// ── File icon helper ────────────────────────────────────────────────────────
function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return { pdf: "📕", pptx: "📊", docx: "📄", xlsx: "📗" }[ext] ?? "📁";
}

// ── Tiny login form ─────────────────────────────────────────────────────────
function LoginPrompt({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(email, password);
      if (data.role !== "student") {
        setError("Only student accounts can access Study Materials.");
        return;
      }
      // Store at this origin (port 3001) so the view can use it
      localStorage.setItem("token", data.token);
      localStorage.setItem("role",  data.role);
      localStorage.setItem("name",  data.name);
      onLogin(data.token, data.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto mt-16 p-8 bg-bg-secondary rounded-2xl border border-border"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <LogIn className="w-4 h-4 text-accent-light" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Student Sign In</h2>
          <p className="text-xs text-text-muted">Access your study materials</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Email</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="student@demo.com"
            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary
                       placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Password</label>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="password123"
            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary
                       placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-semibold
                     hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </motion.div>
  );
}


// ── Main component ──────────────────────────────────────────────────────────
export default function StudyMaterialsView() {
  const router = useRouter();

  const [token,     setToken]     = useState(null);
  const [userName,  setUserName]  = useState("");
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // On mount — read token from localStorage (set at this origin)
  useEffect(() => {
    const t = localStorage.getItem("token");
    const n = localStorage.getItem("name");
    const r = localStorage.getItem("role");
    if (t && r === "student") {
      setToken(t);
      setUserName(n || "Student");
      loadMaterials(t);
    }
  }, []);

  async function loadMaterials(t) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMaterials(t);
      setMaterials(data.materials || []);
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("403")) {
        handleLogout();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(t, name) {
    setToken(t);
    setUserName(name);
    loadMaterials(t);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    setToken(null);
    setMaterials([]);
  }

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!token) {
    return <LoginPrompt onLogin={handleLogin} />;
  }

  // ── Authenticated ────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent-light" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Study Materials</h2>
            <p className="text-xs text-text-muted">Welcome, {userName} · {materials.length} file{materials.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-text-muted hover:text-red-400 border border-border px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-4 text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center gap-3 text-text-muted text-sm py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading materials…
        </div>
      )}

      {/* Materials grid */}
      {!loading && materials.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No materials uploaded yet. Check back after your teacher uploads files.</p>
        </div>
      )}

      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {materials.map(m => (
            <motion.div
              key={m.id}
              whileHover={{ y: -2 }}
              className="bg-bg-secondary rounded-2xl border border-border p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg"
            >
              <div className="text-3xl">{fileIcon(m.file_name)}</div>
              <div>
                <p className="font-semibold text-text-primary text-sm leading-tight">{m.title}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {m.file_name} · Uploaded by {m.uploaded_by}
                </p>
              </div>
              <button
                onClick={() => router.push(`/document-ai/${m.id}`)}
                className="mt-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                           bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Document AI
              </button>
            </motion.div>
          ))}
        </div>
      )}

    </motion.div>
  );
}
