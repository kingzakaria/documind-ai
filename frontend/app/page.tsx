"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UploadPanel from "@/components/UploadPanel";
import ChatWindow, { type ChatMessage } from "@/components/ChatWindow";
import QuestionInput from "@/components/QuestionInput";
import AuthGate from "@/components/AuthGate";
import { uploadDocument, askQuestion, fetchDocumentMessages } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getLanguage, saveLanguage, type Language } from "@/lib/language";

export default function Home() {
  const [token, setTokenState] = useState<string | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  const [docId, setDocId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setTokenState(getToken());
    setLanguage(getLanguage());
    setCheckedAuth(true);
  }, []);

  function handleLanguageChange(newLanguage: Language) {
    setLanguage(newLanguage);
    saveLanguage(newLanguage);
  }

  if (!checkedAuth) {
    return <div className="h-screen bg-[var(--bg)]" />;
  }

  if (!token) {
    return <AuthGate onAuthenticated={() => setTokenState(getToken())} />;
  }

  function handleNewChat() {
    setDocId(null);
    setFilename(null);
    setMessages([]);
    setError(null);
  }

  function handleLogout() {
    setTokenState(null);
    handleNewChat();
  }

  function handleUploaded(newDocId: string, newFilename: string) {
    setDocId(newDocId);
    setFilename(newFilename);
    setMessages([]);
    setError(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleSelectConversation(selectedDocId: string) {
    setError(null);
    setDocId(selectedDocId);
    try {
      const data = await fetchDocumentMessages(selectedDocId);
      setFilename(data.title);
      setMessages(
        data.messages.map((m) => ({
          role: m.role,
          content: m.content,
          sourcesUsed: m.sources_used ?? undefined,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this conversation.");
    }
  }

  async function handleAsk(question: string) {
    if (!docId || !token) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsThinking(true);
    try {
      const res = await askQuestion(docId, question, token, language);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, sourcesUsed: res.sources_used },
      ]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsThinking(false);
    }
  }

  const isRtl = language === "ar";

  return (
    <div
      className={`flex h-screen bg-[var(--bg)] ${isRtl ? "flex-row-reverse" : ""}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Sidebar
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onLogout={handleLogout}
        refreshKey={refreshKey}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <p className="font-serif-display text-sm text-[var(--text)]">
            {filename ? filename : "No document uploaded yet"}
          </p>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {!docId ? (
            <div className="flex flex-1 items-center justify-center px-6">
              <UploadPanel onUploaded={handleUploaded} token={token} />
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