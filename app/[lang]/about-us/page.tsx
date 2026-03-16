import { normalizeLang } from "@/lib/gtg/config";
import { AboutPage } from "@/components/gtg/pages/AboutPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <AboutPage lang={lang} />;
}




