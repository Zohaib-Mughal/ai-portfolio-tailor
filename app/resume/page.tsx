"use client";

import { useChat } from "ai/react";
import { ArrowUp, CheckCircle2, CircleAlert, Loader2, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  state: "partial-call" | "call" | "result";
  result?: {
    success?: boolean;
    score?: number;
    missingKeywords?: string[];
    actionPlan?: string;
    error?: string;
  };
};

type MessagePart = {
  type: string;
  text?: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: ToolInvocation["result"];
  errorText?: string;
};

type ChatMessage = {
  id: string;
  role: string;
  content?: string;
  toolInvocations?: ToolInvocation[];
  parts?: MessagePart[];
};

type LegacyChatHelpers = {
  messages: ChatMessage[];
  append: (message: { role: "user"; content: string }) => void;
  stop: () => void;
  isLoading: boolean;
  error?: Error;
  reload: () => void;
};

const examplePrompts = [
  "Score my resume against a Senior Full Stack React Developer role.",
  "What Next.js and Tailwind keywords am I missing for frontend roles?",
];

function ScoreResult({ result }: { result: NonNullable<ToolInvocation["result"]> }) {
  const score = Math.max(0, Math.min(100, result.score ?? 0));
  const keywords = result.missingKeywords ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-slate-900/90 shadow-2xl shadow-emerald-950/20">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Evaluation complete
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Fit analysis</span>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[132px_1fr] sm:items-center">
        <div
          className="relative mx-auto grid size-32 place-items-center rounded-full"
          style={{ background: `conic-gradient(#34d399 ${score}%, #1e293b ${score}% 100%)` }}
          aria-label={`Resume match score: ${score} out of 100`}
          role="img"
        >
          <div className="grid size-24 place-items-center rounded-full bg-slate-950">
            <div className="text-center">
              <div className="text-3xl font-semibold tracking-tight text-slate-100">{score}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">out of 100</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-100">Your strongest next move</h3>
          <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            {result.actionPlan || "Add measurable evidence that connects your experience to the target role."}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-5 py-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold text-slate-200">Missing keywords</h4>
          <span className="text-xs text-slate-500">{keywords.length} identified</span>
        </div>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No critical keyword gaps were identified.</p>
        )}
      </div>
    </div>
  );
}

function ToolResult({ invocation }: { invocation: ToolInvocation }) {
  if (invocation.state === "partial-call" || invocation.state === "call") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-slate-900/80 px-5 py-4 text-sm text-slate-300">
        <Loader2 className="size-5 animate-spin text-emerald-400" aria-hidden="true" />
        <span>Executing evaluation model...</span>
      </div>
    );
  }

  if (invocation.result?.error || invocation.result?.success === false) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-950/30 px-5 py-4">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-400" aria-hidden="true" />
        <div>
          <p className="font-semibold text-red-200">Evaluation failed</p>
          <p className="mt-1 text-sm leading-6 text-red-200/70">{invocation.result.error || "The model could not calculate a reliable score."}</p>
        </div>
      </div>
    );
  }

  return <ScoreResult result={invocation.result ?? {}} />;
}

function getToolInvocations(message: ChatMessage): ToolInvocation[] {
  if (message.toolInvocations) return message.toolInvocations;

  return (message.parts ?? []).flatMap((part) => {
    if (part.type !== "tool-scoreResume" || !part.toolCallId) return [];

    const state = part.output
      ? "result"
      : part.state === "input-streaming"
        ? "partial-call"
        : "call";

    return [{
      toolCallId: part.toolCallId,
      toolName: "scoreResume",
      state,
      result: part.output ?? (part.errorText ? { error: part.errorText } : undefined),
    } satisfies ToolInvocation];
  });
}

export default function ResumeBuilder() {
  const chat = useChat();
  const messages = chat.messages as unknown as ChatMessage[];
  const { append, stop, isLoading, error, reload } = {
    messages,
    append: (message: { role: "user"; content: string }) => {
      void chat.sendMessage({ text: message.content });
    },
    stop: chat.stop,
    isLoading: chat.status === "submitted" || chat.status === "streaming",
    error: chat.error,
    reload: () => {
      void chat.regenerate();
    },
  } satisfies LegacyChatHelpers;
  const lastMessage = messages[messages.length - 1];
  const hasPendingToolCall = lastMessage
    ? getToolInvocations(lastMessage).some(
        (invocation) => invocation.state === "partial-call" || invocation.state === "call",
      )
    : false;
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, error]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim()) return;

    append({ role: "user", content: draft });
    setDraft("");
  };

  const triggerPrompt = (promptText: string) => {
    append({ role: "user", content: promptText });
  };

  return (
    <main className="mx-auto flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/40">
      <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-4 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">AI career workspace</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-100">Resume Tailoring Engine</h1>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-7">
        {messages.length === 0 && !isLoading && !error && (
          <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-5 grid size-14 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <span className="text-2xl font-semibold">R</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Resume Tailoring Engine</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">Turn a target role into a focused match score, keyword gaps, and a practical improvement plan.</p>
            <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
              {examplePrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => triggerPrompt(prompt)} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left text-sm leading-6 text-slate-300 transition hover:border-emerald-400/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message: ChatMessage) => (
          <div key={message.id} className="space-y-3">
            {(message.content || message.parts?.filter((part) => part.type === "text").map((part) => part.text).join("")) && (
              <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-emerald-500 text-slate-950" : "border border-slate-800 bg-slate-900 text-slate-300"}`}>
                  {message.content || message.parts?.filter((part) => part.type === "text").map((part) => part.text).join("")}
                </div>
              </div>
            )}

            {getToolInvocations(message).map((invocation) => invocation.toolName === "scoreResume" ? <ToolResult key={invocation.toolCallId} invocation={invocation} /> : null)}
          </div>
        ))}

        {error && (
          <div className="flex max-w-2xl items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-950/30 p-4">
            <div>
              <span className="block font-semibold text-red-200">Connection interrupted</span>
              <span className="mt-1 block text-sm leading-6 text-red-200/70">{error.message || "The generative model failed to complete the response."}</span>
            </div>
            <button type="button" onClick={() => reload()} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/10">
              <RotateCcw className="size-4" aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {isLoading && !hasPendingToolCall && !error && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-emerald-400" aria-hidden="true" /> Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="sticky bottom-0 flex gap-2 border-t border-slate-800 bg-slate-900/95 p-4 backdrop-blur sm:p-5">
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          value={draft}
          placeholder="Paste a role or ask for a resume evaluation..."
          onChange={(e) => setDraft(e.target.value)}
          disabled={isLoading}
          aria-label="Resume evaluation prompt"
        />
        {isLoading ? (
          <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/10" aria-label="Stop generation">
            <Square className="size-4 fill-current" aria-hidden="true" /> Stop
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!draft.trim() || isLoading}
            aria-label="Send prompt"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        )}
      </form>
    </main>
  );
}