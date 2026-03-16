import { normalizeLang } from "@/lib/gtg/config";
import { UserRegisterSelectPage } from "@/components/gtg/pages/UserRegisterSelectPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <UserRegisterSelectPage lang={lang} />;
}




