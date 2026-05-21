"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { FooterMain } from "@/components/gtg/FooterMain";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";

export function AuthPageShell({
  lang,
  children,
  showLanguageSwitch = true,
  contentClassName = "",
  marketingFooter = false,
}: {
  lang: string;
  children: ReactNode;
  showLanguageSwitch?: boolean;
  contentClassName?: string;
  marketingFooter?: boolean;
}) {
  const currentLang = normalizeLang(lang);
  const t = getMessages(currentLang);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        <div className="flex min-h-screen flex-col px-6 py-8 lg:px-16 lg:pt-4 lg:pb-16">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BrandHeader height={20} label={t.common.appName} href={`/${currentLang}`} priority />
            </div>
            {showLanguageSwitch ? <LanguageSwitch lang={currentLang} /> : <div className="h-[42px] w-[88px]" aria-hidden="true" />}
          </div>

          <div className={`flex-1 ${contentClassName || "mt-8 lg:mt-10"}`}>{children}</div>
        </div>

        <div
          className={`relative hidden min-h-[320px] overflow-hidden bg-[#F3F5F9] lg:sticky lg:top-0 lg:block lg:h-screen ${
            marketingFooter ? "" : "bg-[url('/assets/images/_gtg_new/Login_right2.svg')] bg-no-repeat"
          }`}
          style={marketingFooter ? undefined : { backgroundPosition: "center 0.75rem", backgroundSize: "92%" }}
        >
          {marketingFooter ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,199,255,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,118,1,0.22),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 pb-40 pt-16">
                <div className="relative w-full max-w-[330px] aspect-square">
                  <Image
                    src="/assets/images/babroo/logo-mark.png"
                    alt={t.common.appName}
                    fill
                    sizes="330px"
                    className="object-contain drop-shadow-[0_24px_60px_rgba(17,24,39,0.14)]"
                    priority
                  />
                </div>
                <div className="relative -mt-10 w-full max-w-[340px] aspect-[670/172]">
                  <Image
                    src="/assets/images/babroo/logo-wordmark.png"
                    alt={t.common.appName}
                    fill
                    sizes="340px"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="absolute inset-x-0 bottom-52 flex items-center justify-center gap-8">
            <div className="inline-flex h-12 w-40 shrink-0 items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/20 bg-black/90 px-3 py-2 shadow-sm">
              <Image
                src="/assets/images/_gtg_new/Apple-logo.svg"
                alt=""
                aria-hidden="true"
                width={22}
                height={26}
                className="h-6 w-auto shrink-0"
                style={{ width: "auto" }}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <Image
                  src="/assets/images/_gtg_new/Download-on-the.svg"
                  alt=""
                  aria-hidden="true"
                  width={96}
                  height={10}
                  className="h-2.5 w-auto max-w-full"
                  style={{ width: "auto" }}
                />
                <Image
                  src="/assets/images/_gtg_new/App-Store.svg"
                  alt=""
                  aria-hidden="true"
                  width={104}
                  height={22}
                  className="h-4 w-auto max-w-full"
                  style={{ width: "auto" }}
                />
              </div>
            </div>

            <div className="inline-flex h-12 w-40 shrink-0 items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/20 bg-black/90 px-3 py-2 shadow-sm">
              <Image
                src="/assets/images/_gtg_new/Google-Play-logo.svg"
                alt=""
                aria-hidden="true"
                width={28}
                height={32}
                className="h-6 w-auto shrink-0"
                style={{ width: "auto" }}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[12px] font-semibold tracking-widest text-white/80">Get it on</span>
                <Image
                  src="/assets/images/_gtg_new/Google-Play.svg"
                  alt=""
                  aria-hidden="true"
                  width={120}
                  height={22}
                  className="h-4 w-auto max-w-full"
                  style={{ width: "auto" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterMain lang={currentLang} />
    </div>
  );
}
