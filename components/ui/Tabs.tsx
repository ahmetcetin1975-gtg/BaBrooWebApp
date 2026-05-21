"use client";

import React from "react";
import clsx from "clsx";

export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-xl bg-neutral-100 p-1.5">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={clsx(
            "rounded-lg px-4 py-2 text-[15px] font-semibold transition-all duration-200 sm:text-[16px]",
            value === it.value
              ? "bg-white text-neutral-900 shadow-sm hover:-translate-y-px hover:shadow-md"
              : "text-neutral-500 hover:-translate-y-px hover:bg-white/80 hover:text-neutral-800"
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
