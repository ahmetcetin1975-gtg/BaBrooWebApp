"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, ChevronDown, ChevronLeft, Eye, EyeOff, Mail, X } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FooterMain } from "@/components/gtg/FooterMain";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { api } from "@/lib/api/client";
import { getMessages } from "@/lib/i18n/messages";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
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
  data?: CountryItem[] | null;
};

type CityItem = {
  Id?: number;
  Nr?: number;
  UlkeId?: number;
  UlkeNr?: number;
  UlkeAdi?: string;
  IlAdi?: string;
};

type CitiesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CityItem[] | null;
  data?: CityItem[] | null;
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
  success?: boolean;
  message?: string;
  verified?: boolean;
  musteriNr?: number;
  [k: string]: any;
};

const OTP_LENGTH = 6;

function resolveOtpInitialSeconds(): number {
  const raw = process.env.NEXT_PUBLIC_REGISTER_OTP_SECONDS?.trim();
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return 180;
}

const OTP_INITIAL_SECONDS = resolveOtpInitialSeconds();

function normalizeCountries(data?: CountriesResponse): CountryItem[] {
  const items = data?.Data ?? data?.data;
  if (!Array.isArray(items)) return [];
  return items.filter((item) => typeof item?.Id === "number");
}

function normalizeCities(data?: CitiesResponse): CityItem[] {
  const items = data?.Data ?? data?.data;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      ...item,
      Id: typeof item?.Id === "number" ? item.Id : typeof item?.Nr === "number" ? item.Nr : undefined,
    }))
    .filter((item) => typeof item?.Id === "number");
}

function hasCountryId(item: CountryItem): item is CountryItem & { Id: number } {
  return typeof item.Id === "number";
}

function countryDisplay(item: CountryItem): string {
  const name = (item.UlkeAdi ?? "").trim() || "-";
  const code = (item.TelKodu ?? "").trim().replace(/^\+/, "");
  return code ? `${name} (+${code})` : name;
}

function cityDisplay(item: CityItem): string {
  const city = (item.IlAdi ?? "").trim() || "-";
  const country = (item.UlkeAdi ?? "").trim();
  return country ? `${city} - ${country}` : city;
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
  const dil = langToDil(currentLang);
  const t = getMessages(currentLang);

  const [phoneCountryId, setPhoneCountryId] = useState<number | null>(1);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp" | "notification">("form");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_INITIAL_SECONDS);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [pendingMusteriNr, setPendingMusteriNr] = useState<number | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const [busy, setBusy] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
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
  const firstNamePlaceholder = t.support.firstName;
  const lastNamePlaceholder = t.support.lastName;
  const showOtpScreen = step === "otp";
  const showNotificationScreen = step === "notification";
  const showCompactScreen = showOtpScreen || showNotificationScreen;

  const formReady =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    email.trim().length >= 5 &&
    selectedCityId != null &&
    phone.trim().length >= 8 &&
    pwRules.ok &&
    agree;
  const canSendOtp = formReady && !busy;
  const canVerifyOtp = otp.trim().length === OTP_LENGTH && !busy;
  const canResendOtp = otpSecondsLeft <= 0 && !busy;
  const canFinishNotificationStep = pendingMusteriNr != null && !busy;
  const otpDigits = useMemo(() => Array.from({ length: OTP_LENGTH }, (_, index) => otp[index] ?? ""), [otp]);
  const overlayOpen = termsOpen || !!errorModal || supportModalOpen;

  const countryLoadingText = t.support.countryLoading;
  const countryPlaceholderText = t.support.countryPlaceholder;
  const countrySearchPlaceholder = t.support.countrySearch;
  const countryNoResultsText = t.support.countryNoResults;
  const cityPlaceholderText = currentLang === "tr" ? "İl seçiniz" : "Select city";
  const cityLoadingText = currentLang === "tr" ? "İller yükleniyor" : "Loading cities";
  const cityLoadFailedText = currentLang === "tr" ? "İller yüklenemedi." : "Failed to load cities.";
  const cityNoResultsText = currentLang === "tr" ? "Bu ülke için il bulunamadı." : "No cities found for this country.";
  const termsLoadingText = t.support.termsLoading;
  const termsErrorText = t.support.termsLoadFailed;
  const acceptText = t.support.accept;
  const declineText = t.support.decline;
  const closeText = t.support.close;
  const otpScreenTitle = currentLang === "tr" ? "6 haneli doğrulama kodunu gir" : "Enter 6-digit recoverycode";
  const otpScreenSubtitle =
    currentLang === "tr"
      ? "Doğrulama kodu telefonunuza SMS ile gönderildi. Lütfen aşağıdaki kodu girin."
      : "The recovery code has been sent to your phone via SMS. Please enter the code below.";
  const otpResendPrefix = currentLang === "tr" ? "Kod gelmedi mi?" : "Didn’t get a code?";
  const otpResendLink = currentLang === "tr" ? "Tekrar gönder." : "Click to resend.";
  const otpResendWaitingText =
    currentLang === "tr" ? "Tekrar göndermek için bekleyin" : "Wait before resending";
  const otpBackText = currentLang === "tr" ? "Geri" : "Back";
  const otpCancelText = currentLang === "tr" ? "Vazgeç" : "Cancel";
  const otpVerifyText = currentLang === "tr" ? "Doğrula" : "Verify";
  const otpLoginAnotherText = currentLang === "tr" ? "Başka bir hesapla giriş yap" : "Log in with another account";
  const notificationScreenTitle = currentLang === "tr" ? "Bildirimleri Aktifleştir" : "Enable Notifications";
  const notificationScreenSubtitle =
    currentLang === "tr"
      ? "Kaydınız tamamlandı. Son adım olarak bildirimlerinizi aktif edin."
      : "Your registration is complete. Enable notifications as the final step.";
  const notificationScreenNote =
    currentLang === "tr"
      ? "Bildirim ayarınızı aşağıdaki anahtardan açıp kapatabilirsiniz."
      : "You can turn your notification preference on or off using the switch below.";
  const notificationToggleLabel = currentLang === "tr" ? "Sesli Bildirimler" : "Sound Notifications";
  const notificationScreenButtonText =
    currentLang === "tr" ? "Kaydı Tamamla" : "Complete Registration";
  const notificationScreenSubmittingText =
    currentLang === "tr" ? "Tamamlanıyor..." : "Finishing...";
  const errorModalTitle = t.support.alert;
  const supportTitle = t.support.title;
  const supportSubtitle = t.support.subtitle;
  const supportMailHref = "mailto:info@babroo.com";
  const supportWhatsappHref = "https://wa.me/971544832320";

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
        setCountriesError(String(e?.message ?? t.support.countryLoadFailed));
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
    if (!phoneCountryId) {
      setCities([]);
      setSelectedCityId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setCitiesLoading(true);
        setCitiesError(null);
        const data = await api.get<CitiesResponse>(`/api/cities-public?dil=${dil}&ulkeId=${phoneCountryId}`);
        if (cancelled) return;

        const nextCities = normalizeCities(data).filter((item) => {
          const countryId = item.UlkeId ?? item.UlkeNr;
          return typeof countryId !== "number" || countryId === phoneCountryId;
        });

        setCities(nextCities);
        setSelectedCityId((prev) => {
          if (typeof prev === "number" && nextCities.some((item) => item.Id === prev)) return prev;
          return null;
        });
      } catch (e: any) {
        if (cancelled) return;
        setCities([]);
        setSelectedCityId(null);
        setCitiesError(String(e?.message ?? cityLoadFailedText));
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cityLoadFailedText, dil, phoneCountryId]);

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
  const selectedCity = useMemo(
    () => cities.find((item) => item.Id === selectedCityId) ?? null,
    [cities, selectedCityId]
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
    setPendingMusteriNr(null);
    setNotificationEnabled(true);
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
        ilNr: selectedCityId ?? 0,
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

  async function syncNotificationPreference(musteriNr: number) {
    await api.post<RegisterResponse>(
      `/api/auth/register-bildirim-on-off?musteriNr=${musteriNr}&bildirim=${notificationEnabled ? 1 : 0}&kaynak=2&dil=${dil}`,
      {}
    );
  }

  async function verifyOtp() {
    if (!canVerifyOtp) return;

    setBusy(true);
    try {
      const res = await api.post<RegisterResponse>("/api/auth/register-verify-otp", {
        countryCode: countryCodeRaw,
        phoneNumber: phone.trim(),
        code: otp,
        dil,
      });

      const backendStatus = Number(res?.StatusCode ?? 200);
      const verified =
        res?.success === true ||
        res?.verified === true ||
        res?.ok === true ||
        (res?.success == null && res?.verified == null && res?.ok == null && backendStatus < 400);
      if (!verified) {
        throw new Error(readErrorMessage(res, t.register.errors.otpVerifyFailed));
      }

      const musteriNr = Number((res as any)?.musteriNr ?? (res as any)?.Data?.musteriNr ?? 0);
      if (!Number.isFinite(musteriNr) || musteriNr <= 0) {
        throw new Error(readErrorMessage(res, t.register.errors.otpVerifyFailed));
      }

      setPendingMusteriNr(musteriNr);
      setNotificationEnabled(true);
      setStep("notification");
    } catch (e: any) {
      setErrorModal(readErrorMessage(e, t.register.errors.otpVerifyFailed));
    } finally {
      setBusy(false);
    }
  }

  async function completeNotificationStep() {
    if (!canFinishNotificationStep || pendingMusteriNr == null) return;

    setBusy(true);
    try {
      await syncNotificationPreference(pendingMusteriNr);
      window.location.href = `/${lang}/login`;
    } catch (e: any) {
      setErrorModal(readErrorMessage(e, t.register.errors.registerFailed));
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (!canResendOtp) return;

    setBusy(true);
    try {
      await api.post<RegisterResponse>("/api/auth/register-resend-otp", {
        countryCode: countryCodeRaw,
        phoneNumber: phone.trim(),
        dil,
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
    "h-[54px] w-full rounded-[10px] border border-[#DCE2EA] bg-white px-4 text-[13px] text-[#090914] outline-none transition placeholder:text-[#99A2B3] focus:border-[#B8C4D9] sm:px-5 sm:text-[14px]";

  const Rule = ({
    ok,
    label,
    highlightInvalid = false,
  }: {
    ok: boolean;
    label: string;
    highlightInvalid?: boolean;
  }) => (
    <div className="flex items-center gap-2.5 text-[13px] leading-5 text-[#616A79] sm:text-[14px]">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          ok
            ? "border-[#FFB11A] bg-[#FFB11A] text-white"
            : highlightInvalid
            ? "border-[#FF4B4B]"
            : "border-[#D6DCE8]"
        }`}
      >
        {ok ? <span className="text-[11px] font-semibold leading-none">✓</span> : null}
      </span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className={`flex min-h-screen flex-col ${showCompactScreen ? "bg-[#F5F8FD]" : "bg-white"}`}>
      <div className="border-b border-[#E7ECF4] bg-white">
        <div
          className={`mx-auto grid h-[74px] grid-cols-1 items-center px-6 ${
            showCompactScreen
              ? "max-w-[1600px] lg:grid-cols-[minmax(500px,600px)_minmax(0,1fr)] lg:px-10"
              : "max-w-[1400px] lg:grid-cols-2 lg:px-16"
          }`}
        >
          <div className={`flex items-center justify-between ${showCompactScreen ? "lg:col-span-2" : ""}`}>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BrandHeader height={20} label={t.common.appName} href={`/${currentLang}`} priority />
            </div>
            {!showCompactScreen ? (
              <LanguageSwitch lang={currentLang} />
            ) : null}
          </div>
        </div>
      </div>

      <main
        className={`mx-auto grid w-full grid-cols-1 ${
          showCompactScreen
            ? "max-w-[1600px] lg:grid-cols-[minmax(500px,600px)_minmax(0,1fr)]"
            : "max-w-[1400px] flex-1 lg:min-h-screen lg:grid-cols-2"
        }`}
      >
        <div
          className={`border-b border-[#E7ECF4] px-6 py-6 lg:border-b-0 lg:border-[#E7ECF4] ${
            showCompactScreen ? "lg:col-span-2 lg:px-10 lg:py-4" : "lg:border-r lg:px-16 lg:py-8"
          }`}
        >
          <div className={`mx-auto flex h-full w-full flex-col ${showCompactScreen ? "max-w-[760px]" : "max-w-[480px]"}`}>
            {showOtpScreen ? (
              <div className="flex w-full flex-col py-4 sm:py-5">
                <h1 className="text-[25px] font-semibold leading-[1.12] tracking-[-0.04em] text-[#090914] sm:text-[31px]">
                  {otpScreenTitle}
                </h1>
                <p className="mt-2.5 max-w-[560px] text-[13px] leading-[1.4] text-[#757D8A] sm:text-[14px]">
                  {otpScreenSubtitle}
                </p>

                <div className="mt-5 rounded-[18px] border border-[#E2E8F0] bg-white px-4 py-[18px] shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-6 sm:py-5">
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
                        className="h-[72px] w-full rounded-[12px] border border-[#D7DFEA] bg-white text-center text-[36px] font-normal leading-none text-[#FAA500] outline-none transition focus:border-[#9CA9BB] focus:ring-2 focus:ring-black/10 sm:h-[78px] sm:text-[40px]"
                      />
                    ))}
                  </div>

                  <div className="mt-3 text-center text-[12px] text-[#7B8494] sm:text-[13px]">
                    {canResendOtp ? (
                      <>
                        {otpResendPrefix}{" "}
                        <button
                          type="button"
                          onClick={() => void resendOtp()}
                          className="font-medium text-[#5F6572] underline underline-offset-2 transition-colors duration-200 hover:text-[#090914]"
                        >
                          {otpResendLink}
                        </button>
                      </>
                    ) : (
                      `${otpResendWaitingText}: ${formatCountdown(otpSecondsLeft)}`
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[96px_1fr_168px]">
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="inline-flex h-[40px] items-center justify-center gap-1 rounded-[12px] border border-[#D8E0EA] bg-white px-2.5 text-[12px] font-medium text-[#333A45] transition-all duration-200 hover:-translate-y-px hover:border-[#C8D1DE] hover:bg-[#F8FAFD] hover:shadow-sm sm:text-[13px]"
                    >
                      <ChevronLeft className="h-[16px] w-[16px] text-[#FAA500]" />
                      <span>{otpBackText}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resetPhoneVerification()}
                      className="h-[40px] rounded-[12px] border border-[#D8E0EA] bg-white px-2.5 text-[12px] font-medium text-[#333A45] transition-all duration-200 hover:-translate-y-px hover:border-[#C8D1DE] hover:bg-[#F8FAFD] hover:shadow-sm sm:text-[13px]"
                    >
                      {otpCancelText}
                    </button>

                    <button
                      type="button"
                      onClick={() => void verifyOtp()}
                      disabled={!canVerifyOtp}
                      className="h-[40px] rounded-[12px] bg-[#FAA500] px-2.5 text-[12px] font-medium text-white shadow-[0_10px_24px_rgba(250,165,0,0.18)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:brightness-95 enabled:hover:shadow-[0_16px_34px_rgba(250,165,0,0.24)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                    >
                      {`${otpVerifyText} (${formatCountdown(otpSecondsLeft)})`}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-[13px] sm:text-[14px]">
                  <Link href={`/${lang}/login`} className="text-[#FAA500]">
                    {otpLoginAnotherText}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(true)}
                    className="font-medium text-[#5F6572] transition hover:text-[#333A45]"
                  >
                    {t.login.help}
                  </button>
                </div>
              </div>
            ) : showNotificationScreen ? (
              <div className="flex w-full flex-col py-4 sm:py-5">
                <h1 className="text-[25px] font-semibold leading-[1.12] tracking-[-0.04em] text-[#090914] sm:text-[31px]">
                  {notificationScreenTitle}
                </h1>
                <p className="mt-2.5 max-w-[560px] text-[13px] leading-[1.4] text-[#757D8A] sm:text-[14px]">
                  {notificationScreenSubtitle}
                </p>

                <div className="mt-5 rounded-[18px] border border-[#E2E8F0] bg-white px-4 py-[18px] shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-6 sm:py-5">
                  <div className="rounded-[14px] border border-[#E8EDF5] bg-[#F8FAFD] px-4 py-4 text-[13px] leading-6 text-[#616A79] sm:text-[14px]">
                    {notificationScreenNote}
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationEnabled}
                    onClick={() => setNotificationEnabled((prev) => !prev)}
                    className="mt-4 flex w-full items-center justify-between gap-4 rounded-[30px] border border-[#D7DBE3] bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-[#CCD3DE] hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF6E2] text-[#717171]">
                        <Bell className="h-6 w-6" strokeWidth={2} />
                      </span>
                      <span className="truncate text-[15px] font-semibold text-[#1F232B] sm:text-[16px]">
                        {notificationToggleLabel}
                      </span>
                    </div>

                    <span
                      className={`relative inline-flex h-[42px] w-[92px] shrink-0 items-center rounded-full border transition-all duration-200 ${
                        notificationEnabled
                          ? "border-[#FFD08A] bg-[#FFCD7A] shadow-[inset_0_0_0_1px_rgba(255,208,138,0.35)]"
                          : "border-[#D8DEE8] bg-[#EEF2F7]"
                      }`}
                    >
                      <span
                        className={`inline-block h-[32px] w-[32px] rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.16)] transition-transform duration-200 ${
                          notificationEnabled ? "translate-x-[52px] bg-[#FF9F0A]" : "translate-x-[8px] bg-white"
                        }`}
                      />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void completeNotificationStep()}
                    disabled={!canFinishNotificationStep}
                    className="mt-4 h-[44px] w-full rounded-[12px] bg-[#FAA500] px-3 text-[13px] font-medium text-white shadow-[0_10px_24px_rgba(250,165,0,0.18)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:brightness-95 enabled:hover:shadow-[0_16px_34px_rgba(250,165,0,0.24)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[14px]"
                  >
                    {busy ? notificationScreenSubmittingText : notificationScreenButtonText}
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-end text-[13px] sm:text-[14px]">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(true)}
                    className="font-medium text-[#5F6572] transition hover:text-[#333A45]"
                  >
                    {t.login.help}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#090914]">
                    {t.register.titlePrefix ? `${t.register.titlePrefix} ` : ""}
                    <span className="text-[#FAA500]">{t.register.titleHighlight}</span>
                    {t.register.titleSuffix ? ` ${t.register.titleSuffix}` : ""}
                  </h1>

                  <p className="mt-4 max-w-[400px] text-[15px] leading-[1.45] text-[#A1A9B8] sm:text-[17px]">
                    {t.register.subtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                  <div className="flex min-h-[54px] min-w-0 flex-col rounded-[10px] border border-[#DCE2EA] bg-white md:flex-row md:items-center">
                    <div
                      className="relative min-w-0 border-b border-[#E8EDF5] px-2 py-1 md:min-w-[265px] md:max-w-[340px] md:flex-[1.3] md:border-b-0 md:pl-2 md:pr-1"
                      ref={countryMenuRef}
                    >
                      <button
                        type="button"
                        onClick={() => !countriesLoading && setCountryMenuOpen((prev) => !prev)}
                        disabled={countriesLoading}
                        className={`flex h-[52px] w-full items-center gap-2.5 rounded-[10px] bg-transparent px-3 text-[13px] outline-none transition-all duration-200 hover:bg-[#F8FAFD] sm:text-[14px] ${
                          selectedCountry ? "text-[#090914]" : "text-[#99A2B3]"
                        }`}
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
                          className={`shrink-0 transition ${selectedCountry ? "text-[#090914]" : "text-[#99A2B3]"} ${countryMenuOpen ? "rotate-180" : "rotate-0"}`}
                        />
                      </button>

                      {countryMenuOpen ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[16px] border border-[#DCE2EA] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                          <div className="border-b border-[#E8EDF5] p-3">
                            <input
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder={countrySearchPlaceholder}
                              className="w-full rounded-[12px] border border-[#E1E7F0] bg-[#F8FAFD] px-3 py-2.5 text-[13px] text-[#090914] outline-none placeholder:text-[#99A2B3]"
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
                                      if (item.Id !== phoneCountryId) setSelectedCityId(null);
                                      setPhoneCountryId(item.Id);
                                      setCountryMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                                      selected ? "bg-[#F1F4F9] font-medium text-[#090914]" : "text-[#4B5565] hover:bg-[#F8FAFD]"
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
                      className="h-[52px] min-w-0 flex-1 bg-transparent px-4 text-[13px] text-[#090914] outline-none placeholder:text-[#99A2B3] md:flex-[0.7] md:px-5 md:text-[14px]"
                      autoComplete="tel"
                    />
                  </div>
                  {countriesError ? <p className="text-sm text-[#D14343]">{countriesError}</p> : null}

                  <div className="relative">
                    <select
                      value={selectedCityId ?? ""}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setSelectedCityId(Number.isFinite(next) && next > 0 ? next : null);
                      }}
                      disabled={!phoneCountryId || citiesLoading || cities.length === 0}
                      aria-label={selectedCity ? cityDisplay(selectedCity) : cityPlaceholderText}
                      className={`${fieldClass} appearance-none pr-12 ${
                        selectedCity ? "text-[#090914]" : "text-[#99A2B3]"
                      } disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#A1A9B8]`}
                    >
                      <option value="">{citiesLoading ? cityLoadingText : cityPlaceholderText}</option>
                      {cities.map((item) => (
                        <option key={item.Id} value={item.Id}>
                          {cityDisplay(item)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#99A2B3]"
                    />
                  </div>
                  {citiesError ? <p className="text-sm text-[#D14343]">{citiesError}</p> : null}
                  {!citiesLoading && !citiesError && phoneCountryId && cities.length === 0 ? (
                    <p className="text-sm text-[#D14343]">{cityNoResultsText}</p>
                  ) : null}

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
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#A1A9B8] transition-all duration-200 hover:bg-[#F5F7FB] hover:text-[#6B7280]"
                      aria-label={t.login.togglePassword}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Rule ok={pwRules.min8} label={t.register.rules.min8} />
                    <Rule ok={pwRules.lowerUpper} label={t.register.rules.lowerUpper} />
                    <Rule ok={pwRules.number} label={t.register.rules.number} highlightInvalid={password.length > 0 && !pwRules.number} />
                    <Rule ok={pwRules.symbol} label={t.register.rules.symbol} />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1 text-[13px] leading-5 text-[#616A79] sm:text-[14px]">
                    <button
                      type="button"
                      onClick={() => setAgree((prev) => !prev)}
                      aria-pressed={agree}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-200 hover:-translate-y-px hover:shadow-sm ${
                        agree ? "border-[#FAA500] bg-[#FAA500] text-white" : "border-[#D6DCE8] bg-white"
                      }`}
                    >
                      {agree ? <span className="text-[11px] font-semibold leading-none">✓</span> : null}
                    </button>
                    <span>
                      {t.register.agree.prefix}{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          void openTermsModal();
                        }}
                        className="font-medium text-[#FAA500] underline underline-offset-2 transition-colors duration-200 hover:text-[#DE9300]"
                      >
                        {t.register.agree.terms}
                      </button>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSendOtp}
                    className="h-[52px] w-full rounded-[10px] bg-[#FAA500] text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(250,165,0,0.18)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:brightness-95 enabled:hover:shadow-[0_18px_38px_rgba(250,165,0,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? t.register.buttons.sending : t.register.buttons.continue}
                  </button>
                </form>

                <div className="mt-5 flex items-center gap-4 text-[#9EA6B3]">
                  <span className="h-px flex-1 bg-[#E5EAF2]" />
                  <span className="text-[16px]">{t.login.or}</span>
                  <span className="h-px flex-1 bg-[#E5EAF2]" />
                </div>

                <div className="mt-3">
                  <GoogleLoginButton lang={lang} size="large" />
                </div>

                <div className="pt-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-[15px] text-[#9AA3B3] sm:text-[16px]">
                    <span>{t.register.links.alreadyHave}</span>
                    <Link href={`/${lang}/login`} className="font-medium text-[#FAA500] underline underline-offset-4">
                      {t.register.links.login}
                    </Link>
                  </div>
                </div>

                <div className="pt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(true)}
                    className="text-[15px] font-medium text-[#5F6572] transition-colors duration-200 hover:text-[#333A45] sm:text-[16px]"
                  >
                    {t.login.help}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {!showCompactScreen ? (
          <div
            className="relative hidden min-h-[320px] overflow-hidden bg-[#F3F5F9] lg:sticky lg:top-0 lg:block lg:h-screen"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,199,255,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,118,1,0.22),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 pb-40 pt-16">
              <div className="relative aspect-square w-full max-w-[330px]">
                <Image
                  src="/assets/images/babroo/logo-mark.png"
                  alt={t.common.appName}
                  fill
                  sizes="330px"
                  className="object-contain drop-shadow-[0_24px_60px_rgba(17,24,39,0.14)]"
                  priority
                />
              </div>
              <div className="relative -mt-10 aspect-[670/172] w-full max-w-[340px]">
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
        ) : null}
      </main>

      <FooterMain lang={currentLang} />

      {supportModalOpen ? (
        <div
          className="fixed inset-0 z-[145] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-[3px]"
          onClick={() => setSupportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[720px] rounded-[28px] border border-[#EAE3D7] bg-white px-6 py-6 shadow-[0_30px_80px_rgba(17,24,39,0.22)] sm:px-8 sm:py-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-support-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DCE3] bg-white text-[#8A8A8A] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-px hover:bg-[#F8FAFC] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
              aria-label={closeText}
            >
              <X className="h-6 w-6" strokeWidth={1.8} />
            </button>

            <h2 id="register-support-modal-title" className="pr-10 text-[22px] font-semibold leading-tight text-[#2A2D33] sm:text-[24px]">
              {supportTitle}
            </h2>
            <p className="mt-3 text-[16px] leading-[1.35] text-[#97A1AE] sm:text-[17px]">{supportSubtitle}</p>

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
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white p-1 text-[#8B93A1] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-px hover:bg-[#F8FAFC] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
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
                className="min-w-[120px] rounded-[10px] bg-[#FAA500] px-5 py-3 text-[16px] font-medium text-white shadow-[0_12px_28px_rgba(250,165,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-[0_18px_38px_rgba(250,165,0,0.24)]"
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
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white p-1 text-[#8B93A1] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-px hover:bg-[#F8FAFC] hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]"
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
                className="min-w-[110px] rounded-[10px] border border-[#CDD6E3] bg-white px-5 py-3 text-[16px] font-medium text-[#7B8494] transition-all duration-200 hover:-translate-y-px hover:border-[#B8C4D9] hover:bg-[#F8FAFD] hover:shadow-sm"
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
                className="min-w-[110px] rounded-[10px] bg-[#FAA500] px-5 py-3 text-[16px] font-medium text-white shadow-[0_12px_28px_rgba(250,165,0,0.18)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:brightness-95 enabled:hover:shadow-[0_18px_38px_rgba(250,165,0,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
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
