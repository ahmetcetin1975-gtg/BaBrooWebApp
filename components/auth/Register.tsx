"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, Eye, EyeOff, X } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { api } from "@/lib/api/client";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";

type AccountType = "company" | "serviceProvider";

type OtpSendResponse = {
  ok?: boolean;
  otpId?: string;
  verificationId?: string;
  token?: string;
  [k: string]: any;
};

type OtpVerifyResponse = {
  ok?: boolean;
  verified?: boolean;
  registerToken?: string;
  token?: string;
  [k: string]: any;
};

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

type TermsItem = {
  Nr?: number;
  Baslik?: string;
  Detay?: string;
  Aciklama?: string;
  Aktif?: boolean;
};

type TermsResponse = {
  StatusCode?: number;
  Message?: string;
  Meta?: unknown;
  Data?: TermsItem[] | null;
};

type RegisterResponse = {
  StatusCode?: number;
  Message?: string;
  Meta?: unknown;
  Data?: unknown;
  ok?: boolean;
  message?: string;
  verified?: boolean;
  [k: string]: any;
};

const OTP_LENGTH = 6;
const OTP_INITIAL_SECONDS = 153;

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

function readErrorMessage(error: any, fallback: string): string {
  return String(error?.message ?? error?.Message ?? error?.raw ?? fallback);
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Register({ lang }: { lang: string }) {
  const currentLang = normalizeLang(lang);
  const dil = currentLang === "tr" ? 1 : 2;
  const t = getMessages(currentLang);

  const [phoneCountryId, setPhoneCountryId] = useState<number | null>(1);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryMenuRef = useRef<HTMLDivElement | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_INITIAL_SECONDS);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);

  const [busy, setBusy] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsTitle, setTermsTitle] = useState("");
  const [termsHtml, setTermsHtml] = useState("");
  const [termsDilLoaded, setTermsDilLoaded] = useState<number | null>(null);

  const pwRules = useMemo(() => {
    const min8 = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return {
      min8,
      lowerUpper: hasLower && hasUpper,
      number: hasNumber,
      symbol: hasSymbol,
      ok: min8 && hasLower && hasUpper && hasNumber && hasSymbol,
    };
  }, [password]);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const firstNamePlaceholder = currentLang === "tr" ? "İsim" : "First Name";
  const lastNamePlaceholder = currentLang === "tr" ? "Soyisim" : "Last Name";
  const showOtpScreen = step === "otp";

  const formReady =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    email.trim().length >= 5 &&
    phone.trim().length >= 8 &&
    pwRules.ok &&
    agree;
  const canSendOtp = formReady && !busy;
  const canVerifyOtp = otp.trim().length === OTP_LENGTH && !busy;
  const otpDigits = useMemo(() => Array.from({ length: OTP_LENGTH }, (_, index) => otp[index] ?? ""), [otp]);
  const overlayOpen = termsOpen || !!errorModal;

  const countryLoadingText = currentLang === "tr" ? "Ulkeler yukleniyor..." : "Loading countries...";
  const countryPlaceholderText = currentLang === "tr" ? "Ulke kodu secin" : "Select country code";
  const countrySearchPlaceholder = currentLang === "tr" ? "Ulke ara" : "Search country";
  const countryNoResultsText = currentLang === "tr" ? "Sonuc bulunamadi." : "No results found.";
  const termsLoadingText = currentLang === "tr" ? "Şartlar ve Koşullar yükleniyor..." : "Loading Terms & Conditions...";
  const termsErrorText = currentLang === "tr" ? "Şartlar ve Koşullar yüklenemedi." : "Failed to load Terms & Conditions.";
  const acceptText = currentLang === "tr" ? "Kabul Et" : "Accept";
  const declineText = currentLang === "tr" ? "Vazgeç" : "Decline";
  const closeText = currentLang === "tr" ? "Kapat" : "Close";
  const otpScreenTitle = currentLang === "tr" ? "6 haneli doğrulama kodunu gir" : "Enter 6-digit recoverycode";
  const otpScreenSubtitle =
    currentLang === "tr"
      ? "Doğrulama kodu telefonunuza SMS ile gönderildi. Lütfen aşağıdaki kodu girin."
      : "The recovery code has been sent to your phone via SMS. Please enter the code below.";
  const otpResendPrefix = currentLang === "tr" ? "Kod gelmedi mi?" : "Didn’t get a code?";
  const otpResendLink = currentLang === "tr" ? "Tekrar gönder." : "Click to resend.";
  const otpBackText = currentLang === "tr" ? "Geri" : "Back";
  const otpCancelText = currentLang === "tr" ? "Vazgeç" : "Cancel";
  const otpVerifyText = currentLang === "tr" ? "Doğrula" : "Verify";
  const otpLoginAnotherText = currentLang === "tr" ? "Başka bir hesapla giriş yap" : "Log in with another account";
  const errorModalTitle = currentLang === "tr" ? "Uyarı" : "Alert";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setCountriesLoading(true);
        setCountriesError(null);
        const data = await api.get<CountriesResponse>(`/api/countries-public?dil=${dil}`);
        if (cancelled) return;
        setCountries(normalizeCountries(data));
      } catch (e: any) {
        if (cancelled) return;
        setCountries([]);
        const fallback = currentLang === "tr" ? "Ulkeler yuklenemedi." : "Failed to load countries.";
        setCountriesError(String(e?.message ?? fallback));
      } finally {
        if (!cancelled) setCountriesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLang, dil]);

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
    if (!countryMenuOpen) setCountrySearch("");
  }, [countryMenuOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.Id === phoneCountryId) ?? null,
    [countries, phoneCountryId]
  );

  const filteredCountries = useMemo(() => {
    const locale = currentLang === "tr" ? "tr-TR" : "en-US";
    const searchValue = countrySearch.trim().toLocaleLowerCase(locale);
    const searchCode = searchValue.replace(/^\+/, "");
    const allCountries = countries.filter(hasCountryId);
    if (!searchValue) return allCountries;
    return allCountries.filter((item) => {
      const name = (item.UlkeAdi ?? "").toLocaleLowerCase(locale);
      const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
      return name.includes(searchValue) || code.includes(searchCode);
    });
  }, [countries, countrySearch, currentLang]);

  const countryCodeRaw = useMemo(() => {
    const code = (selectedCountry?.TelKodu ?? "").trim().replace(/^\+/, "");
    return code || "90";
  }, [selectedCountry]);

  const countryCode = useMemo(() => `+${countryCodeRaw}`, [countryCodeRaw]);

  function resetPhoneVerification() {
    setOtp("");
    setOtpSecondsLeft(OTP_INITIAL_SECONDS);
    setStep("form");
  }

  async function openTermsModal() {
    setTermsOpen(true);

    if (termsDilLoaded === dil && termsHtml) return;

    setTermsLoading(true);
    setTermsError(null);

    try {
      const res = await api.get<TermsResponse>(`/api/terms-public?dil=${dil}`);
      const item = Array.isArray(res?.Data) ? res.Data.find((entry) => entry?.Aktif !== false) ?? res.Data[0] : null;

      if (!item?.Detay) {
        throw new Error(termsErrorText);
      }

      setTermsTitle(item.Baslik?.trim() || t.register.agree.terms);
      setTermsHtml(item.Detay);
      setTermsDilLoaded(dil);
    } catch (e: any) {
      setTermsTitle(t.register.agree.terms);
      setTermsHtml("");
      setTermsError(String(e?.message ?? termsErrorText));
      setTermsDilLoaded(dil);
    } finally {
      setTermsLoading(false);
    }
  }

  async function sendOtp() {
    if (!canSendOtp) return;

    setBusy(true);
    try {
      const res = await api.post<RegisterResponse>("/api/auth/register-public", {
        ad: firstName.trim(),
        soyad: lastName.trim(),
        email: email.trim(),
        countryCode: countryCodeRaw,
        telefon: phone.trim(),
        sifre: password,
        ulkeNr: phoneCountryId ?? 1,
        dil,
        kaynak: 2,
      });

      const backendStatus = Number(res?.StatusCode ?? 200);
      if (backendStatus >= 400) {
        throw new Error(readErrorMessage(res, t.register.errors.registerFailed));
      }

      setOtp("");
      setOtpSecondsLeft(OTP_INITIAL_SECONDS);
      setStep("otp");
    } catch (e: any) {
      setErrorModal(readErrorMessage(e, t.register.errors.registerFailed));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!canVerifyOtp) return;

    setBusy(true);
    try {
      const res = await api.post<RegisterResponse>("/api/auth/otp-verify", {
        countryCode: countryCodeRaw,
        phone: phone.trim(),
        otp,
        purpose: "register",
        lang,
        dil,
      });

      const backendStatus = Number(res?.StatusCode ?? 200);
      const verified = res?.verified === true || res?.ok === true || backendStatus < 400;
      if (!verified) {
        throw new Error(readErrorMessage(res, t.register.errors.otpVerifyFailed));
      }

      window.location.href = `/${lang}/login`;
    } catch (e: any) {
      setErrorModal(readErrorMessage(e, t.register.errors.otpVerifyFailed));
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (busy) return;

    setBusy(true);
    try {
      await api.post<RegisterResponse>("/api/auth/otp-send", {
        countryCode: countryCodeRaw,
        phoneNumber: phone.trim(),
        phone: phone.trim(),
        dil,
        lang,
      });

      setOtp("");
      setOtpSecondsLeft(OTP_INITIAL_SECONDS);
      otpInputRefs.current[0]?.focus();
    } catch (e: any) {
      setErrorModal(readErrorMessage(e, t.register.errors.otpSendFailed));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (showOtpScreen) {
      await verifyOtp();
      return;
    }

    await sendOtp();
  }

  useEffect(() => {
    if (!showOtpScreen || otpSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showOtpScreen, otpSecondsLeft]);

  useEffect(() => {
    if (!showOtpScreen) return;

    const frame = window.requestAnimationFrame(() => {
      otpInputRefs.current[0]?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showOtpScreen]);

  function handleOtpInputChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const chars = otp.padEnd(OTP_LENGTH, " ").split("");
      chars[index] = " ";
      setOtp(chars.join("").replace(/\s+$/g, ""));
      return;
    }

    const nextChars = otp.padEnd(OTP_LENGTH, " ").split("");
    const chars = cleaned.slice(0, OTP_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });
    setOtp(nextChars.join("").replace(/\s+$/g, ""));

    const focusIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    window.requestAnimationFrame(() => {
      otpInputRefs.current[focusIndex]?.focus();
      otpInputRefs.current[focusIndex]?.select();
    });
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        const chars = otp.padEnd(OTP_LENGTH, " ").split("");
        chars[index] = " ";
        setOtp(chars.join("").replace(/\s+$/g, ""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        otpInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    setOtp(pasted);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    window.requestAnimationFrame(() => {
      otpInputRefs.current[Math.max(focusIndex, 0)]?.focus();
      otpInputRefs.current[Math.max(focusIndex, 0)]?.select();
    });
  }

  const fieldClass =
    "h-[62px] w-full rounded-[10px] border border-[#DCE2EA] bg-white px-4 text-[14px] text-[#090914] outline-none transition placeholder:text-[#99A2B3] focus:border-[#B8C4D9] sm:px-5 sm:text-[15px]";

  const Rule = ({
    ok,
    label,
    highlightInvalid = false,
  }: {
    ok: boolean;
    label: string;
    highlightInvalid?: boolean;
  }) => (
    <div className="flex items-center gap-3 text-[15px] leading-6 text-[#616A79] sm:text-[16px]">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          ok
            ? "border-[#FFB11A] bg-[#FFB11A] text-white"
            : highlightInvalid
            ? "border-[#FF4B4B]"
            : "border-[#D6DCE8]"
        }`}
      >
        {ok ? <span className="text-[12px] font-semibold leading-none">✓</span> : null}
      </span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b border-[#E7ECF4] bg-white">
        <div className="mx-auto grid h-[74px] max-w-[1600px] grid-cols-1 items-center px-6 lg:grid-cols-[minmax(540px,640px)_minmax(0,1fr)] lg:px-10">
          <div className="flex items-center justify-between lg:pr-10">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BrandHeader height={20} label={t.common.appName} priority />
            </div>
            <LanguageSwitch
              lang={currentLang}
              showLabel={false}
              className="text-xs font-semibold"
              pillClassName="rounded-[10px] border-[#E2E8F0] px-3 py-2 text-[13px] shadow-none"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:min-h-[920px] lg:grid-cols-[minmax(540px,640px)_minmax(0,1fr)]">
        <div
          className={`border-b border-[#E7ECF4] px-6 py-6 lg:border-b-0 lg:border-[#E7ECF4] lg:px-10 ${
            showOtpScreen ? "lg:col-span-2 lg:py-12" : "lg:border-r lg:py-4"
          }`}
        >
          <div className={`mx-auto flex h-full w-full flex-col ${showOtpScreen ? "max-w-[760px]" : "max-w-[520px]"}`}>
            {showOtpScreen ? (
              <div className="flex h-full w-full flex-col justify-center py-12">
                <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#090914] sm:text-[56px]">
                  {otpScreenTitle}
                </h1>
                <p className="mt-4 max-w-[650px] text-[18px] leading-[1.4] text-[#757D8A] sm:text-[20px]">
                  {otpScreenSubtitle}
                </p>

                <div className="mt-10 rounded-[18px] border border-[#E2E8F0] bg-white px-6 py-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-8">
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(node) => {
                          otpInputRefs.current[index] = node;
                        }}
                        value={digit}
                        onChange={(e) => handleOtpInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        inputMode="numeric"
                        maxLength={1}
                        className="h-[92px] w-full rounded-[12px] border border-[#D7DFEA] bg-white text-center text-[52px] font-normal leading-none text-[#FAA500] outline-none transition focus:border-[#9CA9BB] focus:ring-2 focus:ring-black/10"
                      />
                    ))}
                  </div>

                  <div className="mt-5 text-center text-[16px] text-[#7B8494]">
                    {otpResendPrefix}{" "}
                    <button type="button" onClick={() => void resendOtp()} className="underline underline-offset-2">
                      {otpResendLink}
                    </button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-[130px_1fr_220px]">
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="inline-flex h-[56px] items-center justify-center gap-2 rounded-[12px] border border-[#D8E0EA] bg-white px-4 text-[16px] font-medium text-[#333A45]"
                    >
                      <ChevronLeft className="h-5 w-5 text-[#FAA500]" />
                      <span>{otpBackText}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resetPhoneVerification()}
                      className="h-[56px] rounded-[12px] border border-[#D8E0EA] bg-white px-4 text-[16px] font-medium text-[#333A45]"
                    >
                      {otpCancelText}
                    </button>

                    <button
                      type="button"
                      onClick={() => void verifyOtp()}
                      disabled={!canVerifyOtp}
                      className="h-[56px] rounded-[12px] bg-[#FAA500] px-4 text-[16px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {`${otpVerifyText} (${formatCountdown(otpSecondsLeft)})`}
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between text-[15px]">
                  <Link href={`/${lang}/login`} className="text-[#FAA500]">
                    {otpLoginAnotherText}
                  </Link>
                  <span className="text-[#5F6572]">{t.login.help}</span>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#090914] sm:text-[58px]">
                    {t.register.titlePrefix ? `${t.register.titlePrefix} ` : ""}
                    <span className="text-[#FAA500]">{t.register.titleHighlight}</span>
                    {t.register.titleSuffix ? ` ${t.register.titleSuffix}` : ""}
                  </h1>

                  <p className="mt-5 max-w-[430px] text-[16px] leading-[1.45] text-[#A1A9B8] sm:text-[19px]">
                    {t.register.subtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-10 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={firstNamePlaceholder}
                      className={fieldClass}
                      autoComplete="given-name"
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={lastNamePlaceholder}
                      className={fieldClass}
                      autoComplete="family-name"
                    />
                  </div>

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.register.placeholders.email}
                    className={fieldClass}
                    autoComplete="email"
                  />

                  <div className="flex min-h-[62px] min-w-0 flex-col rounded-[10px] border border-[#DCE2EA] bg-white md:flex-row md:items-center">
                    <div
                      className="relative min-w-0 border-b border-[#E8EDF5] px-2 py-1 md:min-w-[220px] md:max-w-[280px] md:flex-1 md:border-b-0 md:pl-2 md:pr-1"
                      ref={countryMenuRef}
                    >
                      <button
                        type="button"
                        onClick={() => !countriesLoading && setCountryMenuOpen((prev) => !prev)}
                        disabled={countriesLoading}
                        className="flex h-[60px] w-full items-center gap-3 rounded-[10px] bg-transparent px-3 text-[14px] text-[#99A2B3] outline-none sm:text-[15px]"
                      >
                        {selectedCountry?.ResimUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedCountry.ResimUrl}
                            alt={selectedCountry.UlkeAdi ?? "Country"}
                            className="h-5 w-7 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="h-5 w-7 shrink-0 rounded-sm bg-[#EEF2F8]" />
                        )}
                        <span className="truncate">
                          {selectedCountry
                            ? `${selectedCountry.UlkeAdi ?? "TR"} ${countryCode}`
                            : countriesLoading
                            ? countryLoadingText
                            : countryPlaceholderText}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-[#99A2B3] transition ${countryMenuOpen ? "rotate-180" : "rotate-0"}`}
                        />
                      </button>

                      {countryMenuOpen ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[16px] border border-[#DCE2EA] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                          <div className="border-b border-[#E8EDF5] p-3">
                            <input
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder={countrySearchPlaceholder}
                              className="w-full rounded-[12px] border border-[#E1E7F0] bg-[#F8FAFD] px-3 py-3 text-[14px] text-[#090914] outline-none placeholder:text-[#99A2B3]"
                              autoComplete="off"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-56 overflow-auto py-2">
                            {filteredCountries.length ? (
                              filteredCountries.map((item) => {
                                const selected = item.Id === phoneCountryId;
                                return (
                                  <button
                                    key={item.Id}
                                    type="button"
                                    onClick={() => {
                                      if (item.Id !== phoneCountryId) resetPhoneVerification();
                                      setPhoneCountryId(item.Id);
                                      setCountryMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] ${
                                      selected ? "bg-[#F5F7FB] text-[#090914]" : "text-[#4B5565] hover:bg-[#F8FAFD]"
                                    }`}
                                  >
                                    {item.ResimUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.ResimUrl}
                                        alt={item.UlkeAdi ?? "Country"}
                                        className="h-5 w-7 shrink-0 rounded-sm object-cover"
                                      />
                                    ) : (
                                      <span className="h-5 w-7 shrink-0 rounded-sm bg-[#EEF2F8]" />
                                    )}
                                    <span className="truncate">{countryDisplay(item)}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <p className="px-4 py-4 text-[14px] text-[#99A2B3]">{countryNoResultsText}</p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="hidden h-8 w-px bg-[#E8EDF5] md:block" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.register.placeholders.phone}
                      className="h-[60px] min-w-0 flex-1 bg-transparent px-4 text-[14px] text-[#090914] outline-none placeholder:text-[#99A2B3] md:px-5 md:text-[15px]"
                      autoComplete="tel"
                    />
                  </div>
                  {countriesError ? <p className="text-sm text-[#D14343]">{countriesError}</p> : null}

                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.register.placeholders.password}
                      type={showPw ? "text" : "password"}
                      className={`${fieldClass} pr-14`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A9B8] hover:text-[#6B7280]"
                      aria-label={t.login.togglePassword}
                    >
                      {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Rule ok={pwRules.min8} label={t.register.rules.min8} />
                    <Rule ok={pwRules.lowerUpper} label={t.register.rules.lowerUpper} />
                    <Rule ok={pwRules.number} label={t.register.rules.number} highlightInvalid={password.length > 0 && !pwRules.number} />
                    <Rule ok={pwRules.symbol} label={t.register.rules.symbol} />
                  </div>

                  <div className="flex items-start gap-3 pt-2 text-[15px] leading-6 text-[#616A79]">
                    <button
                      type="button"
                      onClick={() => setAgree((prev) => !prev)}
                      aria-pressed={agree}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border ${
                        agree ? "border-[#FAA500] bg-[#FAA500] text-white" : "border-[#D6DCE8] bg-white"
                      }`}
                    >
                      {agree ? <span className="text-[12px] font-semibold leading-none">✓</span> : null}
                    </button>
                    <span>
                      {t.register.agree.prefix}{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          void openTermsModal();
                        }}
                        className="text-[#FAA500] underline underline-offset-2"
                      >
                        {t.register.agree.terms}
                      </button>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSendOtp}
                    className="h-[60px] w-full rounded-[10px] bg-[#FAA500] text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(250,165,0,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? t.register.buttons.sending : t.register.buttons.continue}
                  </button>
                </form>

                <div className="mt-8 flex items-center gap-6 text-[#9EA6B3]">
                  <span className="h-px flex-1 bg-[#E5EAF2]" />
                  <span className="text-[17px]">{t.login.or}</span>
                  <span className="h-px flex-1 bg-[#E5EAF2]" />
                </div>

                <div className="mt-6">
                  <GoogleLoginButton lang={lang} size="large" />
                </div>

                <div className="pt-5 text-center text-[16px] text-[#9AA3B3]">
                  {t.register.links.alreadyHave}
                  <div className="mt-1">
                    <Link href={`/${lang}/login`} className="text-[#FAA500] underline underline-offset-4">
                      {t.register.links.login}
                    </Link>
                  </div>
                </div>

                <div className="mt-auto pt-10 text-center text-[15px] text-[#5F6572]">{t.login.help}</div>
              </>
            )}
          </div>
        </div>

        {!showOtpScreen ? (
          <div className="relative hidden overflow-hidden border-b border-[#E7ECF4] bg-[#F7F9FD] lg:block">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 35% 12%, rgba(255,255,255,0.96) 0, rgba(255,255,255,0.9) 12%, rgba(255,255,255,0) 34%), radial-gradient(circle at 44% 28%, rgba(70,94,255,0.12) 0, rgba(70,94,255,0) 28%), linear-gradient(180deg, #F9FBFF 0%, #F3F6FC 100%)",
            }}
          />
          <div className="relative flex min-h-[920px] flex-col px-10 pt-[2px] pb-12 xl:px-20">
            <div
              className="mx-auto h-[600px] w-full max-w-[780px] bg-[url('/assets/images/_gtg_new/Login_right2.svg')] bg-[length:95%] bg-no-repeat"
              style={{ backgroundPosition: "center 2px" }}
            />

            <div className="mt-6 flex items-center justify-center gap-6 xl:gap-8">
              <div className="inline-flex h-14 w-[188px] shrink-0 items-center justify-center gap-3 overflow-hidden rounded-md border border-black/5 bg-black px-3 py-2 shadow-sm">
                <Image
                  src="/assets/images/_gtg_new/Google-Play-logo.svg"
                  alt=""
                  aria-hidden="true"
                  width={28}
                  height={32}
                  className="h-7 w-auto shrink-0"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] font-semibold tracking-widest text-white/80">Get it on</span>
                  <Image src="/assets/images/_gtg_new/Google-Play.svg" alt="" aria-hidden="true" width={120} height={22} className="h-5 w-auto max-w-full" />
                </div>
              </div>

              <div className="inline-flex h-14 w-[188px] shrink-0 items-center justify-center gap-3 overflow-hidden rounded-md border border-black/5 bg-black px-3 py-2 shadow-sm">
                <Image src="/assets/images/_gtg_new/Apple-logo.svg" alt="" aria-hidden="true" width={22} height={26} className="h-7 w-auto shrink-0" />
                <div className="flex min-w-0 flex-col gap-1">
                  <Image
                    src="/assets/images/_gtg_new/Download-on-the.svg"
                    alt=""
                    aria-hidden="true"
                    width={96}
                    height={10}
                    className="h-2.5 w-auto max-w-full"
                  />
                  <Image src="/assets/images/_gtg_new/App-Store.svg" alt="" aria-hidden="true" width={104} height={22} className="h-5 w-auto max-w-full" />
                </div>
              </div>
            </div>
          </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-[#E7ECF4] bg-[#F5F8FD]">
        <div className="mx-auto max-w-[1600px] px-6 pt-14 pb-16 lg:px-10">
          <div className="grid items-start grid-cols-1 gap-y-8 md:grid-cols-4 md:gap-x-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <BrandHeader height={43} label={t.common.appName} />
              </div>
              <p className="mt-4 max-w-[320px] text-[16px] leading-[30px] text-[#71717A]">{t.footer.introText}</p>
            </div>

            <div>
              <div className="text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]">{t.footer.companyTitle}</div>
              <ul className="mt-6 space-y-5 text-[16px] font-medium text-[#090914]">
                <li>{t.footer.about}</li>
                <li>{t.footer.features}</li>
                <li>{t.footer.works}</li>
                <li>{t.footer.career}</li>
              </ul>
            </div>

            <div>
              <div className="text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]">{t.footer.helpTitle}</div>
              <ul className="mt-6 space-y-5 text-[16px] font-medium text-[#090914]">
                <li>{t.footer.customerSupport}</li>
                <li className="text-[#FAA500]">{t.footer.deliveryDetails}</li>
                <li>{t.footer.terms}</li>
                <li>{t.footer.privacy}</li>
              </ul>
            </div>

            <div>
              <div className="text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]">{t.footer.newsletterTitle}</div>
              <div className="mt-6 space-y-4">
                <div className="flex h-[58px] items-center rounded-[10px] border border-[#E4EAF2] bg-white px-5 text-[16px] text-[#A1A1AA]">
                  {t.footer.enterEmail}
                </div>
                <button className="h-[58px] w-full rounded-[10px] bg-[#FAA500] text-[16px] font-medium text-white">
                  {t.footer.subscribe}
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {errorModal ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/45 px-4 py-8" onClick={() => setErrorModal(null)}>
          <div
            className="relative w-full max-w-[460px] rounded-[18px] bg-white px-6 py-6 shadow-[0_32px_80px_rgba(15,23,42,0.28)] sm:px-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-error-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setErrorModal(null)}
              className="absolute right-5 top-5 rounded-full p-1 text-[#8B93A1] transition hover:bg-black/5"
              aria-label={closeText}
            >
              <X className="h-6 w-6" strokeWidth={1.8} />
            </button>

            <h2 id="register-error-modal-title" className="pr-10 text-[20px] font-semibold text-[#26292F]">
              {errorModalTitle}
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-[#6E7786]">{errorModal}</p>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="min-w-[120px] rounded-[10px] bg-[#FAA500] px-5 py-3 text-[16px] font-medium text-white transition hover:brightness-95"
              >
                {closeText}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {termsOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 px-4 py-8" onClick={() => setTermsOpen(false)}>
          <div
            className="relative w-full max-w-[670px] rounded-[18px] bg-white px-6 py-6 shadow-[0_32px_80px_rgba(15,23,42,0.28)] sm:px-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1 text-[#8B93A1] transition hover:bg-black/5"
              aria-label={closeText}
            >
              <X className="h-6 w-6" strokeWidth={1.8} />
            </button>

            <h2 id="terms-modal-title" className="pr-10 text-[20px] font-semibold text-[#26292F]">
              {termsTitle || t.register.agree.terms}
            </h2>

            <div className="mt-6 max-h-[44vh] overflow-y-auto pr-3">
              {termsLoading ? <p className="text-[15px] text-[#7B8494]">{termsLoadingText}</p> : null}
              {!termsLoading && termsError ? <p className="text-[15px] text-[#D14343]">{termsError}</p> : null}
              {!termsLoading && !termsError && termsHtml ? (
                <div
                  className="text-[15px] leading-7 text-[#7B8494] [&_div]:mb-3 [&_strong]:font-semibold [&_strong]:text-[#26292F] [&_span]:leading-inherit"
                  dangerouslySetInnerHTML={{ __html: termsHtml }}
                />
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="min-w-[110px] rounded-[10px] border border-[#CDD6E3] bg-white px-5 py-3 text-[16px] font-medium text-[#7B8494] transition hover:border-[#B8C4D9]"
              >
                {declineText}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgree(true);
                  setTermsOpen(false);
                }}
                disabled={termsLoading || !!termsError || !termsHtml}
                className="min-w-[110px] rounded-[10px] bg-[#FAA500] px-5 py-3 text-[16px] font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {acceptText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
