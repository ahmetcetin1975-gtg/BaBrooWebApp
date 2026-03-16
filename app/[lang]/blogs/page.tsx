import { redirect } from "next/navigation";
import { normalizeLang } from "@/lib/gtg/config";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  redirect(`/${lang}/blogs/1`);
}




