"use client";

import { useRef, useState } from "react";
import { uploadDocument } from "@/lib/api";

interface Props {
  onUploaded: (docId: string, filename: string) => void;
  token: string;
}

export default function UploadPanel({ onUploaded, token }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const res = await uploadDocument(file, token);
      onUploaded(res.doc_id, res.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="font-serif-display text-base font-medium text-[var(--text)]">
          {uploading ? "Reading your document…" : "Upload a PDF to get started"}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Click to choose a file — contracts, reports, notes, anything with real text
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}