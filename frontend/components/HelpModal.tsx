"use client";

interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif-display mb-4 text-base font-semibold text-[var(--text)]">
          How DocuMind AI works
        </h2>

        <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-muted)]">
          <li>Upload a PDF using the panel in the middle of the screen.</li>
          <li>Wait for it to finish processing — this splits it into searchable pieces.</li>
          <li>
            Ask a question in plain language. Answers are grounded only in your document —
            if it&apos;s not in there, DocuMind will say so instead of guessing.
          </li>
        </ol>

        <button
          onClick={onClose}
          className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
