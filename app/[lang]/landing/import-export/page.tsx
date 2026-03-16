import { normalizeLang } from "@/lib/gtg/config";
import { ImportExportAdvertisingPage } from "@/components/gtg/pages/ImportExportAdvertisingPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <ImportExportAdvertisingPage lang={lang} />;
}




