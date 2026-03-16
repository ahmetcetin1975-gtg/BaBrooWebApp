import { normalizeLang, type Lang } from "@/lib/i18n/languages";

export type LocalizedString = Record<Lang, string>;

export function localize(lang: string, value: LocalizedString): string {
  return value[normalizeLang(lang)];
}
