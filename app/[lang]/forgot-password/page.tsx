import { ForgotPasswordPageContent } from "@/components/auth/ForgotPasswordPageContent";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return <ForgotPasswordPageContent lang={lang} />;
}
