"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Layout1 } from "@/components/gtg/Layout1";
import { FooterMain } from "@/components/gtg/FooterMain";
import { Cookies } from "@/components/gtg/Cookies";
import { ClientPlugins } from "@/components/gtg/ClientPlugins";
import type { Lang } from "@/lib/gtg/config";
import { AuthProvider } from "@/lib/auth/AuthContext";

type LangLayoutShellProps = {
  children: ReactNode;
  lang: Lang;
};

export function LangLayoutShell({ children, lang }: LangLayoutShellProps) {
  const pathname = usePathname() ?? "/";
  const normalizedPath = useMemo(() => {
    const stripped = pathname.replace(/^\/(tr|en)/, "");
    return stripped === "" ? "/" : stripped;
  }, [pathname]);

  const isRegister = normalizedPath === "/register" || normalizedPath.startsWith("/register/");
  const isLogin = normalizedPath === "/login" || normalizedPath.startsWith("/login/");
  const isAuthPage = isRegister || isLogin;
  const isHome = normalizedPath === "/home" || normalizedPath.startsWith("/home/");
  const needsAuthProvider = isAuthPage || isHome;
  const isStandaloneLayout = isAuthPage || isHome;

  const content = isStandaloneLayout ? (
    <>{children}</>
  ) : (
    <>
      <Layout1 lang={lang} />
      {children}
      <Cookies />
      <FooterMain lang={lang} />
    </>
  );

  const shell = (
    <>
      <ClientPlugins />
      {content}
    </>
  );

  return needsAuthProvider ? <AuthProvider>{shell}</AuthProvider> : shell;
}
