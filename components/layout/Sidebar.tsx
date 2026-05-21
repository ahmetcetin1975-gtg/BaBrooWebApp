"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  Check,
  Home,
  BriefcaseBusiness,
  MessageCircle,
  ClipboardList,
  User,
  Bell,
  Bot,
  Star,
  Settings,
  LogOut,
  Coins,
  Plus,
  CircleHelp,
  CreditCard,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api/client";
import {
  CUSTOMER_PROFILE_REFRESH_EVENT,
  CUSTOMER_UPDATED_EVENT,
  OPEN_COIN_PURCHASE_EVENT,
  type CustomerUpdatedDetail,
  type OpenCoinPurchaseDetail,
} from "@/lib/customer/events";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { NOTIFICATIONS_UPDATED_EVENT, type NotificationsUpdatedDetail } from "@/lib/notifications/events";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";

type SidebarItemKey = keyof Messages["sidebar"]["items"];
type SettingsSubLinkTab =
  | "resume"
  | "store"
  | "missions"
  | "orderHistory"
  | "language"
  | "contact"
  | "sound"
  | "privacy"
  | "terms";

const navItems: Array<{
  key: SidebarItemKey;
  labelKey: SidebarItemKey;
  icon: LucideIcon;
  href: string;
}> = [
  { key: "home", labelKey: "home", icon: Home, href: "/home/products" },
  { key: "myJobs", labelKey: "myJobs", icon: BriefcaseBusiness, href: "/home/myjobs" },
  { key: "chat", labelKey: "chat", icon: MessageCircle, href: "/home/chat" },
  { key: "missions", labelKey: "missions", icon: ClipboardList, href: "/home/missions" },
  { key: "profile", labelKey: "profile", icon: User, href: "/home/settings?tab=profile" },
  { key: "notifications", labelKey: "notifications", icon: Bell, href: "/home/notifications" },
  { key: "ai", labelKey: "ai", icon: Bot, href: "/home/ai" },
  { key: "favJobs", labelKey: "favJobs", icon: Star, href: "/home/myfavjobs" },
  { key: "favJobSeekers", labelKey: "favJobSeekers", icon: Star, href: "/home/myfavjobsekeers" },
];

type SidebarProps = {
  lang: string;
  mobile?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  onOpenNotifications?: () => void;
  notificationsOpen?: boolean;
};

type CustomerData = {
  Nr?: number;
  MusteriAdi?: string;
  MusteriSoyadi?: string;
  MusteriEmail?: string;
  MusteriResimUrl?: string;
  MusteriCoin?: number;
};

type CustomerGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerData | null;
};

type NotificationUnreadCountResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    UnreadCount?: number;
  } | null;
};

type StorePackageItem = {
  Nr?: number;
  PaketAdi?: string;
  PaketCoin?: number;
  PaketFiyat?: number;
  PaketAciklama?: string;
  DovizNr?: number;
  PaketDovizNr?: number;
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

type CustomerPackageCreateResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
  } | null;
};

type CreditPurchaseStep = "packages" | "payment";

type PaymentFormState = {
  cardNumber: string;
  firstName: string;
  lastName: string;
  month: string;
  year: string;
  cvc: string;
};

const IYZICO_PAYMENT_URL = "https://www.iyzico.com/";
const SHOW_CREDITS_FEATURE = false;

const EMPTY_PAYMENT_FORM: PaymentFormState = {
  cardNumber: "",
  firstName: "",
  lastName: "",
  month: "",
  year: "",
  cvc: "",
};

type PurchaseCopy = {
  brandBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  bestPrice: string;
  buyCoins: string;
  loadingPackages: string;
  packagesLoadFailed: string;
  noPackages: string;
  retry: string;
  back: string;
  paymentTitle: string;
  paymentSubtitle: string;
  selectedPackageAmount: string;
  paymentDetails: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  month: string;
  year: string;
  cvc: string;
  totalAmount: string;
  disclaimer: string;
  completePayment: string;
  paymentFormError: string;
  paymentCreateError: string;
  paymentCurrencyError: string;
  selectPackageError: string;
  secureRedirect: string;
  secureRedirectAfterOpen: string;
  selectedPackage: string;
  markPaymentDone: string;
  openingIyzi: string;
  saving: string;
};

const PURCHASE_COPY: Record<Lang, PurchaseCopy> = {
  tr: {
    brandBadge: "PRO",
    heroTitle: "Coin Satın Alın ve premium özelliklerin keyfini çıkarın",
    heroSubtitle: "Size en uygun paketi seçin ve güvenli ödeme adımına geçin.",
    bestPrice: "EN İYİ FİYAT",
    buyCoins: "Coin Satın Al",
    loadingPackages: "Paketler yükleniyor...",
    packagesLoadFailed: "Paketler yüklenemedi.",
    noPackages: "Şu anda gösterilecek paket bulunmuyor.",
    retry: "Tekrar Dene",
    back: "Geri",
    paymentTitle: "Bakiye Yükleme",
    paymentSubtitle: "Seçilen paketi tamamlamak için ödeme bilgilerinizi girin.",
    selectedPackageAmount: "Seçilen Paket Tutarı",
    paymentDetails: "Ödeme Bilgileri",
    cardNumber: "Kart Numarası",
    firstName: "Ad",
    lastName: "Soyad",
    month: "Ay",
    year: "Yıl",
    cvc: "CVC Kodu",
    totalAmount: "Toplam Tutar",
    disclaimer: "Dikkat: Yapılan yüklemelerde geri iade yapılamaz ve işlemler fatura edilemez.",
    completePayment: "Ödemeyi Tamamla",
    paymentFormError: "Lütfen ödeme bilgilerini eksiksiz ve doğru girin.",
    paymentCreateError: "Paket kaydı oluşturulamadı. Lütfen tekrar deneyin.",
    paymentCurrencyError: "Seçilen paket için döviz bilgisi eksik.",
    selectPackageError: "Devam etmek için bir paket seçin.",
    secureRedirect: "Güvenli ödeme iyzico sayfasında yeni sekmede açılacaktır.",
    secureRedirectAfterOpen: "iyzico sayfasında ödemeyi tamamladıktan sonra aşağıdaki butona basın.",
    selectedPackage: "Seçilen Paket",
    markPaymentDone: "Ödemeyi Tamamladım",
    openingIyzi: "iyzico ile Devam Et",
    saving: "Kaydediliyor...",
  },
  en: {
    brandBadge: "PRO",
    heroTitle: "Buy coins and unlock premium features",
    heroSubtitle: "Choose the package that fits you best and continue to secure payment.",
    bestPrice: "BEST PRICE",
    buyCoins: "Buy Coins",
    loadingPackages: "Loading packages...",
    packagesLoadFailed: "Packages could not be loaded.",
    noPackages: "There are no packages to display right now.",
    retry: "Try Again",
    back: "Back",
    paymentTitle: "Top Up Balance",
    paymentSubtitle: "Enter your payment details to complete the selected package.",
    selectedPackageAmount: "Selected Package Amount",
    paymentDetails: "Payment Details",
    cardNumber: "Card Number",
    firstName: "First Name",
    lastName: "Last Name",
    month: "Month",
    year: "Year",
    cvc: "CVC Code",
    totalAmount: "Total Amount",
    disclaimer: "Note: Completed top-ups are non-refundable and cannot be invoiced.",
    completePayment: "Complete Payment",
    paymentFormError: "Please complete the payment details correctly.",
    paymentCreateError: "The package purchase record could not be created. Please try again.",
    paymentCurrencyError: "Currency information is missing for the selected package.",
    selectPackageError: "Please select a package to continue.",
    secureRedirect: "Secure payment will open on iyzico in a new tab.",
    secureRedirectAfterOpen: "After completing the payment on iyzico, press the button below.",
    selectedPackage: "Selected Package",
    markPaymentDone: "I Completed Payment",
    openingIyzi: "Continue with iyzico",
    saving: "Saving...",
  },
  ru: {
    brandBadge: "PRO",
    heroTitle: "Покупайте coin и открывайте premium-возможности",
    heroSubtitle: "Выберите подходящий пакет и перейдите к безопасной оплате.",
    bestPrice: "ЛУЧШАЯ ЦЕНА",
    buyCoins: "Купить coin",
    loadingPackages: "Пакеты загружаются...",
    packagesLoadFailed: "Не удалось загрузить пакеты.",
    noPackages: "Сейчас нет пакетов для отображения.",
    retry: "Повторить",
    back: "Назад",
    paymentTitle: "Пополнение баланса",
    paymentSubtitle: "Введите платежные данные, чтобы завершить выбранный пакет.",
    selectedPackageAmount: "Сумма выбранного пакета",
    paymentDetails: "Платежные данные",
    cardNumber: "Номер карты",
    firstName: "Имя",
    lastName: "Фамилия",
    month: "Месяц",
    year: "Год",
    cvc: "CVC-код",
    totalAmount: "Итого",
    disclaimer: "Внимание: выполненные пополнения не возвращаются и не могут быть выставлены в счет.",
    completePayment: "Завершить оплату",
    paymentFormError: "Пожалуйста, заполните платежные данные полностью и корректно.",
    paymentCreateError: "Не удалось создать запись покупки пакета. Попробуйте еще раз.",
    paymentCurrencyError: "Для выбранного пакета отсутствует информация о валюте.",
    selectPackageError: "Выберите пакет, чтобы продолжить.",
    secureRedirect: "Безопасная оплата откроется на странице iyzico в новой вкладке.",
    secureRedirectAfterOpen: "После завершения оплаты на iyzico нажмите кнопку ниже.",
    selectedPackage: "Выбранный пакет",
    markPaymentDone: "Я завершил оплату",
    openingIyzi: "Продолжить с iyzico",
    saving: "Сохранение...",
  },
  es: {
    brandBadge: "PRO",
    heroTitle: "Compra coins y desbloquea funciones premium",
    heroSubtitle: "Elige el paquete que mejor se adapte a ti y continúa con el pago seguro.",
    bestPrice: "MEJOR PRECIO",
    buyCoins: "Comprar coins",
    loadingPackages: "Cargando paquetes...",
    packagesLoadFailed: "No se pudieron cargar los paquetes.",
    noPackages: "No hay paquetes para mostrar en este momento.",
    retry: "Reintentar",
    back: "Atrás",
    paymentTitle: "Recargar saldo",
    paymentSubtitle: "Introduce tus datos de pago para completar el paquete seleccionado.",
    selectedPackageAmount: "Importe del paquete seleccionado",
    paymentDetails: "Datos de pago",
    cardNumber: "Número de tarjeta",
    firstName: "Nombre",
    lastName: "Apellido",
    month: "Mes",
    year: "Año",
    cvc: "Código CVC",
    totalAmount: "Importe total",
    disclaimer: "Atención: las recargas realizadas no son reembolsables y no pueden facturarse.",
    completePayment: "Completar pago",
    paymentFormError: "Completa los datos de pago de forma correcta.",
    paymentCreateError: "No se pudo crear el registro de compra del paquete. Inténtalo de nuevo.",
    paymentCurrencyError: "Falta la información de moneda para el paquete seleccionado.",
    selectPackageError: "Selecciona un paquete para continuar.",
    secureRedirect: "El pago seguro se abrirá en iyzico en una pestaña nueva.",
    secureRedirectAfterOpen: "Después de completar el pago en iyzico, pulsa el botón de abajo.",
    selectedPackage: "Paquete seleccionado",
    markPaymentDone: "He completado el pago",
    openingIyzi: "Continuar con iyzico",
    saving: "Guardando...",
  },
  fr: {
    brandBadge: "PRO",
    heroTitle: "Achetez des coins et débloquez les fonctionnalités premium",
    heroSubtitle: "Choisissez le forfait qui vous convient et passez au paiement sécurisé.",
    bestPrice: "MEILLEUR PRIX",
    buyCoins: "Acheter des coins",
    loadingPackages: "Chargement des forfaits...",
    packagesLoadFailed: "Impossible de charger les forfaits.",
    noPackages: "Aucun forfait à afficher pour le moment.",
    retry: "Réessayer",
    back: "Retour",
    paymentTitle: "Recharger le solde",
    paymentSubtitle: "Saisissez vos informations de paiement pour finaliser le forfait sélectionné.",
    selectedPackageAmount: "Montant du forfait sélectionné",
    paymentDetails: "Informations de paiement",
    cardNumber: "Numéro de carte",
    firstName: "Prénom",
    lastName: "Nom",
    month: "Mois",
    year: "Année",
    cvc: "Code CVC",
    totalAmount: "Montant total",
    disclaimer: "Attention : les recharges effectuées ne sont pas remboursables et ne peuvent pas être facturées.",
    completePayment: "Finaliser le paiement",
    paymentFormError: "Veuillez renseigner correctement toutes les informations de paiement.",
    paymentCreateError: "Impossible de créer l'enregistrement d'achat du forfait. Veuillez réessayer.",
    paymentCurrencyError: "Les informations de devise sont manquantes pour le forfait sélectionné.",
    selectPackageError: "Sélectionnez un forfait pour continuer.",
    secureRedirect: "Le paiement sécurisé s'ouvrira sur iyzico dans un nouvel onglet.",
    secureRedirectAfterOpen: "Après avoir finalisé le paiement sur iyzico, appuyez sur le bouton ci-dessous.",
    selectedPackage: "Forfait sélectionné",
    markPaymentDone: "J'ai terminé le paiement",
    openingIyzi: "Continuer avec iyzico",
    saving: "Enregistrement...",
  },
};

const SETTINGS_SUB_LINKS: Record<Lang, Array<{ tab: SettingsSubLinkTab; label: string }>> = {
  tr: [
    { tab: "resume", label: "Özgeçmiş" },
    { tab: "store", label: "Mağaza" },
    { tab: "missions", label: "Görevler" },
    { tab: "orderHistory", label: "Sipariş Geçmişi" },
    { tab: "language", label: "Dil" },
    { tab: "contact", label: "İletişim" },
    { tab: "sound", label: "Ses Bildirimleri" },
    { tab: "privacy", label: "Gizlilik Politikası" },
    { tab: "terms", label: "Kullanıcı Şart ve Koşulları" },
  ],
  en: [
    { tab: "resume", label: "Resume" },
    { tab: "store", label: "Store" },
    { tab: "missions", label: "Missions" },
    { tab: "orderHistory", label: "Order History" },
    { tab: "language", label: "Language" },
    { tab: "contact", label: "Contact Us" },
    { tab: "sound", label: "Sound Notification" },
    { tab: "privacy", label: "Privacy Policy" },
    { tab: "terms", label: "User Terms and Conditions" },
  ],
  ru: [
    { tab: "resume", label: "Резюме" },
    { tab: "store", label: "Магазин" },
    { tab: "missions", label: "Задания" },
    { tab: "orderHistory", label: "История заказов" },
    { tab: "language", label: "Язык" },
    { tab: "contact", label: "Связаться с нами" },
    { tab: "sound", label: "Звуковые уведомления" },
    { tab: "privacy", label: "Политика конфиденциальности" },
    { tab: "terms", label: "Условия использования" },
  ],
  es: [
    { tab: "resume", label: "Currículum" },
    { tab: "store", label: "Tienda" },
    { tab: "missions", label: "Misiones" },
    { tab: "orderHistory", label: "Historial de pedidos" },
    { tab: "language", label: "Idioma" },
    { tab: "contact", label: "Contacto" },
    { tab: "sound", label: "Notificaciones sonoras" },
    { tab: "privacy", label: "Política de privacidad" },
    { tab: "terms", label: "Términos y condiciones" },
  ],
  fr: [
    { tab: "resume", label: "CV" },
    { tab: "store", label: "Boutique" },
    { tab: "missions", label: "Missions" },
    { tab: "orderHistory", label: "Historique des commandes" },
    { tab: "language", label: "Langue" },
    { tab: "contact", label: "Contact" },
    { tab: "sound", label: "Notifications sonores" },
    { tab: "privacy", label: "Politique de confidentialité" },
    { tab: "terms", label: "Conditions d'utilisation" },
  ],
};

function toPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? href;
}

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const target = toPathWithoutQuery(href);
  return pathname === target || pathname.startsWith(`${target}/`);
}

function isHomeContextPath(pathname: string | null, lang: string): boolean {
  return (
    isPathActive(pathname, `/${lang}/home/products`) ||
    isPathActive(pathname, `/${lang}/home/services`)
  );
}

function normalizeStorePackages(data?: StorePackagesResponse): StorePackageItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Nr === "number");
}

function getStoreCurrencySymbol(item: StorePackageItem | null | undefined): string {
  return (item?.DovizSembolu ?? item?.DovizSembol ?? "").trim();
}

function getStoreCurrencyShortName(item: StorePackageItem | null | undefined): string {
  return (item?.["DovizKısaAdi"] ?? item?.DovizKisaAdi ?? item?.DovizAdi ?? "").trim();
}

function getStoreCurrencyNr(item: StorePackageItem | null | undefined): number | null {
  if (typeof item?.DovizNr === "number" && Number.isFinite(item.DovizNr)) {
    return item.DovizNr;
  }

  if (typeof item?.PaketDovizNr === "number" && Number.isFinite(item.PaketDovizNr)) {
    return item.PaketDovizNr;
  }

  const shortName = getStoreCurrencyShortName(item).toUpperCase();
  const symbol = getStoreCurrencySymbol(item);

  if (shortName === "TL" || shortName === "TRY" || symbol === "₺") {
    return 1;
  }

  return null;
}

function formatAmount(
  value: number | undefined,
  locale: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

function formatPackageCoins(value: number | undefined, locale: string): string {
  return formatAmount(value, locale, Number.isInteger(value) ? 0 : 2, 2);
}

function formatPackageListPrice(item: StorePackageItem | null | undefined, locale: string): string {
  const amount = formatAmount(item?.PaketFiyat, locale, 1, 2);
  if (amount === "-") return amount;
  const symbol = getStoreCurrencySymbol(item);
  return symbol ? `${amount} ${symbol}` : amount;
}

function formatPackageTotalPrice(item: StorePackageItem | null | undefined, locale: string): string {
  const amount = formatAmount(item?.PaketFiyat, locale, 2, 2);
  if (amount === "-") return amount;
  const symbol = getStoreCurrencySymbol(item);
  return symbol ? `${symbol}${amount}` : amount;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCardNumberInput(value: string): string {
  return digitsOnly(value)
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function isValidPaymentForm(form: PaymentFormState): boolean {
  const cardDigits = digitsOnly(form.cardNumber);
  const monthDigits = digitsOnly(form.month);
  const yearDigits = digitsOnly(form.year);
  const cvcDigits = digitsOnly(form.cvc);
  const monthNumber = Number.parseInt(monthDigits, 10);

  return (
    cardDigits.length >= 12 &&
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    monthDigits.length === 2 &&
    Number.isFinite(monthNumber) &&
    monthNumber >= 1 &&
    monthNumber <= 12 &&
    (yearDigits.length === 2 || yearDigits.length === 4) &&
    cvcDigits.length >= 3 &&
    cvcDigits.length <= 4
  );
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }

  return fallback;
}

export function Sidebar({
  lang,
  mobile = false,
  mobileOpen = false,
  onClose,
  onNavigate,
  onOpenNotifications,
  notificationsOpen = false,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const currentLang = normalizeLang(lang);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [creditsStep, setCreditsStep] = useState<CreditPurchaseStep>("packages");
  const [storePackages, setStorePackages] = useState<StorePackageItem[]>([]);
  const [storePackagesLoading, setStorePackagesLoading] = useState(false);
  const [storePackagesError, setStorePackagesError] = useState<string | null>(null);
  const [selectedPackageNr, setSelectedPackageNr] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(EMPTY_PAYMENT_FORM);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentGatewayOpened, setPaymentGatewayOpened] = useState(false);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const t = getMessages(currentLang);
  const purchaseText = PURCHASE_COPY[currentLang];
  const numberLocale = localeForLang(currentLang);
  const coin = customer?.MusteriCoin;
  const balance = typeof coin === "number" && Number.isFinite(coin) ? coin : 0;
  const footerLinks = [
    { key: "support", label: t.sidebar.support, icon: CircleHelp, href: "/home/support" },
    { key: "settings", label: t.sidebar.settings, icon: Settings, href: "/home/settings" },
  ];
  const settingsBasePath = `/${currentLang}/home/settings`;
  const isSettingsPage = pathname === settingsBasePath || pathname?.startsWith(`${settingsBasePath}/`);
  const activeSettingsTab = (searchParams.get("tab") ?? "").trim();
  const settingsSubLinks = SETTINGS_SUB_LINKS[currentLang].filter(
    (item) => SHOW_CREDITS_FEATURE || item.tab !== "store"
  );
  const customerFullName =
    `${customer?.MusteriAdi ?? ""} ${customer?.MusteriSoyadi ?? ""}`.trim() || user?.name || "";
  const customerImageUrl = (customer?.MusteriResimUrl ?? "").trim();
  const selectedPackage =
    storePackages.find((item) => item.Nr === selectedPackageNr) ?? storePackages[0] ?? null;
  const lowestPricePackageNr = storePackages.reduce<number | null>((bestNr, item) => {
    if (typeof item.Nr !== "number" || typeof item.PaketFiyat !== "number" || !Number.isFinite(item.PaketFiyat)) {
      return bestNr;
    }

    if (bestNr == null) return item.Nr;

    const bestItem = storePackages.find((candidate) => candidate.Nr === bestNr);
    if (typeof bestItem?.PaketFiyat !== "number" || item.PaketFiyat < bestItem.PaketFiyat) {
      return item.Nr;
    }

    return bestNr;
  }, null);
  const paymentFormValid = isValidPaymentForm(paymentForm);
  const activeNavKey = (() => {
    if (notificationsOpen) return "notifications";

    const favoriteOnly = (searchParams.get("favorites") ?? "").trim() === "1";

    if (favoriteOnly) {
      if (isPathActive(pathname, `/${currentLang}/home/products`)) return "favProducts";
      if (isPathActive(pathname, `/${currentLang}/home/services`)) return "favServices";
    }

    if (isPathActive(pathname, `/${currentLang}/home/myjobs`)) return "myJobs";

    if (isHomeContextPath(pathname, currentLang)) return "home";

    if (pathname === settingsBasePath || pathname?.startsWith(`${settingsBasePath}/`)) {
      return "profile";
    }

    return navItems.find((it) => isPathActive(pathname, `/${currentLang}${it.href}`))?.key;
  })();

  const fetchCustomer = useCallback(async () => {
    if (loading) return;
    if (!user) {
      setCustomer(null);
      return;
    }

    const dil = langToDil(currentLang);

    try {
      const data = await api.get<CustomerGetResponse>(`/api/customer?dil=${dil}`);
      setCustomer(data?.Data ?? null);
    } catch {
      setCustomer(null);
    }
  }, [currentLang, loading, user]);

  const fetchUnreadNotificationCount = useCallback(async () => {
    if (loading) return;
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    const dil = langToDil(currentLang);

    try {
      const data = await api.get<NotificationUnreadCountResponse>(`/api/notifications/unread-count?dil=${dil}`);
      const nextUnreadCount =
        typeof data?.Data?.UnreadCount === "number" && Number.isFinite(data.Data.UnreadCount)
          ? data.Data.UnreadCount
          : 0;
      setUnreadNotificationCount(Math.max(0, nextUnreadCount));
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [currentLang, loading, user]);

  useEffect(() => {
    void fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    void fetchUnreadNotificationCount();
  }, [fetchUnreadNotificationCount]);

  useEffect(() => {
    const onCustomerUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CustomerUpdatedDetail>;
      const ad = typeof customEvent.detail?.ad === "string" ? customEvent.detail.ad : "";
      const soyad = typeof customEvent.detail?.soyad === "string" ? customEvent.detail.soyad : "";
      const coin =
        typeof customEvent.detail?.coin === "number" && Number.isFinite(customEvent.detail.coin)
          ? customEvent.detail.coin
          : null;

      if (ad || soyad || coin != null) {
        setCustomer((prev) => ({
          ...(prev ?? {}),
          MusteriAdi: ad || prev?.MusteriAdi,
          MusteriSoyadi: soyad || prev?.MusteriSoyadi,
          MusteriCoin: coin != null ? coin : prev?.MusteriCoin,
        }));
      }

      void fetchCustomer();
    };

    window.addEventListener(CUSTOMER_UPDATED_EVENT, onCustomerUpdated);
    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, onCustomerUpdated);
    };
  }, [fetchCustomer]);

  useEffect(() => {
    const onNotificationsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationsUpdatedDetail>;
      const nextUnreadCount = customEvent.detail?.unreadCount;

      if (typeof nextUnreadCount === "number" && Number.isFinite(nextUnreadCount)) {
        setUnreadNotificationCount(Math.max(0, nextUnreadCount));
        return;
      }

      void fetchUnreadNotificationCount();
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onNotificationsUpdated);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onNotificationsUpdated);
    };
  }, [fetchUnreadNotificationCount]);

  useEffect(() => {
    if (!creditsModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreditsModalOpen(false);
        setCreditsStep("packages");
        setPaymentError(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [creditsModalOpen]);

  useEffect(() => {
    const onOpenCoinPurchase = (event: Event) => {
      const customEvent = event as CustomEvent<OpenCoinPurchaseDetail>;
      const packageNr = customEvent.detail?.packageNr;
      void handleOpenCreditsModal(typeof packageNr === "number" && Number.isFinite(packageNr) ? packageNr : null);
    };

    window.addEventListener(OPEN_COIN_PURCHASE_EVENT, onOpenCoinPurchase);
    return () => {
      window.removeEventListener(OPEN_COIN_PURCHASE_EVENT, onOpenCoinPurchase);
    };
  }, [currentLang, customer?.MusteriAdi, customer?.MusteriSoyadi, mobile, onClose]);

  async function loadStorePackages(preferredPackageNr?: number | null) {
    const dil = langToDil(currentLang);

    setStorePackagesLoading(true);
    setStorePackagesError(null);

    try {
      const data = await api.get<StorePackagesResponse>(`/api/store?dil=${dil}`);
      const nextPackages = normalizeStorePackages(data);
      setStorePackages(nextPackages);
      setSelectedPackageNr((prev) => {
        if (
          typeof preferredPackageNr === "number" &&
          Number.isFinite(preferredPackageNr) &&
          nextPackages.some((item) => item.Nr === preferredPackageNr)
        ) {
          return preferredPackageNr;
        }
        if (prev != null && nextPackages.some((item) => item.Nr === prev)) return prev;
        return nextPackages[0]?.Nr ?? null;
      });
    } catch (error) {
      setStorePackages([]);
      setSelectedPackageNr(null);
      setStorePackagesError(readErrorMessage(error, purchaseText.packagesLoadFailed));
    } finally {
      setStorePackagesLoading(false);
    }
  }

  async function handleOpenCreditsModal(preferredPackageNr?: number | null) {
    setCreditsModalOpen(true);
    setCreditsStep("packages");
    setPaymentError(null);
    setPaymentGatewayOpened(false);
    setPurchaseSaving(false);
    setPaymentForm({
      ...EMPTY_PAYMENT_FORM,
      firstName: (customer?.MusteriAdi ?? "").trim(),
      lastName: (customer?.MusteriSoyadi ?? "").trim(),
    });
    setStorePackages([]);
    setSelectedPackageNr(
      typeof preferredPackageNr === "number" && Number.isFinite(preferredPackageNr) ? preferredPackageNr : null
    );

    if (mobile) onClose?.();

    await loadStorePackages(preferredPackageNr);
  }

  function handleCloseCreditsModal() {
    setCreditsModalOpen(false);
    setCreditsStep("packages");
    setPaymentError(null);
    setPaymentGatewayOpened(false);
    setPurchaseSaving(false);
  }

  function handleContinueToPayment() {
    if (!selectedPackage) {
      setPaymentError(purchaseText.selectPackageError);
      return;
    }

    setPaymentError(null);
    setPaymentGatewayOpened(false);
    setCreditsStep("payment");
  }

  function handleOpenPaymentGateway() {
    if (!selectedPackage || !paymentFormValid) {
      setPaymentError(purchaseText.paymentFormError);
      return;
    }

    setPaymentError(null);
    setPaymentGatewayOpened(true);
    window.open(IYZICO_PAYMENT_URL, "_blank", "noopener,noreferrer");
  }

  async function handleCompletePayment() {
    if (!selectedPackage || !paymentFormValid) {
      setPaymentError(purchaseText.paymentFormError);
      return;
    }

    const paketNr = selectedPackage.Nr;
    const coin = selectedPackage.PaketCoin;
    const fiyat = selectedPackage.PaketFiyat;
    const dovizNr = getStoreCurrencyNr(selectedPackage);

    if (
      typeof paketNr !== "number" ||
      !Number.isFinite(paketNr) ||
      typeof coin !== "number" ||
      !Number.isFinite(coin) ||
      typeof fiyat !== "number" ||
      !Number.isFinite(fiyat) ||
      typeof dovizNr !== "number" ||
      !Number.isFinite(dovizNr)
    ) {
      setPaymentError(
        typeof dovizNr !== "number" ? purchaseText.paymentCurrencyError : purchaseText.paymentCreateError
      );
      return;
    }

    const dil = langToDil(currentLang);

    setPurchaseSaving(true);
    setPaymentError(null);

    try {
      await api.post<CustomerPackageCreateResponse>(`/api/customer-package/create?kaynak=2&dil=${dil}`, {
        paketNr,
        coin,
        fiyat,
        dovizNr,
      });

      await fetchCustomer();
      window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
      handleCloseCreditsModal();
    } catch (error) {
      setPaymentError(readErrorMessage(error, purchaseText.paymentCreateError));
    } finally {
      setPurchaseSaving(false);
    }
  }

  const creditsModal =
    creditsModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] bg-[#0f0b06]/78 backdrop-blur-sm"
            onClick={handleCloseCreditsModal}
          >
            <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-label={purchaseText.buyCoins}
                className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,185,31,0.42),_rgba(81,49,0,0.96)_46%,_rgba(15,12,8,1)_100%)] shadow-[0_45px_120px_rgba(0,0,0,0.52)] sm:min-h-0 sm:max-h-[calc(100vh-32px)] sm:max-w-[820px] sm:rounded-[32px]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,181,24,0.58)_0%,rgba(74,42,0,0.44)_38%,rgba(10,10,10,0.94)_100%)]" />

                <div className="relative flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
                  {creditsStep === "payment" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCreditsStep("packages");
                        setPaymentError(null);
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition hover:bg-white/16"
                      aria-label={purchaseText.back}
                    >
                      <ArrowLeft size={20} />
                    </button>
                  ) : (
                    <div className="h-11 w-11" />
                  )}

                  <button
                    type="button"
                    onClick={handleCloseCreditsModal}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition hover:bg-white/16"
                    aria-label="Close purchase modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="relative flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:px-6 sm:pb-6 sm:pt-1">
                  {creditsStep === "packages" ? (
                    <div className="mx-auto flex max-w-[680px] flex-col gap-4 sm:gap-5">
                      <div className="space-y-3 text-center">
                        <div className="inline-flex items-center gap-2.5 rounded-full bg-[#090909]/92 px-4 py-2.5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
                          <span className="text-[22px] font-black tracking-[-0.04em] sm:text-[28px]">Babroo</span>
                          <span className="rounded-[16px] bg-white/10 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.28em] text-[#ffbf36] sm:text-[11px]">
                            {purchaseText.brandBadge}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h2 className="mx-auto max-w-[580px] text-[22px] font-semibold leading-tight text-[#1a1205] sm:text-[31px]">
                            {purchaseText.heroTitle}
                          </h2>
                          <p className="mx-auto max-w-[520px] text-[13px] text-[#3d2a0d]/80 sm:text-[15px]">
                            {purchaseText.heroSubtitle}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-[#120c06]/70 p-4 shadow-[0_32px_70px_rgba(0,0,0,0.22)] backdrop-blur sm:p-5">
                        {storePackagesLoading ? (
                          <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[26px] border border-white/10 bg-white/5 px-6 py-10 text-center text-white/82">
                            <Loader2 size={28} className="animate-spin text-[#ffbc33]" />
                            <p className="text-base font-medium">{purchaseText.loadingPackages}</p>
                          </div>
                        ) : storePackagesError ? (
                          <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[26px] border border-[#ffcf85]/20 bg-white/5 px-6 py-10 text-center text-white/90">
                            <p className="max-w-[440px] text-base">{storePackagesError}</p>
                            <button
                              type="button"
                              onClick={() => void loadStorePackages()}
                              className="inline-flex items-center justify-center rounded-full border border-[#ffb320] bg-[#ffb320] px-5 py-2.5 text-sm font-semibold text-[#221403] transition hover:brightness-95"
                            >
                              {purchaseText.retry}
                            </button>
                          </div>
                        ) : storePackages.length === 0 ? (
                          <div className="flex min-h-[240px] items-center justify-center rounded-[26px] border border-white/10 bg-white/5 px-6 py-10 text-center text-white/82">
                            <p className="max-w-[440px] text-base">{purchaseText.noPackages}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {storePackages.map((item, index) => {
                              const isSelected = item.Nr === selectedPackage?.Nr;
                              const title = (item.PaketAdi ?? "").trim() || `${t.sidebar.addCredits} ${index + 1}`;
                              const coinLabel = formatPackageCoins(item.PaketCoin, numberLocale);
                              const priceLabel = formatPackageListPrice(item, numberLocale);
                              const description = (item.PaketAciklama ?? "").trim();
                              const isBestPrice = item.Nr === lowestPricePackageNr;

                              return (
                                <button
                                  key={item.Nr ?? `${title}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPackageNr(item.Nr ?? null);
                                    setPaymentError(null);
                                  }}
                                  className={clsx(
                                    "w-full rounded-[28px] border px-5 py-5 text-left transition sm:px-6 sm:py-6",
                                    isSelected
                                      ? "border-[#ffb320] bg-[linear-gradient(135deg,rgba(255,179,32,0.16),rgba(255,179,32,0.03))] shadow-[0_18px_45px_rgba(255,179,32,0.12)]"
                                      : "border-white/12 bg-white/4 hover:border-white/22 hover:bg-white/7"
                                  )}
                                >
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-start gap-4">
                                      <span
                                        className={clsx(
                                          "mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                                          isSelected
                                            ? "border-[#ffb320] bg-[#ffb320] text-[#261500]"
                                            : "border-white/35 bg-transparent text-transparent"
                                        )}
                                      >
                                        <Check size={20} />
                                      </span>

                                      <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <h3 className="text-[22px] font-semibold leading-tight text-white sm:text-[28px]">
                                            {title}
                                          </h3>
                                          {isBestPrice ? (
                                            <span className="rounded-full bg-[#ffb320] px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-[#241500]">
                                              {purchaseText.bestPrice}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="text-base font-medium text-white/88 sm:text-[18px]">
                                          {coinLabel} Coin
                                        </p>
                                        {description && description !== "..." ? (
                                          <p className="max-w-[440px] text-sm text-white/62">{description}</p>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="shrink-0 text-right text-[22px] font-semibold text-white sm:text-[30px]">
                                      {priceLabel}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleContinueToPayment}
                        disabled={!selectedPackage || storePackagesLoading || !!storePackagesError}
                        className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,#ffb31f_0%,#ffc83b_100%)] px-6 text-lg font-semibold text-[#241500] shadow-[0_25px_60px_rgba(255,179,31,0.28)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xl"
                      >
                        {purchaseText.buyCoins}
                      </button>
                    </div>
                  ) : (
                    <div className="mx-auto flex max-w-[680px] flex-col gap-4 sm:gap-5">
                      <div className="space-y-1.5">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#704300]">
                          {purchaseText.selectedPackage}
                        </p>
                        <h2 className="text-[24px] font-semibold leading-tight text-white sm:text-[32px]">
                          {purchaseText.paymentTitle}
                        </h2>
                        <p className="max-w-[560px] text-[13px] text-white/76 sm:text-[15px]">
                          {purchaseText.paymentSubtitle}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-white/12 bg-[#201306]/72 p-4 shadow-[0_30px_70px_rgba(0,0,0,0.2)] backdrop-blur sm:p-5">
                        <p className="text-[13px] text-white/62 sm:text-[15px]">{purchaseText.selectedPackageAmount}</p>
                        <div className="mt-2.5 rounded-[20px] border border-white/12 bg-black/10 px-4 py-3.5 sm:px-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1.5">
                              <div className="text-[24px] font-semibold text-white sm:text-[30px]">
                                {formatPackageTotalPrice(selectedPackage, numberLocale)}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[13px] text-white/70 sm:text-[15px]">
                                <span>{(selectedPackage?.PaketAdi ?? "").trim() || "-"}</span>
                                <span className="text-white/30">•</span>
                                <span>{formatPackageCoins(selectedPackage?.PaketCoin, numberLocale)} Coin</span>
                              </div>
                            </div>

                            <div className="text-right text-[16px] font-semibold text-[#ffbf35] sm:text-[18px]">
                              {getStoreCurrencyShortName(selectedPackage) || getStoreCurrencySymbol(selectedPackage)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[20px] font-semibold text-white sm:text-[24px]">
                          {purchaseText.paymentDetails}
                        </h3>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <label className="sm:col-span-2">
                            <span className="mb-1.5 block text-[13px] font-medium text-white/68">
                              {purchaseText.cardNumber}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              placeholder="0000 0000 0000 0000"
                              value={paymentForm.cardNumber}
                              onChange={(event) => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  cardNumber: formatCardNumberInput(event.target.value),
                                }));
                                if (paymentError) setPaymentError(null);
                              }}
                              className="w-full rounded-[18px] border border-white/12 bg-[#2c1a07]/78 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/34 focus:border-[#ffb320] focus:ring-2 focus:ring-[#ffb320]/25"
                            />
                          </label>

                          <label>
                            <span className="mb-1.5 block text-[13px] font-medium text-white/68">
                              {purchaseText.firstName}
                            </span>
                            <input
                              type="text"
                              autoComplete="cc-given-name"
                              placeholder={purchaseText.firstName}
                              value={paymentForm.firstName}
                              onChange={(event) => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  firstName: event.target.value,
                                }));
                                if (paymentError) setPaymentError(null);
                              }}
                              className="w-full rounded-[18px] border border-white/12 bg-[#2c1a07]/78 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/34 focus:border-[#ffb320] focus:ring-2 focus:ring-[#ffb320]/25"
                            />
                          </label>

                          <label>
                            <span className="mb-1.5 block text-[13px] font-medium text-white/68">
                              {purchaseText.lastName}
                            </span>
                            <input
                              type="text"
                              autoComplete="cc-family-name"
                              placeholder={purchaseText.lastName}
                              value={paymentForm.lastName}
                              onChange={(event) => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  lastName: event.target.value,
                                }));
                                if (paymentError) setPaymentError(null);
                              }}
                              className="w-full rounded-[18px] border border-white/12 bg-[#2c1a07]/78 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/34 focus:border-[#ffb320] focus:ring-2 focus:ring-[#ffb320]/25"
                            />
                          </label>

                          <label>
                            <span className="mb-1.5 block text-[13px] font-medium text-white/68">
                              {purchaseText.month}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-exp-month"
                              placeholder="MM"
                              value={paymentForm.month}
                              onChange={(event) => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  month: digitsOnly(event.target.value).slice(0, 2),
                                }));
                                if (paymentError) setPaymentError(null);
                              }}
                              className="w-full rounded-[18px] border border-white/12 bg-[#2c1a07]/78 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/34 focus:border-[#ffb320] focus:ring-2 focus:ring-[#ffb320]/25"
                            />
                          </label>

                          <label>
                            <span className="mb-1.5 block text-[13px] font-medium text-white/68">
                              {purchaseText.year}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-exp-year"
                              placeholder="YYYY"
                              value={paymentForm.year}
                              onChange={(event) => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  year: digitsOnly(event.target.value).slice(0, 4),
                                }));
                                if (paymentError) setPaymentError(null);
                              }}
                              className="w-full rounded-[18px] border border-white/12 bg-[#2c1a07]/78 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/34 focus:border-[#ffb320] focus:ring-2 focus:ring-[#ffb320]/25"
                            />
                          </label>

                          <label className="sm:col-span-2">
                            <span className="mb-1.5 block text-[13px] font-medium text-white/68">
                              {purchaseText.cvc}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              placeholder="000"
                              value={paymentForm.cvc}
                              onChange={(event) => {
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  cvc: digitsOnly(event.target.value).slice(0, 4),
                                }));
                                if (paymentError) setPaymentError(null);
                              }}
                              className="w-full rounded-[18px] border border-white/12 bg-[#2c1a07]/78 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/34 focus:border-[#ffb320] focus:ring-2 focus:ring-[#ffb320]/25"
                            />
                          </label>
                        </div>

                        {paymentError ? (
                          <p className="rounded-[18px] border border-[#ffcc85]/18 bg-[#2e1608]/70 px-4 py-2.5 text-[13px] text-[#ffe2af]">
                            {paymentError}
                          </p>
                        ) : (
                          <p className="text-[13px] text-white/58">
                            {paymentGatewayOpened ? purchaseText.secureRedirectAfterOpen : purchaseText.secureRedirect}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-black/12 px-4 py-4 text-white/78 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                        <p className="max-w-[420px] text-[13px] leading-[1.45]">{purchaseText.disclaimer}</p>
                        <div className="text-left sm:text-right">
                          <p className="text-[13px] text-white/56">{purchaseText.totalAmount}</p>
                          <p className="text-[24px] font-semibold text-white sm:text-[30px]">
                            {formatPackageTotalPrice(selectedPackage, numberLocale)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={paymentGatewayOpened ? () => void handleCompletePayment() : handleOpenPaymentGateway}
                        disabled={!selectedPackage || !paymentFormValid || purchaseSaving}
                        className="inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(90deg,#ffb31f_0%,#ffc83b_100%)] px-5 text-[16px] font-semibold text-[#241500] shadow-[0_25px_60px_rgba(255,179,31,0.28)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[18px]"
                      >
                        {purchaseSaving ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                        {purchaseSaving
                          ? purchaseText.saving
                          : paymentGatewayOpened
                          ? purchaseText.markPaymentDone
                          : purchaseText.openingIyzi}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <aside
        className={clsx(
          "w-[280px] shrink-0 border-r border-gtg-border bg-gtg-surface",
          mobile
            ? "fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh flex-col overflow-y-auto overscroll-y-contain pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition-transform duration-300 ease-out lg:hidden"
            : "hidden lg:flex lg:flex-col",
          mobile && (mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")
        )}
      >
      <div className="border-b border-gtg-border px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/${currentLang}/home`}
            onClick={onNavigate}
            aria-label={t.common.appName}
            className="flex items-center gap-2 transition-opacity hover:opacity-85"
          >
            <span className="relative block h-[30px] w-[30px] shrink-0">
              <Image
                src="/assets/images/babroo/logo-mark.png"
                alt=""
                aria-hidden="true"
                fill
                sizes="30px"
                className="object-contain"
              />
            </span>
            <span className="text-base font-semibold text-gtg-blue">{t.common.appName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitch
              lang={currentLang}
              showLabel={false}
              className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
              pillClassName="border-transparent bg-transparent px-0 py-0 text-xs font-semibold text-neutral-700"
            />
            {mobile ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="px-4 py-4">
        <div className="space-y-1">
          {navItems.map((it) => {
            const href = `/${currentLang}${it.href}`;
            const active = it.key === activeNavKey;
            const Icon = it.icon;
            const className = clsx(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
              active
                ? "bg-neutral-100 text-neutral-900"
                : "text-gtg-muted hover:bg-neutral-50 hover:text-neutral-900"
            );

            if (it.key === "notifications") {
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => {
                    onOpenNotifications?.();
                    onNavigate?.();
                  }}
                  className={className}
                >
                  <Icon size={18} />
                  <span className="flex-1">{t.sidebar.items[it.labelKey]}</span>
                  {unreadNotificationCount > 0 ? (
                    <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold leading-none text-white">
                      {unreadNotificationCount}
                    </span>
                  ) : null}
                </button>
              );
            }

            if (it.key === "profile") {
              return (
                <div key={it.key} className="space-y-1">
                  <Link
                    href={href}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent(CUSTOMER_PROFILE_REFRESH_EVENT));
                      onNavigate?.();
                    }}
                    className={className}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{t.sidebar.items[it.labelKey]}</span>
                  </Link>

                  <div className="ml-8 space-y-1 border-l border-neutral-200 pl-3">
                    {settingsSubLinks.map((subLink) => {
                      const resolvedTab = subLink.tab === "resume" ? "profile" : subLink.tab;
                      const subHref = `${settingsBasePath}?tab=${resolvedTab}`;
                      const subActive = isSettingsPage && activeSettingsTab === resolvedTab;
                      return (
                        <Link
                          key={subLink.tab}
                          href={subHref}
                          onClick={onNavigate}
                          className={clsx(
                            "block rounded-lg px-2 py-1.5 text-[13px] transition",
                            subActive
                              ? "bg-neutral-100 font-medium text-neutral-900"
                              : "text-gtg-muted hover:bg-neutral-50 hover:text-neutral-900"
                          )}
                        >
                          {subLink.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={it.key}
                href={href}
                onClick={onNavigate}
                className={className}
              >
                <Icon size={18} />
                <span className="flex-1">{t.sidebar.items[it.labelKey]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

        {SHOW_CREDITS_FEATURE ? (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Coins size={18} className="text-amber-500" />
                <span className="text-sm font-semibold">{balance}</span>
              </div>
              <button
                type="button"
                aria-label={t.sidebar.addCredits}
                onClick={() => void handleOpenCreditsModal()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm transition hover:bg-amber-500"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-auto">
          <div className="space-y-1 px-4 pb-4">
            {footerLinks.map((link) => {
              const href = `/${currentLang}${link.href}`;
              const active = isPathActive(pathname, href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.key}
                  href={href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-gtg-muted hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={async () => {
                onNavigate?.();
                await logout();
                window.location.href = `/${currentLang}/login`;
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gtg-muted transition hover:bg-neutral-50 hover:text-neutral-900"
            >
              <LogOut size={18} />
              {t.sidebar.logout}
            </button>
          </div>

          <div className="border-t border-gtg-border px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                {customerImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customerImageUrl} alt={customerFullName || "Customer"} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{customerFullName || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {SHOW_CREDITS_FEATURE ? creditsModal : null}
    </>
  );
}
