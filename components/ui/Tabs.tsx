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
    <div className="inline-flex rounded-lg bg-neutral-100 p-1">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={clsx(
            "px-3 py-1.5 text-sm rounded-md transition",
            value === it.value ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
