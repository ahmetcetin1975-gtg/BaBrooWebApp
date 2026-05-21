"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import clsx from "clsx";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";

type TopBarTab = {
  label: string;
  href: string;
  active?: boolean;
};

type TopBarProps = {
  titleLeft?: React.ReactNode;
  lang: string;
  tabs?: TopBarTab[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideSearch?: boolean;
};

export function TopBar({ titleLeft, lang, tabs, searchValue, onSearchChange, hideSearch = false }: TopBarProps) {
  const t = getMessages(normalizeLang(lang));

  const left = tabs && tabs.length > 0 ? (
    <div className="ml-14 flex min-w-0 flex-wrap items-center gap-2 lg:ml-0">
      {tabs.map((tab) => (
        <Link
          key={`${tab.href}-${tab.label}`}
          href={tab.href}
          className={clsx(
            "rounded-xl border px-4 py-2 text-sm font-semibold transition",
            tab.active
              ? "border-neutral-300 bg-neutral-100 text-neutral-900 shadow-sm"
              : "border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  ) : (
    <div className="ml-14 flex items-center gap-2 lg:ml-0">{titleLeft}</div>
  );

  return (
    <div className="flex flex-col items-stretch gap-3 border-b border-gtg-border bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-7">
      {left}
      {hideSearch ? null : (
        <div className="relative w-full min-w-0 max-w-none lg:max-w-[500px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
            placeholder={t.common.search}
            {...(onSearchChange
              ? {
                  value: searchValue ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
                }
              : {})}
          />
        </div>
      )}
    </div>
  );
}
