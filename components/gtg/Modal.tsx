"use client";

import { useEffect } from "react";

export function Modal({ active, onClose, children }: { active: boolean; onClose?: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (active) {
      document.body.classList.add("jw-modal-open");
    } else {
      document.body.classList.remove("jw-modal-open");
    }
    return () => document.body.classList.remove("jw-modal-open");
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close modal"
        className="modal-background absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]"
        onClick={onClose}
      ></button>
      <div className="modal relative z-10 flex w-full items-center justify-center">
        <div className="modal-body gtg-modal-panel relative w-full max-w-[min(92vw,960px)] overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}


