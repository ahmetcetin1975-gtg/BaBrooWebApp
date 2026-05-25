"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { OfferFlowModal, type OfferModalMode } from "@/components/offers/OfferFlowModal";
import { CUSTOMER_UPDATED_EVENT, OPEN_COIN_PURCHASE_EVENT } from "@/lib/customer/events";
import { api } from "@/lib/api/client";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";

type ApiResponse<T> = {
  StatusCode?: number;
  statusCode?: number;
  Message?: string;
  message?: string;
  Data?: T | null;
  data?: T | null;
  LastId?: number | null;
  lastId?: number | null;
  PageSize?: number;
  pageSize?: number;
  TotalCount?: number;
  totalCount?: number;
};

type JobFeature = {
  Nr?: number;
  nr?: number;
  SecenekAdi?: string | null;
  secenekAdi?: string | null;
  GrupSecenekAdi?: string | null;
  grupSecenekAdi?: string | null;
  GrupsecenekTek?: boolean | null;
  grupsecenekTek?: boolean | null;
  IlanozEh?: boolean | null;
  ilanozEh?: boolean | null;
  IlanozEhAcik?: string | null;
  ilanozEhAcik?: string | null;
 // Aciklama?: string | null;
 // aciklama?: string | null;
};

type JobItem = {
  Nr?: number;
  nr?: number;
  IlanMusteriNr?: number | null;
  ilanMusteriNr?: number | null;
  MusteriNr?: number | null;
  musteriNr?: number | null;
  MusteriId?: number | null;
  musteriId?: number | null;
  MusteriResimUrl?: string | null;
  musteriResimUrl?: string | null;
  MusteriUlkeAdi?: string | null;
  musteriUlkeAdi?: string | null;
  MusteriUlkeId?: number | null;
  musteriUlkeId?: number | null;
  MusteriIlAdi?: string | null;
  musteriIlAdi?: string | null;
  MusteriIlId?: number | null;
  musteriIlId?: number | null;
  HizmetGrupAdi?: string | null;
  hizmetGrupAdi?: string | null;
  HizmetGrupId?: number | null;
  hizmetGrupId?: number | null;
  CalismaSekilAdi?: string | null;
  calismaSekilAdi?: string | null;
  CalismaSekilId?: number | null;
  calismaSekilId?: number | null;
  IsTanimi?: string | null;
  isTanimi?: string | null;
 // Aciklama?: string | null;
//  aciklama?: string | null;
  Aktif?: boolean | null;
  aktif?: boolean | null;
  OlusturmaZamani?: string | null;
  olusturmaZamani?: string | null;
  FavCount?: number | null;
  favCount?: number | null;
  BakCount?: number | null;
  bakCount?: number | null;
  FavorimMi?: boolean | null;
  favorimMi?: boolean | null;
  Ozellikler?: JobFeature[] | null;
  ozellikler?: JobFeature[] | null;
};

type CustomerMessageFeeResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    MesajUcreti?: number;
  } | null;
};

type CustomerMessageSendResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    yeniMesajNr?: number;
  } | null;
};

const JOB_PAGE_SIZE = 4;

type JobsPageText = {
  tabJobs: string;
  tabJobSeekers: string;
  searchPlaceholder: string;
  loading: string;
  loadError: string;
  noData: string;
  noMatch: string;
  pass: string;
  like: string;
  match: string;
  sendMessage: string;
  active: string;
  inactive: string;
  published: string;
  serviceGroup: string;
  workType: string;
  location: string;
  features: string;
  descriptionFallback: string;
  deckHint: string;
  loadMore: string;
  remaining: string;
  liked: string;
  reset: string;
  noRecipient: string;
  enterMessage: string;
  messageSent: string;
  messageSendError: string;
  feeLoadError: string;
  filtersTitle: string;
  filtersLoading: string;
  countryLabel: string;
  countrySearchPlaceholder: string;
  cityLabel: string;
  selectCountryFirst: string;
  noCityFound: string;
  serviceGroupLabel: string;
  noServiceGroupFound: string;
  workTypeLabel: string;
  noWorkTypeFound: string;
  noResultFound: string;
  allOption: string;
  clear: string;
  apply: string;
  defaultMessage: (title: string) => string;
};
type CountriesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CountryItem[] | null;
};
type CountryItem = {
  Id?: number;
  UlkeAdi?: string;
  TelKodu?: string;
  ResimUrl?: string;
};

const JOB_TEXT: Record<Lang, JobsPageText> = {
  tr: {
    tabJobs: "İş İlanları",
    tabJobSeekers: "İş Arayanlar",
    searchPlaceholder: "İlan ara",
    loading: "İlanlar yükleniyor...",
    loadError: "İlanlar yüklenemedi.",
    noData: "Gösterilecek ilan kalmadı.",
    noMatch: "Bu aramayla eşleşen ilan bulunamadı.",
    pass: "Geç",
    like: "Beğen",
    match: "BabrooMatch",
    sendMessage: "Mesaj Gönder",
    active: "Aktif",
    inactive: "Pasif",
    published: "Yayın Tarihi",
    serviceGroup: "Hizmet Grubu",
    workType: "Çalışma Şekli",
    location: "Konum",
    features: "Özellikler",
    descriptionFallback: "Bu ilan için açıklama paylaşılmadı.",
    deckHint: "Sağa kaydır beğen, sola kaydır geç.",
    loadMore: "Yeni ilanlar yükleniyor...",
    remaining: "ilan kaldı",
    liked: "beğeni",
    reset: "Başa dön",
    noRecipient: "Bu ilanda başvuru yapılacak ilan bilgisi bulunamadı.",
    enterMessage: "Mesajınızı yazın.",
    messageSent: "Mesajınız başarıyla gönderildi.",
    messageSendError: "Mesaj gönderilemedi.",
    feeLoadError: "Mesaj ücreti yüklenemedi.",
    filtersTitle: "Filtreler",
    filtersLoading: "Yükleniyor...",
    countryLabel: "Ülke",
    countrySearchPlaceholder: "Ülke ara...",
    cityLabel: "İl",
    selectCountryFirst: "Önce ülke seçiniz",
    noCityFound: "İl bulunamadı",
    serviceGroupLabel: "Hizmet Grubu",
    noServiceGroupFound: "Hizmet grubu bulunamadı",
    workTypeLabel: "Çalışma Şekli",
    noWorkTypeFound: "Çalışma şekli bulunamadı",
    noResultFound: "Sonuç bulunamadı",
    allOption: "Tümü",
    clear: "Temizle",
    apply: "Uygula",
    defaultMessage: (title) => `Merhaba, "${title}" ilanınız hakkında bilgi almak istiyorum.`,
  },
  en: {
    tabJobs: "Job Listings",
    tabJobSeekers: "Job Seekers",
    searchPlaceholder: "Search listings",
    loading: "Loading listings...",
    loadError: "Failed to load job listings.",
    noData: "No listings left to show.",
    noMatch: "No listings matched this search.",
    pass: "Pass",
    like: "Like",
    match: "BabrooMatch",
    sendMessage: "Send Message",
    active: "Active",
    inactive: "Inactive",
    published: "Published",
    serviceGroup: "Service Group",
    workType: "Work Type",
    location: "Location",
    features: "Features",
    descriptionFallback: "No description was shared for this listing.",
    deckHint: "Swipe right to like, left to pass.",
    loadMore: "Loading more listings...",
    remaining: "listings left",
    liked: "likes",
    reset: "Start over",
    noRecipient: "This listing does not include a valid listing id for application.",
    enterMessage: "Enter your message.",
    messageSent: "Your message has been sent successfully.",
    messageSendError: "Failed to send message.",
    feeLoadError: "The message fee could not be loaded.",
    filtersTitle: "Filters",
    filtersLoading: "Loading...",
    countryLabel: "Country",
    countrySearchPlaceholder: "Search country...",
    cityLabel: "City",
    selectCountryFirst: "Select a country first",
    noCityFound: "No city found",
    serviceGroupLabel: "Service Group",
    noServiceGroupFound: "No service group found",
    workTypeLabel: "Work Type",
    noWorkTypeFound: "No work type found",
    noResultFound: "No results found",
    allOption: "All",
    clear: "Clear",
    apply: "Apply",
    defaultMessage: (title) => `Hello, I would like to learn more about your "${title}" listing.`,
  },
  ru: {
    tabJobs: "Вакансии",
    tabJobSeekers: "Соискатели",
    searchPlaceholder: "Поиск вакансий",
    loading: "Вакансии загружаются...",
    loadError: "Не удалось загрузить вакансии.",
    noData: "Больше нет вакансий для показа.",
    noMatch: "По этому поиску вакансии не найдены.",
    pass: "Пропустить",
    like: "Нравится",
    match: "BabrooMatch",
    sendMessage: "Отправить сообщение",
    active: "Активно",
    inactive: "Неактивно",
    published: "Опубликовано",
    serviceGroup: "Группа услуг",
    workType: "Тип работы",
    location: "Местоположение",
    features: "Особенности",
    descriptionFallback: "Для этой вакансии описание не указано.",
    deckHint: "Смахните вправо, чтобы поставить лайк, влево, чтобы пропустить.",
    loadMore: "Загружаются новые вакансии...",
    remaining: "вакансий осталось",
    liked: "лайков",
    reset: "Начать заново",
    noRecipient: "В этой вакансии отсутствует корректный ID объявления для отклика.",
    enterMessage: "Введите сообщение.",
    messageSent: "Ваше сообщение успешно отправлено.",
    messageSendError: "Не удалось отправить сообщение.",
    feeLoadError: "Не удалось загрузить стоимость сообщения.",
    filtersTitle: "Фильтры",
    filtersLoading: "Загрузка...",
    countryLabel: "Страна",
    countrySearchPlaceholder: "Поиск страны...",
    cityLabel: "Город",
    selectCountryFirst: "Сначала выберите страну",
    noCityFound: "Город не найден",
    serviceGroupLabel: "Группа услуг",
    noServiceGroupFound: "Группа услуг не найдена",
    workTypeLabel: "Тип работы",
    noWorkTypeFound: "Тип работы не найден",
    noResultFound: "Ничего не найдено",
    allOption: "Все",
    clear: "Очистить",
    apply: "Применить",
    defaultMessage: (title) => `Здравствуйте, хочу узнать подробнее о вакансии "${title}".`,
  },
  es: {
    tabJobs: "Ofertas",
    tabJobSeekers: "Buscadores de empleo",
    searchPlaceholder: "Buscar ofertas",
    loading: "Cargando ofertas...",
    loadError: "No se pudieron cargar las ofertas.",
    noData: "No quedan ofertas por mostrar.",
    noMatch: "No se encontraron ofertas con esta búsqueda.",
    pass: "Pasar",
    like: "Me gusta",
    match: "BabrooMatch",
    sendMessage: "Enviar mensaje",
    active: "Activo",
    inactive: "Inactivo",
    published: "Publicado",
    serviceGroup: "Grupo de servicio",
    workType: "Tipo de trabajo",
    location: "Ubicación",
    features: "Características",
    descriptionFallback: "No se compartió una descripción para esta oferta.",
    deckHint: "Desliza a la derecha para guardar, a la izquierda para pasar.",
    loadMore: "Cargando más ofertas...",
    remaining: "ofertas restantes",
    liked: "me gusta",
    reset: "Empezar de nuevo",
    noRecipient: "Esta oferta no incluye un ID válido de anuncio para postulación.",
    enterMessage: "Escribe tu mensaje.",
    messageSent: "Tu mensaje se envió correctamente.",
    messageSendError: "No se pudo enviar el mensaje.",
    feeLoadError: "No se pudo cargar el costo del mensaje.",
    filtersTitle: "Filtros",
    filtersLoading: "Cargando...",
    countryLabel: "País",
    countrySearchPlaceholder: "Buscar país...",
    cityLabel: "Ciudad",
    selectCountryFirst: "Primero selecciona un país",
    noCityFound: "No se encontró ciudad",
    serviceGroupLabel: "Grupo de servicio",
    noServiceGroupFound: "No se encontró grupo de servicio",
    workTypeLabel: "Tipo de trabajo",
    noWorkTypeFound: "No se encontró tipo de trabajo",
    noResultFound: "No se encontraron resultados",
    allOption: "Todos",
    clear: "Limpiar",
    apply: "Aplicar",
    defaultMessage: (title) => `Hola, me gustaría saber más sobre tu oferta "${title}".`,
  },
  fr: {
    tabJobs: "Offres",
    tabJobSeekers: "Chercheurs d'emploi",
    searchPlaceholder: "Rechercher des offres",
    loading: "Chargement des offres...",
    loadError: "Impossible de charger les offres.",
    noData: "Aucune offre restante.",
    noMatch: "Aucune offre ne correspond à cette recherche.",
    pass: "Passer",
    like: "Aimer",
    match: "BabrooMatch",
    sendMessage: "Envoyer un message",
    active: "Actif",
    inactive: "Inactif",
    published: "Publié",
    serviceGroup: "Groupe de service",
    workType: "Type de travail",
    location: "Lieu",
    features: "Caractéristiques",
    descriptionFallback: "Aucune description n'a été partagée pour cette offre.",
    deckHint: "Glissez à droite pour aimer, à gauche pour passer.",
    loadMore: "Chargement d'autres offres...",
    remaining: "offres restantes",
    liked: "likes",
    reset: "Recommencer",
    noRecipient: "Cette offre ne contient pas d'identifiant d'annonce valide pour postuler.",
    enterMessage: "Saisissez votre message.",
    messageSent: "Votre message a été envoyé avec succès.",
    messageSendError: "Impossible d'envoyer le message.",
    feeLoadError: "Impossible de charger le coût du message.",
    filtersTitle: "Filtres",
    filtersLoading: "Chargement...",
    countryLabel: "Pays",
    countrySearchPlaceholder: "Rechercher un pays...",
    cityLabel: "Ville",
    selectCountryFirst: "Sélectionnez d'abord un pays",
    noCityFound: "Aucune ville trouvée",
    serviceGroupLabel: "Groupe de service",
    noServiceGroupFound: "Aucun groupe de service trouvé",
    workTypeLabel: "Type de travail",
    noWorkTypeFound: "Aucun type de travail trouvé",
    noResultFound: "Aucun résultat trouvé",
    allOption: "Tous",
    clear: "Effacer",
    apply: "Appliquer",
    defaultMessage: (title) => `Bonjour, je souhaite en savoir plus sur votre offre "${title}".`,
  },
};

function readItems<T>(response?: ApiResponse<T[] | { Data?: T[]; data?: T[] }>): T[] {
  const data = response?.Data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const nested = (data as { Data?: T[]; data?: T[] }).Data ?? (data as { Data?: T[]; data?: T[] }).data;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function jobId(job: JobItem): number | null {
  return toPositiveInt(job.Nr ?? job.nr);
}

function jobCountryId(job: JobItem): number | null {
  return toPositiveInt(job.MusteriUlkeId ?? job.musteriUlkeId);
}

function jobCityId(job: JobItem): number | null {
  return toPositiveInt(job.MusteriIlId ?? job.musteriIlId);
}

function jobServiceGroupId(job: JobItem): number | null {
  return toPositiveInt(job.HizmetGrupId ?? job.hizmetGrupId);
}

function jobWorkTypeId(job: JobItem): number | null {
  return toPositiveInt(job.CalismaSekilId ?? job.calismaSekilId);
}

function jobTitle(job: JobItem): string {
  return (job.IsTanimi ?? job.isTanimi ?? "").trim() || "-";
}

//function jobDescription(job: JobItem): string {
//  return (job.Aciklama ?? job.aciklama ?? "").trim();
//}

function jobServiceGroup(job: JobItem): string {
  return (job.HizmetGrupAdi ?? job.hizmetGrupAdi ?? "").trim();
}

function jobWorkType(job: JobItem): string {
  return (job.CalismaSekilAdi ?? job.calismaSekilAdi ?? "").trim();
}

function jobCustomerImage(job: JobItem): string {
  return (job.MusteriResimUrl ?? job.musteriResimUrl ?? "").trim();
}

function jobLocation(job: JobItem): string {
  const country = (job.MusteriUlkeAdi ?? job.musteriUlkeAdi ?? "").trim();
  const city = (job.MusteriIlAdi ?? job.musteriIlAdi ?? "").trim();
  return [country, city].filter(Boolean).join(" / ");
}

function jobFeatures(job: JobItem): JobFeature[] {
  const items = job.Ozellikler ?? job.ozellikler;
  return Array.isArray(items) ? items : [];
}

function featureTitle(feature: JobFeature): string {
  return (feature.SecenekAdi ?? feature.secenekAdi ??  "").trim();
}

function featureGroup(feature: JobFeature): string {
  return (feature.GrupSecenekAdi ?? feature.grupSecenekAdi ?? "").trim();
}
function featureIsSingle(feature: JobFeature): boolean {
  return (feature.GrupsecenekTek ?? feature.grupsecenekTek) === true;
}

function featureValue(feature: JobFeature): boolean | null {
  return feature.IlanozEh ?? feature.ilanozEh ?? null;
}

function featureValueText(feature: JobFeature): string {
  return (feature.IlanozEhAcik ?? feature.ilanozEhAcik ?? "").trim();
}

function jobCreatedAt(job: JobItem): string | null | undefined {
  return job.OlusturmaZamani ?? job.olusturmaZamani;
}

function jobActive(job: JobItem): boolean {
  return (job.Aktif ?? job.aktif) !== false;
}

function jobFavCount(job: JobItem): number {
  const count = Number(job.FavCount ?? job.favCount ?? 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function jobBakCount(job: JobItem): number {
  const count = Number(job.BakCount ?? job.bakCount ?? 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function jobFavorimMi(job: JobItem): boolean {
  return (job.FavorimMi ?? job.favorimMi) === true;
}

function normalizeJobs(response?: ApiResponse<JobItem[] | { Data?: JobItem[]; data?: JobItem[] }>): JobItem[] {
  return readItems(response).filter((item) => jobId(item) != null);
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return fallback;
}

function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  return Number(status) === 401;
}

function isInsufficientBalanceError(error: unknown): boolean {
  const message = readErrorMessage(error, "");
  return /Yetersiz coin bakiyesi|Insufficient coin balance/i.test(message);
}

function formatJobDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getJobMonogram(job: JobItem): string {
  const raw = (jobServiceGroup(job) || jobTitle(job)).trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("tr-TR") ?? "")
      .join("") || "B"
  );
}

function buildAccent(seed: string) {
  const palettes = [
    {
      shell: "from-[#121720] via-[#18202d] to-[#10131a]",
      panel: "bg-[#f4edca]",
      chip: "bg-[#faa500] text-white",
      mark: "bg-[#121720] text-white",
      line: "bg-[#dfd2a7]",
    },
    {
      shell: "from-[#0f172a] via-[#17324b] to-[#0b2533]",
      panel: "bg-[#e5f3f4]",
      chip: "bg-[#0891b2] text-white",
      mark: "bg-[#103345] text-white",
      line: "bg-[#bed9df]",
    },
    {
      shell: "from-[#211815] via-[#3a231b] to-[#4d2818]",
      panel: "bg-[#f8e5d2]",
      chip: "bg-[#d97706] text-white",
      mark: "bg-[#4d2818] text-white",
      line: "bg-[#e8c4a5]",
    },
  ];
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[score % palettes.length] ?? palettes[0];
}

function SwipeJobCard({
  job,
  lang,
  text,
  dragX,
  dragging,
  animating,
  onPointerDown,
  onImageOpen,
}: {
  job: JobItem;
  lang: Lang;
  text: JobsPageText;
  dragX: number;
  dragging: boolean;
  animating: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onImageOpen: (job: JobItem) => void;
}) {
  const title = jobTitle(job);
  const serviceGroup = jobServiceGroup(job);
  const workType = jobWorkType(job);
  const imageUrl = jobCustomerImage(job);
  const location = jobLocation(job);
  const features = jobFeatures(job).filter((feature) => featureTitle(feature));
  const accent = buildAccent(`${jobId(job) ?? ""}-${serviceGroup}-${workType}-${title}`);
  const [imageFailed, setImageFailed] = useState(false);
  const likeOpacity = Math.min(Math.max(dragX / 130, 0), 1);
  const passOpacity = Math.min(Math.max(-dragX / 130, 0), 1);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <article
      onPointerDown={onPointerDown}
      className={`relative mx-auto w-full max-w-[1220px] cursor-grab overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] active:cursor-grabbing ${
        animating || !dragging ? "transition-transform duration-200 ease-out" : ""
      }`}
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
        touchAction: "pan-y",
      }}
    >
      <div
        className="pointer-events-none absolute left-7 top-7 z-20 rounded-2xl border-2 border-[#16a34a] bg-white/95 px-5 py-2 text-lg font-black uppercase text-[#16a34a] shadow"
        style={{ opacity: likeOpacity, transform: `rotate(-8deg) scale(${0.9 + likeOpacity * 0.1})` }}
      >
        {text.like}
      </div>
      <div
        className="pointer-events-none absolute right-7 top-7 z-20 rounded-2xl border-2 border-[#ef4444] bg-white/95 px-5 py-2 text-lg font-black uppercase text-[#ef4444] shadow"
        style={{ opacity: passOpacity, transform: `rotate(8deg) scale(${0.9 + passOpacity * 0.1})` }}
      >
        {text.pass}
      </div>

      <div className="grid min-h-[460px] lg:min-h-[520px] lg:grid-cols-[0.98fr_1fr]">
        <div className={`relative flex items-center justify-center bg-gradient-to-br ${accent.shell} px-4 py-6 sm:px-6 sm:py-10`}>
          <div className="absolute left-6 top-6 rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
            {jobBakCount(job)}
          </div>
          <div
            className={`absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-white backdrop-blur ${
              jobFavorimMi(job) ? "bg-red-500/90" : "bg-white/10"
            }`}
          >
            <Heart className={`h-4 w-4 ${jobFavorimMi(job) ? "fill-white" : ""}`} />
            {jobFavCount(job)}
          </div>

          <div className="flex aspect-square w-[min(70vw,330px)] items-center justify-center overflow-hidden rounded-[36px] bg-white shadow-[0_26px_70px_rgba(0,0,0,0.26)]">
            {imageUrl && !imageFailed ? (
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full cursor-zoom-in object-cover"
                onError={() => setImageFailed(true)}
                onClick={() => onImageOpen(job)}
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className={`grid h-24 w-24 place-items-center rounded-[30px] text-4xl font-black ${accent.mark}`}>
                  {getJobMonogram(job)}
                </div>
                <BriefcaseBusiness className="h-20 w-20 text-[#faa500]" strokeWidth={1.55} />
                <div className="max-w-[220px] px-3 text-base font-bold leading-snug text-[#243444]">
                  {serviceGroup || text.serviceGroup}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`${accent.panel} flex min-h-[460px] flex-col p-4 sm:min-h-[520px] sm:p-7 lg:p-9`}>
          <div className="flex flex-wrap items-center gap-2">
            {workType ? <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${accent.chip}`}>{workType}</span> : null}
            {serviceGroup ? (
              <span className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-[#3f4f5e] shadow-sm">
                {serviceGroup}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 break-words text-[24px] font-black leading-tight text-[#17202b] sm:mt-5 sm:text-[30px] lg:text-[40px]">
            {title}
          </h1>

          <div className="mt-4 rounded-[22px] bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#8492a6]">
              <MapPin className="h-4 w-4 text-[#64748b]" />
              {text.location}
            </div>
            <div className="mt-2 break-words text-base font-black text-[#17202b]">{location || "-"}</div>
          </div>

          <div className={`mt-5 h-px w-full ${accent.line}`} />

          {/*<p className="mt-5 max-h-[120px] overflow-y-auto pr-2 text-[17px] leading-8 text-[#334155]">
            {jobDescription(job) || text.descriptionFallback}
          </p>*/}

          <div className="mt-5 rounded-[22px] bg-white/70 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#8492a6]">{text.features}</div>
            {features.length ? (
              <div className="mt-3 flex max-h-[116px] flex-wrap gap-2 overflow-y-auto pr-1">
                {features.map((feature) => {
                  const title = featureTitle(feature);
                  const group = featureGroup(feature);
                  return (
                    <span
                      key={`${feature.Nr ?? feature.nr ?? title}-${group}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#334155] shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                      <span className="truncate">{group ? `${group}: ${title}` : title}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 text-sm font-semibold text-[#64748b]">-</div>
            )}
          </div>

          <div className="mt-auto grid gap-4 pt-6 sm:grid-cols-2">
            <div className="rounded-[22px] bg-white/70 p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.published}</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-[#17202b]">
                <CalendarDays className="h-4 w-4 text-[#64748b]" />
                {formatJobDate(jobCreatedAt(job), lang)}
              </div>
            </div>
            <div className="rounded-[22px] bg-white/70 p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.workType}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b]">{workType || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function JobsHomePage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const text = JOB_TEXT[lang];

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  const [messageJob, setMessageJob] = useState<JobItem | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMode, setSendModalMode] = useState<OfferModalMode>("form");
  const [sendCoinFee, setSendCoinFee] = useState<number | null>(null);
  const [sendFeeLoading, setSendFeeLoading] = useState(false);
  const [sendMessageInput, setSendMessageInput] = useState("");
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [favoritedJobIds, setFavoritedJobIds] = useState<Set<number>>(new Set());

  // Filter states for collapsible search section
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedUlke, setSelectedUlke] = useState<number | null>(null);
  const [selectedIller, setSelectedIller] = useState<number[]>([]);
  const [selectedHizmetGruplari, setSelectedHizmetGruplari] = useState<number[]>([]);
  const [selectedCalismaSekilleri, setSelectedCalismaSekilleri] = useState<number[]>([]);
  const [appliedUlke, setAppliedUlke] = useState<number | null>(null);
  const [appliedIller, setAppliedIller] = useState<number[]>([]);
  const [appliedHizmetGruplari, setAppliedHizmetGruplari] = useState<number[]>([]);
  const [appliedCalismaSekilleri, setAppliedCalismaSekilleri] = useState<number[]>([]);

  // Filter options - matching MainController API response shapes
  const [ulkeler, setUlkeler] = useState<{ Id?: number; UlkeAdi?: string | null; TelKodu?: string | null; ResimUrl?: string | null }[]>([]);
  const [iller, setIller] = useState<{ Id?: number; IlAdi?: string | null }[]>([]);
  const [hizmetGruplari, setHizmetGruplari] = useState<{ Id?: number; HgAdi?: string | null }[]>([]);
  const [calismaSekilleri, setCalismaSekilleri] = useState<{ Id?: number; CalismaSekliAdi?: string | null }[]>([]);

  // Search state for searchable dropdown (Ülke)
  const [ulkeSearch, setUlkeSearch] = useState("");

  // Ülke dropdown menu state
  const [ulkeMenuOpen, setUlkeMenuOpen] = useState(false);
  const ulkeMenuRef = React.useRef<HTMLDivElement>(null);

  // Helper to get display text for country
  const countryDisplay = (item: { UlkeAdi?: string | null; TelKodu?: string | null }) => {
    const name = (item.UlkeAdi ?? "").trim();
    const code = (item.TelKodu ?? "").trim();
    return code ? `${name} (+${code.replace(/^\+/, "")})` : name;
  };

  // Get selected country object
  const selectedUlkeObj = ulkeler.find((u) => u.Id === selectedUlke) ?? null;

  // Click outside handler for Ülke dropdown
  useEffect(() => {
    if (!ulkeMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (ulkeMenuRef.current && !ulkeMenuRef.current.contains(event.target as Node)) {
        setUlkeMenuOpen(false);
        setUlkeSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ulkeMenuOpen]);

  // Filter loading states
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Load filter options from MainController
  useEffect(() => {
    if (!filterOpen || filtersLoaded) return;
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        setFiltersLoading(true);
        console.log("[Jobs] Loading filters with dil:", dil);
        const [ulkelerRes, hizmetGruplariRes, calismaSekilleriRes] = await Promise.all([
          api.get<CountriesResponse>(`/api/countries?dil=${dil}`),
          api.get<ApiResponse<{ Id?: number; HgAdi?: string | null }[]>>("/api/main/GetHizmetGruplari?dil=" + dil),
          api.get<ApiResponse<{ Id?: number; CalismaSekliAdi?: string | null }[]>>("/api/main/GetCalismaSekilleri?dil=" + dil),
        ]);

        if (!cancelled) {
          console.log("[Jobs] Ulkeler response:", ulkelerRes);
          const ulkelerData = ulkelerRes?.Data;
          const hizmetGruplariData = hizmetGruplariRes?.Data ?? hizmetGruplariRes?.data;
          const calismaSekilleriData = calismaSekilleriRes?.Data ?? calismaSekilleriRes?.data;

          console.log("[Jobs] Ulkeler data:", ulkelerData);
          setUlkeler(Array.isArray(ulkelerData) ? ulkelerData : []);
          setIller([]);
          setHizmetGruplari(Array.isArray(hizmetGruplariData) ? hizmetGruplariData : []);
          setCalismaSekilleri(Array.isArray(calismaSekilleriData) ? calismaSekilleriData : []);
          setFiltersLoaded(true);
        }
      } catch (error) {
        console.error("[Jobs] Error loading filters:", error);
      } finally {
        if (!cancelled) setFiltersLoading(false);
      }
    }

    void loadFilterOptions();
    return () => { cancelled = true; };
  }, [filterOpen, dil, filtersLoaded]);

  // Filtered options for searchable dropdowns
  const filteredUlkeler = ulkeler.filter((u) =>
    (u.UlkeAdi ?? "").toLowerCase().includes(ulkeSearch.toLowerCase())
  );

  useEffect(() => {
    let cancelled = false;
    async function loadIllerByUlke() {
      if (!selectedUlke) {
        setIller([]);
        setSelectedIller([]);
        return;
      }

      try {
        const response = await api.get<ApiResponse<{ Id?: number; IlAdi?: string | null }[]>>(
          `/api/cities-public?dil=${dil}&ulkeId=${selectedUlke}`
        );
        if (cancelled) return;
        const cityList = response?.Data ?? response?.data;
        const nextIller = Array.isArray(cityList) ? cityList : [];
        setIller(nextIller);
        const validIds = new Set(nextIller.map((i) => i.Id).filter((id): id is number => typeof id === "number"));
        setSelectedIller((prev) => prev.filter((id) => validIds.has(id)));
      } catch {
        if (!cancelled) setIller([]);
      }
    }

    void loadIllerByUlke();
    return () => {
      cancelled = true;
    };
  }, [dil, selectedUlke]);

  // Apply filters and search
  const applyFilters = () => {
    setAppliedUlke(selectedUlke);
    setAppliedIller([...selectedIller]);
    setAppliedHizmetGruplari([...selectedHizmetGruplari]);
    setAppliedCalismaSekilleri([...selectedCalismaSekilleri]);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedUlke(null);
    setSelectedIller([]);
    setSelectedHizmetGruplari([]);
    setSelectedCalismaSekilleri([]);
    setAppliedUlke(null);
    setAppliedIller([]);
    setAppliedHizmetGruplari([]);
    setAppliedCalismaSekilleri([]);
  };

  const hasActiveFilters =
    appliedUlke != null ||
    appliedIller.length > 0 ||
    appliedHizmetGruplari.length > 0 ||
    appliedCalismaSekilleri.length > 0;

  const applyJobFilters = React.useCallback(
    (items: JobItem[]) =>
      items.filter((item) => {
        if (appliedUlke != null && jobCountryId(item) !== appliedUlke) return false;
        if (appliedIller.length > 0) {
          const cityId = jobCityId(item);
          if (cityId == null || !appliedIller.includes(cityId)) return false;
        }
        if (appliedHizmetGruplari.length > 0) {
          const groupId = jobServiceGroupId(item);
          if (groupId == null || !appliedHizmetGruplari.includes(groupId)) return false;
        }
        if (appliedCalismaSekilleri.length > 0) {
          const workTypeId = jobWorkTypeId(item);
          if (workTypeId == null || !appliedCalismaSekilleri.includes(workTypeId)) return false;
        }
        return true;
      }),
    [appliedCalismaSekilleri, appliedHizmetGruplari, appliedIller, appliedUlke]
  );

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const qs = new URLSearchParams({
        dil: String(dil),
        pageSize: String(JOB_PAGE_SIZE),
      });
      const trimmedSearch = search.trim();
      if (trimmedSearch) qs.set("search", trimmedSearch);
      if (appliedUlke) qs.set("ulke", String(appliedUlke));
      for (const id of appliedIller) qs.append("il", String(id));
      for (const id of appliedHizmetGruplari) qs.append("hizmetgrup", String(id));
      for (const id of appliedCalismaSekilleri) qs.append("calismasekil", String(id));

      try {
        setLoading(true);
        setLoadError(null);
        setActiveIndex(0);
        setDragX(0);
        const response = await api.get<ApiResponse<JobItem[] | { Data?: JobItem[]; data?: JobItem[] }>>(
          `/api/ilan/getall?${qs.toString()}`
        );
        if (cancelled) return;
        const nextJobs = applyJobFilters(normalizeJobs(response));
        setJobs(nextJobs);
        setLastId(toPositiveInt(response?.LastId ?? response?.lastId));
        const nextTotal = Number(response?.TotalCount ?? response?.totalCount ?? nextJobs.length);
        setTotalCount(Number.isFinite(nextTotal) && nextTotal >= 0 ? nextTotal : nextJobs.length);
      } catch (error) {
        if (cancelled) return;
        if (isUnauthorizedError(error)) {
          window.location.href = `/${lang}/login`;
          return;
        }
        setLoadError(readErrorMessage(error, text.loadError));
        setJobs([]);
        setLastId(null);
        setTotalCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [appliedCalismaSekilleri, appliedHizmetGruplari, appliedIller, appliedUlke, dil, search, text.loadError]);

  async function loadMoreJobs() {
    if (loading || loadingMore || lastId == null) return;

    const qs = new URLSearchParams({
      dil: String(dil),
      pageSize: String(JOB_PAGE_SIZE),
      lastId: String(lastId),
    });
    const trimmedSearch = search.trim();
    if (trimmedSearch) qs.set("search", trimmedSearch);
    if (appliedUlke) qs.set("ulke", String(appliedUlke));
    for (const id of appliedIller) qs.append("il", String(id));
    for (const id of appliedHizmetGruplari) qs.append("hizmetgrup", String(id));
    for (const id of appliedCalismaSekilleri) qs.append("calismasekil", String(id));

    try {
      setLoadingMore(true);
      const response = await api.get<ApiResponse<JobItem[] | { Data?: JobItem[]; data?: JobItem[] }>>(
        `/api/ilan/getall?${qs.toString()}`
      );
      const nextJobs = applyJobFilters(normalizeJobs(response));
      setJobs((prev) => {
        const seen = new Set(prev.map((item) => jobId(item)).filter((id): id is number => id != null));
        return [...prev, ...nextJobs.filter((item) => {
          const id = jobId(item);
          return id != null && !seen.has(id);
        })];
      });
      setLastId(toPositiveInt(response?.LastId ?? response?.lastId));
      const nextTotal = Number(response?.TotalCount ?? response?.totalCount ?? totalCount);
      if (Number.isFinite(nextTotal) && nextTotal >= 0) setTotalCount(nextTotal);
    } catch (error) {
      setLoadError(readErrorMessage(error, text.loadError));
    } finally {
      setLoadingMore(false);
    }
  }

  const hasMore = lastId != null && jobs.length < totalCount;

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    if (activeIndex >= jobs.length - 2) {
      void loadMoreJobs();
    }
  }, [activeIndex, hasMore, jobs.length, loading, loadingMore]);

  const activeJob = jobs[activeIndex] ?? null;
  const hasSearchQuery = search.trim().length > 0;
  const useVisibleCount = hasActiveFilters || hasSearchQuery;
  const remainingCount = useVisibleCount
    ? Math.max(jobs.length - activeIndex, 0)
    : Math.max(Math.max(totalCount, jobs.length) - activeIndex, 0);

  function resetDrag() {
    setAnimating(true);
    setDragX(0);
    window.setTimeout(() => setAnimating(false), 180);
  }

  async function addJobFavorite(ilanNr: number) {
    if (favoritedJobIds.has(ilanNr)) return;
    try {
      await api.post(`/api/jobs/favorite?ilanNr=${ilanNr}&kaynak=2&dil=${dil}`, {});
      setFavoritedJobIds((prev) => {
        const next = new Set(prev);
        next.add(ilanNr);
        return next;
      });
    } catch {
      // no-op: swipe action should continue even if favorite tracking fails
    }
  }

  async function addJobView(ilanNr: number) {
    try {
      await api.post(`/api/jobs/view?ilanNr=${ilanNr}&kaynak=2&dil=${dil}`, {});
    } catch {
      // no-op: swipe/image flow should continue even if view tracking fails
    }
  }

  function finishSwipe(direction: "left" | "right") {
    if (!activeJob || animating) return;
    const id = jobId(activeJob);
    setAnimating(true);
    setDragging(false);
    setDragStartX(null);
    setDragX(direction === "right" ? window.innerWidth : -window.innerWidth);

    window.setTimeout(() => {
      if (id != null) {
        void addJobView(id);
        if (direction === "right") {
          setLikedIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
          void addJobFavorite(id);
        }
      }
      setActiveIndex((prev) => prev + 1);
      setDragX(0);
      setAnimating(false);
    }, 220);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!activeJob || animating) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStartX(event.clientX);
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (dragStartX == null || !dragging || animating) return;
    setDragX(event.clientX - dragStartX);
  }

  function handlePointerUp() {
    if (!dragging || animating) return;
    setDragging(false);
    setDragStartX(null);
    if (dragX > 120) {
      finishSwipe("right");
      return;
    }
    if (dragX < -120) {
      finishSwipe("left");
      return;
    }
    resetDrag();
  }

  function closeSendModal() {
    setSendModalOpen(false);
    setSendModalMode("form");
    setSendMessageError(null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    setMessageJob(null);
    window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
  }

  async function openMessageModal(job: JobItem) {
    const title = jobTitle(job);
    const ilanNr = jobId(job);
    setMessageJob(job);
    setSendModalOpen(true);
    setSendModalMode("form");
    setSendMessageError(ilanNr == null ? text.noRecipient : null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    setSendMessageInput(text.defaultMessage(title));
    setSendCoinFee(null);

    if (ilanNr == null) return;

    try {
      setSendFeeLoading(true);
      const data = await api.get<CustomerMessageFeeResponse>(`/api/messages/job-application-fee?dil=${dil}`);
      const fee =
        typeof data?.Data?.MesajUcreti === "number" && Number.isFinite(data.Data.MesajUcreti)
          ? data.Data.MesajUcreti
          : null;
      setSendCoinFee(fee);
    } catch (error) {
      setSendCoinFee(null);
      setSendMessageError(readErrorMessage(error, text.feeLoadError));
    } finally {
      setSendFeeLoading(false);
    }
  }

  async function submitCustomerMessage() {
    const ilanNr = jobId(messageJob as JobItem);
    if (ilanNr == null) {
      setSendMessageError(text.noRecipient);
      return;
    }

    const trimmedMessage = sendMessageInput.trim();
    if (!trimmedMessage) {
      setSendMessageError(text.enterMessage);
      return;
    }

    setSendMessageLoading(true);
    setSendMessageError(null);

    try {
      const data = await api.post<CustomerMessageSendResponse>(`/api/messages/job-application-send?kaynak=2&dil=${dil}`, {
        ilanNr,
        mesajMetin: trimmedMessage,
      });

      setSendModalMode("success");
      setSendSuccessMessage(
        typeof data?.Message === "string" && data.Message.trim() ? data.Message : text.messageSent
      );
      setSendMessageInput("");
      window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
    } catch (error) {
      if (isInsufficientBalanceError(error)) {
        setSendModalMode("insufficient");
      } else {
        setSendMessageError(readErrorMessage(error, text.messageSendError));
      }
    } finally {
      setSendMessageLoading(false);
    }
  }

  function openCoinPurchase() {
    closeSendModal();
    window.dispatchEvent(new CustomEvent(OPEN_COIN_PURCHASE_EVENT));
  }

  async function openImagePreview(job: JobItem) {
    const imageUrl = jobCustomerImage(job);
    if (!imageUrl) return;
    setImagePreviewUrl(imageUrl);

    const id = jobId(job);
    if (id == null) return;
    void addJobView(id);
  }

  const tabs = [
    { label: text.tabJobs, href: `/${lang}/home/jobs`, active: true },
    { label: text.tabJobSeekers, href: `/${lang}/home/jobseekers` },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <TopBar
        lang={lang}
        tabs={tabs}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto mb-5 flex max-w-[1220px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase text-[#738096] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#faa500]" />
              {text.match}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#64748b]">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {remainingCount} {text.remaining}
            </span>
            {loadingMore ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#faa500]" />
                {text.loadMore}
              </span>
            ) : null}
          </div>
        </div>

        {loadError ? (
          <div className="mx-auto mb-5 flex max-w-[1220px] items-center gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <CircleAlert className="h-5 w-5" />
            <span>{loadError}</span>
          </div>
        ) : null}

        {/* Collapsible Filter Section */}
        <div className="mx-auto mb-5 max-w-[1220px]">
          <div className="rounded-3xl border border-[#e4e7ec] bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex w-full items-center justify-between text-sm font-bold text-[#334155]"
            >
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#faa500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {text.filtersTitle}
                {hasActiveFilters && (
                  <span className="rounded-full bg-[#faa500] px-2 py-0.5 text-xs text-white">
                    {[appliedUlke, appliedIller.length, appliedHizmetGruplari.length, appliedCalismaSekilleri.length].filter(Boolean).length}
                  </span>
                )}
              </span>
              <ChevronDown className={`h-5 w-5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filtersLoading ? (
                  <div className="col-span-full flex items-center justify-center gap-2 py-4 text-sm text-[#64748b]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {text.filtersLoading}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block text-[15px] text-[#66738e]">{text.countryLabel}</label>
                      <div className="relative" ref={ulkeMenuRef}>
                        <button
                          type="button"
                          onClick={() => setUlkeMenuOpen((prev) => !prev)}
                          className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#334155] transition hover:border-[#b8c4d8] focus:border-[#faa500] focus:outline-none"
                        >
                          {selectedUlkeObj?.ResimUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedUlkeObj.ResimUrl}
                              alt={selectedUlkeObj.UlkeAdi ?? "Ülke"}
                              className="h-5 w-7 shrink-0 rounded-sm object-cover"
                            />
                          ) : (
                            <span className="h-5 w-7 shrink-0 rounded-sm bg-[#EEF2F8]" />
                          )}
                          <span className="min-w-0 flex-1 pr-2 text-sm font-semibold text-[#1f232b]">
                            {selectedUlkeObj ? countryDisplay(selectedUlkeObj) : text.allOption}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`shrink-0 text-[#66738e] transition ${ulkeMenuOpen ? "rotate-180" : "rotate-0"}`}
                          />
                        </button>

                        {ulkeMenuOpen ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[#d7dbe3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                            <div className="border-b border-[#e8edf5] p-3">
                              <input
                                value={ulkeSearch}
                                onChange={(event) => setUlkeSearch(event.target.value)}
                                placeholder={text.countrySearchPlaceholder}
                                className="w-full rounded-[12px] border border-[#e1e7f0] bg-[#f8fafd] px-3 py-2.5 text-[13px] text-[#090914] outline-none placeholder:text-[#99A2B3]"
                                autoComplete="off"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-56 overflow-auto py-2">
                              {filteredUlkeler.length ? (
                                filteredUlkeler.map((item) => {
                                  const selected = item.Id === selectedUlke;
                                  return (
                                    <button
                                      key={item.Id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedUlke(item.Id ?? null);
                                        setUlkeMenuOpen(false);
                                        setUlkeSearch("");
                                      }}
                                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                                        selected
                                          ? "bg-[#fff2ea] font-semibold text-[#faa500]"
                                          : "text-[#4B5565] hover:bg-[#F8FAFD]"
                                      }`}
                                    >
                                      {item.ResimUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={item.ResimUrl}
                                          alt={item.UlkeAdi ?? "Ülke"}
                                          className="h-5 w-7 shrink-0 rounded-sm object-cover"
                                        />
                                      ) : (
                                        <span className="h-5 w-7 shrink-0 rounded-sm bg-[#EEF2F8]" />
                                      )}
                                      <span className="whitespace-normal break-words">
                                        {countryDisplay(item)}
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="px-4 py-4 text-[14px] text-[#99A2B3]">
                                  {text.noResultFound}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase text-[#738096]">{text.cityLabel}</label>
                      <div className="max-h-44 overflow-auto rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5">
                        {!selectedUlke ? (
                          <p className="text-sm text-[#94a3b8]">{text.selectCountryFirst}</p>
                        ) : iller.length === 0 ? (
                          <p className="text-sm text-[#94a3b8]">{text.noCityFound}</p>
                        ) : (
                          <div className="space-y-2">
                            {iller.map((i) => {
                              const cityId = i.Id ?? 0;
                              const checked = cityId > 0 && selectedIller.includes(cityId);
                              return (
                                <label key={i.Id} className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (cityId <= 0) return;
                                      setSelectedIller((prev) =>
                                        e.target.checked ? [...prev, cityId] : prev.filter((id) => id !== cityId)
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#faa500] focus:ring-[#faa500]"
                                  />
                                  <span>{i.IlAdi || `#${i.Id}`}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase text-[#738096]">{text.serviceGroupLabel}</label>
                      <div className="max-h-44 overflow-auto rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5">
                        {hizmetGruplari.length === 0 ? (
                          <p className="text-sm text-[#94a3b8]">{text.noServiceGroupFound}</p>
                        ) : (
                          <div className="space-y-2">
                            {hizmetGruplari.map((h) => {
                              const groupId = h.Id ?? 0;
                              const checked = groupId > 0 && selectedHizmetGruplari.includes(groupId);
                              return (
                                <label key={h.Id} className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (groupId <= 0) return;
                                      setSelectedHizmetGruplari((prev) =>
                                        e.target.checked ? [...prev, groupId] : prev.filter((id) => id !== groupId)
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#faa500] focus:ring-[#faa500]"
                                  />
                                  <span>{h.HgAdi || `#${h.Id}`}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase text-[#738096]">{text.workTypeLabel}</label>
                      <div className="max-h-44 overflow-auto rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5">
                        {calismaSekilleri.length === 0 ? (
                          <p className="text-sm text-[#94a3b8]">{text.noWorkTypeFound}</p>
                        ) : (
                          <div className="space-y-2">
                            {calismaSekilleri.map((c) => {
                              const workTypeId = c.Id ?? 0;
                              const checked = workTypeId > 0 && selectedCalismaSekilleri.includes(workTypeId);
                              return (
                                <label key={c.Id} className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (workTypeId <= 0) return;
                                      setSelectedCalismaSekilleri((prev) =>
                                        e.target.checked ? [...prev, workTypeId] : prev.filter((id) => id !== workTypeId)
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#faa500] focus:ring-[#faa500]"
                                  />
                                  <span>{c.CalismaSekliAdi || `#${c.Id}`}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {filterOpen && (
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#e2e8f0] pt-4">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-bold text-[#64748b] transition hover:bg-[#f8fafc]"
                  >
                    <X className="h-4 w-4" />
                    {text.clear}
                  </button>
                )}
                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#faa500] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  {text.apply}
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mx-auto flex min-h-[440px] max-w-[1220px] items-center justify-center gap-3 rounded-[24px] border border-[#e4e7ec] bg-white text-[#526071] shadow-sm sm:min-h-[560px] sm:rounded-[30px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{text.loading}</span>
          </div>
        ) : !activeJob && loadingMore ? (
          <div className="mx-auto flex min-h-[440px] max-w-[1220px] items-center justify-center gap-3 rounded-[24px] border border-[#e4e7ec] bg-white text-[#526071] shadow-sm sm:min-h-[560px] sm:rounded-[30px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{text.loadMore}</span>
          </div>
        ) : !activeJob ? (
          <div className="mx-auto flex min-h-[440px] max-w-[1220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d3d9e2] bg-white px-4 text-center shadow-sm sm:min-h-[560px] sm:rounded-[30px] sm:px-6">
            <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-[#fff4df] text-[#faa500]">
              <BriefcaseBusiness className="h-10 w-10" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-[#17202b]">
              {jobs.length > 0 && (search.trim() || hasActiveFilters) ? text.noMatch : text.noData}
            </h1>
            {jobs.length > 0 || activeIndex > 0 ? (
              <button
                type="button"
                onClick={() => setActiveIndex(0)}
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#faa500] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(250,165,0,0.22)] transition hover:brightness-95"
              >
                <RotateCcw className="h-4 w-4" />
                {text.reset}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <SwipeJobCard
                job={activeJob}
                lang={lang}
                text={text}
                dragX={dragX}
                dragging={dragging}
                animating={animating}
                onPointerDown={handlePointerDown}
                onImageOpen={openImagePreview}
              />
            </div>

            <div className="mx-auto mt-2 flex max-w-[1220px] items-center justify-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => finishSwipe("left")}
                disabled={animating}
                aria-label={text.pass}
                title={text.pass}
                className="group relative grid h-16 w-16 place-items-center rounded-full border border-[#d7dce3] bg-white text-[#777] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50 sm:h-20 sm:w-20"
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={3} />
                <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#17202b] px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {text.pass}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void openMessageModal(activeJob)}
                disabled={animating}
                aria-label={text.sendMessage}
                title={text.sendMessage}
                className="group relative grid h-[76px] w-[76px] place-items-center rounded-full bg-[#151dcf] text-white shadow-[0_18px_40px_rgba(21,29,207,0.28)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[90px] sm:w-[90px]"
              >
                <span className="absolute inset-[-5px] rounded-full border border-[#151dcf]/25" />
                <Image
                  src="/assets/images/babroo/logo-mark.png"
                  alt=""
                  width={44}
                  height={44}
                  className="h-9 w-9 object-contain brightness-0 invert sm:h-11 sm:w-11"
                />
                <span className="absolute bottom-4 text-[10px] font-black leading-none sm:bottom-5 sm:text-[11px]">
                  {text.match}
                </span>
                <MessageCircle className="absolute right-1 top-2 h-5 w-5 text-white/90 opacity-0 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#17202b] px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {text.sendMessage}
                </span>
              </button>

              <button
                type="button"
                onClick={() => finishSwipe("right")}
                disabled={animating}
                aria-label={text.like}
                title={text.like}
                className="group relative grid h-16 w-16 place-items-center rounded-full border border-[#d7dce3] bg-white text-[#faa500] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-50 sm:h-20 sm:w-20"
              >
                <Star className="h-7 w-7 fill-[#faa500] sm:h-9 sm:w-9" strokeWidth={2} />
                <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#17202b] px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {text.like}
                </span>
              </button>
            </div>
          </>
        )}
      </main>

      <OfferFlowModal
        open={sendModalOpen}
        lang={lang}
        kind="customer"
        mode={sendModalMode}
        coinFee={sendCoinFee}
        loadingFee={sendFeeLoading}
        message={sendMessageInput}
        sending={sendMessageLoading}
        error={sendMessageError}
        successMessage={sendSuccessMessage}
        onMessageChange={setSendMessageInput}
        onClose={closeSendModal}
        onSubmit={() => void submitCustomerMessage()}
        onOpenTopUp={openCoinPurchase}
      />

      {imagePreviewUrl ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImagePreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreviewUrl}
            alt="preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setImagePreviewUrl(null)}
            className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-[#1f232b]"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
