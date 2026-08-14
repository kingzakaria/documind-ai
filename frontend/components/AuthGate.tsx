"use client";

import { useState, type FormEvent } from "react";
import { registerUser, loginUser, saveToken } from "@/lib/auth";

interface Props {
  onAuthenticated: () => void;
}

export default function AuthGate({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = mode === "login" ? await loginUser(email, password) : await registerUser(email, password);
      saveToken(token);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-6 text-center">
          <span className="font-serif-display text-xl font-semibold text-[var(--text)]">
            DocuMind<span className="text-[var(--accent)]">AI</span>
          </span>
        </div>

        <div className="mb-5 flex rounded-lg border border-[var(--border)] p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              mode === "login" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--text-muted)]"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              mode === "register" ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--text-muted)]"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-ink)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
