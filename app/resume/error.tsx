"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center h-[85dvh] border border-red-900/50 bg-slate-950 rounded-lg p-6 mt-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400 font-bold text-xl">
        !
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong with this route</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {error.message || "An unexpected client-side rendering error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-md transition-colors text-sm"
      >
        Try Again
      </button>
    </div>
  );
}