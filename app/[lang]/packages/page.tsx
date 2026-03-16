import { normalizeLang } from "@/lib/gtg/config";
import { PackagesPage } from "@/components/gtg/pages/PackagesPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <PackagesPage lang={lang} />;
}




