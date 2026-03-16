import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const currentLang = normalizeLang(lang);
  const t = getMessages(currentLang);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        <div className="px-6 py-8 lg:px-16 lg:pt-4 lg:pb-16">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BrandHeader height={20} label={t.common.appName} priority />
            </div>
            <LanguageSwitch lang={currentLang} />
          </div>

          <div className="mt-14">
            <LoginForm lang={currentLang} />
          </div>

          <div className="mt-16 border-t pt-8 text-xs text-neutral-500">
            <div className="grid items-start grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-16">
              <div>
                <div className="flex items-center gap-2">
                  <BrandHeader height={43} label={t.common.appName} />
                </div>
                <p className="mt-2">{t.footer.introText}</p>
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-widest text-neutral-400">
                  {t.footer.companyTitle}
                </div>
                <ul className="mt-3 space-y-2">
                  <li>{t.footer.about}</li>
                  <li>{t.footer.features}</li>
                  <li>{t.footer.works}</li>
                  <li>{t.footer.career}</li>
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-widest text-neutral-400">
                  {t.footer.helpTitle}
                </div>
                <ul className="mt-3 space-y-2">
                  <li>{t.footer.customerSupport}</li>
                  <li className="text-[var(--gtg-orange)]">{t.footer.deliveryDetails}</li>
                  <li>{t.footer.terms}</li>
                  <li>{t.footer.privacy}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative hidden min-h-[320px] bg-[#F3F5F9] bg-[url('/assets/images/_gtg_new/Login_right2.svg')] bg-[length:85%] bg-no-repeat lg:block"
          style={{ backgroundPosition: "center 1rem" }}
        >
          <div className="absolute inset-x-0 bottom-52 flex items-center justify-center gap-8">
            <div className="inline-flex h-12 w-40 shrink-0 items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/20 bg-black/90 px-3 py-2 shadow-sm">
              <Image src="/assets/images/_gtg_new/Apple-logo.svg" alt="" aria-hidden="true" width={22} height={26} className="h-6 w-auto shrink-0" />
              <div className="flex min-w-0 flex-col gap-1">
                <Image
                  src="/assets/images/_gtg_new/Download-on-the.svg"
                  alt=""
                  aria-hidden="true"
                  width={96}
                  height={10}
                  className="h-2.5 w-auto max-w-full"
                />
                <Image src="/assets/images/_gtg_new/App-Store.svg" alt="" aria-hidden="true" width={104} height={22} className="h-4 w-auto max-w-full" />
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
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[12px] font-semibold tracking-widest text-white/80">Get it on</span>
                <Image src="/assets/images/_gtg_new/Google-Play.svg" alt="" aria-hidden="true" width={120} height={22} className="h-4 w-auto max-w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
