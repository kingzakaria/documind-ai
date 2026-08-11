"use client";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
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
        <select className="mb-4 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]">
          <option>English</option>
          <option>Français</option>
          <option>العربية</option>
        </select>

        <p className="mb-4 text-xs leading-relaxed text-[var(--text-muted)]">
          Model choice and theme are on the way once account storage is connected.
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
