import { promises as fs } from "fs";
import path from "path";
import { normalizeLang, type Lang } from "@/lib/gtg/config";

export type Dictionary = Record<string, string>;

export async function getDictionary(lang: string): Promise<Dictionary> {
  const normalized = normalizeLang(lang);
  const basePath = path.join(process.cwd(), "public", "assets", "i18n");
  const textPath = path.join(basePath, `${normalized}-text.json`);
  const staticPath = path.join(basePath, `${normalized}-static.json`);
  const [textRaw, staticRaw] = await Promise.all([
    fs.readFile(textPath, "utf-8"),
    fs.readFile(staticPath, "utf-8"),
  ]);
  const textData = JSON.parse(textRaw) as Dictionary;
  const staticData = JSON.parse(staticRaw) as Dictionary;
  return { ...textData, ...staticData };
}

export function t(dictionary: Dictionary, key: string): string {
  return dictionary[key] ?? key;
}

export function isLangSupported(lang: string): lang is Lang {
  return lang === "tr" || lang === "en";
}


