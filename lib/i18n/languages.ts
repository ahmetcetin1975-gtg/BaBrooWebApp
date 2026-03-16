export const LANGS = ["tr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function normalizeLang(lang: string): Lang {
  return (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "tr";
}
