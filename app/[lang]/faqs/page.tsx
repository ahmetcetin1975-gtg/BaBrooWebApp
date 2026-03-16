import { normalizeLang } from "@/lib/gtg/config";
import { FaqPage } from "@/components/gtg/pages/FaqPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <FaqPage lang={lang} />;
}




