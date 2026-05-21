import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <AuthPageShell lang={lang} marketingFooter>
      <LoginForm lang={lang} />
    </AuthPageShell>
  );
}
