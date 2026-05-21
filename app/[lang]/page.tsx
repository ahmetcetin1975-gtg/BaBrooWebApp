import { IndexPage } from "@/components/gtg/pages/IndexPage";
import { normalizeLang } from "@/lib/gtg/config";
import { getCareCategories } from "@/lib/gtg/api";

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  const normalizedLang = normalizeLang(lang);
  const careCategories = await getCareCategories(normalizedLang);

  return <IndexPage lang={normalizedLang} careCategories={careCategories} />;
}
