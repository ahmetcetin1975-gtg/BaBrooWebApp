import { normalizeLang } from "@/lib/gtg/config";
import { ContactPage } from "@/components/gtg/pages/ContactPage";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  return <ContactPage lang={lang} />;
}




