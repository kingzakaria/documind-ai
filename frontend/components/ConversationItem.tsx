"use client";

import { useState } from "react";
import type { ConversationSummary } from "@/lib/api";

interface Props {
  conversation: ConversationSummary;
  onSelect: (docId: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
}

export default function ConversationItem({ conversation, onSelect, onRename, onDelete, onToggleStar }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(conversation.title);

  function submitRename() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed);
    }
    setRenaming(false);
  }

  return (
    <div className="group relative flex items-center rounded-md px-2 py-2 text-sm hover:bg-[var(--surface-2)]">
      {renaming ? (
        <input
          autoFocus
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          className="flex-1 rounded border border-[var(--accent)] bg-[var(--surface)] px-1 py-0.5 text-sm text-[var(--text)] focus:outline-none"
        />
      ) : (
        <button
          onClick={() => onSelect(conversation.doc_id)}
          className="flex-1 truncate text-left text-[var(--text)]"
          title={conversation.title}
        >
          {conversation.starred && <span className="mr-1 text-[var(--accent)]">★</span>}
          {conversation.title}
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="ml-1 rounded px-1.5 py-0.5 text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--border)] group-hover:opacity-100"
        >
          ⋯
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-6 z-20 w-36 rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
              <button
                onClick={() => {
                  onToggleStar(conversation.id, !conversation.starred);
                  setMenuOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                {conversation.starred ? "Unstar" : "Star"}
              </button>
              <button
                onClick={() => {
                  setRenaming(true);
                  setMenuOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  onDelete(conversation.id);
                  setMenuOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-[var(--surface-2)]"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
