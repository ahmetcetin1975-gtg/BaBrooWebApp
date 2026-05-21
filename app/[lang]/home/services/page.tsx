import { redirect } from "next/navigation";

export default async function ServicesRedirectPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/home/jobs`);
}
