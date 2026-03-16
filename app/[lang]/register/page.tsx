import Register from "@/components/auth/Register";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <Register lang={lang} />;
}

