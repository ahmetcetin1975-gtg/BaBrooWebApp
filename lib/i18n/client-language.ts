import { normalizeLang, type Lang } from "@/lib/i18n/languages";

export const LANGUAGE_STORAGE_KEY = "gtg_lang";
export const LANGUAGE_COOKIE_KEY = "gtg_lang";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

export function persistLanguagePreference(value: string): Lang {
  const lang = normalizeLang(value);

  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${lang}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  }

  return lang;
}
