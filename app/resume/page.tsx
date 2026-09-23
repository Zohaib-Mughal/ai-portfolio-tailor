"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

export default function ResumeBuilder() {
  // @ts-ignore
  const { messages, input, handleInputChange, handleSubmit, stop, isLoading } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[85vh] border border-slate-800 bg-slate-950 rounded-lg overflow-hidden mt-8">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages?.map((m: any) => (
          <div key={m.id} className="flex flex-col gap-2">
            
            {/* Standard Text Message */}
            {m.content && (
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200"
                }`}>
                  {m.content}
                </div>
              </div>
            )}
            
            {/* Generative UI: Tool Invocations */}
            {m.toolInvocations?.map((tool: any) => {
              const { toolName, toolCallId, state, result } = tool;
              
              if (toolName === 'scoreResume') {
                return (
                  <div key={toolCallId} className="flex justify-start">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300">
                      
                      {/* State 1 & 2: Input Streaming & Executing */}
                      {(state === 'partial-call' || state === 'call') && (
                        <div className="p-4 flex items-center gap-3 text-slate-400 border-l-4 border-emerald-500">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-mono text-sm">
                            {state === 'partial-call' ? 'Streaming parameters...' : 'Executing evaluation model...'}
                          </span>
                        </div>
                      )}

                      {/* State 3: Output Available (Component Render) */}
                      {state === 'result' && !result?.error && (
                        <div className="p-0 border-l-4 border-emerald-500">
                          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Analysis Complete</span>
                            <span className={`font-bold text-lg ${result.score > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {result.score}/100 Fit
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <span className="text-xs text-slate-500 uppercase block mb-1">Missing Keywords</span>
                              <div className="flex flex-wrap gap-2">
                                {result.missingKeywords?.map((kw: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-slate-950 text-slate-300 text-xs rounded border border-slate-800">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-slate-300 bg-slate-950 p-3 rounded-md border border-slate-800">
                              <span className="text-emerald-400 font-semibold mr-2">Action:</span>
                              {result.actionPlan}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* State 4: Output Error */}
                      {state === 'result' && result?.error && (
                        <div className="p-4 border-l-4 border-red-500 bg-red-950/20 flex flex-col gap-1">
                          <span className="text-red-400 font-bold">Execution Failed</span>
                          <span className="text-sm text-red-300/80">Could not calculate resume score. Please adjust your input and try again.</span>
                        </div>
                      )}
                      
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
        
        {/* Fallback loading indicator for initial thinking time */}
        {isLoading && !messages[messages.length - 1]?.toolInvocations && (
          <div className="text-slate-500 text-sm italic flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-md p-2 focus:outline-none focus:border-emerald-500"
          value={input}
          placeholder="E.g., Compare my skills against a frontend developer role..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        {isLoading ? (
          <button type="button" onClick={stop} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-md font-medium transition-colors">
            Stop
          </button>
        ) : (
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-md font-bold transition-colors">
            Send
          </button>
        )}
      </form>
    </div>
  );
}