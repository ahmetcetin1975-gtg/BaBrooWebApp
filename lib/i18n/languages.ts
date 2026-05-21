export const LANGS = ["tr", "en", "ru", "es", "fr"] as const;
export type Lang = (typeof LANGS)[number];

export function normalizeLang(lang: unknown): Lang {
  const normalized = typeof lang === "string" ? lang.trim().toLowerCase() : "";
  return (LANGS as readonly string[]).includes(normalized) ? (normalized as Lang) : "tr";
}

export type Dil = 1 | 2 | 3 | 4 | 5;

export const DIL_BY_LANG: Record<Lang, Dil> = {
  tr: 1,
  en: 2,
  ru: 3,
  es: 4,
  fr: 5,
};

export const LANG_BY_DIL: Record<Dil, Lang> = {
  1: "tr",
  2: "en",
  3: "ru",
  4: "es",
  5: "fr",
};

export const LOCALE_BY_LANG: Record<Lang, string> = {
  tr: "tr-TR",
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
  fr: "fr-FR",
};

export const LANGUAGE_LABELS: Record<Lang, string> = {
  tr: "Türkçe",
  en: "English",
  ru: "Русский",
  es: "Español",
  fr: "Français",
};

export const LANG_SEGMENT = LANGS.join("|");

export function langToDil(lang: unknown): Dil {
  return DIL_BY_LANG[normalizeLang(lang)];
}

export function normalizeDil(value: unknown): Dil {
  const parsed = typeof value === "number" ? value : Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? (parsed as Dil) : 1;
}

export function dilToLang(value: unknown): Lang {
  return LANG_BY_DIL[normalizeDil(value)];
}

export function localeForLang(lang: unknown): string {
  return LOCALE_BY_LANG[normalizeLang(lang)];
}
