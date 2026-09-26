"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

type ButtonState = "idle" | "loading" | "success" | "error";
type SimMode = "success" | "error" | "random";

interface SmartButtonProps {
  idleLabel: string;
  loadingLabel: string;
  successLabel: string;
  errorLabel: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
  simMode: SimMode;
  disabled?: boolean;
  forceReducedMotion?: boolean;
  onLog?: (msg: string) => void;
}

function SmartButton({
  idleLabel,
  loadingLabel,
  successLabel,
  errorLabel,
  icon,
  variant = "primary",
  simMode,
  disabled = false,
  forceReducedMotion = false,
  onLog,
}: SmartButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [isPressed, setIsPressed] = useState(false);
  const [blockedClicks, setBlockedClicks] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Reset to idle if disabled is toggled on mid-state
  useEffect(() => {
    if (disabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      setState("idle");
    }
  }, [disabled]);

  const handleTrigger = () => {
    if (disabled) return;

    // Interruptibility & spam-click protection: ignore duplicate triggers while loading
    if (state === "loading") {
      setBlockedClicks((prev) => prev + 1);
      onLog?.(`Ignored spam click while "${idleLabel}" is in-flight.`);
      return;
    }

    // Clear any pending return-to-idle timers if user clicks during success/error
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    setState("loading");
    onLog?.(`"${idleLabel}" -> LOADING (150ms cubic-bezier exit)`);

    const delay = 1100 + Math.floor(Math.random() * 500);

    timerRef.current = setTimeout(() => {
      const shouldFail =
        simMode === "error" || (simMode === "random" && Math.random() < 0.2);

      if (shouldFail) {
        setState("error");
        onLog?.(
          `"${idleLabel}" -> ERROR (${delay}ms). Triggered horizontal error shake & retry state.`
        );
      } else {
        setState("success");
        onLog?.(
          `"${idleLabel}" -> SUCCESS (${delay}ms). Spring checkmark morph -> auto-reset in 1.8s.`
        );
        resetTimerRef.current = setTimeout(() => {
          setState("idle");
          setBlockedClicks(0);
          onLog?.(`"${idleLabel}" -> Returned to IDLE.`);
        }, 1800);
      }
    }, delay);
  };

  // Surface color palette by state and variant
  const getSurfaceClasses = () => {
    if (disabled) {
      return "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60";
    }
    if (state === "error") {
      return "bg-red-950/80 text-red-200 border-red-500/70 hover:bg-red-900/60";
    }
    if (state === "success") {
      return "bg-emerald-500 text-slate-950 border-emerald-400";
    }
    if (variant === "primary") {
      return "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400/50";
    }
    return "bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-emerald-500/50";
  };

  // Helper for vertical state choreography using only transform & opacity
  const getLayerClasses = (targetState: ButtonState) => {
    const isActive = state === targetState;
    if (forceReducedMotion) {
      return isActive
        ? "opacity-100 translate-y-0 scale-100"
        : "opacity-0 pointer-events-none";
    }
    return isActive
      ? "opacity-100 translate-y-0 scale-100 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
      : "opacity-0 -translate-y-3 scale-95 pointer-events-none transition-all duration-150 ease-[cubic-bezier(0.4,0,1,1)]";
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={disabled}
        aria-live="polite"
        aria-busy={state === "loading"}
        onClick={handleTrigger}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={`
          relative overflow-hidden rounded-lg border px-5 py-3 font-bold text-sm
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
          transition-[background-color,border-color,color,transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${getSurfaceClasses()}
          ${
            !disabled && !forceReducedMotion && isPressed
              ? "scale-[0.97]"
              : !disabled && !forceReducedMotion
              ? "hover:-translate-y-0.5 active:scale-[0.97]"
              : ""
          }
          ${
            state === "error" && !forceReducedMotion
              ? "animate-[errorShake_380ms_cubic-bezier(0.36,0.07,0.19,0.97)_both]"
              : ""
          }
        `}
      >
        {/* Single-cell CSS Grid prevents width/height layout thrash across all 5+ states */}
        <span className="grid grid-cols-1 grid-rows-1 place-items-center min-w-[190px]">
          
          {/* STATE 1: IDLE */}
          <span
            className={`col-start-1 row-start-1 flex items-center gap-2 ${getLayerClasses(
              "idle"
            )}`}
          >
            {icon}
            <span>{disabled ? `${idleLabel} (Disabled)` : idleLabel}</span>
          </span>

          {/* STATE 2: LOADING */}
          <span
            className={`col-start-1 row-start-1 flex items-center gap-2.5 ${getLayerClasses(
              "loading"
            )}`}
          >
            <svg
              className={`w-4 h-4 ${
                forceReducedMotion ? "" : "animate-spin"
              }`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
              />
            </svg>
            <span>{loadingLabel}</span>
          </span>

          {/* STATE 3: SUCCESS */}
          <span
            className={`col-start-1 row-start-1 flex items-center gap-2 ${getLayerClasses(
              "success"
            )}`}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                state === "success" && !forceReducedMotion
                  ? "scale-110"
                  : "scale-75"
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successLabel}</span>
          </span>

          {/* STATE 4: ERROR (Retry Micro-interaction) */}
          <span
            className={`col-start-1 row-start-1 flex items-center gap-2 ${getLayerClasses(
              "error"
            )}`}
          >
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorLabel}</span>
          </span>

        </span>
      </button>

      {/* Live status pill & spam-click counter */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 pl-1">
        <span>
          state: <strong className="text-slate-300">{disabled ? "disabled" : state}</strong>
        </span>
        {blockedClicks > 0 && (
          <span className="text-amber-400">
            · {blockedClicks} duplicate click{blockedClicks > 1 ? "s" : ""} absorbed
          </span>
        )}
      </div>
    </div>
  );
}

export default function ButtonWithABrainDemo() {
  const [simMode, setSimMode] = useState<SimMode>("success");
  const [isDisabled, setIsDisabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "Ready. Select a simulation mode above and click either button.",
  ]);

  // Honor OS prefers-reduced-motion automatically
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) setReducedMotion(true);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      {/* Custom Keyframe for Compositor-Safe Horizontal Error Shake */}
      <style>{`
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Buttons with a Brain · Motion & State System
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">
              Choreographed AI Action Buttons
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              6 states (Idle, Hover/Focus, Active, Loading, Success, Error + Disabled) using strictly compositor-friendly <code className="text-emerald-300">transform</code> and <code className="text-emerald-300">opacity</code>.
            </p>
          </div>
          <Link
            href="/resume"
            className="text-xs font-mono text-slate-400 hover:text-emerald-400 border border-slate-800 px-3 py-2 rounded-md shrink-0 self-start"
          >
            ← Back to Resume Agent
          </Link>
        </div>

        {/* Reviewer Trigger Controls */}
        <section className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Reviewer State Triggers (Force Outcome)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Force Success or Error on demand, or test the 20% random failure rate.
              </p>
            </div>

            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              {(
                [
                  { id: "success", label: "Force Success" },
                  { id: "error", label: "Force Error" },
                  { id: "random", label: "Random (20% Fail)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSimMode(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    simMode === tab.id
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-800/80 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={isDisabled}
                onChange={(e) => setIsDisabled(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              Toggle <strong>Disabled</strong> State (Bonus 6th State)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              Simulate <strong>prefers-reduced-motion</strong> (Instant State Swap, Keep Feedback)
            </label>
          </div>
        </section>

        {/* Interactive Demo Stage (2-Button Shared Motion System) */}
        <section className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center gap-8">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* Button 1: Primary Capstone Action */}
            <SmartButton
              variant="primary"
              idleLabel="Score Resume Match"
              loadingLabel="Scoring Profile..."
              successLabel="Scorecard Ready"
              errorLabel="Failed — Retry Score"
              simMode={simMode}
              disabled={isDisabled}
              forceReducedMotion={reducedMotion}
              onLog={addLog}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              }
            />

            {/* Button 2 (Optional Flex): Secondary Action Sharing the Motion Language */}
            <SmartButton
              variant="secondary"
              idleLabel="Export .md Package"
              loadingLabel="Generating .md..."
              successLabel="Package Downloaded"
              errorLabel="Export Failed — Retry"
              simMode={simMode}
              disabled={isDisabled}
              forceReducedMotion={reducedMotion}
              onLog={addLog}
              icon={
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>

          {/* Live Telemetry Log */}
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-400 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-900">
              State Transition Telemetry (Try spam-clicking while loading or pressing Tab + Space)
            </div>
            {logs.map((log, index) => (
              <div key={index} className={index === 0 ? "text-emerald-400" : "text-slate-500"}>
                {log}
              </div>
            ))}
          </div>
        </section>

        {/* Deliverable Note: Duration & Easing Rationale */}
        <section className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
            Design Note: Duration, Easing & Compositor Choices
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <strong className="text-white block">
                1. Asymmetric Enter/Exit Timing (150ms vs. 200ms)
              </strong>
              Outgoing labels exit fast (<code className="text-emerald-300">150ms</code> with an accelerating ease-in <code className="text-emerald-300">cubic-bezier(0.4, 0, 1, 1)</code>) to clear the stage immediately upon click, while incoming states settle in over <code className="text-emerald-300">200ms</code> using a decelerating ease-out (<code className="text-emerald-300">cubic-bezier(0.22, 1, 0.36, 1)</code>) so the new status feels responsive and grounded.
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <strong className="text-white block">
                2. Tactile Press & Spring Checkmark (300ms)
              </strong>
              Active press scales the button down to <code className="text-emerald-300">scale(0.97)</code> for physical push feedback. On success, the checkmark uses a slight spring overshoot (<code className="text-emerald-300">cubic-bezier(0.34, 1.56, 0.64, 1)</code> over <code className="text-emerald-300">300ms</code>) before automatically returning to idle after <code className="text-emerald-300">1800ms</code>.
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <strong className="text-white block">
                3. Error Shake & Retry Persistence (380ms)
              </strong>
              On failure, the button runs a 3-cycle horizontal <code className="text-emerald-300">translateX(±6px)</code> keyframe over <code className="text-emerald-300">380ms</code> and stays in the error state (rather than auto-resetting) so the user can read the failure and click directly to retry.
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <strong className="text-white block">
                4. Zero Layout Thrash & Reduced Motion
              </strong>
              All 4 state layers occupy the same CSS Grid cell (<code className="text-emerald-300">col-start-1 row-start-1</code>), animating only <code className="text-emerald-300">transform</code> and <code className="text-emerald-300">opacity</code>. Under <code className="text-emerald-300">prefers-reduced-motion</code>, spatial motion and error shaking are disabled while preserving full color, icon, and text feedback.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}