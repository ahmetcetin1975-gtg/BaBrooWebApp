"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { getMessages } from "@/lib/i18n/messages";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
import { ArrowRight, ChevronDown, Eye, EyeOff, Mail, X } from "lucide-react";
import { GoogleLoginButton } from "./GoogleLoginButton";

type CountryItem = {
  Id?: number;
  UlkeAdi?: string;
  TelKodu?: string;
  ResimUrl?: string;
};

type CountriesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CountryItem[] | null;
};

function normalizeCountries(data?: CountriesResponse): CountryItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function hasCountryId(item: CountryItem): item is CountryItem & { Id: number } {
  return typeof item.Id === "number";
}

function countryDisplay(item: CountryItem): string {
  const name = (item.UlkeAdi ?? "").trim() || "-";
  const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
  return code ? `${name} (+${code})` : name;
}

export function LoginForm({ lang }: { lang: string }) {
  const normalizedLang = normalizeLang(lang);
  const dil = langToDil(normalizedLang);
  const { refreshSession } = useAuth();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [showPw, setShowPw] = useState(false);
  const t = getMessages(normalizedLang);

  const [email, setEmail] = useState("");
  const [phoneCountryId, setPhoneCountryId] = useState<number | null>(1);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [supportModalMessage, setSupportModalMessage] = useState<string | null>(null);

  const supportMailHref = "mailto:info@babroo.com";
  const supportWhatsappHref = "https://wa.me/971544832320";
  const supportTitle = t.support.title;
  const supportSubtitle = t.support.subtitle;
  const countryPlaceholder = t.support.countryPlaceholder;
  const countryLoading = t.support.countryLoading;
  const countryErrorText = t.support.countryLoadFailed;
  const countrySearchPlaceholder = t.support.countrySearch;
  const countryNoResultsText = t.support.countryNoResults;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setCountriesLoading(true);
        setCountriesError(null);
        const data = await api.get<CountriesResponse>(`/api/countries-public?dil=${dil}`);
        if (cancelled) return;
        setCountries(normalizeCountries(data));
      } catch (err: any) {
        if (cancelled) return;
        setCountries([]);
        setCountriesError(String(err?.message ?? countryErrorText));
      } finally {
        if (!cancelled) setCountriesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [countryErrorText, dil]);

  useEffect(() => {
    setPhoneCountryId((prev) => {
      if (countries.length === 0) return 1;
      if (typeof prev === "number" && countries.some((item) => item.Id === prev)) return prev;
      const defaultCountry = countries.find((item) => item.Id === 1);
      if (defaultCountry && hasCountryId(defaultCountry)) return defaultCountry.Id;
      const first = countries.find(hasCountryId);
      return first?.Id ?? 1;
    });
  }, [countries]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!countryMenuRef.current) return;
      if (countryMenuRef.current.contains(event.target as Node)) return;
      setCountryMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (mode !== "phone") setCountryMenuOpen(false);
  }, [mode]);

  useEffect(() => {
    if (!countryMenuOpen) setCountrySearch("");
  }, [countryMenuOpen]);

  const selectedPhoneCountry = useMemo(
    () => countries.find((item) => item.Id === phoneCountryId) ?? null,
    [countries, phoneCountryId]
  );

  const filteredCountries = useMemo(() => {
    const locale = normalizedLang === "tr" ? "tr-TR" : "en-US";
    const searchValue = countrySearch.trim().toLocaleLowerCase(locale);
    const searchCode = searchValue.replace(/^\+/, "");
    const allCountries = countries.filter(hasCountryId);
    if (!searchValue) return allCountries;
    return allCountries.filter((item) => {
      const name = (item.UlkeAdi ?? "").toLocaleLowerCase(locale);
      const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
      return name.includes(searchValue) || code.includes(searchCode);
    });
  }, [countries, countrySearch, normalizedLang]);

  const phoneCountryCode = useMemo(() => {
    const code = (selectedPhoneCountry?.TelKodu ?? "").trim().replace(/^\+/, "");
    return code ? `+${code}` : "+90";
  }, [selectedPhoneCountry]);

  const canSubmit = useMemo(() => {
    if (!password.trim()) return false;
    if (mode === "email") return email.trim().length > 3;
    return phone.trim().length >= 8;
  }, [mode, email, phone, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSupportModalMessage(null);
    setBusy(true);
    try {
      const loginPayload = {
        password,
        lang: normalizedLang,
        dil,
        playerId: "string",
        platform: "web",
      };

      if (mode === "email") {
        await api.post("/api/auth/login-email", { email: email.trim(), ...loginPayload });
      } else {
        await api.post("/api/auth/login-phone", {
          countryCode: phoneCountryCode,
          phone: phone.trim(),
          ...loginPayload,
        });
      }
      await refreshSession();
      window.location.href = `/${lang}/home/products`;
    } catch (err: any) {
      const fallbackMessage = t.login.errors.loginFailed;
      const message = String(err?.message ?? err?.raw ?? fallbackMessage);
      setSupportModalMessage(message !== fallbackMessage ? message : fallbackMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-115">
        <h1 className="text-4xl font-extrabold leading-tight">
          {t.login.title} <span className="text-[var(--gtg-orange)]">{t.common.appName}!</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">{t.login.subtitle}</p>

        <div className="mt-6">
          <Tabs
            value={mode}
            onChange={(v) => setMode(v as any)}
            items={[
              { value: "email", label: t.login.tabs.email },
              { value: "phone", label: t.login.tabs.phone },
            ]}
          />
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {mode === "email" ? (
            <input
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              placeholder={t.login.placeholders.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          ) : (
            <>
              <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(0,0.95fr)] gap-2">
                <div className="relative min-w-0" ref={countryMenuRef}>
                  <button
                    type="button"
                    onClick={() => !countriesLoading && setCountryMenuOpen((prev) => !prev)}
                    disabled={countriesLoading}
                    className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-3 text-sm outline-none transition-all duration-200 hover:-translate-y-px hover:border-[#CAD3E0] hover:bg-[#FAFBFD] hover:shadow-sm focus:ring-2 focus:ring-amber-200 disabled:opacity-70"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      {selectedPhoneCountry?.ResimUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedPhoneCountry.ResimUrl}
                          alt={selectedPhoneCountry.UlkeAdi ?? "Country"}
                          className="h-4 w-6 rounded-sm border border-black/10 object-cover"
                        />
                      ) : (
                        <span className="h-4 w-6 rounded-sm border border-black/10 bg-[#e5e7eb]" />
                      )}
                      <span className="truncate">
                        {selectedPhoneCountry
                          ? countryDisplay(selectedPhoneCountry)
                          : countriesLoading
                          ? countryLoading
                          : countryPlaceholder}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[#6b7280] transition ${countryMenuOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>

                  {countryMenuOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-[#d6d9df] bg-white shadow-xl">
                      <div className="border-b border-[#eceff4] p-2">
                        <input
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder={countrySearchPlaceholder}
                          className="w-full rounded-lg border border-[#d6d9df] px-2.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-amber-200"
                          autoComplete="off"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-52 overflow-auto py-1">
                        {filteredCountries.length ? (
                          filteredCountries.map((item) => {
                            const selected = item.Id === phoneCountryId;
                            return (
                              <button
                                key={item.Id}
                                type="button"
                                onClick={() => {
                                  setPhoneCountryId(item.Id);
                                  setCountryMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] transition-colors duration-150 ${
                                  selected ? "bg-[#eef1f6] text-[#1f2937]" : "text-[#374151] hover:bg-[#f6f7f9]"
                                }`}
                              >
                                {item.ResimUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.ResimUrl}
                                    alt={item.UlkeAdi ?? "Country"}
                                    className="h-4 w-6 shrink-0 rounded-sm border border-black/10 object-cover"
                                  />
                                ) : (
                                  <span className="h-4 w-6 shrink-0 rounded-sm border border-black/10 bg-[#e5e7eb]" />
                                )}
                                <span className="truncate">{countryDisplay(item)}</span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-3 text-[13px] text-[#6b7280]">{countryNoResultsText}</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                <input
                  className="w-full min-w-0 rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder={t.login.placeholders.phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={12}
                />
              </div>
              {countriesError ? <p className="-mt-1 text-xs text-red-600">{countriesError}</p> : null}
            </>
          )}

          <div className="relative">
            <input
              className="w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              placeholder={t.login.placeholders.password}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label={t.login.togglePassword}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[13px] sm:text-[14px]">
            <Link className="font-medium text-[var(--gtg-orange)] hover:underline" href={`/${lang}/forgot-password`}>
              {t.login.forgotPassword}
            </Link>
            <button
              type="button"
              onClick={() => setSupportModalMessage("")}
              className="font-medium text-neutral-500 transition-colors duration-200 hover:text-neutral-700 hover:underline"
            >
              {t.login.help}
            </button>
          </div>

          <button
            disabled={!canSubmit || busy}
            className="w-full rounded-xl bg-[var(--gtg-orange)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(250,165,0,0.22)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:brightness-95 enabled:hover:shadow-[0_18px_38px_rgba(250,165,0,0.28)] disabled:opacity-50"
          >
            {busy ? t.login.loggingIn : t.login.login}
          </button>

          <div className="flex items-center gap-3 py-0.5">
            <div className="h-px flex-1 bg-neutral-200" />
            <div className="text-[13px] font-medium text-neutral-400 sm:text-[14px]">{t.login.or}</div>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <GoogleLoginButton lang={lang} />

          <div className="pt-3 text-center text-[15px] text-neutral-500 sm:text-[16px]">
            {t.login.noAccount}{" "}
            <Link className="font-medium text-[var(--gtg-orange)] hover:underline" href={`/${lang}/register`}>
              {t.login.register}
            </Link>
          </div>
        </form>
      </div>

      {supportModalMessage !== null ? (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
          onClick={() => setSupportModalMessage(null)}
        >
          <div
            className="relative w-full max-w-[720px] rounded-[28px] border border-[#EAE3D7] bg-white px-6 py-6 shadow-[0_30px_80px_rgba(17,24,39,0.22)] sm:px-8 sm:py-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-support-popup-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSupportModalMessage(null)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DCE3] bg-white text-[#8A8A8A] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-px hover:bg-[#F8FAFC] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
              aria-label={t.support.close}
            >
              <X className="h-6 w-6" strokeWidth={1.8} />
            </button>

            <h2 id="login-support-popup-title" className="pr-10 text-[22px] font-semibold leading-tight text-[#2A2D33] sm:text-[24px]">
              {supportTitle}
            </h2>
            <p className="mt-3 text-[16px] leading-[1.35] text-[#97A1AE] sm:text-[17px]">{supportSubtitle}</p>

            {supportModalMessage ? (
              <div className="mt-4 rounded-2xl border border-[#F5C2C7] bg-[#FFF1F2] px-4 py-3 text-[13px] font-medium leading-5 text-[#B42318]">
                {supportModalMessage}
              </div>
            ) : null}

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <a
                href={supportWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-center gap-3 rounded-2xl border border-[#FAA500] bg-[#FAA500] px-5 py-4 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(250,165,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E89A00] hover:shadow-[0_18px_36px_rgba(232,154,0,0.34)] active:translate-y-0 active:shadow-[0_10px_24px_rgba(250,165,0,0.28)] sm:text-[17px]"
              >
                <WhatsAppIcon className="h-6 w-6 shrink-0 text-white" />
                <span>{t.support.whatsapp}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>

              <a
                href={supportMailHref}
                className="group flex items-center justify-center gap-3 rounded-2xl border border-[#FAA500] bg-[#FAA500] px-5 py-4 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(250,165,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E89A00] hover:shadow-[0_18px_36px_rgba(232,154,0,0.34)] active:translate-y-0 active:shadow-[0_10px_24px_rgba(250,165,0,0.28)] sm:text-[17px]"
              >
                <Mail className="h-6 w-6" />
                <span>{t.support.mail}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
