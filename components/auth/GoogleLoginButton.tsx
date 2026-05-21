"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { langToDil } from "@/lib/i18n/languages";

declare global {
  interface Window {
    google?: any;
    __gtgGoogleIdentityScriptPromise?: Promise<void>;
    __gtgGoogleIdentityInitializedClientId?: string;
  }
}

type GoogleLoginButtonProps = {
  lang: string;
  size?: "default" | "large";
};

export function GoogleLoginButton({ lang, size = "default" }: GoogleLoginButtonProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { refreshSession } = useAuth();
  const authContextRef = useRef({ lang, refreshSession });
  const [originBlockedMessage, setOriginBlockedMessage] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const buttonLabel = lang === "tr" ? "Google ile devam et" : "Continue with Google";
  const rawIpBlockedText =
    lang === "tr"
      ? "Google girisi ham IP adreslerinde calismaz. Lutfen uygulamayi localhost veya HTTPS bir alan adi uzerinden acin ve bu origin'i Google Cloud Console'da Authorized JavaScript origins listesine ekleyin."
      : "Google sign-in does not work on raw IP addresses. Open the app on localhost or an HTTPS domain and add that origin to Authorized JavaScript origins in Google Cloud Console.";
  const isLarge = size === "large";
  const containerClass = isLarge ? "h-[56px] rounded-[10px]" : "h-12 rounded-xl";
  const iconClass = isLarge
    ? "absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-semibold leading-none sm:left-5"
    : "absolute left-7 top-1/2 -translate-y-1/2 text-[42px] font-semibold leading-none";
  const labelClass = isLarge
    ? "block w-full text-center text-[16px] font-semibold leading-[56px]"
    : "block w-full text-center text-[16px] font-semibold leading-[48px]";

  useEffect(() => {
    authContextRef.current = { lang, refreshSession };
  }, [lang, refreshSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname.trim().toLowerCase();
    const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
    const isLocalhostIp = host === "127.0.0.1";

    setOriginBlockedMessage(isIpv4 && !isLocalhostIp ? rawIpBlockedText : null);
  }, [rawIpBlockedText]);

  useEffect(() => {
    if (!clientId || originBlockedMessage) return;
    let cancelled = false;

    const loadScript = async () => {
      if (window.google?.accounts?.id) return;
      if (!window.__gtgGoogleIdentityScriptPromise) {
        window.__gtgGoogleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
          const id = "google-identity-services";
          const existing = document.getElementById(id) as HTMLScriptElement | null;

          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")), {
              once: true,
            });
            return;
          }

          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.id = id;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
          document.head.appendChild(script);
        });
      }

      await window.__gtgGoogleIdentityScriptPromise;
    };

    const mountButton = async () => {
      await loadScript();

      if (cancelled || !window.google?.accounts?.id || !ref.current) return;

      const g = window.google;
      if (window.__gtgGoogleIdentityInitializedClientId !== clientId) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: { credential: string }) => {
            const { lang: currentLang, refreshSession: currentRefreshSession } = authContextRef.current;
            await api.post("/api/auth/login-google", {
              idToken: resp.credential,
              dil: langToDil(currentLang),
              playerId: "string",
              platform: "web",
              lang: currentLang,
            });
            await currentRefreshSession();
            window.location.href = `/${currentLang}/home/products`;
          },
        });
        window.__gtgGoogleIdentityInitializedClientId = clientId;
      }

      const width = Math.max(Math.floor(ref.current.getBoundingClientRect().width), 280);
      ref.current.innerHTML = "";
      g.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    void mountButton();

    return () => {
      cancelled = true;
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [clientId, originBlockedMessage]);

  if (!clientId || originBlockedMessage) {
    return (
      <button
        type="button"
        className={`relative w-full overflow-hidden bg-[#EA4335] px-4 text-white shadow-[0_12px_28px_rgba(234,67,53,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-[0_18px_38px_rgba(234,67,53,0.28)] ${containerClass}`}
        aria-label={buttonLabel}
        onClick={() => {
          window.alert(
            originBlockedMessage ??
              "Google Client ID tanimli degil. .env.local guncelleyip dev server'i yeniden baslatin."
          );
        }}
      >
        <span className={iconClass}>G</span>
        <span className={labelClass}>{buttonLabel}</span>
      </button>
    );
  }

  return (
    <div
      className={`group relative w-full overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[#F6B14A]/45 focus-within:ring-offset-2 ${containerClass}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#EA4335] text-white shadow-[0_12px_28px_rgba(234,67,53,0.22)] transition-all duration-200 group-hover:brightness-95 group-hover:shadow-[0_18px_38px_rgba(234,67,53,0.28)]">
        <span className={iconClass}>G</span>
        <span className={labelClass}>{buttonLabel}</span>
      </div>
      <div
        ref={ref}
        className="absolute inset-0 z-10 cursor-pointer [&>div]:!h-full [&>div]:!w-full [&>div]:!opacity-[0.01] [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!opacity-[0.01]"
      />
    </div>
  );
}
