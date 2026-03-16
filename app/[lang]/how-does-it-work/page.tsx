import { normalizeLang } from "@/lib/gtg/config";
import { HowDoesItWorkPage } from "@/components/gtg/pages/HowDoesItWorkPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <HowDoesItWorkPage lang={lang} />;
}




