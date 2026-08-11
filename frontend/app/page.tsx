"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import UploadPanel from "@/components/UploadPanel";
import ChatWindow, { type ChatMessage } from "@/components/ChatWindow";
import QuestionInput from "@/components/QuestionInput";
import { askQuestion } from "@/lib/api";

export default function Home() {
  const [docId, setDocId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNewChat() {
    setDocId(null);
    setFilename(null);
    setMessages([]);
    setError(null);
  }

  function handleUploaded(newDocId: string, newFilename: string) {
    setDocId(newDocId);
    setFilename(newFilename);
    setMessages([]);
    setError(null);
  }

  async function handleAsk(question: string) {
    if (!docId) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsThinking(true);
    try {
      const res = await askQuestion(docId, question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, sourcesUsed: res.sources_used },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar onNewChat={handleNewChat} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <p className="font-serif-display text-sm text-[var(--text)]">
            {filename ? filename : "No document uploaded yet"}
          </p>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {!docId ? (
            <div className="flex flex-1 items-center justify-center px-6">
              <UploadPanel onUploaded={handleUploaded} />
            </div>
          ) : (
            <ChatWindow messages={messages} isThinking={isThinking} />
          )}
        </div>

        {error && (
          <p className="mx-auto mb-2 w-full max-w-2xl px-4 text-sm text-red-400">{error}</p>
        )}

        {docId && <QuestionInput onSend={handleAsk} disabled={isThinking} />}
      </main>
    </div>
  );
}
