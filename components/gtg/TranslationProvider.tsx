"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Dictionary } from "@/lib/gtg/i18n";

const TranslationContext = createContext<Dictionary>({});

export function TranslationProvider({ dictionary, children }: { dictionary: Dictionary; children: React.ReactNode }) {
  const value = useMemo(() => dictionary, [dictionary]);
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslate() {
  const dictionary = useContext(TranslationContext);
  return (key: string) => dictionary[key] ?? key;
}


