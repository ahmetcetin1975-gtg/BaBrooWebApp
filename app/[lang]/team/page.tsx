import { normalizeLang } from "@/lib/gtg/config";
import { TeamPage } from "@/components/gtg/pages/TeamPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <TeamPage lang={lang} />;
}




