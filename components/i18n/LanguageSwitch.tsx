"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getMessages } from "@/lib/i18n/messages";
import { LANGS, LANGUAGE_LABELS, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { toLangHref } from "@/lib/i18n/routing";
import { persistLanguagePreference } from "@/lib/i18n/client-language";

type LanguageSwitchProps = {
  lang: string;
  className?: string;
  labelClassName?: string;
  pillClassName?: string;
  showLabel?: boolean;
};

export function LanguageSwitch({
  lang,
  className,
  labelClassName,
  pillClassName,
  showLabel = true,
}: LanguageSwitchProps) {
  const pathname = usePathname() ?? "/";
  const currentLang = normalizeLang(lang);
  const t = getMessages(currentLang);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative inline-flex items-center gap-2", className)}>
      {showLabel ? <span className={labelClassName}>{t.common.language}</span> : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          "group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md",
          pillClassName
        )}
        aria-label={`${t.common.language}: ${LANGUAGE_LABELS[currentLang]}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="inline-flex items-center gap-1.5">
          <FlagIcon lang={currentLang} />
          <span>{currentLang.toUpperCase()}</span>
        </span>
        <ChevronDownIcon className="h-3 w-3 text-neutral-500" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[1000] min-w-[150px] overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
        >
          {LANGS.map((item) => {
            const isActive = item === currentLang;

            return (
              <Link
                key={item}
                href={toLangHref(pathname, item)}
                role="menuitem"
                onClick={() => {
                  persistLanguagePreference(item);
                  setOpen(false);
                }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50",
                  isActive && "bg-neutral-50 text-neutral-950"
                )}
              >
                <FlagIcon lang={item} className="h-4 w-6" />
                <span>{item.toUpperCase()}</span>
                <span className="text-xs font-medium text-neutral-400">{LANGUAGE_LABELS[item]}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type FlagIconProps = {
  lang: Lang;
  className?: string;
};

function FlagIcon({ lang, className }: FlagIconProps) {
  return (
    <span
      className={clsx("inline-flex h-4 w-6 overflow-hidden rounded-sm border border-black/10", className)}
      aria-hidden="true"
    >
      {lang === "tr" ? <FlagTR /> : null}
      {lang === "en" ? <FlagEN /> : null}
      {lang === "ru" ? <FlagRU /> : null}
      {lang === "es" ? <FlagES /> : null}
      {lang === "fr" ? <FlagFR /> : null}
    </span>
  );
}

function FlagTR() {
  return (
    <svg viewBox="0 0 24 16" className="h-full w-full" focusable="false" aria-hidden="true">
      <rect width="24" height="16" fill="#E30A17" />
      <circle cx="9" cy="8" r="4.5" fill="#FFFFFF" />
      <circle cx="10.5" cy="8" r="3.5" fill="#E30A17" />
      <polygon
        points="16.5,5.8 17.03,7.27 18.59,7.32 17.36,8.28 17.79,9.78 16.5,8.9 15.21,9.78 15.64,8.28 14.41,7.32 15.97,7.27"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function FlagEN() {
  return (
    <svg viewBox="0 0 60 30" className="h-full w-full" focusable="false" aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <polygon points="0,0 6,0 60,24 60,30 54,30 0,6" fill="#FFFFFF" />
      <polygon points="60,0 54,0 0,24 0,30 6,30 60,6" fill="#FFFFFF" />
      <polygon points="0,0 3,0 60,28.5 60,30 57,30 0,1.5" fill="#C8102E" />
      <polygon points="60,0 57,0 0,28.5 0,30 3,30 60,1.5" fill="#C8102E" />
      <rect x="24" width="12" height="30" fill="#FFFFFF" />
      <rect y="9" width="60" height="12" fill="#FFFFFF" />
      <rect x="26" width="8" height="30" fill="#C8102E" />
      <rect y="11" width="60" height="8" fill="#C8102E" />
    </svg>
  );
}

function FlagRU() {
  return (
    <svg viewBox="0 0 24 16" className="h-full w-full" focusable="false" aria-hidden="true">
      <rect width="24" height="16" fill="#FFFFFF" />
      <rect y="5.33" width="24" height="5.34" fill="#0039A6" />
      <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
    </svg>
  );
}

function FlagES() {
  return (
    <svg viewBox="0 0 24 16" className="h-full w-full" focusable="false" aria-hidden="true">
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </svg>
  );
}

function FlagFR() {
  return (
    <svg viewBox="0 0 24 16" className="h-full w-full" focusable="false" aria-hidden="true">
      <rect width="8" height="16" fill="#002395" />
      <rect x="8" width="8" height="16" fill="#FFFFFF" />
      <rect x="16" width="8" height="16" fill="#ED2939" />
    </svg>
  );
}

type ChevronDownIconProps = {
  className?: string;
};

function ChevronDownIcon({ className }: ChevronDownIconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
