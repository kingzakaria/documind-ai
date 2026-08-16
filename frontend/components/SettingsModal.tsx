"use client";

import { LANGUAGE_LABELS, type Language } from "@/lib/language";

interface Props {
  onClose: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export default function SettingsModal({ onClose, language, onLanguageChange }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif-display mb-4 text-base font-semibold text-[var(--text)]">
          Settings
        </h2>

        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Answer language
        </label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="mb-4 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
        >
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_LABELS[code]}
            </option>
          ))}
        </select>

        <p className="mb-4 text-xs leading-relaxed text-[var(--text-muted)]">
          Answers will be generated in this language regardless of the document&apos;s
          language. Model choice and theme are on the way.
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-ink)] transition hover:opacity-90"
        >
          Done
        </button>
      </div>
    </div>
  );
}