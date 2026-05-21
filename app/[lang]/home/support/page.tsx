"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { api } from "@/lib/api/client";
import { langToDil, normalizeLang, type Lang } from "@/lib/i18n/languages";

type CustomerData = {
  MusteriEmail?: string;
};

type CustomerGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerData | null;
};

type SupportCreateResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

const SUPPORT_MESSAGE_MIN_LENGTH = 3;
const SUPPORT_MESSAGE_MAX_LENGTH = 255;

function validateSupportMessage(value: string): "required" | "min" | "max" | null {
  const length = value.trim().length;
  if (length === 0) return "required";
  if (length < SUPPORT_MESSAGE_MIN_LENGTH) return "min";
  if (length > SUPPORT_MESSAGE_MAX_LENGTH) return "max";
  return null;
}

const SUPPORT_TEXT: Record<
  Lang,
  {
    pageTitle: string;
    breadcrumbParent: string;
    contactTitle: string;
    contactDesc: string;
    loading: string;
    loadError: string;
    sendError: string;
    noData: string;
    email: string;
    contactMessageLabel: string;
    contactSend: string;
    contactSending: string;
    contactSendOk: string;
    supportNo: string;
    contactEmailMissing: string;
    contactMessageRequired: string;
    contactMessageMin: string;
    contactMessageMax: string;
  }
> = {
  tr: {
    pageTitle: "Destek",
    breadcrumbParent: "Diğer",
    contactTitle: "İletişim",
    contactDesc: "Destek talebinizi aşağıdaki form ile iletebilirsiniz.",
    loading: "Yükleniyor...",
    loadError: "Hesap bilgileri yüklenemedi.",
    sendError: "Destek mesajı gönderilemedi.",
    noData: "Hesap bilgisi bulunamadı.",
    email: "E-posta Adresi",
    contactMessageLabel: "Mesajınız",
    contactSend: "Mesaj Gönder",
    contactSending: "Gönderiliyor...",
    contactSendOk: "Mesajınız gönderildi.",
    supportNo: "Destek No",
    contactEmailMissing: "Giriş yapan kullanıcı e-postası bulunamadı.",
    contactMessageRequired: "Mesaj boş olamaz.",
    contactMessageMin: "Mesaj en az 3 karakter olmalıdır.",
    contactMessageMax: "Mesaj en fazla 255 karakter olabilir.",
  },
  en: {
    pageTitle: "Support",
    breadcrumbParent: "Other",
    contactTitle: "Contact Us",
    contactDesc: "Send your support request using the form below.",
    loading: "Loading...",
    loadError: "Failed to load account details.",
    sendError: "Failed to send support message.",
    noData: "No account information found.",
    email: "Email Address",
    contactMessageLabel: "Your Message",
    contactSend: "Send Message",
    contactSending: "Sending...",
    contactSendOk: "Your message has been sent.",
    supportNo: "Support No",
    contactEmailMissing: "Logged in user email is not available.",
    contactMessageRequired: "Message is required.",
    contactMessageMin: "Message must be at least 3 characters.",
    contactMessageMax: "Message must be at most 255 characters.",
  },
  ru: {
    pageTitle: "Поддержка",
    breadcrumbParent: "Другое",
    contactTitle: "Связаться с нами",
    contactDesc: "Отправьте запрос в поддержку через форму ниже.",
    loading: "Загрузка...",
    loadError: "Не удалось загрузить данные аккаунта.",
    sendError: "Не удалось отправить сообщение в поддержку.",
    noData: "Информация об аккаунте не найдена.",
    email: "Адрес e-mail",
    contactMessageLabel: "Ваше сообщение",
    contactSend: "Отправить сообщение",
    contactSending: "Отправка...",
    contactSendOk: "Ваше сообщение отправлено.",
    supportNo: "Номер обращения",
    contactEmailMissing: "E-mail вошедшего пользователя недоступен.",
    contactMessageRequired: "Сообщение обязательно.",
    contactMessageMin: "Сообщение должно содержать минимум 3 символа.",
    contactMessageMax: "Сообщение может содержать не более 255 символов.",
  },
  es: {
    pageTitle: "Soporte",
    breadcrumbParent: "Otro",
    contactTitle: "Contáctanos",
    contactDesc: "Envía tu solicitud de soporte usando el formulario de abajo.",
    loading: "Cargando...",
    loadError: "No se pudieron cargar los datos de la cuenta.",
    sendError: "No se pudo enviar el mensaje de soporte.",
    noData: "No se encontró información de la cuenta.",
    email: "Correo electrónico",
    contactMessageLabel: "Tu mensaje",
    contactSend: "Enviar mensaje",
    contactSending: "Enviando...",
    contactSendOk: "Tu mensaje ha sido enviado.",
    supportNo: "N.º de soporte",
    contactEmailMissing: "El correo del usuario conectado no está disponible.",
    contactMessageRequired: "El mensaje es obligatorio.",
    contactMessageMin: "El mensaje debe tener al menos 3 caracteres.",
    contactMessageMax: "El mensaje debe tener como máximo 255 caracteres.",
  },
  fr: {
    pageTitle: "Support",
    breadcrumbParent: "Autre",
    contactTitle: "Nous contacter",
    contactDesc: "Envoyez votre demande de support avec le formulaire ci-dessous.",
    loading: "Chargement...",
    loadError: "Impossible de charger les informations du compte.",
    sendError: "Impossible d'envoyer le message au support.",
    noData: "Aucune information de compte trouvée.",
    email: "Adresse e-mail",
    contactMessageLabel: "Votre message",
    contactSend: "Envoyer le message",
    contactSending: "Envoi...",
    contactSendOk: "Votre message a été envoyé.",
    supportNo: "N° de support",
    contactEmailMissing: "L'e-mail de l'utilisateur connecté n'est pas disponible.",
    contactMessageRequired: "Le message est obligatoire.",
    contactMessageMin: "Le message doit contenir au moins 3 caractères.",
    contactMessageMax: "Le message doit contenir au maximum 255 caractères.",
  },
};

export default function SupportPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactTouched, setContactTouched] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  const text = useMemo(() => SUPPORT_TEXT[lang], [lang]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<CustomerGetResponse>(`/api/customer?dil=${dil}`);
        if (cancelled) return;
        setCustomer(data?.Data ?? null);
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? text.loadError));
        setCustomer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, text.loadError]);

  const plainInputClass =
    "w-full rounded-xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-[15px] text-[#1f2937] outline-none";

  const contactEmail = (customer?.MusteriEmail ?? "").trim();
  const trimmedContactMessage = contactMessage.trim();
  const contactMessageValidation = validateSupportMessage(contactMessage);
  const contactMessageError =
    contactMessageValidation === "required"
      ? text.contactMessageRequired
      : contactMessageValidation === "min"
      ? text.contactMessageMin
      : contactMessageValidation === "max"
      ? text.contactMessageMax
      : null;
  const contactEmailError = contactEmail ? null : text.contactEmailMissing;
  const canSendContact =
    !loading &&
    !error &&
    !!customer &&
    !contactSending &&
    !contactEmailError &&
    !contactMessageError;

  async function handleSendContact() {
    setContactTouched(true);
    if (contactEmailError || contactMessageError) {
      setContactSuccess(null);
      setContactError(contactEmailError ?? contactMessageError);
      return;
    }
    if (!canSendContact) return;

    try {
      setContactSending(true);
      setContactError(null);
      setContactSuccess(null);

      const response = await api.post<SupportCreateResponse>(`/api/support?kaynak=2&dil=${dil}`, {
        destekEmail: contactEmail,
        destekMetin: trimmedContactMessage,
      });

      setContactMessage("");
      setContactTouched(false);
      const supportNr = response?.Data?.Nr;
      setContactSuccess(
        typeof supportNr === "number" && Number.isFinite(supportNr)
          ? `${text.contactSendOk} (${text.supportNo}: ${supportNr})`
          : text.contactSendOk
      );
    } catch (err: any) {
      setContactError(String(err?.message ?? text.sendError));
    } finally {
      setContactSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <header className="flex items-center justify-between border-b border-[#d6dae2] bg-[#f3f3f5] px-4 py-4 lg:px-7">
        <h1 className="ml-14 text-[31px] font-semibold text-[#1f232b] lg:ml-0">{text.pageTitle}</h1>
      </header>

      <div className="px-4 py-5 lg:px-7">
        <div className="mb-4 text-[15px] text-[#8b95a7]">
          {text.breadcrumbParent} <span className="mx-2 text-neutral-400">/</span>
          <span className="text-neutral-800">{text.pageTitle}</span>
        </div>

        <div className="rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] p-6 lg:p-6">
          <h2 className="text-[34px] font-semibold leading-tight text-[#1f232b]">{text.contactTitle}</h2>
          <p className="mt-1.5 text-[15px] text-[#66738e]">{text.contactDesc}</p>

          {loading ? <div className="mt-8 text-sm text-neutral-500">{text.loading}</div> : null}
          {!loading && error ? <div className="mt-8 text-sm text-red-600">{error}</div> : null}
          {!loading && !error && !customer ? <div className="mt-8 text-sm text-neutral-500">{text.noData}</div> : null}

          {!loading && !error && customer ? (
            <div className="mt-8">
              <div className="mb-4">
                <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.email}</label>
                <input value={contactEmail} readOnly className={`${plainInputClass} bg-[#eef1f5] text-[#66738e]`} />
              </div>

              <div>
                <label className="mb-2 block text-[15px] text-[#66738e]">{text.contactMessageLabel}</label>
                <textarea
                  value={contactMessage}
                  maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
                  rows={6}
                  aria-invalid={contactTouched && !!contactMessageError}
                  onChange={(event) => {
                    setContactMessage(event.target.value);
                    if (!contactTouched) setContactTouched(true);
                    if (contactError) setContactError(null);
                    if (contactSuccess) setContactSuccess(null);
                  }}
                  className="w-full resize-none rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-[15px] leading-8 text-[#1f2937] outline-none focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                />
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    {contactTouched && contactMessageError ? <p className="text-xs text-red-600">{contactMessageError}</p> : null}
                    {contactEmailError ? <p className="text-xs text-red-600">{contactEmailError}</p> : null}
                    {contactError ? <p className="text-xs text-red-600">{contactError}</p> : null}
                    {contactSuccess ? <p className="text-xs text-[#16a34a]">{contactSuccess}</p> : null}
                  </div>
                  <div className="text-[15px] text-[#8b95a7]">
                    {contactMessage.length}/{SUPPORT_MESSAGE_MAX_LENGTH}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendContact}
                  disabled={!canSendContact}
                  className={clsx(
                    "rounded-2xl px-8 py-3 text-[15px] font-semibold transition",
                    canSendContact
                      ? "bg-[var(--gtg-orange)] text-white"
                      : "cursor-not-allowed bg-[#d9dde4] text-white"
                  )}
                >
                  {contactSending ? text.contactSending : text.contactSend}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
