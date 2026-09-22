"use client";

import { useState } from "react";

interface DisclosureProps {
  title: string;
  children: React.ReactNode;
}

export function Disclosure({ title, children }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = `disclosure-content-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="border border-slate-800 rounded-md p-4 mb-4">
      <button
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center text-left font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-sm"
      >
        {title}
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      <div
        id={contentId}
        hidden={!isOpen}
        className="mt-4 text-slate-300"
      >
        {children}
      </div>
    </div>
  );
}