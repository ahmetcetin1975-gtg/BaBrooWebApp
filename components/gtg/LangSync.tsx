"use client";

import { useEffect } from "react";
import { persistLanguagePreference } from "@/lib/i18n/client-language";

export function LangSync({ lang }: { lang: string }) {
  useEffect(() => {
    persistLanguagePreference(lang);
  }, [lang]);

  return null;
}
