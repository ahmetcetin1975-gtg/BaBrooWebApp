import { getDictionary } from "@/lib/gtg/i18n";
import { normalizeLang } from "@/lib/gtg/config";
import { TranslationProvider } from "@/components/gtg/TranslationProvider";
import { LangSync } from "@/components/gtg/LangSync";
import { LangLayoutShell } from "@/components/gtg/LangLayoutShell";

type LangLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;
  const normalizedLang = normalizeLang(lang);
  const dictionary = await getDictionary(normalizedLang);

  return (
    <TranslationProvider dictionary={dictionary}>
      <LangSync lang={normalizedLang} />
      <LangLayoutShell lang={normalizedLang}>{children}</LangLayoutShell>
    </TranslationProvider>
  );
}
