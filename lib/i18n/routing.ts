import { LANG_SEGMENT, LANGS, normalizeLang, type Lang } from "@/lib/i18n/languages";

const LANG_PATH_RE = new RegExp(`^/(${LANG_SEGMENT})\\b`);

export function otherLang(lang: string): Lang {
  const current = normalizeLang(lang);
  const currentIndex = LANGS.indexOf(current);
  return LANGS[(currentIndex + 1) % LANGS.length];
}

export function toLangHref(pathname: string, targetLang: string): string {
  const target = normalizeLang(targetLang);
  if (LANG_PATH_RE.test(pathname)) return pathname.replace(LANG_PATH_RE, `/${target}`);
  return `/${target}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function switchLangHref(pathname: string, lang: string): string {
  return toLangHref(pathname, otherLang(lang));
}
