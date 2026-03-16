import { normalizeLang } from "@/lib/gtg/config";
import { ImportExportPage } from "@/components/gtg/pages/ImportExportPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <ImportExportPage lang={lang} />;
}




