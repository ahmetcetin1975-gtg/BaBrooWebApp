"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { normalizeLang, type Lang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import { CUSTOMER_UPDATED_EVENT, type CustomerUpdatedDetail } from "@/lib/customer/events";
import { persistLanguagePreference } from "@/lib/i18n/client-language";
import { toLangHref } from "@/lib/i18n/routing";

type CustomerData = {
  Nr?: number;
  MusteriAdi?: string;
  MusteriSoyadi?: string;
  MusteriEmail?: string;
  MusteriEmailOnayli?: boolean;
  MusteriTel?: string;
  MusteriTelOnayli?: boolean;
  MusteriCoin?: number;
  MusteriUlkeNr?: number;
  MusteriLastloginat?: string;
  MusteriResimUrl?: string;
};

type CustomerGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerData | null;
};

type CustomerSaveResponse = {
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

type NotificationStatusResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    BildirimAcikDurumu?: boolean;
  } | null;
};

type OrderHistoryItem = {
  Nr?: number;
  MuspaketPaketNr?: number;
  MuspaketCoin?: number;
  MuspaketFiyat?: number;
  OlusturmaZamani?: string;
  PaketAdi?: string;
  PaketAciklama?: string;
  PaketCoin?: number;
  PaketFiyat?: number;
  DovizAdi?: string;
  DovizKisaAdi?: string;
  DovizSembol?: string;
};

type OrderHistoryResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: OrderHistoryItem[] | null;
};

type StorePackageItem = {
  Nr?: number;
  PaketAdi?: string;
  PaketCoin?: number;
  PaketFiyat?: number;
  PaketAciklama?: string;
  DovizAdi?: string;
  DovizKisaAdi?: string;
  "DovizKısaAdi"?: string;
  DovizSembol?: string;
  DovizSembolu?: string;
};

type StorePackagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: StorePackageItem[] | null;
};

type MissionItem = {
  Nr?: number;
  GorevAdi?: string;
  GorevAciklamasi?: string;
  GorevAdres?: string;
  GorevResim?: string;
  GorevCoin?: number;
  Aktif?: boolean;
  GorevDone?: boolean;
};

type MissionsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: MissionItem[] | null;
};

type PrivacyItem = {
  Nr?: number;
  Baslik?: string;
  Detay?: string;
  Aciklama?: string;
  Aktif?: boolean;
};

type PrivacyGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: PrivacyItem[] | null;
};

type ProfileFormState = {
  ad: string;
  soyad: string;
};

type SettingTabKey =
  | "profile"
  | "missions"
  | "store"
  | "orderHistory"
  | "language"
  | "contact"
  | "sound"
  | "privacy"
  | "terms";

function isSettingTabKey(value: string | null | undefined): value is SettingTabKey {
  return (
    value === "profile" ||
    value === "missions" ||
    value === "store" ||
    value === "orderHistory" ||
    value === "language" ||
    value === "contact" ||
    value === "sound" ||
    value === "privacy" ||
    value === "terms"
  );
}

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const SUPPORT_MESSAGE_MIN_LENGTH = 3;
const SUPPORT_MESSAGE_MAX_LENGTH = 255;
const IYZICO_PAYMENT_URL = "https://www.iyzico.com/";

function formatPhone(value: string | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return value;
}

function validateName(value: string): "required" | "min" | "max" | null {
  const length = value.trim().length;
  if (length === 0) return "required";
  if (length < NAME_MIN_LENGTH) return "min";
  if (length > NAME_MAX_LENGTH) return "max";
  return null;
}

function validateSupportMessage(value: string): "required" | "min" | "max" | null {
  const length = value.trim().length;
  if (length === 0) return "required";
  if (length < SUPPORT_MESSAGE_MIN_LENGTH) return "min";
  if (length > SUPPORT_MESSAGE_MAX_LENGTH) return "max";
  return null;
}

function sanitizePolicyHtml(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function formatOrderDate(value: string | undefined, locale: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function SettingsPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = lang === "tr" ? 1 : 2;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [activeTab, setActiveTab] = useState<SettingTabKey>("profile");
  const [form, setForm] = useState<ProfileFormState>({ ad: "", soyad: "" });
  const [initialForm, setInitialForm] = useState<ProfileFormState>({ ad: "", soyad: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacyItems, setPrivacyItems] = useState<PrivacyItem[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termsItems, setTermsItems] = useState<PrivacyItem[]>([]);
  const [contactMessage, setContactMessage] = useState("");
  const [contactTouched, setContactTouched] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundSaving, setSoundSaving] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState<string | null>(null);
  const [orderHistoryItems, setOrderHistoryItems] = useState<OrderHistoryItem[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storePackages, setStorePackages] = useState<StorePackageItem[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [missionSubmittingNr, setMissionSubmittingNr] = useState<number | null>(null);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

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
        setError(String(err?.message ?? "Failed to load account details"));
        setCustomer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil]);

  useEffect(() => {
    const ad = customer?.MusteriAdi ?? "";
    const soyad = customer?.MusteriSoyadi ?? "";
    setForm({ ad, soyad });
    setInitialForm({ ad, soyad });
    setSaveError(null);
    setSaveSuccess(null);
  }, [customer?.MusteriAdi, customer?.MusteriSoyadi]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!isSettingTabKey(tabParam)) return;
    setActiveTab((prev) => (prev === tabParam ? prev : tabParam));
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== "privacy") return;

    let cancelled = false;

    (async () => {
      try {
        setPrivacyLoading(true);
        setPrivacyError(null);
        const data = await api.get<PrivacyGetResponse>(`/api/privacy?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setPrivacyItems(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setPrivacyError(String(err?.message ?? "Failed to load privacy policy"));
        setPrivacyItems([]);
      } finally {
        if (!cancelled) setPrivacyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "terms") return;

    let cancelled = false;

    (async () => {
      try {
        setTermsLoading(true);
        setTermsError(null);
        const data = await api.get<PrivacyGetResponse>(`/api/terms?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setTermsItems(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setTermsError(String(err?.message ?? "Failed to load user terms and conditions"));
        setTermsItems([]);
      } finally {
        if (!cancelled) setTermsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "sound") return;

    let cancelled = false;

    (async () => {
      try {
        setSoundLoading(true);
        setSoundError(null);
        const data = await api.get<NotificationStatusResponse>(`/api/notifications?dil=${dil}`);
        if (cancelled) return;
        setSoundEnabled(Boolean(data?.Data?.BildirimAcikDurumu));
      } catch (err: any) {
        if (cancelled) return;
        setSoundError(String(err?.message ?? "Failed to load notification status"));
      } finally {
        if (!cancelled) setSoundLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "orderHistory") return;

    let cancelled = false;

    (async () => {
      try {
        setOrderHistoryLoading(true);
        setOrderHistoryError(null);
        const data = await api.get<OrderHistoryResponse>(`/api/order-history?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setOrderHistoryItems(items);
      } catch (err: any) {
        if (cancelled) return;
        setOrderHistoryError(String(err?.message ?? "Failed to load order history"));
        setOrderHistoryItems([]);
      } finally {
        if (!cancelled) setOrderHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "missions") return;

    let cancelled = false;

    (async () => {
      try {
        setMissionsLoading(true);
        setMissionsError(null);
        const data = await api.get<MissionsResponse>(`/api/missions?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setMissions(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setMissionsError(String(err?.message ?? "Failed to load missions"));
        setMissions([]);
      } finally {
        if (!cancelled) setMissionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab !== "store") return;

    let cancelled = false;

    (async () => {
      try {
        setStoreLoading(true);
        setStoreError(null);
        const data = await api.get<StorePackagesResponse>(`/api/store?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setStorePackages(items);
      } catch (err: any) {
        if (cancelled) return;
        setStoreError(String(err?.message ?? "Failed to load store packages"));
        setStorePackages([]);
      } finally {
        if (!cancelled) setStoreLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, dil]);

  useEffect(() => {
    if (activeTab === "contact") return;
    setContactTouched(false);
    setContactError(null);
    setContactSuccess(null);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "language") {
      setLanguageMenuOpen(false);
    }
  }, [activeTab]);

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            title: "Ayarlar",
            breadcrumbParent: "Diğer",
            profile: "Profil",
            missions: "Görevler",
            missionsTitle: "Görevler",
            missionsDesc: "Görevleri tamamlayın ve coin kazanın.",
            missionsLoading: "Görevler yükleniyor...",
            missionsNoData: "Aktif görev bulunamadı.",
            missionCoin: "Coin",
            missionGo: "Göreve Git ve Tamamla",
            missionDone: "Tamamlandı",
            missionLink: "Görev Linki",
            missionTakeCoin: "Coini Al",
            missionCompletedCard: "Görev Tamamlandı",
            store: "Mağaza",
            storeTitle: "Plan ve Fiyatlandırma",
            storeDesc: "Size en uygun coin paketini seçin ve kullanımınızı güncelleyin.",
            storeLoading: "Paketler yükleniyor...",
            storeNoData: "Aktif paket bulunamadı.",
            storeBuy: "Satın Al",
            storeCurrentPlan: "Mevcut Plan",
            storeUpgradePlan: "Planı Yükselt",
            storeDowngradePlan: "Düşür",
            storePerMonth: "/ ay",
            storeOneTime: "tek seferlik",
            storeFeatureCoin: "{coin} coin",
            storeFeatureFast: "Anında kullanım",
            storeFeatureSecure: "Güvenli ödeme",
            storeFeatureSupport: "7/24 destek",
            orderHistory: "Sipariş Geçmişi",
            orderHistoryTitle: "Sipariş Geçmişi",
            orderHistoryDesc: "Fatura ve paket ödemelerinizi buradan takip edebilirsiniz.",
            orderNo: "Sipariş No",
            orderDate: "Tarih",
            orderPlan: "Paket",
            orderAmount: "Tutar",
            orderHistoryLoading: "Sipariş geçmişi yükleniyor...",
            orderHistoryNoData: "Sipariş geçmişi bulunamadı.",
            language: "Dil",
            chooseLanguageTitle: "Dil Seçin",
            chooseLanguageDesc: "Dil seçiminizi yapın. Değişiklik tüm sitede uygulanır.",
            languageField: "Dil",
            languageTr: "Türkçe",
            languageEn: "İngilizce",
            contact: "İletişim",
            contactTitle: "İletişim",
            contactDesc: "Destek talebinizi aşağıdaki form ile iletebilirsiniz.",
            contactMessageLabel: "Mesajınız",
            contactSend: "Mesaj Gönder",
            contactSending: "Gönderiliyor...",
            contactSendOk: "Mesajınız gönderildi.",
            supportNo: "Destek No",
            contactEmailMissing: "Giriş yapan kullanıcı e-postası bulunamadı.",
            contactMessageRequired: "Mesaj boş olamaz.",
            contactMessageMin: "Mesaj en az 3 karakter olmalıdır.",
            contactMessageMax: "Mesaj en fazla 255 karakter olabilir.",
            sound: "Ses Bildirimleri",
            soundTitle: "Push Bildirimleri",
            soundDesc: "Mesaj bildirimlerini bu alandan açıp kapatabilirsiniz.",
            soundMessageTitle: "Mesaj Bildirimleri",
            soundMessageDesc: "Yeni mesaj aldığınızda bildirim alırsınız.",
            soundOn: "Açık",
            soundOff: "Kapalı",
            soundLoading: "Bildirim durumu yükleniyor...",
            privacy: "Gizlilik Politikası",
            terms: "Kullanıcı Şart ve Koşulları",
            policiesTitle: "Politikalar",
            policiesDesc: "Gizlilik ve KVKK metinleri aşağıda listelenmiştir.",
            termsTitle: "Kullanıcı Şart ve Koşulları",
            termsDesc: "Kullanıcı şart ve koşul metinleri aşağıda listelenmiştir.",
            accountDetails: "Hesap Detayları",
            accountDesc: "Kullanıcılar size bu bilgilerle ulaşacaktır.",
            name: "Ad",
            surname: "Soyad",
            password: "Şifre",
            email: "E-posta Adresi",
            phone: "Telefon Numarası",
            deleteAccount: "Hesabı Sil",
            verify: "Onayla",
            checked: "Onaylandı",
            save: "Kaydet",
            cancel: "Vazgeç",
            loading: "Yükleniyor...",
            noData: "Hesap bilgisi bulunamadı.",
            sectionSoon: "Bu bölüm yakında aktif olacak.",
            saving: "Kaydediliyor...",
            saveOk: "Bilgiler kaydedildi.",
            privacyLoading: "Gizlilik metni yükleniyor...",
            privacyNoData: "Gizlilik metni bulunamadı.",
            termsLoading: "Kullanıcı şart ve koşulları yükleniyor...",
            termsNoData: "Kullanıcı şart ve koşulları bulunamadı.",
            nameRequired: "Ad boş olamaz.",
            nameMin: "Ad en az 2 karakter olmalıdır.",
            nameMax: "Ad en fazla 100 karakter olabilir.",
            surnameRequired: "Soyad boş olamaz.",
            surnameMin: "Soyad en az 2 karakter olmalıdır.",
            surnameMax: "Soyad en fazla 100 karakter olabilir.",
          }
        : {
            title: "Settings",
            breadcrumbParent: "Other",
            profile: "Profile",
            missions: "Missions",
            missionsTitle: "Missions",
            missionsDesc: "Complete missions and earn coins.",
            missionsLoading: "Loading missions...",
            missionsNoData: "No active missions found.",
            missionCoin: "Coin",
            missionGo: "Go and Complete",
            missionDone: "Completed",
            missionLink: "Mission Link",
            missionTakeCoin: "Take the Coin",
            missionCompletedCard: "Mission Completed",
            store: "Store",
            storeTitle: "Plan & Pricing",
            storeDesc:
              "Manage your subscription plans. Choose a plan that best suits your needs, compare features, and adjust your subscription as needed.",
            storeLoading: "Loading packages...",
            storeNoData: "No active package found.",
            storeBuy: "Buy Now",
            storeCurrentPlan: "Current Plan",
            storeUpgradePlan: "Upgrade Plan",
            storeDowngradePlan: "Downgrade",
            storePerMonth: "/ month",
            storeOneTime: "one-time",
            storeFeatureCoin: "{coin} coin",
            storeFeatureFast: "Instant activation",
            storeFeatureSecure: "Secure payment",
            storeFeatureSupport: "24/7 support",
            orderHistory: "Order History",
            orderHistoryTitle: "Order History",
            orderHistoryDesc: "Review and update your billing information to ensure accurate and timely payments.",
            orderNo: "Order No #",
            orderDate: "Date",
            orderPlan: "Plan",
            orderAmount: "Amount",
            orderHistoryLoading: "Loading order history...",
            orderHistoryNoData: "No order history found.",
            language: "Language",
            chooseLanguageTitle: "Choose Your Language",
            chooseLanguageDesc: "Set your language. The change applies across the whole site.",
            languageField: "Language",
            languageTr: "Turkish",
            languageEn: "English",
            contact: "Contact Us",
            contactTitle: "Contact Us",
            contactDesc: "Send your support request using the form below.",
            contactMessageLabel: "Your Message",
            contactSend: "Send Message",
            contactSending: "Sending...",
            contactSendOk: "Your message has been sent.",
            supportNo: "Support No",
            contactEmailMissing: "Logged in user email is not available.",
            contactMessageRequired: "Message is required.",
            contactMessageMin: "Message must be at least 3 characters.",
            contactMessageMax: "Message must be at most 255 characters.",
            sound: "Sound Notification",
            soundTitle: "Push Notifications",
            soundDesc: "Control your message notifications from here.",
            soundMessageTitle: "Message Notification",
            soundMessageDesc: "You will receive notifications for new messages.",
            soundOn: "On",
            soundOff: "Off",
            soundLoading: "Loading notification status...",
            privacy: "Privacy Policy",
            terms: "User Terms and Conditions",
            policiesTitle: "Policies",
            policiesDesc: "Privacy and compliance policy texts are listed below.",
            termsTitle: "User Terms and Conditions",
            termsDesc: "User terms and conditions texts are listed below.",
            accountDetails: "Account Details",
            accountDesc: "Your users will use this information to contact you.",
            name: "Name",
            surname: "Surname",
            password: "Password",
            email: "Email Address",
            phone: "Phone Number",
            deleteAccount: "Delete Account",
            verify: "Verify",
            checked: "Verified",
            save: "Save Change",
            cancel: "Cancel",
            loading: "Loading...",
            noData: "No account information found.",
            sectionSoon: "This section will be available soon.",
            saving: "Saving...",
            saveOk: "Account details saved.",
            privacyLoading: "Loading privacy policy...",
            privacyNoData: "No privacy policy found.",
            termsLoading: "Loading user terms and conditions...",
            termsNoData: "No user terms and conditions found.",
            nameRequired: "Name is required.",
            nameMin: "Name must be at least 2 characters.",
            nameMax: "Name must be at most 100 characters.",
            surnameRequired: "Surname is required.",
            surnameMin: "Surname must be at least 2 characters.",
            surnameMax: "Surname must be at most 100 characters.",
          },
    [lang]
  );

  const tabItems: Array<{ key: SettingTabKey; label: string }> = [
    { key: "profile", label: text.profile },
    { key: "missions", label: text.missions },
    { key: "store", label: text.store },
    { key: "orderHistory", label: text.orderHistory },
    { key: "language", label: text.language },
    { key: "contact", label: text.contact },
    { key: "sound", label: text.sound },
    { key: "privacy", label: text.privacy },
    { key: "terms", label: text.terms },
  ];
  const activeTabLabel = tabItems.find((tab) => tab.key === activeTab)?.label ?? text.profile;

  const isProfileTab = activeTab === "profile";
  const isMissionsTab = activeTab === "missions";
  const isStoreTab = activeTab === "store";
  const isOrderHistoryTab = activeTab === "orderHistory";
  const isLanguageTab = activeTab === "language";
  const isContactTab = activeTab === "contact";
  const isSoundTab = activeTab === "sound";
  const isPrivacyTab = activeTab === "privacy";
  const isTermsTab = activeTab === "terms";
  const isPolicyTab = isPrivacyTab || isTermsTab;
  const languageOptions: Array<{ code: Lang; label: string; flag: string; alt: string }> = [
    { code: "tr", label: text.languageTr, flag: "/assets/images/turkey.png", alt: "Turkey" },
    { code: "en", label: text.languageEn, flag: "/assets/images/united-states.png", alt: "United States" },
  ];
  const selectedLanguageOption =
    languageOptions.find((option) => option.code === lang) ?? languageOptions[0];
  const policyLoading = isPrivacyTab ? privacyLoading : termsLoading;
  const policyError = isPrivacyTab ? privacyError : termsError;
  const policyItems = isPrivacyTab ? privacyItems : termsItems;
  const policyLoadingText = isPrivacyTab ? text.privacyLoading : text.termsLoading;
  const policyNoDataText = isPrivacyTab ? text.privacyNoData : text.termsNoData;
  const orderDateLocale = lang === "tr" ? "tr-TR" : "en-US";
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
    isContactTab &&
    !loading &&
    !error &&
    !!customer &&
    !contactSending &&
    !contactEmailError &&
    !contactMessageError;
  const trimmedForm = { ad: form.ad.trim(), soyad: form.soyad.trim() };
  const trimmedInitialForm = { ad: initialForm.ad.trim(), soyad: initialForm.soyad.trim() };
  const adValidation = validateName(form.ad);
  const soyadValidation = validateName(form.soyad);
  const adError =
    adValidation === "required"
      ? text.nameRequired
      : adValidation === "min"
      ? text.nameMin
      : adValidation === "max"
      ? text.nameMax
      : null;
  const soyadError =
    soyadValidation === "required"
      ? text.surnameRequired
      : soyadValidation === "min"
      ? text.surnameMin
      : soyadValidation === "max"
      ? text.surnameMax
      : null;
  const hasValidationError = Boolean(adError || soyadError);
  const isDirty =
    trimmedForm.ad !== trimmedInitialForm.ad || trimmedForm.soyad !== trimmedInitialForm.soyad;
  const canSave =
    isProfileTab && !loading && !error && !!customer && isDirty && !saving && !hasValidationError;
  const canCancel = isProfileTab && isDirty && !saving;
  const panelTitle = isProfileTab
    ? text.accountDetails
    : isMissionsTab
    ? text.missionsTitle
    : isStoreTab
    ? text.storeTitle
    : isOrderHistoryTab
    ? text.orderHistoryTitle
    : isLanguageTab
    ? text.chooseLanguageTitle
    : isContactTab
    ? text.contactTitle
    : isSoundTab
    ? text.soundTitle
    : isPrivacyTab
    ? text.policiesTitle
    : isTermsTab
    ? text.termsTitle
    : activeTabLabel;
  const panelDescription = isProfileTab
    ? text.accountDesc
    : isMissionsTab
    ? text.missionsDesc
    : isStoreTab
    ? text.storeDesc
    : isOrderHistoryTab
    ? text.orderHistoryDesc
    : isLanguageTab
    ? text.chooseLanguageDesc
    : isContactTab
    ? text.contactDesc
    : isSoundTab
    ? text.soundDesc
    : isPrivacyTab
    ? text.policiesDesc
    : isTermsTab
    ? text.termsDesc
    : text.sectionSoon;

  const phonePrefix = customer?.MusteriUlkeNr === 1 ? "TR +90" : "";
  const phoneText = formatPhone(customer?.MusteriTel);
  const customerPhoto = (customer?.MusteriResimUrl ?? "").trim();
  const customerFullName = `${form.ad} ${form.soyad}`.trim();
  const customerInitials =
    `${form.ad.charAt(0)}${form.soyad.charAt(0)}`.toUpperCase().trim() || "?";

  const plainInputClass =
    "w-full rounded-xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-[15px] text-[#1f2937] outline-none";

  function formatOrderAmount(item: OrderHistoryItem): string {
    const amount =
      typeof item.MuspaketFiyat === "number"
        ? item.MuspaketFiyat
        : typeof item.PaketFiyat === "number"
        ? item.PaketFiyat
        : null;
    if (amount == null) return "-";
    const symbol = (item.DovizSembol ?? "").trim();
    const formatted = amount.toLocaleString(orderDateLocale, {
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return symbol ? `${symbol}${formatted}` : formatted;
  }

  function formatMissionCoin(value: number | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return value.toLocaleString(orderDateLocale, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  function getStoreCurrencySymbol(item: StorePackageItem): string {
    return (item.DovizSembolu ?? item.DovizSembol ?? "").trim();
  }

  function formatStorePrice(item: StorePackageItem): string {
    if (typeof item.PaketFiyat !== "number" || !Number.isFinite(item.PaketFiyat)) return "-";
    const formatted = item.PaketFiyat.toLocaleString(orderDateLocale, {
      minimumFractionDigits: Number.isInteger(item.PaketFiyat) ? 0 : 2,
      maximumFractionDigits: 2,
    });
    const symbol = getStoreCurrencySymbol(item);
    return symbol ? `${symbol}${formatted}` : formatted;
  }

  function getMissionHeadline(item: MissionItem, fallbackTitle: string): string {
    const coin = formatMissionCoin(item.GorevCoin);
    if (coin === "-") return fallbackTitle;
    return lang === "tr" ? `${coin} Coin Kazan!` : `Free ${coin} Coin!`;
  }

  async function handleSave() {
    if (adError || soyadError) {
      setSaveSuccess(null);
      setSaveError(adError ?? soyadError);
      return;
    }
    if (!canSave) return;

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      await api.post<CustomerSaveResponse>(`/api/customer/save?kaynak=2&dil=${dil}`, {
        ad: trimmedForm.ad,
        soyad: trimmedForm.soyad,
      });

      setForm({ ad: trimmedForm.ad, soyad: trimmedForm.soyad });
      setInitialForm({ ad: trimmedForm.ad, soyad: trimmedForm.soyad });
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              MusteriAdi: trimmedForm.ad,
              MusteriSoyadi: trimmedForm.soyad,
            }
          : prev
      );
      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, {
          detail: { ad: trimmedForm.ad, soyad: trimmedForm.soyad },
        })
      );
      setSaveSuccess(text.saveOk);
    } catch (err: any) {
      setSaveError(String(err?.message ?? "Failed to save account details"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!canCancel) return;
    setForm({ ad: initialForm.ad, soyad: initialForm.soyad });
    setSaveError(null);
    setSaveSuccess(null);
  }

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
      setContactError(String(err?.message ?? "Failed to send support message"));
    } finally {
      setContactSending(false);
    }
  }

  async function handleMissionComplete(item: MissionItem) {
    const gorevNr = item.Nr;
    if (!gorevNr || item.GorevDone || missionSubmittingNr === gorevNr) return;

    const missionUrl = (item.GorevAdres ?? "").trim();
    if (missionUrl) {
      window.open(missionUrl, "_blank", "noopener,noreferrer");
    }

    try {
      setMissionSubmittingNr(gorevNr);
      setMissionsError(null);
      await api.post(`/api/missions/done?gorevNr=${gorevNr}&kaynak=2&dil=${dil}`, {});
      setMissions((prev) =>
        prev.map((mission) =>
          mission.Nr === gorevNr ? { ...mission, GorevDone: true } : mission
        )
      );
      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, { detail: {} })
      );
    } catch (err: any) {
      setMissionsError(String(err?.message ?? "Failed to complete mission"));
    } finally {
      setMissionSubmittingNr(null);
    }
  }

  function handleLanguageSelect(nextLang: Lang) {
    setLanguageMenuOpen(false);
    if (nextLang === lang) return;

    persistLanguagePreference(nextLang);
    router.push(toLangHref(pathname, nextLang));
  }

  async function handleSoundToggle(nextValue: boolean) {
    if (soundSaving) return;

    const prevValue = soundEnabled;
    setSoundEnabled(nextValue);
    setSoundSaving(true);
    setSoundError(null);

    try {
      await api.post(`/api/notifications?bildirim=${nextValue ? 1 : 0}&kaynak=2&dil=${dil}`, {});
    } catch (err: any) {
      setSoundEnabled(prevValue);
      setSoundError(String(err?.message ?? "Failed to update notification status"));
    } finally {
      setSoundSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <header className="flex items-center justify-between border-b border-[#d6dae2] bg-[#f3f3f5] px-4 py-4 lg:px-7">
        <h1 className="ml-14 text-[31px] font-semibold text-[#1f232b] lg:ml-0">{text.title}</h1>
        {isProfileTab ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!canCancel}
              className={clsx(
                "rounded-xl border px-7 py-2.5 text-[15px] font-semibold transition",
                canCancel
                  ? "border-[#cfd4de] bg-[#efeff2] text-[#2a313d]"
                  : "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
              )}
            >
              {text.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={clsx(
                "rounded-xl px-7 py-2.5 text-[15px] font-semibold shadow-sm transition",
                canSave
                  ? "bg-[var(--gtg-orange)] text-white"
                  : "cursor-not-allowed bg-[#d9dde4] text-white"
              )}
            >
              {saving ? text.saving : text.save}
            </button>
          </div>
        ) : null}
      </header>

      <div className="px-4 py-5 lg:px-7">
        <div className="mb-4 text-[15px] text-[#8b95a7]">
          {text.breadcrumbParent} <span className="mx-2 text-neutral-400">/</span>
          <span className="text-neutral-800">{text.title}</span>
        </div>

        <div className="rounded-2xl border border-[#cfd4de] bg-[#f7f7f9]">
          <div className="grid min-h-[640px] grid-cols-1 xl:grid-cols-[200px_1fr]">
            <aside className="border-b border-[#cfd4de] p-4 xl:border-b-0 xl:border-r">
              <div className="space-y-1" role="tablist" aria-orientation="vertical">
                {tabItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    role="tab"
                    aria-selected={activeTab === item.key}
                    aria-controls={`settings-panel-${item.key}`}
                    id={`settings-tab-${item.key}`}
                    className={clsx(
                      "w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-[15px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]",
                      activeTab === item.key
                        ? "border border-[#cfd4de] bg-[#eef1f6] text-neutral-900"
                        : "text-[#66738e] hover:bg-[#f8f8fb]"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </aside>

            <section
              className="p-6 lg:p-6"
              role="tabpanel"
              id={`settings-panel-${activeTab}`}
              aria-labelledby={`settings-tab-${activeTab}`}
            >
              <h2 className="text-[34px] font-semibold leading-tight text-[#1f232b]">
                {panelTitle}
              </h2>
              <p className="mt-1.5 text-[15px] text-[#66738e]">
                {panelDescription}
              </p>
              {activeTab === "profile" && saveError ? (
                <div className="mt-3 text-sm text-red-600">{saveError}</div>
              ) : null}
              {activeTab === "profile" && saveSuccess ? (
                <div className="mt-3 text-sm text-[#16a34a]">{saveSuccess}</div>
              ) : null}

              {activeTab === "profile" ? (
                <>
                  {loading ? <div className="mt-8 text-sm text-neutral-500">{text.loading}</div> : null}
                  {!loading && error ? <div className="mt-8 text-sm text-red-600">{error}</div> : null}
                  {!loading && !error && !customer ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.noData}</div>
                  ) : null}

                  {!loading && !error && customer ? (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center gap-3 pb-1">
                        <div className="h-16 w-16 overflow-hidden rounded-full bg-[#e1e4ea]">
                          {customerPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customerPhoto} alt={customerFullName || "Customer"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm font-semibold text-[#6b7280]">
                              {customerInitials}
                            </div>
                          )}
                        </div>
                        <div className="text-[15px] font-medium text-[#1f2937]">{customerFullName || "-"}</div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.name}</label>
                        <input
                          value={form.ad}
                          maxLength={NAME_MAX_LENGTH}
                          aria-invalid={isDirty && !!adError}
                          onChange={(event) => {
                            const next = event.target.value;
                            setForm((prev) => ({ ...prev, ad: next }));
                            if (saveError) setSaveError(null);
                            if (saveSuccess) setSaveSuccess(null);
                          }}
                          className={plainInputClass}
                        />
                        {isDirty && adError ? <p className="mt-1 text-xs text-red-600">{adError}</p> : null}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.surname}</label>
                        <input
                          value={form.soyad}
                          maxLength={NAME_MAX_LENGTH}
                          aria-invalid={isDirty && !!soyadError}
                          onChange={(event) => {
                            const next = event.target.value;
                            setForm((prev) => ({ ...prev, soyad: next }));
                            if (saveError) setSaveError(null);
                            if (saveSuccess) setSaveSuccess(null);
                          }}
                          className={plainInputClass}
                        />
                        {isDirty && soyadError ? <p className="mt-1 text-xs text-red-600">{soyadError}</p> : null}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.password}</label>
                        <input value="************" readOnly className={plainInputClass} />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <label className="block text-[15px] text-[#66738e]">{text.email}</label>
                          {customer.MusteriEmailOnayli ? (
                            <span className="text-[13px] font-semibold text-[#16a34a]">{text.checked}</span>
                          ) : (
                            <button
                              type="button"
                              className="text-[13px] font-semibold text-[var(--gtg-orange)] underline-offset-2 hover:underline"
                            >
                              {text.verify}
                            </button>
                          )}
                        </div>
                        <input value={customer.MusteriEmail ?? ""} readOnly className={plainInputClass} />
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <label className="block text-[15px] text-[#66738e]">{text.phone}</label>
                          {customer.MusteriTelOnayli ? (
                            <span className="text-[13px] font-semibold text-[#16a34a]">{text.checked}</span>
                          ) : (
                            <button
                              type="button"
                              className="text-[13px] font-semibold text-[var(--gtg-orange)] underline-offset-2 hover:underline"
                            >
                              {text.verify}
                            </button>
                          )}
                        </div>
                        <div className={`${plainInputClass} flex items-center gap-2`}>
                          <span className="inline-flex h-5 items-center rounded-sm bg-[#E30A17] px-2 text-[10px] font-semibold text-white">
                            TR
                          </span>
                          <span className="text-[15px] text-[#8b95a7]">{phonePrefix}</span>
                          <ChevronDown size={16} className="text-[#8b95a7]" />
                          <span className="text-[15px] text-[#2a313d]">{phoneText}</span>
                        </div>
                      </div>

                      <div className="pt-4 text-right text-sm text-[#ef6c62]">{text.deleteAccount}</div>
                    </div>
                  ) : null}
                </>
              ) : isMissionsTab ? (
                <>
                  {missionsLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.missionsLoading}</div>
                  ) : null}
                  {!missionsLoading && missionsError ? (
                    <div className="mt-8 text-sm text-red-600">{missionsError}</div>
                  ) : null}
                  {!missionsLoading && !missionsError && missions.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.missionsNoData}</div>
                  ) : null}

                  {!missionsLoading && !missionsError && missions.length > 0 ? (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {missions.map((item, index) => {
                        const gorevNr = item.Nr ?? index + 1;
                        const missionTitle = (item.GorevAdi ?? "").trim() || `#${gorevNr}`;
                        const missionDesc = (item.GorevAciklamasi ?? "").trim() || "-";
                        const missionImg = (item.GorevResim ?? "").trim();
                        const missionHeadline = getMissionHeadline(item, missionTitle);
                        const isDone = Boolean(item.GorevDone);
                        const isSubmitting = missionSubmittingNr === item.Nr;
                        const buttonDisabled = isDone || isSubmitting;

                        return (
                          <article
                            key={item.Nr ?? `${missionTitle}-${index}`}
                            className="flex min-h-[360px] flex-col rounded-[24px] border border-[#2d3036] bg-gradient-to-br from-[#2a2b31] to-[#1f2126] p-6"
                          >
                            <div className="h-[72px] w-[72px] overflow-hidden rounded-[20px] bg-[#32353b] p-3">
                              {missionImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={missionImg}
                                  alt={missionTitle}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/80">
                                  {missionTitle.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <h3 className="mt-6 text-[20px] font-semibold leading-[1.15] text-white">
                              {missionHeadline}
                            </h3>
                            <p className="mt-2 text-[15px] leading-[1.35] text-white/65">{missionDesc}</p>

                            <button
                              type="button"
                              disabled={buttonDisabled}
                              onClick={() => handleMissionComplete(item)}
                              className={clsx(
                                "mt-auto w-full rounded-[18px] px-4 py-3 text-[18px] font-semibold transition",
                                isDone
                                  ? "cursor-not-allowed bg-[#a7a7ab] text-[#e4e4e5]"
                                  : "bg-[var(--gtg-orange)] text-white hover:brightness-95",
                                isSubmitting ? "opacity-70" : "opacity-100"
                              )}
                            >
                              {isDone ? text.missionCompletedCard : text.missionTakeCoin}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : isStoreTab ? (
                <>
                  {storeLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.storeLoading}</div>
                  ) : null}
                  {!storeLoading && storeError ? (
                    <div className="mt-8 text-sm text-red-600">{storeError}</div>
                  ) : null}
                  {!storeLoading && !storeError && storePackages.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.storeNoData}</div>
                  ) : null}

                  {!storeLoading && !storeError && storePackages.length > 0 ? (
                    <div className="mt-8 space-y-5">
                      {storePackages.map((item, index) => {
                        const packageNr = item.Nr ?? index + 1;
                        const packageTitle = (item.PaketAdi ?? "").trim() || `#${packageNr}`;
                        const packageDesc = (item.PaketAciklama ?? "").trim() || "-";
                        const packagePrice = formatStorePrice(item);
                        const coinText = formatMissionCoin(item.PaketCoin);
                        const cycleText = text.storeOneTime;
                        const coinFeatureText = text.storeFeatureCoin.replace(
                          "{coin}",
                          coinText === "-" ? "0" : coinText
                        );
                        const featureItems = [
                          coinFeatureText,
                          text.storeFeatureFast,
                          text.storeFeatureSecure,
                          text.storeFeatureSupport,
                        ];
                        return (
                          <article
                            key={item.Nr ?? `${packageTitle}-${index}`}
                            className="overflow-hidden rounded-3xl border border-[#cfd4de] bg-white/70"
                          >
                            <div className="flex items-center justify-between gap-4 border-b border-[#d9dde5] px-5 py-4">
                              <h3 className="text-[34px] font-semibold leading-tight text-[#1f232b]">
                                {packageTitle}
                              </h3>
                              <button
                                type="button"
                                onClick={() => window.open(IYZICO_PAYMENT_URL, "_blank", "noopener,noreferrer")}
                                className="inline-flex items-center rounded-xl border border-[#ffb020] bg-[var(--gtg-orange)] px-5 py-2 text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(245,158,11,0.35)] transition hover:brightness-95"
                              >
                                {text.storeBuy}
                              </button>
                            </div>

                            <div className="space-y-5 px-5 py-4">
                              <div>
                                <div className="flex items-end gap-2">
                                  <span className="text-[46px] font-semibold leading-none text-[#1f232b]">
                                    {packagePrice}
                                  </span>
                                  <span className="pb-1 text-[16px] font-semibold text-[var(--gtg-orange)]">
                                    {cycleText}
                                  </span>
                                </div>
                                <p className="mt-2 text-[15px] text-[#66738e]">{packageDesc}</p>
                              </div>

                              <div className="border-t border-[#dbe0e8] pt-4">
                                <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                  {featureItems.map((featureText, featureIndex) => (
                                    <div
                                      key={`${item.Nr ?? packageNr}-feature-${featureIndex}`}
                                      className="flex items-center gap-2 text-[15px] text-[#1f232b]"
                                    >
                                      <CheckCircle2 size={18} className="shrink-0 text-[var(--gtg-orange)]" />
                                      <span>{featureText}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : isOrderHistoryTab ? (
                <>
                  {orderHistoryLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.orderHistoryLoading}</div>
                  ) : null}
                  {!orderHistoryLoading && orderHistoryError ? (
                    <div className="mt-8 text-sm text-red-600">{orderHistoryError}</div>
                  ) : null}
                  {!orderHistoryLoading && !orderHistoryError && orderHistoryItems.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.orderHistoryNoData}</div>
                  ) : null}

                  {!orderHistoryLoading && !orderHistoryError && orderHistoryItems.length > 0 ? (
                    <div className="mt-8 overflow-hidden rounded-3xl border border-[#cfd4de] bg-white/70">
                      <div className="grid grid-cols-4 border-b border-[#d9dde5] bg-[#eef1f5] px-6 py-4 text-[15px] font-semibold text-[#66738e]">
                        <div>{text.orderNo}</div>
                        <div>{text.orderDate}</div>
                        <div>{text.orderPlan}</div>
                        <div className="text-right">{text.orderAmount}</div>
                      </div>
                      {orderHistoryItems.map((item, index) => {
                        const orderNo = `#${String(item.Nr ?? index + 1).padStart(6, "0")}`;
                        const dateText = formatOrderDate(item.OlusturmaZamani, orderDateLocale);
                        const planText = (item.PaketAdi ?? "").trim() || "-";
                        const amountText = formatOrderAmount(item);
                        const key = item.Nr ?? `${item.MuspaketPaketNr ?? "pkg"}-${index}`;
                        return (
                          <div
                            key={key}
                            className={clsx(
                              "grid grid-cols-4 px-6 py-5 text-[15px] text-[#1f232b]",
                              index !== orderHistoryItems.length - 1 ? "border-b border-[#e2e6ed]" : ""
                            )}
                          >
                            <div className="font-semibold">{orderNo}</div>
                            <div className="font-semibold">{dateText}</div>
                            <div className="font-semibold">{planText}</div>
                            <div className="text-right font-semibold">{amountText}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : isLanguageTab ? (
                <div className="mt-8 border-b border-[#cfd4de] pb-8">
                  <div className="max-w-[560px] lg:ml-auto">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <label className="shrink-0 text-[15px] text-[#66738e] sm:w-[90px]">
                        {text.languageField}
                      </label>
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setLanguageMenuOpen((prev) => !prev)}
                          aria-haspopup="listbox"
                          aria-expanded={languageMenuOpen}
                          className="flex w-full items-center justify-between rounded-2xl border border-[#cfd4de] bg-[#f7f7f9] px-4 py-3 text-left text-[15px] text-[#1f2937] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                        >
                          <span className="inline-flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedLanguageOption.flag}
                              alt={selectedLanguageOption.alt}
                              className="h-5 w-7 rounded-sm border border-black/10 object-cover"
                            />
                            <span>{selectedLanguageOption.label}</span>
                          </span>
                          <ChevronDown
                            size={18}
                            className={clsx(
                              "text-[#8b95a7] transition-transform",
                              languageMenuOpen ? "rotate-180" : "rotate-0"
                            )}
                          />
                        </button>

                        {languageMenuOpen ? (
                          <div
                            role="listbox"
                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#cfd4de] bg-white shadow-lg"
                          >
                            {languageOptions.map((option) => (
                              <button
                                key={option.code}
                                type="button"
                                onClick={() => handleLanguageSelect(option.code)}
                                className={clsx(
                                  "flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] transition",
                                  option.code === selectedLanguageOption.code
                                    ? "bg-[#eef1f6] text-[#1f232b]"
                                    : "text-[#4b5567] hover:bg-[#f7f8fb]"
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={option.flag}
                                  alt={option.alt}
                                  className="h-5 w-7 rounded-sm border border-black/10 object-cover"
                                />
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isContactTab ? (
                <>
                  {loading ? <div className="mt-8 text-sm text-neutral-500">{text.loading}</div> : null}
                  {!loading && error ? <div className="mt-8 text-sm text-red-600">{error}</div> : null}
                  {!loading && !error && !customer ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.noData}</div>
                  ) : null}

                  {!loading && !error && customer ? (
                    <div className="mt-8">
                      <div className="mb-4">
                        <label className="mb-1.5 block text-[15px] text-[#66738e]">{text.email}</label>
                        <input
                          value={contactEmail}
                          readOnly
                          className={`${plainInputClass} bg-[#eef1f5] text-[#66738e]`}
                        />
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
                            {contactTouched && contactMessageError ? (
                              <p className="text-xs text-red-600">{contactMessageError}</p>
                            ) : null}
                            {contactEmailError ? (
                              <p className="text-xs text-red-600">{contactEmailError}</p>
                            ) : null}
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
                </>
              ) : isSoundTab ? (
                <>
                  {soundLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{text.soundLoading}</div>
                  ) : null}
                  {!soundLoading && soundError ? (
                    <div className="mt-8 text-sm text-red-600">{soundError}</div>
                  ) : null}

                  {!soundLoading ? (
                    <div className="mt-8">
                      <div className="flex items-start justify-between gap-6 rounded-2xl border border-[#cfd4de] bg-white/60 px-5 py-4">
                        <div>
                          <h3 className="text-[28px] font-semibold text-[#1f232b]">
                            {text.soundMessageTitle}
                          </h3>
                          <p className="mt-1 text-[15px] text-[#66738e]">{text.soundMessageDesc}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <div className="whitespace-nowrap text-[20px] font-semibold text-[#16a34a]">
                            {soundEnabled ? text.soundOn : text.soundOff}
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={soundEnabled}
                            disabled={soundSaving}
                            onClick={() => handleSoundToggle(!soundEnabled)}
                            className={clsx(
                              "relative inline-flex h-10 w-[72px] items-center rounded-full border transition",
                              soundEnabled
                                ? "border-[var(--gtg-orange)] bg-[var(--gtg-orange)]"
                                : "border-[#d4d9e2] bg-[#e8ebf0]",
                              soundSaving ? "opacity-60" : "opacity-100"
                            )}
                          >
                            <span
                              className={clsx(
                                "inline-block h-8 w-8 transform rounded-full bg-white shadow transition",
                                soundEnabled ? "translate-x-9" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : isPolicyTab ? (
                <>
                  {policyLoading ? (
                    <div className="mt-8 text-sm text-neutral-500">{policyLoadingText}</div>
                  ) : null}
                  {!policyLoading && policyError ? (
                    <div className="mt-8 text-sm text-red-600">{policyError}</div>
                  ) : null}
                  {!policyLoading && !policyError && policyItems.length === 0 ? (
                    <div className="mt-8 text-sm text-neutral-500">{policyNoDataText}</div>
                  ) : null}

                  {!policyLoading && !policyError && policyItems.length > 0 ? (
                    <div className="mt-8 space-y-12">
                      {policyItems.map((item, index) => {
                        const title = (item.Baslik ?? "").trim();
                        const description = (item.Aciklama ?? "").trim();
                        const html = sanitizePolicyHtml(item.Detay);
                        const key = item.Nr ?? `${title || "privacy"}-${index}`;
                        return (
                          <article key={key} className="space-y-2">
                            {title ? (
                              <h3 className="text-[22px] font-semibold leading-tight text-[#1f232b]">{title}</h3>
                            ) : null}
                            {description ? <p className="text-[15px] text-[#66738e]">{description}</p> : null}
                            <div
                              className="text-[15px] leading-8 text-[#66738e] [&_a]:text-[var(--gtg-orange)] [&_a]:underline [&_a]:underline-offset-2 [&_div]:mb-3 [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:pl-6 [&_ol]:list-decimal [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-3 [&_ul]:pl-6 [&_ul]:list-disc"
                              dangerouslySetInnerHTML={{ __html: html }}
                            />
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-8 rounded-xl border border-[#cfd4de] bg-white/70 px-4 py-3 text-sm text-[#66738e]">
                  {text.sectionSoon}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
