"use client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sourcesUsed?: number;
}

interface Props {
  messages: ChatMessage[];
  isThinking: boolean;
}

export default function ChatWindow({ messages, isThinking }: Props) {
  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]">
        Ask a question about your document below.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 self-start rounded-lg bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            <LoadingDots />
            Reading through the document…
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--accent)] text-[var(--accent-ink)]"
            : "bg-[var(--surface)] text-[var(--text)]"
        }`}
      >
        <p>{message.content}</p>
        {!isUser && message.sourcesUsed !== undefined && (
          <p className="font-mono-ui mt-2 text-[11px] text-[var(--verified)]">
            grounded in {message.sourcesUsed} source
            {message.sourcesUsed === 1 ? "" : "s"} from your document
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)]" />
    </span>
  );
}
