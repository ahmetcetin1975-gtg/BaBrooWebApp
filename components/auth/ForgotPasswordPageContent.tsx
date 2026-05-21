"use client";

import { useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordMethod } from "@/components/auth/ForgotPasswordMethod";

export function ForgotPasswordPageContent({ lang }: { lang: string }) {
  const [showLanguageSwitch, setShowLanguageSwitch] = useState(true);

  return (
    <AuthPageShell lang={lang} showLanguageSwitch={showLanguageSwitch} contentClassName="mt-4 flex-1 lg:mt-5">
      <ForgotPasswordMethod lang={lang} onStepChange={(step) => setShowLanguageSwitch(step === "method")} />
    </AuthPageShell>
  );
}
