import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeLang } from "@/lib/i18n/languages";
import { LANGUAGE_COOKIE_KEY } from "@/lib/i18n/client-language";

export default async function Root() {
  const jar = await cookies();
  const savedLang = normalizeLang(jar.get(LANGUAGE_COOKIE_KEY)?.value ?? "tr");
  redirect(`/${savedLang}`);
}
