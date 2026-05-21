"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, Eye, EyeOff, Mail, Smartphone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { api } from "@/lib/api/client";
import { getMessages } from "@/lib/i18n/messages";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";

type RecoveryStep = "method" | "mail" | "sms" | "code" | "reset";
type RecoveryMethod = "sms" | "mail";

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

type ForgotPasswordEmailResponse = {
  ok?: boolean;
  message?: string;
  email?: string;
  expireSeconds?: number;
  dil?: number;
  [k: string]: any;
};

type ForgotPasswordSmsResponse = {
  ok?: boolean;
  message?: string;
  countryCode?: string;
  phone?: string;
  telefon?: string;
  expireSeconds?: number;
  dil?: number;
  [k: string]: any;
};

type ForgotPasswordSmsVerifyData = {
  ResetToken?: string;
  CountryCode?: string;
  Telefon?: string;
  AdSoyad?: string;
};

type ForgotPasswordSmsVerifyResponse = {
  ok?: boolean;
  message?: string;
  Message?: string;
  Data?: ForgotPasswordSmsVerifyData | null;
  [k: string]: any;
};

type ResetPasswordResponse = {
  ok?: boolean;
  message?: string;
  Message?: string;
  [k: string]: any;
};

const RECOVERY_CODE_LENGTH = 6;
const DEFAULT_EXPIRE_SECONDS = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ForgotPasswordMethod({
  lang,
  onStepChange,
}: {
  lang: string;
  onStepChange?: (step: RecoveryStep) => void;
}) {
  const normalizedLang = normalizeLang(lang);
  const dil = langToDil(normalizedLang);
  const t = getMessages(normalizedLang);

  const [step, setStep] = useState<RecoveryStep>("method");
  const [method, setMethod] = useState<RecoveryMethod>("mail");
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [methodMessage, setMethodMessage] = useState<string | null>(null);

  const [phoneCountryId, setPhoneCountryId] = useState<number | null>(1);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryMenuRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submittingSms, setSubmittingSms] = useState(false);
  const [smsPendingCountryCode, setSmsPendingCountryCode] = useState("");
  const [smsPendingPhone, setSmsPendingPhone] = useState("");
  const [smsResetToken, setSmsResetToken] = useState("");

  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [submittedIdentity, setSubmittedIdentity] = useState("");
  const [recoverCode, setRecoverCode] = useState("");
  const [recoverCodeError, setRecoverCodeError] = useState<string | null>(null);
  const [expireSecondsLeft, setExpireSecondsLeft] = useState(DEFAULT_EXPIRE_SECONDS);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(null);

  const recoverCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isTurkish = normalizedLang === "tr";
  const supportTitle = t.support.title;
  const supportSubtitle = t.support.subtitle;
  const supportMailHref = "mailto:info@babroo.com";
  const supportWhatsappHref = "https://wa.me/971544832320";
  const closeText = t.support.close;
  const countryPlaceholder = t.support.countryPlaceholder;
  const countryLoading = t.support.countryLoading;
  const countryErrorText = t.support.countryLoadFailed;
  const countrySearchPlaceholder = t.support.countrySearch;
  const countryNoResultsText = t.support.countryNoResults;
  const phoneRequiredText = isTurkish ? "Telefon numarası zorunludur" : "Phone number is required";
  const smsCodeSubtitle = isTurkish
    ? "Doğrulama kodu telefonunuza SMS ile gönderildi. Lütfen aşağıdaki kodu girin."
    : "The recovery code has been sent to your phone via SMS. Please enter the code below.";
  const smsResetSessionMissingText = isTurkish
    ? "Şifre sıfırlama oturumu bulunamadı"
    : "Reset password session not found";

  const recoverCodeDigits = Array.from({ length: RECOVERY_CODE_LENGTH }, (_, index) => recoverCode[index] ?? "");
  const fieldClass =
    "h-[54px] w-full rounded-[10px] border border-[#DCE2EA] bg-white px-4 text-[13px] text-[#090914] outline-none transition placeholder:text-[#99A2B3] focus:border-[#B8C4D9] sm:px-5 sm:text-[14px]";

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

  const selectedCountryCode = useMemo(() => {
    const code = (selectedPhoneCountry?.TelKodu ?? "").trim().replace(/^\+/, "");
    return code || "90";
  }, [selectedPhoneCountry]);

  const canVerifyCode = recoverCode.length === RECOVERY_CODE_LENGTH && expireSecondsLeft > 0 && !verifyingCode;
  const resetPasswordMismatch = passwordAgain.length > 0 && password !== passwordAgain;
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
  const canUpdatePassword = pwRules.ok && passwordAgain.length > 0 && !resetPasswordMismatch && !resettingPassword;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setCountriesLoading(true);
        setCountriesError(null);
        const data = await api.get<CountriesResponse>(`/api/countries-public?dil=${dil}`);
        if (cancelled) return;
        setCountries(normalizeCountries(data));
      } catch (error: any) {
        if (cancelled) return;
        setCountries([]);
        setCountriesError(String(error?.message ?? countryErrorText));
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
    if (step !== "sms") setCountryMenuOpen(false);
  }, [step]);

  useEffect(() => {
    if (!countryMenuOpen) setCountrySearch("");
  }, [countryMenuOpen]);

  useEffect(() => {
    if (step !== "code" || expireSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setExpireSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, expireSecondsLeft]);

  useEffect(() => {
    if (step !== "code") return;

    const frame = window.requestAnimationFrame(() => {
      recoverCodeInputRefs.current[0]?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  function resetFlow(nextStep: RecoveryStep = "method") {
    setStep(nextStep);
    setMethod("mail");
    setMethodMessage(null);
    setCountryMenuOpen(false);
    setCountrySearch("");
    setEmailError(null);
    setPhoneError(null);
    setRequestMessage(null);
    setSubmittedIdentity("");
    setRecoverCode("");
    setRecoverCodeError(null);
    setExpireSecondsLeft(DEFAULT_EXPIRE_SECONDS);
    setVerifyingCode(false);
    setSmsPendingCountryCode("");
    setSmsPendingPhone("");
    setSmsResetToken("");
    setPassword("");
    setPasswordAgain("");
    setShowPassword(false);
    setShowPasswordAgain(false);
    setResettingPassword(false);
    setResetPasswordError(null);
    setSuccessModalMessage(null);
  }

  function handleMethodSelect(nextMethod: RecoveryMethod) {
    setMethod(nextMethod);
    setMethodMessage(null);
    setEmailError(null);
    setPhoneError(null);
    setRecoverCodeError(null);
    setResetPasswordError(null);
    setRequestMessage(null);
    setSubmittedIdentity("");
    setRecoverCode("");
    setSmsResetToken("");
    setStep(nextMethod === "mail" ? "mail" : "sms");
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t.login.recovery.emailRequired);
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError(t.login.recovery.emailInvalid);
      return;
    }

    setSubmittingEmail(true);
    setEmailError(null);
    setPhoneError(null);
    setRecoverCodeError(null);
    setResetPasswordError(null);

    try {
      const response = await api.post<ForgotPasswordEmailResponse>("/api/auth/forgot-password-email", {
        email: trimmedEmail,
        dil,
      });
      const nextExpireSeconds = Number(response?.expireSeconds);

      setMethod("mail");
      setSubmittedIdentity(String(response?.email ?? trimmedEmail));
      setRequestMessage(String(response?.message ?? ""));
      setRecoverCode("");
      setSmsPendingCountryCode("");
      setSmsPendingPhone("");
      setSmsResetToken("");
      setExpireSecondsLeft(
        Number.isFinite(nextExpireSeconds) && nextExpireSeconds > 0
          ? Math.floor(nextExpireSeconds)
          : DEFAULT_EXPIRE_SECONDS
      );
      setStep("code");
    } catch (error: any) {
      setEmailError(String(error?.message ?? t.login.errors.loginFailed));
    } finally {
      setSubmittingEmail(false);
    }
  }

  async function handleSmsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 8) {
      setPhoneError(phoneRequiredText);
      return;
    }

    setSubmittingSms(true);
    setPhoneError(null);
    setEmailError(null);
    setRecoverCodeError(null);
    setResetPasswordError(null);

    try {
      const response = await api.post<ForgotPasswordSmsResponse>("/api/auth/forgot-password", {
        countryCode: selectedCountryCode,
        telefon: trimmedPhone,
        dil,
      });
      const nextExpireSeconds = Number(response?.expireSeconds);
      const responseCountryCode = String(response?.countryCode ?? selectedCountryCode).replace(/^\+/, "");
      const responsePhone = String(response?.phone ?? response?.telefon ?? trimmedPhone);

      setMethod("sms");
      setSubmittedIdentity(`+${responseCountryCode} ${responsePhone}`);
      setRequestMessage(String(response?.message ?? ""));
      setRecoverCode("");
      setSmsPendingCountryCode(responseCountryCode);
      setSmsPendingPhone(responsePhone);
      setSmsResetToken("");
      setExpireSecondsLeft(
        Number.isFinite(nextExpireSeconds) && nextExpireSeconds > 0
          ? Math.floor(nextExpireSeconds)
          : DEFAULT_EXPIRE_SECONDS
      );
      setStep("code");
    } catch (error: any) {
      setPhoneError(String(error?.message ?? t.login.errors.loginFailed));
    } finally {
      setSubmittingSms(false);
    }
  }

  async function handleRecoverCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (recoverCode.length !== RECOVERY_CODE_LENGTH) {
      setRecoverCodeError(t.login.recovery.codeRequired);
      return;
    }

    if (expireSecondsLeft <= 0) {
      setRecoverCodeError(t.login.recovery.codeExpired);
      return;
    }

    setVerifyingCode(true);
    setRecoverCodeError(null);

    try {
      if (method === "sms") {
        const response = await api.post<ForgotPasswordSmsVerifyResponse>("/api/auth/forgot-password-verify", {
          countryCode: smsPendingCountryCode,
          telefon: smsPendingPhone,
          otpCode: recoverCode,
          dil,
        });
        const data = response?.Data ?? null;
        const nextResetToken = String(data?.ResetToken ?? "");
        if (!nextResetToken) {
          throw { message: smsResetSessionMissingText };
        }

        setSmsResetToken(nextResetToken);
        setSmsPendingCountryCode(String(data?.CountryCode ?? smsPendingCountryCode).replace(/^\+/, ""));
        setSmsPendingPhone(String(data?.Telefon ?? smsPendingPhone));
      } else {
        await api.post("/api/auth/forgot-password-email-verify", {
          code: recoverCode,
          dil,
        });
      }

      setPassword("");
      setPasswordAgain("");
      setShowPassword(false);
      setShowPasswordAgain(false);
      setResetPasswordError(null);
      setStep("reset");
    } catch (error: any) {
      setRecoverCodeError(String(error?.message ?? t.login.recovery.codeVerifyFailed));
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleResetPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pwRules.ok) return;

    if (password !== passwordAgain) {
      setResetPasswordError(t.login.recovery.passwordsDoNotMatch);
      return;
    }

    setResettingPassword(true);
    setResetPasswordError(null);

    try {
      const response =
        method === "sms"
          ? await api.post<ResetPasswordResponse>("/api/auth/reset-password", {
              countryCode: smsPendingCountryCode,
              telefon: smsPendingPhone,
              resetToken: smsResetToken,
              newPassword: password,
              dil,
            })
          : await api.post<ResetPasswordResponse>("/api/auth/reset-password-email", {
              code: recoverCode,
              newPassword: password,
              dil,
            });

      setSuccessModalMessage(String(response?.message ?? response?.Message ?? t.login.recovery.passwordUpdatedMessage));
    } catch (error: any) {
      setResetPasswordError(String(error?.message ?? t.login.recovery.resetPasswordFailed));
    } finally {
      setResettingPassword(false);
    }
  }

  function handleSuccessDone() {
    setSuccessModalMessage(null);
    window.location.href = `/${lang}/login`;
  }

  function handleRecoverCodeInputChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const chars = recoverCode.padEnd(RECOVERY_CODE_LENGTH, " ").split("");
      chars[index] = " ";
      setRecoverCode(chars.join("").replace(/\s+$/g, ""));
      return;
    }

    const nextChars = recoverCode.padEnd(RECOVERY_CODE_LENGTH, " ").split("");
    const chars = cleaned.slice(0, RECOVERY_CODE_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      nextChars[index + offset] = char;
    });
    setRecoverCode(nextChars.join("").replace(/\s+$/g, ""));
    if (recoverCodeError) setRecoverCodeError(null);

    const focusIndex = Math.min(index + chars.length, RECOVERY_CODE_LENGTH - 1);
    window.requestAnimationFrame(() => {
      recoverCodeInputRefs.current[focusIndex]?.focus();
      recoverCodeInputRefs.current[focusIndex]?.select();
    });
  }

  function handleRecoverCodeKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (recoverCodeDigits[index]) {
        const chars = recoverCode.padEnd(RECOVERY_CODE_LENGTH, " ").split("");
        chars[index] = " ";
        setRecoverCode(chars.join("").replace(/\s+$/g, ""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        recoverCodeInputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      recoverCodeInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < RECOVERY_CODE_LENGTH - 1) {
      event.preventDefault();
      recoverCodeInputRefs.current[index + 1]?.focus();
    }
  }

  function handleRecoverCodePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, RECOVERY_CODE_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    setRecoverCode(pasted);
    if (recoverCodeError) setRecoverCodeError(null);

    const focusIndex = Math.min(pasted.length, RECOVERY_CODE_LENGTH) - 1;
    window.requestAnimationFrame(() => {
      recoverCodeInputRefs.current[Math.max(focusIndex, 0)]?.focus();
      recoverCodeInputRefs.current[Math.max(focusIndex, 0)]?.select();
    });
  }

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

  const screenTitle =
    step === "code" ? t.login.recovery.codeTitle : step === "reset" ? t.login.recovery.resetTitle : t.login.recovery.title;
  const screenSubtitle =
    step === "code"
      ? method === "sms"
        ? smsCodeSubtitle
        : t.login.recovery.codeSubtitle
      : step === "reset"
      ? t.login.recovery.resetSubtitle
      : t.login.recovery.subtitle;

  return (
    <>
      <div className="w-full max-w-115">
        <div className="flex min-h-[420px] flex-col justify-start pt-1 pb-6">
          <h1
            className={`font-extrabold leading-tight text-[#2B2F36] ${
              step === "code"
                ? "text-[30px] sm:text-[36px]"
                : step === "reset"
                ? "text-4xl sm:text-[52px]"
                : "text-[32px] sm:text-[40px]"
            }`}
          >
            {screenTitle}
          </h1>
          <p className="mt-4 max-w-[420px] text-[15px] leading-[1.55] text-[#98A2B3] sm:text-[17px]">{screenSubtitle}</p>

          {step === "method" ? (
            <>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleMethodSelect("sms")}
                  className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-[14px] font-semibold tracking-[0.02em] text-white transition-all duration-200 ${
                    method === "sms"
                      ? "bg-[#2F2F2F] shadow-[0_12px_24px_rgba(47,47,47,0.18)] ring-2 ring-[#2F2F2F]/10"
                      : "bg-[#4A4A4A] hover:-translate-y-px hover:bg-[#363636]"
                  }`}
                >
                  <Smartphone className="h-[18px] w-[18px]" />
                  <span>{t.login.recovery.sms}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMethodSelect("mail")}
                  className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-[14px] font-semibold tracking-[0.02em] text-white transition-all duration-200 ${
                    method === "mail"
                      ? "bg-[var(--gtg-orange)] shadow-[0_12px_24px_rgba(250,165,0,0.22)] ring-2 ring-[var(--gtg-orange)]/15"
                      : "bg-[#FFB11A] hover:-translate-y-px hover:brightness-95"
                  }`}
                >
                  <Mail className="h-[18px] w-[18px]" />
                  <span>{t.login.recovery.mail}</span>
                </button>
              </div>

              {methodMessage ? <p className="mt-4 text-[14px] text-[#D14343]">{methodMessage}</p> : null}

              <div className="pt-6">
                <Link
                  href={`/${lang}/login`}
                  className="text-[14px] font-medium text-neutral-500 transition-colors duration-200 hover:text-neutral-800 hover:underline"
                >
                  {t.login.recovery.backToLogin}
                </Link>
              </div>
            </>
          ) : null}

          {step === "mail" ? (
            <form onSubmit={handleEmailSubmit} className="mt-7 w-full max-w-[420px] space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder={t.login.recovery.emailPlaceholder}
                  autoComplete="email"
                  className={`${fieldClass} ${emailError ? "border-[#D14343] focus:border-[#D14343]" : ""}`}
                />
                {emailError ? <p className="mt-2 text-[13px] text-[#D14343]">{emailError}</p> : null}
              </div>

              <button
                type="submit"
                disabled={submittingEmail}
                className="inline-flex h-[54px] w-full items-center justify-center rounded-[10px] bg-[var(--gtg-orange)] px-5 text-[16px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingEmail ? `${t.login.recovery.continue}...` : t.login.recovery.continue}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => resetFlow("method")}
                  className="text-[14px] font-medium text-neutral-400 transition-colors duration-200 hover:text-neutral-600 hover:underline"
                >
                  {t.login.recovery.tryAnotherMethod}
                </button>
              </div>
            </form>
          ) : null}

          {step === "sms" ? (
            <form onSubmit={handleSmsSubmit} className="mt-7 w-full max-w-[460px] space-y-4">
              <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(0,0.95fr)] gap-2">
                <div className="relative min-w-0" ref={countryMenuRef}>
                  <button
                    type="button"
                    onClick={() => !countriesLoading && setCountryMenuOpen((prev) => !prev)}
                    disabled={countriesLoading}
                    className="flex h-[54px] w-full items-center justify-between rounded-[10px] border border-[#DCE2EA] bg-white px-4 text-[13px] text-[#090914] outline-none transition hover:border-[#CAD3E0] hover:bg-[#FAFBFD] focus:border-[#B8C4D9] disabled:opacity-70 sm:px-5 sm:text-[14px]"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      {selectedPhoneCountry?.ResimUrl ? (
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
                          onChange={(event) => setCountrySearch(event.target.value)}
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
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/[^\d]/g, ""));
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder={t.login.placeholders.phone}
                  className={fieldClass}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={12}
                />
              </div>

              {countriesError ? <p className="-mt-1 text-[13px] text-[#D14343]">{countriesError}</p> : null}
              {phoneError ? <p className="-mt-1 text-[13px] text-[#D14343]">{phoneError}</p> : null}

              <button
                type="submit"
                disabled={submittingSms}
                className="inline-flex h-[54px] w-full items-center justify-center rounded-[10px] bg-[var(--gtg-orange)] px-5 text-[16px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingSms ? `${t.login.recovery.continue}...` : t.login.recovery.continue}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => resetFlow("method")}
                  className="text-[14px] font-medium text-neutral-400 transition-colors duration-200 hover:text-neutral-600 hover:underline"
                >
                  {t.login.recovery.tryAnotherMethod}
                </button>
              </div>
            </form>
          ) : null}

          {step === "code" ? (
            <form onSubmit={handleRecoverCodeSubmit} className="mt-7 w-full max-w-[460px]">
              {requestMessage ? <p className="text-[14px] text-[#1E8E5A]">{requestMessage}</p> : null}
              {submittedIdentity ? <p className="mt-3 text-[14px] text-[#667085]">{submittedIdentity}</p> : null}

              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6" onPaste={handleRecoverCodePaste}>
                {recoverCodeDigits.map((digit, index) => (
                  <input
                    key={`recover-code-${index}`}
                    ref={(node) => {
                      recoverCodeInputRefs.current[index] = node;
                    }}
                    value={digit}
                    onChange={(event) => handleRecoverCodeInputChange(index, event.target.value)}
                    onKeyDown={(event) => handleRecoverCodeKeyDown(index, event)}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-[58px] rounded-[14px] border border-[#DCE2EA] bg-white text-center text-[22px] font-semibold tracking-[0.18em] text-[#090914] outline-none transition focus:border-[var(--gtg-orange)]"
                    aria-label={`${t.login.recovery.codeTitle} ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={!canVerifyCode}
                className="mt-6 inline-flex h-[54px] w-full items-center justify-center rounded-[10px] bg-[var(--gtg-orange)] px-5 text-[16px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {verifyingCode ? t.login.recovery.verifying : `${t.login.recovery.verify} (${formatCountdown(expireSecondsLeft)})`}
              </button>

              {recoverCodeError ? <p className="mt-3 text-[13px] text-[#D14343]">{recoverCodeError}</p> : null}
              {!recoverCodeError && expireSecondsLeft <= 0 ? (
                <p className="mt-3 text-[13px] text-[#D14343]">{t.login.recovery.codeExpired}</p>
              ) : null}

              <div className="mt-4 text-[14px] text-[#98A2B3]">
                {t.login.recovery.codeExpiresIn} {formatCountdown(expireSecondsLeft)}
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => resetFlow("method")}
                  className="text-[14px] font-medium text-neutral-400 transition-colors duration-200 hover:text-neutral-600 hover:underline"
                >
                  {t.login.recovery.tryAnotherMethod}
                </button>
              </div>
            </form>
          ) : null}

          {step === "reset" ? (
            <form onSubmit={handleResetPasswordSubmit} className="mt-7 w-full max-w-[460px]">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (resetPasswordError) setResetPasswordError(null);
                    }}
                    placeholder={t.login.placeholders.password}
                    autoComplete="new-password"
                    className={`${fieldClass} pr-13`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B7C3] transition hover:text-[#8B95A6]"
                    aria-label={t.login.togglePassword}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPasswordAgain ? "text" : "password"}
                    value={passwordAgain}
                    onChange={(event) => {
                      setPasswordAgain(event.target.value);
                      if (resetPasswordError) setResetPasswordError(null);
                    }}
                    placeholder={t.login.recovery.passwordAgainPlaceholder}
                    autoComplete="new-password"
                    className={`${fieldClass} pr-13 ${resetPasswordMismatch ? "border-[#D14343] focus:border-[#D14343]" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordAgain((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B7C3] transition hover:text-[#8B95A6]"
                    aria-label={t.login.togglePassword}
                  >
                    {showPasswordAgain ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {resetPasswordMismatch ? <p className="text-[13px] text-[#D14343]">{t.login.recovery.passwordsDoNotMatch}</p> : null}
              </div>

              <div className="mt-5 space-y-2">
                <Rule ok={pwRules.min8} label={t.register.rules.min8} />
                <Rule ok={pwRules.lowerUpper} label={t.register.rules.lowerUpper} />
                <Rule ok={pwRules.number} label={t.register.rules.number} highlightInvalid={password.length > 0 && !pwRules.number} />
                <Rule ok={pwRules.symbol} label={t.register.rules.symbol} />
              </div>

              {resetPasswordError ? <p className="mt-4 text-[13px] text-[#D14343]">{resetPasswordError}</p> : null}

              <button
                type="submit"
                disabled={!canUpdatePassword}
                className="mt-8 inline-flex h-[54px] w-full items-center justify-center rounded-[10px] bg-[var(--gtg-orange)] px-5 text-[16px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {resettingPassword ? t.login.recovery.updatingPassword : t.login.recovery.updatePassword}
              </button>
            </form>
          ) : null}

          <div className="pt-8 text-center">
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="font-medium text-neutral-500 transition-colors duration-200 hover:text-neutral-700 hover:underline"
            >
              {t.login.help}
            </button>
          </div>
        </div>
      </div>

      {supportModalOpen ? (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
          onClick={() => setSupportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[720px] rounded-[28px] border border-[#EAE3D7] bg-white px-6 py-6 shadow-[0_30px_80px_rgba(17,24,39,0.22)] sm:px-8 sm:py-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-support-title"
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

            <h2 id="forgot-password-support-title" className="pr-10 text-[22px] font-semibold leading-tight text-[#2A2D33] sm:text-[24px]">
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

      {successModalMessage ? (
        <div className="fixed inset-0 z-130 flex items-center justify-center bg-[#20232B]/65 p-4 backdrop-blur-[2px]">
          <div
            className="relative w-full max-w-[720px] rounded-[22px] bg-white px-10 py-10 shadow-[0_40px_100px_rgba(15,23,42,0.32)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-updated-title"
          >
            <button
              type="button"
              onClick={handleSuccessDone}
              className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8A8A8A] transition hover:bg-[#F5F7FA] hover:text-[#636B77]"
              aria-label={closeText}
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            <div className="flex items-center gap-3 text-[18px] font-medium text-[var(--gtg-orange)] sm:text-[20px]">
              <CheckCircle2 className="h-7 w-7 fill-[var(--gtg-orange)] text-white" />
              <h2 id="password-updated-title">{t.login.recovery.passwordUpdatedTitle}</h2>
            </div>

            <p className="mt-8 max-w-[560px] text-[18px] leading-[1.45] text-[#95A1B2]">{successModalMessage}</p>

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleSuccessDone}
                className="inline-flex h-[52px] min-w-[120px] items-center justify-center rounded-[10px] bg-[var(--gtg-orange)] px-8 text-[16px] font-semibold text-white transition hover:brightness-95"
              >
                {t.login.recovery.done}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
