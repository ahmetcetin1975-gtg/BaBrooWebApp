import { CaregiverFindPage } from "@/components/gtg/pages/CaregiverFindPage";
import { getCareCategories } from "@/lib/gtg/api";
import { normalizeLang } from "@/lib/gtg/config";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ f?: string | string[] }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const lang = normalizeLang(resolvedParams.lang);
  const activeFilter = Array.isArray(resolvedSearchParams.f) ? resolvedSearchParams.f[0] : resolvedSearchParams.f;
  const careCategories = await getCareCategories(lang);

  return <CaregiverFindPage lang={lang} activeFilter={activeFilter} careCategories={careCategories} />;
}
