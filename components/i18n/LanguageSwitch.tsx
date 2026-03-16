"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang, type Lang } from "@/lib/i18n/languages";
import { switchLangHref, otherLang } from "@/lib/i18n/routing";
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
  const nextLang = otherLang(currentLang);
  const href = switchLangHref(pathname, currentLang);
  const t = getMessages(currentLang);
  const nextLabel = nextLang.toUpperCase();

  return (
    <Link
      href={href}
      onClick={() => persistLanguagePreference(nextLang)}
      className={clsx("group inline-flex items-center gap-2", className)}
      aria-label={`${t.common.language}: ${currentLang.toUpperCase()} → ${nextLabel}`}
    >
      {showLabel ? <span className={labelClassName}>{t.common.language}</span> : null}
      <span
        className={clsx(
          "inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm transition-colors group-hover:border-neutral-300",
          pillClassName
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <FlagIcon lang={currentLang} />
          <span>{currentLang.toUpperCase()}</span>
        </span>
        <ChevronDownIcon className="h-3 w-3 text-neutral-500" />
      </span>
    </Link>
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
      {lang === "tr" ? <FlagTR /> : <FlagEN />}
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
    <svg viewBox="0 0 24 16" className="h-full w-full" focusable="false" aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="4" />
      <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="4" />
      <line x1="0" y1="0" x2="24" y2="16" stroke="#C8102E" strokeWidth="2" />
      <line x1="24" y1="0" x2="0" y2="16" stroke="#C8102E" strokeWidth="2" />
      <rect x="10" y="0" width="4" height="16" fill="#FFFFFF" />
      <rect x="0" y="6" width="24" height="4" fill="#FFFFFF" />
      <rect x="11" y="0" width="2" height="16" fill="#C8102E" />
      <rect x="0" y="7" width="24" height="2" fill="#C8102E" />
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
