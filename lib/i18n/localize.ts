import { normalizeLang, type Lang } from "@/lib/i18n/languages";

export type LocalizedString = Record<Lang, string>;

export function localize(lang: string, value: LocalizedString): string {
  const localized = value[normalizeLang(lang)];
  return localized || value.en || value.tr;
}
