import { normalizeLang, type Lang } from "@/lib/i18n/languages";

export function otherLang(lang: string): Lang {
  return normalizeLang(lang) === "tr" ? "en" : "tr";
}

export function toLangHref(pathname: string, targetLang: string): string {
  const target = normalizeLang(targetLang);
  if (/^\/(tr|en)\b/.test(pathname)) return pathname.replace(/^\/(tr|en)\b/, `/${target}`);
  return `/${target}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function switchLangHref(pathname: string, lang: string): string {
  return toLangHref(pathname, otherLang(lang));
}
