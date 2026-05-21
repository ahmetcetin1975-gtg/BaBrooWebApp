import { promises as fs } from "fs";
import path from "path";
import { LANGS, normalizeLang, type Lang } from "@/lib/gtg/config";

export type Dictionary = Record<string, string>;

async function readDictionaryFile(basePath: string, lang: Lang, suffix: "text" | "static"): Promise<string> {
  const filePath = path.join(basePath, `${lang}-${suffix}.json`);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    if (lang === "en") throw error;
    return fs.readFile(path.join(basePath, `en-${suffix}.json`), "utf-8");
  }
}

export async function getDictionary(lang: string): Promise<Dictionary> {
  const normalized = normalizeLang(lang);
  const basePath = path.join(process.cwd(), "public", "assets", "i18n");
  const [textRaw, staticRaw] = await Promise.all([
    readDictionaryFile(basePath, normalized, "text"),
    readDictionaryFile(basePath, normalized, "static"),
  ]);
  const textData = JSON.parse(textRaw) as Dictionary;
  const staticData = JSON.parse(staticRaw) as Dictionary;
  return { ...textData, ...staticData };
}

export function t(dictionary: Dictionary, key: string): string {
  return dictionary[key] ?? key;
}

export function isLangSupported(lang: string): lang is Lang {
  return (LANGS as readonly string[]).includes(lang);
}


