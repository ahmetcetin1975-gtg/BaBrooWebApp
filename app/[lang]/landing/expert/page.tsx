import { normalizeLang } from "@/lib/gtg/config";
import { ExpertAdvertisingPage } from "@/components/gtg/pages/ExpertAdvertisingPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <ExpertAdvertisingPage lang={lang} />;
}




