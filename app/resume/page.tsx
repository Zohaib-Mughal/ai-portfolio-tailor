"use client";

import { useChat } from "@ai-sdk/react";
import type { UIDataTypes, UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

type ResumeTools = {
  readMasterProfile: {
    input: Record<string, never>;
    output: {
      success?: boolean;
      fileName?: string;
    };
  };
  scoreResume: {
    input: {
      score: number;
      matchedProjects?: string[];
      missingKeywords: string[];
      actionPlan: string;
    };
    output: {
      success?: boolean;
      error?: boolean;
      message?: string;
      score?: number;
      matchedProjects?: string[];
      missingKeywords?: string[];
      actionPlan?: string;
    };
  };
  draftApplicationPackage: {
    input: {
      companyOrRole: string;
      tailoredBullets: string[];
      coverLetter: string;
    };
    output: {
      success: boolean;
      fileName: string;
      markdownContent: string;
      companyOrRole: string;
      tailoredBullets: string[];
      coverLetter: string;
    };
  };
};

type ResumeMessage = UIMessage<unknown, UIDataTypes, ResumeTools>;

export default function ResumeBuilder() {
  const { messages, sendMessage, status, stop, error, regenerate } =
    useChat<ResumeMessage>();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, error]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || isLoading) return;
    sendMessage({ text: draft.trim() });
    setDraft("");
  };

  const triggerPrompt = (promptText: string) => {
    if (isLoading) return;
    sendMessage({ text: promptText });
  };

  const downloadMarkdown = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[85dvh] border border-slate-800 bg-slate-950 rounded-lg overflow-hidden mt-6">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-100">
            Career & Resume Tailoring Agent
          </h2>
          <p className="text-xs text-slate-400">
            Grounded in local source: data/master_profile.md
          </p>
        </div>
        <span className="px-2 py-1 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
          {isLoading ? "Streaming..." : "Agent Ready"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 1. Designed Empty State (Onboarding) */}
        {messages.length === 0 && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h3 className="text-xl font-bold text-slate-200 mb-2">
              Resume Tailoring Engine
            </h3>
            <p className="text-slate-400 mb-6 max-w-md text-sm">
              Click a starter prompt or paste a job description below. The agent will read your master profile, score your fit, and ask before drafting tailored bullets.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              <button
                type="button"
                onClick={() =>
                  triggerPrompt(
                    "Evaluate my profile for a Full Stack Developer role requiring React.js, Node.js, Express, MongoDB, REST APIs, and AWS Docker.",
                  )
                }
                className="p-3 text-sm text-left bg-slate-900 border border-slate-800 rounded-md hover:border-emerald-500/50 transition-colors text-slate-300 cursor-pointer"
              >
                1. High-Fit Role: Full Stack React & Node.js Developer (with AWS Docker gap)
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerPrompt(
                    "Evaluate my profile for a Mobile App Developer role requiring React Native, Socket.io real-time messaging, and SQL Server.",
                  )
                }
                className="p-3 text-sm text-left bg-slate-900 border border-slate-800 rounded-md hover:border-emerald-500/50 transition-colors text-slate-300 cursor-pointer"
              >
                2. Mobile Role: React Native & Real-Time Socket.io Engineer
              </button>
            </div>
          </div>
        )}

        {/* 2. Messages & AI SDK v5 Parts Map */}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-3">
            {m.parts?.map((part, idx) => {
              // Render standard text parts
              if (part.type === "text" && part.text) {
                return (
                  <div
                    key={idx}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {part.text}
                    </div>
                  </div>
                );
              }

              if (
                part.type === "tool-readMasterProfile" &&
                part.state === "output-available"
              ) {
                return (
                  <div key={idx} className="flex justify-start">
                    <span className="px-2 py-1 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                      Master profile read
                    </span>
                  </div>
                );
              }

              // Render scoreResume
              if (part.type === "tool-scoreResume") {
                const isPending =
                  part.state === "input-streaming" ||
                  part.state === "input-available";
                const output = part.output;

                return (
                  <div key={idx} className="flex justify-start">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                      {isPending && (
                        <div className="p-4 flex items-center gap-3 text-slate-400 border-l-4 border-emerald-500">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-xs">
                            Executing resume evaluation model...
                          </span>
                        </div>
                      )}

                      {part.state === "output-available" &&
                        output?.score !== undefined &&
                        !output.error && (
                        <div className="border-l-4 border-emerald-500">
                          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                              Analysis Complete
                            </span>
                            <span
                              className={`font-bold text-lg ${
                                output.score >= 75
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {output.score}/100 Fit
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            {(output.matchedProjects?.length ?? 0) > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase block mb-1">
                                  Matched Profile Projects
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {output.matchedProjects?.map(
                                    (proj: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 text-xs rounded border border-emerald-800/60"
                                      >
                                        {proj}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-slate-500 uppercase block mb-1">
                                Missing Keywords
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {output.missingKeywords?.map(
                                  (kw: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-slate-950 text-slate-300 text-xs rounded border border-slate-800"
                                    >
                                      {kw}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-slate-300 bg-slate-950 p-3 rounded-md border border-slate-800">
                              <span className="text-emerald-400 font-semibold mr-2">
                                Action:
                              </span>
                              {output.actionPlan ?? "No action plan returned."}
                            </div>
                          </div>
                        </div>
                      )}

                      {(part.state === "output-error" || output?.error) && (
                        <div className="p-4 border-l-4 border-red-500 bg-red-950/20 flex flex-col gap-1">
                          <span className="text-red-400 font-bold text-sm">
                            Execution Failed
                          </span>
                          <span className="text-xs text-red-300/80">
                            {output?.message ||
                              "Could not calculate resume score. Please try again."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Render Tool 3: draftApplicationPackage
              if (part.type === "tool-draftApplicationPackage") {
                const isPending =
                  part.state === "input-streaming" ||
                  part.state === "input-available";
                const output = part.output;

                return (
                  <div key={idx} className="flex justify-start">
                    <div className="w-full max-w-lg bg-slate-900 border border-emerald-700/60 rounded-lg overflow-hidden p-4 space-y-3">
                      {isPending ? (
                        <div className="flex items-center gap-3 text-slate-300">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-xs">
                            Drafting tailored bullets & cover letter...
                          </span>
                        </div>
                      ) : (
                        output && (
                          <>
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                              <span className="text-xs font-bold text-emerald-400 uppercase">
                                Package Ready: {output.companyOrRole}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadMarkdown(
                                    output.fileName,
                                    output.markdownContent,
                                  )
                                }
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                              >
                                Download .md File
                              </button>
                            </div>
                            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                              {output.tailoredBullets?.map(
                                (b: string, i: number) => (
                                  <li key={i}>{b}</li>
                                ),
                              )}
                            </ul>
                          </>
                        )
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}

        {/* 3. Global Error State */}
        {error && (
          <div className="p-4 border-l-4 border-red-500 bg-red-950/20 flex flex-col gap-3 rounded-r-md max-w-[80%]">
            <div>
              <span className="text-red-400 font-bold block text-sm">
                Connection Interrupted
              </span>
              <span className="text-xs text-red-300/80">
                The generative model failed to complete the response. (
                {error.message})
              </span>
            </div>
            <button
              type="button"
              onClick={() => regenerate()}
              className="w-fit bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded font-medium text-xs transition-colors border border-red-500/30 cursor-pointer"
            >
              Retry Generation
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2"
      >
        <input
          className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-md p-2 text-sm focus:outline-none focus:border-emerald-500"
          value={draft}
          placeholder="Paste a job description or type 'Yes, generate the application package'..."
          onChange={(e) => setDraft(e.target.value)}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={() => stop()}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-md font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            disabled={!draft.trim()}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}