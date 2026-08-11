"use client";

import { useState } from "react";
import SettingsModal from "./SettingsModal";
import HelpModal from "./HelpModal";

interface SidebarProps {
  onNewChat: () => void;
}

export default function Sidebar({ onNewChat }: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <aside className="flex h-screen w-64 flex-col justify-between border-r border-[var(--border)] bg-[var(--surface)] p-4">
        <div>
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

          <div className="px-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Recents
            </p>
            <p className="rounded-md px-2 py-2 text-sm leading-relaxed text-[var(--text-muted)]">
              Conversation history will appear here once account storage is connected.
            </p>
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
        </div>
      </aside>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}
