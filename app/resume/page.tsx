"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

export default function ResumeBuilder() {
  // @ts-ignore
  const { messages, input, handleInputChange, handleSubmit, stop, isLoading } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Simple auto-scroll implementation
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[85vh] border border-slate-800 bg-slate-950 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((m: any) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-slate-500 text-sm italic">Tailoring resume...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-md p-2 focus:outline-none focus:border-emerald-500"
          value={input}
          placeholder="Paste a job description or bullet point..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        {isLoading ? (
          <button type="button" onClick={stop} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium">
            Stop
          </button>
        ) : (
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-md font-medium">
            Send
          </button>
        )}
      </form>
    </div>
  );
}