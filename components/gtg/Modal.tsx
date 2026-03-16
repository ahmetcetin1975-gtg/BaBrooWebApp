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
    <div>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal">
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}


