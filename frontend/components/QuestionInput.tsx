"use client";

import { useState, type FormEvent } from "react";

interface Props {
  onSend: (question: string) => void;
  disabled: boolean;
}

export default function QuestionInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl gap-2 px-4 pb-6">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Ask something about this document…"
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-ink)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Ask
      </button>
    </form>
  );
}
