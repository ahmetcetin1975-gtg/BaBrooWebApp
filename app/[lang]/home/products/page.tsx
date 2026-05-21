import { redirect } from "next/navigation";

export default async function ProductsRedirectPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/home/jobs`);
}
