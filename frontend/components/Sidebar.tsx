"use client";

import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";
import HelpModal from "./HelpModal";
import ConversationItem from "./ConversationItem";
import type { Language } from "@/lib/language";
import {
  fetchConversations,
  updateConversation,
  deleteConversation,
  type ConversationSummary,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";

interface SidebarProps {
  onNewChat: () => void;
  onSelectConversation: (docId: string) => void;
  onLogout: () => void;
  refreshKey: number; // parent bumps this after upload/ask so the list refetches
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export default function Sidebar({
  onNewChat,
  onSelectConversation,
  onLogout,
  refreshKey,
  language,
  onLanguageChange,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function loadConversations() {
    setLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch {
      // if this fails (e.g. expired token) the sidebar just stays empty — not worth a hard error here
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(id: string, title: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    try {
      await updateConversation(id, { title });
    } catch {
      loadConversations();
    }
  }

  async function handleToggleStar(id: string, starred: boolean) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, starred } : c)));
    try {
      await updateConversation(id, { starred });
    } catch {
      loadConversations();
    }
  }

  async function handleDelete(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteConversation(id);
    } catch {
      loadConversations();
    }
  }

  function handleLogout() {
    clearToken();
    onLogout();
  }

  const starred = conversations.filter((c) => c.starred);
  const recent = conversations.filter((c) => !c.starred);

  return (
    <>
      <aside className="flex h-screen w-64 flex-col justify-between border-r border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-6 px-1">
            <span className="font-serif-display text-lg font-semibold tracking-tight text-[var(--text)]">
              DocuMind<span className="text-[var(--accent)]">AI</span>
            </span>
          </div>

          <button
            onClick={onNewChat}
            className="mb-6 flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <span className="text-base leading-none">+</span> New chat
          </button>

          <div className="flex-1 overflow-y-auto">
            {starred.length > 0 && (
              <div className="mb-4">
                <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Starred
                </p>
                {starred.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    onSelect={onSelectConversation}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                  />
                ))}
              </div>
            )}

            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Recents
            </p>
            {loading && <p className="px-2 py-2 text-sm text-[var(--text-muted)]">Loading…</p>}
            {!loading && recent.length === 0 && starred.length === 0 && (
              <p className="px-2 py-2 text-sm leading-relaxed text-[var(--text-muted)]">
                Your conversations will show up here once you upload a document.
              </p>
            )}
            {recent.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                onSelect={onSelectConversation}
                onRename={handleRename}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md px-2 py-2 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            Settings
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="rounded-md px-2 py-2 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            Help
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md px-2 py-2 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            Log out
          </button>
        </div>
      </aside>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          language={language}
          onLanguageChange={onLanguageChange}
        />
      )}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}