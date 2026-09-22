"use client";

import { useEffect, useRef, useState } from "react";

interface ModalProps {
  triggerLabel: string;
  title: string;
  children: React.ReactNode;
}

export function Modal({ triggerLabel, title, children }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      
      // Basic Focus Trap
      if (e.key === "Tab" && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus modal container on open
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 focus:ring-2 focus:ring-emerald-400"
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className="bg-slate-950 border border-slate-800 p-6 rounded-lg max-w-md w-full shadow-xl focus:outline-none"
          >
            <h2 id="modal-title" className="text-xl font-bold mb-4">
              {title}
            </h2>
            <div className="text-slate-300 mb-6">{children}</div>
            <button
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded hover:bg-emerald-400 focus:ring-2 focus:ring-white focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}