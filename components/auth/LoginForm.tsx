"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";
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
  const dil = normalizedLang === "tr" ? 1 : 2;
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
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

  const isTurkish = normalizedLang === "tr";
  const supportTitle = isTurkish ? "Yardıma mı ihtiyacınız var?" : "Need Support?";
  const supportSubtitle = isTurkish ? "Yardım için hemen bize ulaşabilirsiniz." : "We're here to help. Reach out anytime!";
  const supportMailHref = "mailto:info@gotradego.com";
  const supportWhatsappHref = "https://wa.me/971544832320";
  const countryPlaceholder = isTurkish ? "Ulke kodu secin" : "Select country code";
  const countryLoading = isTurkish ? "Ulkeler yukleniyor..." : "Loading countries...";
  const countryErrorText = isTurkish ? "Ulkeler yuklenemedi." : "Failed to load countries.";
  const countrySearchPlaceholder = isTurkish ? "Ulke ara" : "Search country";
  const countryNoResultsText = isTurkish ? "Sonuc bulunamadi." : "No results found.";

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
    const locale = isTurkish ? "tr-TR" : "en-US";
    const searchValue = countrySearch.trim().toLocaleLowerCase(locale);
    const searchCode = searchValue.replace(/^\+/, "");
    const allCountries = countries.filter(hasCountryId);
    if (!searchValue) return allCountries;
    return allCountries.filter((item) => {
      const name = (item.UlkeAdi ?? "").toLocaleLowerCase(locale);
      const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
      return name.includes(searchValue) || code.includes(searchCode);
    });
  }, [countries, countrySearch, isTurkish]);

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
    setErrorPopup(null);
    setBusy(true);
    try {
      if (mode === "email") {
        console.log("[LoginForm] submit email", { email, lang, passwordLen: password.length });
        console.trace("[LoginForm] submit email trace");
        const res = await api.post("/api/auth/login-email", { email, password, lang });
        console.log("[LoginForm] login email response", res);
      } else {
        console.log("[LoginForm] submit phone", {
          countryCode: phoneCountryCode,
          phone,
          lang,
          passwordLen: password.length,
        });
        console.trace("[LoginForm] submit phone trace");
        const res = await api.post("/api/auth/login-phone", { countryCode: phoneCountryCode, phone, password, lang });
        console.log("[LoginForm] login phone response", res);
      }
      await refreshSession();
      window.location.href = `/${lang}/home/products`;
    } catch (err: any) {
      console.error("[LoginForm] login error", err);
      const fallbackMessage = t.login.errors.loginFailed;
      const message = String(err?.message ?? err?.raw ?? fallbackMessage);
      setErrorPopup(message !== fallbackMessage ? message : fallbackMessage);
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
                    className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-70"
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
                                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] ${
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              aria-label={t.login.togglePassword}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <a className="text-[var(--gtg-orange)] hover:underline" href="#">
              {t.login.forgotPassword}
            </a>
            <a className="text-neutral-500 hover:underline" href="#">
              {t.login.help}
            </a>
          </div>

          <button
            disabled={!canSubmit || busy}
            className="w-full rounded-xl bg-[var(--gtg-orange)] px-4 py-3 text-sm font-semibold text-white shadow disabled:opacity-50"
          >
            {busy ? t.login.loggingIn : t.login.login}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-neutral-200" />
            <div className="text-xs text-neutral-400">{t.login.or}</div>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <GoogleLoginButton lang={lang} />

          <div className="pt-2 text-center text-xs text-neutral-500">
            {t.login.noAccount}{" "}
            <Link className="text-[var(--gtg-orange)] hover:underline" href={`/${lang}/register`}>
              {t.login.register}
            </Link>
          </div>
        </form>
      </div>

      {errorPopup ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/30 p-4" onClick={() => setErrorPopup(null)}>
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-[#E6E8EC] bg-[#F3F4F6] p-4 shadow-[0_24px_60px_rgba(17,24,39,0.25)] sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-error-popup-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setErrorPopup(null)}
              className="absolute right-5 top-5 rounded-full p-1 text-[#8A8A8A] transition hover:bg-black/5"
              aria-label="Close"
            >
              <X className="h-6 w-6" strokeWidth={1.8} />
            </button>

            <h2 id="login-error-popup-title" className="pr-10 text-[21px] font-semibold leading-tight text-[#26292F]">
              {supportTitle}
            </h2>
            <p className="mt-2 text-[11px] leading-tight text-[#8B959E]">{supportSubtitle}</p>

            <div className="mt-3 rounded-xl bg-white/70 px-4 py-2.5 text-[10px] leading-4 text-[#4B5563]">{errorPopup}</div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <a
                href={supportWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gtg-orange)] px-4 py-3 text-[14px] font-medium text-white transition hover:brightness-95"
              >
                <Image src="/assets/images/client/whatsapp.png" alt="WhatsApp" width={24} height={24} className="h-6 w-6 object-contain" />
                <span>WhatsApp</span>
                <ArrowRight className="h-6 w-6" />
              </a>

              <a
                href={supportMailHref}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gtg-orange)] px-4 py-3 text-[14px] font-medium text-white transition hover:brightness-95"
              >
                <Mail className="h-6 w-6" />
                <span>{isTurkish ? "E-Posta" : "Mail"}</span>
                <ArrowRight className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
