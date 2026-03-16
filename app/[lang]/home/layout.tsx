import { HomeShell } from "@/components/layout/HomeShell";

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <HomeShell lang={lang}>{children}</HomeShell>;
}
