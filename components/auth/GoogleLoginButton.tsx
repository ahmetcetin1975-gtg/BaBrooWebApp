"use client";

import React, { useEffect, useRef } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";

declare global {
  interface Window {
    google?: any;
  }
}

type GoogleLoginButtonProps = {
  lang: string;
  size?: "default" | "large";
};

export function GoogleLoginButton({ lang, size = "default" }: GoogleLoginButtonProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { refreshSession } = useAuth();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const buttonLabel = lang === "tr" ? "Google ile devam et" : "Continue with Google";
  const isLarge = size === "large";
  const containerClass = isLarge ? "h-[64px] rounded-[10px]" : "h-12 rounded-xl";
  const iconClass = isLarge
    ? "absolute left-4 top-1/2 -translate-y-1/2 text-[19px] font-semibold leading-none sm:left-5"
    : "absolute left-7 top-1/2 -translate-y-1/2 text-[42px] font-semibold leading-none";
  const labelClass = isLarge
    ? "block w-full text-center text-[18px] font-semibold leading-[64px]"
    : "block w-full text-center text-[16px] font-semibold leading-[48px]";

  useEffect(() => {
    if (!clientId) return;

    const id = "google-identity-services";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.id = id;
      document.head.appendChild(s);
    }

    const t = setInterval(() => {
      const g = window.google;
      if (!g || !ref.current) return;

      clearInterval(t);

      const width = Math.max(Math.floor(ref.current.getBoundingClientRect().width), 280);
      ref.current.innerHTML = "";

      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          await api.post("/api/auth/login-google", {
            idToken: resp.credential,
            dil: lang === "tr" ? 1 : 2,
            playerId: "string",
            platform: "web",
            lang,
          });
          await refreshSession();
          window.location.href = `/${lang}/home/products`;
        },
      });

      g.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width,
        text: "continue_with",
        shape: "rectangular",
      });
    }, 200);

    return () => clearInterval(t);
  }, [clientId, lang, refreshSession]);

  if (!clientId) {
    return (
      <button
        type="button"
        className={`relative w-full overflow-hidden bg-[#EA4335] px-4 text-white ${containerClass}`}
        aria-label={buttonLabel}
        onClick={() => {
          window.alert("Google Client ID tanimli degil. .env.local guncelleyip dev server'i yeniden baslatin.");
        }}
      >
        <span className={iconClass}>G</span>
        <span className={labelClass}>{buttonLabel}</span>
      </button>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${containerClass}`}>
      <div className="pointer-events-none absolute inset-0 bg-[#EA4335] text-white">
        <span className={iconClass}>G</span>
        <span className={labelClass}>{buttonLabel}</span>
      </div>
      <div
        ref={ref}
        className="absolute inset-0 z-10 cursor-pointer [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!opacity-[0.01]"
      />
    </div>
  );
}
