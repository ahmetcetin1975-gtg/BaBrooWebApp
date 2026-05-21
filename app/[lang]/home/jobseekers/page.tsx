"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Eye,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { OfferFlowModal, type OfferModalMode } from "@/components/offers/OfferFlowModal";
import { CUSTOMER_UPDATED_EVENT, OPEN_COIN_PURCHASE_EVENT } from "@/lib/customer/events";
import { localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";

const PAGE_SIZE = 4;

type ApiResponse<T> = {
  LastId?: number | null;
  lastId?: number | null;
  TotalCount?: number;
  totalCount?: number;
  Data?: T | null;
  data?: T | null;
  Message?: string;
  message?: string;
};

type JobSeekerItem = {
  Nr?: number;
  AdSoyad?: string | null;
  MusteriAdi?: string | null;
  MusteriSoyadi?: string | null;
  MusteriResimUrl?: string | null;
  UlkeAdi?: string | null;
  IlAdi?: string | null;
  Hakkimda?: string | null;
  CinsiyetAdi?: string | null;
  MedeniDurumAdi?: string | null;
  DogumTarihi?: string | null;
  OlusturmaZamani?: string | null;
  FavCount?: number | null;
  BakCount?: number | null;
  FavorimMi?: boolean | null;
  HizmetGruplari?: string[] | null;
  Uyruklar?: string[] | null;
  YabanciDiller?: string[] | null;
  Universiteler?: Array<{ UniversiteAdi?: string | null; BolumAdi?: string | null }> | null;
  Liseler?: Array<{ LiseAdi?: string | null; LiseTipAdi?: string | null }> | null;
};

type PageText = {
  tabJobs: string;
  tabJobSeekers: string;
  loading: string;
  loadMore: string;
  loadError: string;
  noData: string;
  noMatch: string;
  pass: string;
  sendMessage: string;
  like: string;
  match: string;
  reset: string;
  remaining: string;
  about: string;
  location: string;
  published: string;
  services: string;
  languages: string;
  nationalities: string;
  gender: string;
  marital: string;
  birthYear: string;
  education: string;
  badge: string;
  viewDetail: string;
  noRecipient: string;
  enterMessage: string;
  messageSent: string;
  messageSendError: string;
  feeLoadError: string;
  filtersTitle: string;
  countryLabel: string;
  cityLabel: string;
  genderLabel: string;
  maritalLabel: string;
  serviceLabel: string;
  selectCountryFirst: string;
  noResultFound: string;
  countrySearchPlaceholder: string;
  citySearchPlaceholder: string;
  allOption: string;
  clear: string;
  apply: string;
  defaultMessage: (name: string) => string;
};

const TEXT: Record<Lang, PageText> = {
  tr: {
    tabJobs: "İş İlanları",
    tabJobSeekers: "İş Arayanlar",
    loading: "İş arayanlar yükleniyor...",
    loadMore: "Yeni profiller yükleniyor...",
    loadError: "İş arayanlar yüklenemedi.",
    noData: "Gösterilecek profil kalmadı.",
    noMatch: "Aramana uygun profil bulunamadı.",
    pass: "Geç",
    sendMessage: "Mesaj Gönder",
    like: "Beğen",
    match: "BabrooMatch",
    reset: "Başa dön",
    remaining: "profil kaldı",
    about: "Hakkımda",
    location: "Konum",
    published: "Kayıt Tarihi",
    services: "Hizmet Grupları",
    languages: "Yabancı Diller",
    nationalities: "Uyruklar",
    gender: "Cinsiyet",
    marital: "Medeni Durum",
    birthYear: "Doğum Yılı",
    education: "Eğitim",
    badge: "İş Arayanlar",
    viewDetail: "Detayı Gör",
    noRecipient: "Bu profile mesaj gönderilecek müşteri bilgisi bulunamadı.",
    enterMessage: "Mesajınızı yazın.",
    messageSent: "Mesajınız başarıyla gönderildi.",
    messageSendError: "Mesaj gönderilemedi.",
    feeLoadError: "Mesaj ücreti yüklenemedi.",
    filtersTitle: "Filtreler",
    countryLabel: "Ülke",
    cityLabel: "İl",
    genderLabel: "Cinsiyet",
    maritalLabel: "Medeni Durum",
    serviceLabel: "Hizmet Grubu",
    selectCountryFirst: "Önce ülke seçiniz",
    noResultFound: "Sonuç bulunamadı",
    countrySearchPlaceholder: "Ülke ara...",
    citySearchPlaceholder: "İl ara...",
    allOption: "Tümü",
    clear: "Temizle",
    apply: "Uygula",
    defaultMessage: (name) => `Merhaba ${name}, profiliniz hakkında bilgi almak istiyorum.`,
  },
  en: {
    tabJobs: "Job Listings",
    tabJobSeekers: "Job Seekers",
    loading: "Loading job seekers...",
    loadMore: "Loading more profiles...",
    loadError: "Failed to load job seekers.",
    noData: "No profiles left to show.",
    noMatch: "No profiles matched your search.",
    pass: "Pass",
    sendMessage: "Send Message",
    like: "Like",
    match: "BabrooMatch",
    reset: "Start over",
    remaining: "profiles left",
    about: "About",
    location: "Location",
    published: "Registered",
    services: "Service Groups",
    languages: "Languages",
    nationalities: "Nationalities",
    gender: "Gender",
    marital: "Marital Status",
    birthYear: "Birth Year",
    education: "Education",
    badge: "Job Seekers",
    viewDetail: "View Detail",
    noRecipient: "This profile does not include a recipient for messaging.",
    enterMessage: "Enter your message.",
    messageSent: "Your message has been sent successfully.",
    messageSendError: "Failed to send message.",
    feeLoadError: "The message fee could not be loaded.",
    filtersTitle: "Filters",
    countryLabel: "Country",
    cityLabel: "City",
    genderLabel: "Gender",
    maritalLabel: "Marital Status",
    serviceLabel: "Service Group",
    selectCountryFirst: "Select country first",
    noResultFound: "No result found",
    countrySearchPlaceholder: "Search country...",
    citySearchPlaceholder: "Search city...",
    allOption: "All",
    clear: "Clear",
    apply: "Apply",
    defaultMessage: (name) => `Hello ${name}, I would like to learn more about your profile.`,
  },
  ru: {
    tabJobs: "Вакансии",
    tabJobSeekers: "Соискатели",
    loading: "Загрузка соискателей...",
    loadMore: "Загрузка новых профилей...",
    loadError: "Не удалось загрузить соискателей.",
    noData: "Профили закончились.",
    noMatch: "По вашему поиску профили не найдены.",
    pass: "Пропустить",
    sendMessage: "Отправить сообщение",
    like: "Нравится",
    match: "BabrooMatch",
    reset: "Начать заново",
    remaining: "профилей осталось",
    about: "О себе",
    location: "Местоположение",
    published: "Дата регистрации",
    services: "Группы услуг",
    languages: "Языки",
    nationalities: "Гражданство",
    gender: "Пол",
    marital: "Семейное положение",
    birthYear: "Год рождения",
    education: "Образование",
    badge: "Соискатели",
    viewDetail: "Смотреть",
    noRecipient: "В этом профиле нет получателя для сообщения.",
    enterMessage: "Введите сообщение.",
    messageSent: "Ваше сообщение успешно отправлено.",
    messageSendError: "Не удалось отправить сообщение.",
    feeLoadError: "Не удалось загрузить стоимость сообщения.",
    filtersTitle: "Фильтры",
    countryLabel: "Страна",
    cityLabel: "Город",
    genderLabel: "Пол",
    maritalLabel: "Семейное положение",
    serviceLabel: "Группа услуг",
    selectCountryFirst: "Сначала выберите страну",
    noResultFound: "Ничего не найдено",
    countrySearchPlaceholder: "Поиск страны...",
    citySearchPlaceholder: "Поиск города...",
    allOption: "Все",
    clear: "Очистить",
    apply: "Применить",
    defaultMessage: (name) => `Здравствуйте ${name}, хочу узнать подробнее о вашем профиле.`,
  },
  es: {
    tabJobs: "Ofertas",
    tabJobSeekers: "Buscadores de empleo",
    loading: "Cargando buscadores de empleo...",
    loadMore: "Cargando más perfiles...",
    loadError: "No se pudieron cargar los buscadores.",
    noData: "No quedan perfiles por mostrar.",
    noMatch: "No se encontraron perfiles para tu búsqueda.",
    pass: "Pasar",
    sendMessage: "Enviar mensaje",
    like: "Me gusta",
    match: "BabrooMatch",
    reset: "Empezar de nuevo",
    remaining: "perfiles restantes",
    about: "Sobre mí",
    location: "Ubicación",
    published: "Fecha de registro",
    services: "Grupos de servicio",
    languages: "Idiomas",
    nationalities: "Nacionalidades",
    gender: "Género",
    marital: "Estado civil",
    birthYear: "Año de nacimiento",
    education: "Educación",
    badge: "Buscadores de empleo",
    viewDetail: "Ver detalle",
    noRecipient: "Este perfil no incluye destinatario para mensajes.",
    enterMessage: "Escribe tu mensaje.",
    messageSent: "Tu mensaje se envió correctamente.",
    messageSendError: "No se pudo enviar el mensaje.",
    feeLoadError: "No se pudo cargar el costo del mensaje.",
    filtersTitle: "Filtros",
    countryLabel: "País",
    cityLabel: "Ciudad",
    genderLabel: "Género",
    maritalLabel: "Estado civil",
    serviceLabel: "Grupo de servicio",
    selectCountryFirst: "Primero selecciona país",
    noResultFound: "No se encontraron resultados",
    countrySearchPlaceholder: "Buscar país...",
    citySearchPlaceholder: "Buscar ciudad...",
    allOption: "Todos",
    clear: "Limpiar",
    apply: "Aplicar",
    defaultMessage: (name) => `Hola ${name}, me gustaría saber más sobre tu perfil.`,
  },
  fr: {
    tabJobs: "Offres",
    tabJobSeekers: "Chercheurs d'emploi",
    loading: "Chargement des chercheurs d'emploi...",
    loadMore: "Chargement de nouveaux profils...",
    loadError: "Impossible de charger les chercheurs d'emploi.",
    noData: "Aucun profil restant.",
    noMatch: "Aucun profil ne correspond à votre recherche.",
    pass: "Passer",
    sendMessage: "Envoyer un message",
    like: "Aimer",
    match: "BabrooMatch",
    reset: "Recommencer",
    remaining: "profils restants",
    about: "À propos",
    location: "Lieu",
    published: "Date d'inscription",
    services: "Groupes de service",
    languages: "Langues",
    nationalities: "Nationalités",
    gender: "Genre",
    marital: "État civil",
    birthYear: "Année de naissance",
    education: "Éducation",
    badge: "Chercheurs d'emploi",
    viewDetail: "Voir détail",
    noRecipient: "Ce profil ne contient pas de destinataire pour les messages.",
    enterMessage: "Saisissez votre message.",
    messageSent: "Votre message a été envoyé avec succès.",
    messageSendError: "Impossible d'envoyer le message.",
    feeLoadError: "Impossible de charger le coût du message.",
    filtersTitle: "Filtres",
    countryLabel: "Pays",
    cityLabel: "Ville",
    genderLabel: "Genre",
    maritalLabel: "État civil",
    serviceLabel: "Groupe de service",
    selectCountryFirst: "Sélectionnez d'abord un pays",
    noResultFound: "Aucun résultat",
    countrySearchPlaceholder: "Rechercher un pays...",
    citySearchPlaceholder: "Rechercher une ville...",
    allOption: "Tous",
    clear: "Effacer",
    apply: "Appliquer",
    defaultMessage: (name) => `Bonjour ${name}, je souhaite en savoir plus sur votre profil.`,
  },
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

type FilterCountry = { Id?: number; UlkeAdi?: string | null; ResimUrl?: string | null };
type FilterCity = { Id?: number; IlAdi?: string | null };
type FilterGender = { Id?: number; CinsiyetAdi?: string | null };
type FilterMarital = { Id?: number; MedeniHalAdi?: string | null };
type FilterService = { Id?: number; HgAdi?: string | null };

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readItems(response?: ApiResponse<JobSeekerItem[]>): JobSeekerItem[] {
  const items = response?.Data ?? response?.data;
  return Array.isArray(items) ? items : [];
}

function seekerId(item: JobSeekerItem): number | null {
  return toPositiveInt(item.Nr);
}

function seekerName(item: JobSeekerItem): string {
  const full = (item.AdSoyad ?? "").trim();
  if (full) return full;
  const first = (item.MusteriAdi ?? "").trim();
  const last = (item.MusteriSoyadi ?? "").trim();
  return `${first} ${last}`.trim() || "-";
}

function maskedSeekerName(item: JobSeekerItem): string {
  const first = (item.MusteriAdi ?? "").trim();
  const last = (item.MusteriSoyadi ?? "").trim();
  const full = (item.AdSoyad ?? "").trim();

  if (first || last) {
    const firstMasked = first ? `${first[0]?.toLocaleUpperCase("tr-TR") ?? ""}...` : "";
    const lastMasked = last ? `${last[0]?.toLocaleUpperCase("tr-TR") ?? ""}...` : "";
    return [firstMasked, lastMasked].filter(Boolean).join(" ") || "-";
  }

  const parts = full.split(/\s+/).filter(Boolean);
  if (!parts.length) return "-";
  return parts.map((p) => `${p[0]?.toLocaleUpperCase("tr-TR") ?? ""}...`).join(" ");
}

function formatDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatYear(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return String(date.getFullYear());
}

function seekerLocation(item: JobSeekerItem): string {
  const country = (item.UlkeAdi ?? "").trim();
  const city = (item.IlAdi ?? "").trim();
  return [country, city].filter(Boolean).join(" / ");
}

function monogram(item: JobSeekerItem): string {
  const name = seekerName(item);
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toLocaleUpperCase("tr-TR") ?? "")
      .join("") || "JB"
  );
}

function briefEducation(item: JobSeekerItem): string {
  const uni = item.Universiteler?.[0];
  if (uni?.UniversiteAdi) return `${uni.UniversiteAdi}${uni.BolumAdi ? ` - ${uni.BolumAdi}` : ""}`;
  const lise = item.Liseler?.[0];
  if (lise?.LiseAdi) return `${lise.LiseAdi}${lise.LiseTipAdi ? ` - ${lise.LiseTipAdi}` : ""}`;
  return "-";
}

function seekerFavCount(item: JobSeekerItem): number {
  const count = Number(item.FavCount ?? 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function seekerBakCount(item: JobSeekerItem): number {
  const count = Number(item.BakCount ?? 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function seekerFavorimMi(item: JobSeekerItem): boolean {
  return item.FavorimMi === true;
}

function normalizeFilterValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return fallback;
}

function isInsufficientBalanceError(error: unknown): boolean {
  const message = readErrorMessage(error, "");
  return /Yetersiz coin bakiyesi|Insufficient coin balance/i.test(message);
}

function SwipeSeekerCard({
  seeker,
  text,
  lang,
  dragX,
  dragging,
  animating,
  onPointerDown,
  onViewDetail,
}: {
  seeker: JobSeekerItem;
  text: PageText;
  lang: Lang;
  dragX: number;
  dragging: boolean;
  animating: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onViewDetail: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = (seeker.MusteriResimUrl ?? "").trim();
  const likeOpacity = Math.min(Math.max(dragX / 130, 0), 1);
  const passOpacity = Math.min(Math.max(-dragX / 130, 0), 1);

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <article
      onPointerDown={onPointerDown}
      className={`relative mx-auto w-full max-w-[1220px] cursor-grab overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] active:cursor-grabbing ${
        animating || !dragging ? "transition-transform duration-200 ease-out" : ""
      }`}
      style={{ transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`, touchAction: "pan-y" }}
    >
      <div
        className="pointer-events-none absolute left-7 top-7 z-20 rounded-2xl border-2 border-[#16a34a] bg-white/95 px-5 py-2 text-lg font-black uppercase text-[#16a34a] shadow"
        style={{ opacity: likeOpacity }}
      >
        {text.like}
      </div>
      <div
        className="pointer-events-none absolute right-7 top-7 z-20 rounded-2xl border-2 border-[#ef4444] bg-white/95 px-5 py-2 text-lg font-black uppercase text-[#ef4444] shadow"
        style={{ opacity: passOpacity }}
      >
        {text.pass}
      </div>

      <div className="grid min-h-[460px] lg:min-h-[520px] lg:grid-cols-[0.95fr_1fr]">
        <div className="relative flex items-center justify-center bg-gradient-to-br from-[#121720] via-[#17324b] to-[#102436] px-4 py-6 sm:px-6 sm:py-10">
          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
            <Eye className="h-4 w-4" />
            {seekerBakCount(seeker)}
          </div>
          <div
            className={`absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-white backdrop-blur ${
              seekerFavorimMi(seeker) ? "bg-red-500/90" : "bg-white/10"
            }`}
          >
            <Heart className={`h-4 w-4 ${seekerFavorimMi(seeker) ? "fill-white" : ""}`} />
            {seekerFavCount(seeker)}
          </div>
          <div className="flex aspect-square w-[min(70vw,320px)] items-center justify-center overflow-hidden rounded-[36px] bg-white shadow-[0_26px_70px_rgba(0,0,0,0.26)]">
            {imageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={seekerName(seeker)}
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
                draggable={false}
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-[30px] bg-[#17202b] text-4xl font-black text-white">
                {monogram(seeker)}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[460px] flex-col bg-[#f8fafc] p-4 sm:min-h-[520px] sm:p-7 lg:p-9">
          <div className="flex items-start justify-between gap-3">
            <h1 className="break-words text-[24px] font-black leading-tight text-[#17202b] sm:text-[30px] lg:text-[38px]">{maskedSeekerName(seeker)}</h1>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onViewDetail();
              }}
              className="shrink-0 rounded-xl bg-[#151dcf] px-4 py-2 text-xs font-bold text-white transition hover:brightness-95"
            >
              {text.viewDetail}
            </button>
          </div>
          <p className="mt-3 line-clamp-4 break-words text-[14px] leading-6 text-[#334155] sm:mt-4 sm:text-[16px] sm:leading-7">{(seeker.Hakkimda ?? "").trim() || "-"}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.location}</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-[#17202b]">
                <MapPin className="h-4 w-4 text-[#64748b]" />
                <span className="break-words">{seekerLocation(seeker) || "-"}</span>
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.published}</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-[#17202b]">
                <CalendarDays className="h-4 w-4 text-[#64748b]" />
                {formatDate(seeker.OlusturmaZamani, lang)}
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.services}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b] line-clamp-2">
                {(seeker.HizmetGruplari ?? []).filter(Boolean).join(", ") || "-"}
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.languages}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b] line-clamp-2">
                {(seeker.YabanciDiller ?? []).filter(Boolean).join(", ") || "-"}
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.nationalities}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b] line-clamp-2">
                {(seeker.Uyruklar ?? []).filter(Boolean).join(", ") || "-"}
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.gender}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b]">{(seeker.CinsiyetAdi ?? "").trim() || "-"}</div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.marital}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b]">{(seeker.MedeniDurumAdi ?? "").trim() || "-"}</div>
            </div>
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold uppercase text-[#8492a6]">{text.birthYear}</div>
              <div className="mt-2 text-sm font-bold text-[#17202b]">{formatYear(seeker.DogumTarihi)}</div>
            </div>
          </div>

          <div className="mt-3 rounded-[18px] bg-white p-4 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#8492a6]">{text.education}</div>
            <div className="mt-2 text-sm font-bold text-[#17202b]">{briefEducation(seeker)}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function JobSeekersPage() {
  const router = useRouter();
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const text = TEXT[lang];
  const dilMap: Record<Lang, number> = { tr: 1, en: 2, ru: 3, es: 4, fr: 5 };
  const dil = dilMap[lang];

  const [items, setItems] = useState<JobSeekerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [messageSeeker, setMessageSeeker] = useState<JobSeekerItem | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMode, setSendModalMode] = useState<OfferModalMode>("form");
  const [sendCoinFee, setSendCoinFee] = useState<number | null>(null);
  const [sendFeeLoading, setSendFeeLoading] = useState(false);
  const [sendMessageInput, setSendMessageInput] = useState("");
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);
  const [selectedGenderIds, setSelectedGenderIds] = useState<number[]>([]);
  const [selectedMaritalIds, setSelectedMaritalIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [appliedCountryId, setAppliedCountryId] = useState<number | null>(null);
  const [appliedCityIds, setAppliedCityIds] = useState<number[]>([]);
  const [appliedGenderIds, setAppliedGenderIds] = useState<number[]>([]);
  const [appliedMaritalIds, setAppliedMaritalIds] = useState<number[]>([]);
  const [appliedServiceIds, setAppliedServiceIds] = useState<number[]>([]);
  const [countries, setCountries] = useState<FilterCountry[]>([]);
  const [cities, setCities] = useState<FilterCity[]>([]);
  const [genders, setGenders] = useState<FilterGender[]>([]);
  const [maritals, setMaritals] = useState<FilterMarital[]>([]);
  const [services, setServices] = useState<FilterService[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const qs = new URLSearchParams({ dil: String(dil), pageSize: String(PAGE_SIZE) });
      const q = search.trim();
      if (q) qs.set("search", q);
      try {
        setLoading(true);
        setLoadError(null);
        setActiveIndex(0);
        setDragX(0);
        const response = await api.get<ApiResponse<JobSeekerItem[]>>(`/api/jobseekers/getallcompiled?${qs.toString()}`);
        if (cancelled) return;
        const nextItems = readItems(response).filter((x) => seekerId(x) != null);
        setItems(nextItems);
        setLastId(toPositiveInt(response?.LastId ?? response?.lastId));
        const total = Number(response?.TotalCount ?? response?.totalCount ?? nextItems.length);
        setTotalCount(Number.isFinite(total) && total >= 0 ? total : nextItems.length);
      } catch (error) {
        if (cancelled) return;
        const message =
          error && typeof error === "object"
            ? (typeof (error as { message?: unknown }).message === "string" && (error as { message: string }).message.trim()
                ? (error as { message: string }).message.trim()
                : typeof (error as { Message?: unknown }).Message === "string" && (error as { Message: string }).Message.trim()
                ? (error as { Message: string }).Message.trim()
                : text.loadError)
            : text.loadError;
        setLoadError(message || text.loadError);
        setItems([]);
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
  }, [dil, search, text.loadError]);

  async function loadMore() {
    if (loading || loadingMore || lastId == null) return;
    const qs = new URLSearchParams({ dil: String(dil), pageSize: String(PAGE_SIZE), lastId: String(lastId) });
    const q = search.trim();
    if (q) qs.set("search", q);
    try {
      setLoadingMore(true);
      const response = await api.get<ApiResponse<JobSeekerItem[]>>(`/api/jobseekers/getallcompiled?${qs.toString()}`);
      const next = readItems(response);
      setItems((prev) => {
        const seen = new Set(prev.map((x) => seekerId(x)).filter((id): id is number => id != null));
        return [...prev, ...next.filter((x) => {
          const id = seekerId(x);
          return id != null && !seen.has(id);
        })];
      });
      setLastId(toPositiveInt(response?.LastId ?? response?.lastId));
      const total = Number(response?.TotalCount ?? response?.totalCount ?? totalCount);
      if (Number.isFinite(total) && total >= 0) setTotalCount(total);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!filterOpen || filtersLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        setFiltersLoading(true);
        const [countriesRes, gendersRes, maritalsRes, servicesRes] = await Promise.all([
          api.get<ApiResponse<FilterCountry[]>>(`/api/main/GetUlkeler?dil=${dil}`),
          api.get<ApiResponse<FilterGender[]>>(`/api/main/GetCinsiyetler?dil=${dil}`),
          api.get<ApiResponse<FilterMarital[]>>(`/api/main/GetMedeniHaller?dil=${dil}`),
          api.get<ApiResponse<FilterService[]>>(`/api/main/GetHizmetGruplari?dil=${dil}`),
        ]);
        if (cancelled) return;
        setCountries(Array.isArray(countriesRes?.Data ?? countriesRes?.data) ? (countriesRes?.Data ?? countriesRes?.data ?? []) : []);
        setGenders(Array.isArray(gendersRes?.Data ?? gendersRes?.data) ? (gendersRes?.Data ?? gendersRes?.data ?? []) : []);
        setMaritals(Array.isArray(maritalsRes?.Data ?? maritalsRes?.data) ? (maritalsRes?.Data ?? maritalsRes?.data ?? []) : []);
        setServices(Array.isArray(servicesRes?.Data ?? servicesRes?.data) ? (servicesRes?.Data ?? servicesRes?.data ?? []) : []);
        setFiltersLoaded(true);
      } finally {
        if (!cancelled) setFiltersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dil, filterOpen, filtersLoaded]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedCountryId) {
      setCities([]);
      setSelectedCityIds([]);
      setCitySearch("");
      return;
    }
    (async () => {
      const res = await api.get<ApiResponse<FilterCity[]>>(`/api/main/GetIller?ulkeId=${selectedCountryId}&dil=${dil}`);
      if (cancelled) return;
      const nextCities = Array.isArray(res?.Data ?? res?.data) ? (res?.Data ?? res?.data ?? []) : [];
      setCities(nextCities);
      const validIds = new Set(nextCities.map((c) => Number(c.Id)).filter((id) => Number.isInteger(id) && id > 0));
      setSelectedCityIds((prev) => prev.filter((id) => validIds.has(id)));
    })().catch(() => {
      if (!cancelled) setCities([]);
    });
    return () => {
      cancelled = true;
    };
  }, [dil, selectedCountryId]);

  useEffect(() => {
    if (!countryMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (countryMenuRef.current && !countryMenuRef.current.contains(event.target as Node)) {
        setCountryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [countryMenuOpen]);

  const selectedCountryObj = countries.find((c) => Number(c.Id) === selectedCountryId) ?? null;
  const filteredCountries = countries.filter((c) =>
    normalizeFilterValue(c.UlkeAdi).toLocaleLowerCase(localeForLang(lang)).includes(countrySearch.toLocaleLowerCase(localeForLang(lang)))
  );
  const filteredCities = cities.filter((c) =>
    normalizeFilterValue(c.IlAdi).toLocaleLowerCase(localeForLang(lang)).includes(citySearch.toLocaleLowerCase(localeForLang(lang)))
  );

  const hasActiveFilters =
    appliedCountryId != null || appliedCityIds.length > 0 || appliedGenderIds.length > 0 || appliedMaritalIds.length > 0 || appliedServiceIds.length > 0;
  const visibleItems = items.filter((item) => {
    const countryName = normalizeFilterValue(item.UlkeAdi);
    const cityName = normalizeFilterValue(item.IlAdi);
    const genderName = normalizeFilterValue(item.CinsiyetAdi);
    const maritalName = normalizeFilterValue(item.MedeniDurumAdi);
    if (appliedCountryId != null) {
      const selectedCountryName = normalizeFilterValue(countries.find((c) => Number(c.Id) === appliedCountryId)?.UlkeAdi ?? "");
      if (!selectedCountryName || countryName !== selectedCountryName) return false;
    }
    if (appliedCityIds.length > 0) {
      const selectedCityNames = new Set(
        cities.filter((c) => appliedCityIds.includes(Number(c.Id))).map((c) => normalizeFilterValue(c.IlAdi)).filter(Boolean)
      );
      if (!selectedCityNames.has(cityName)) return false;
    }
    if (appliedGenderIds.length > 0) {
      const selectedGenderNames = new Set(
        genders.filter((g) => appliedGenderIds.includes(Number(g.Id))).map((g) => normalizeFilterValue(g.CinsiyetAdi)).filter(Boolean)
      );
      if (!selectedGenderNames.has(genderName)) return false;
    }
    if (appliedMaritalIds.length > 0) {
      const selectedMaritalNames = new Set(
        maritals.filter((m) => appliedMaritalIds.includes(Number(m.Id))).map((m) => normalizeFilterValue(m.MedeniHalAdi)).filter(Boolean)
      );
      if (!selectedMaritalNames.has(maritalName)) return false;
    }
    if (appliedServiceIds.length > 0) {
      const selectedServiceNames = new Set(
        services.filter((s) => appliedServiceIds.includes(Number(s.Id))).map((s) => normalizeFilterValue(s.HgAdi)).filter(Boolean)
      );
      const itemServices = (item.HizmetGruplari ?? []).map((service) => normalizeFilterValue(service));
      if (!itemServices.some((service) => selectedServiceNames.has(service))) return false;
    }
    return true;
  });

  useEffect(() => {
    if (activeIndex >= visibleItems.length) setActiveIndex(0);
  }, [activeIndex, visibleItems.length]);

  const hasMore = lastId != null && items.length < totalCount;
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const threshold = hasActiveFilters ? Math.max(visibleItems.length - 1, 0) : items.length - 2;
    if (activeIndex >= threshold) void loadMore();
  }, [activeIndex, hasActiveFilters, hasMore, items.length, loading, loadingMore, visibleItems.length]);

  const activeItem = visibleItems[activeIndex] ?? null;
  const remainingBase = hasActiveFilters || search.trim() ? visibleItems.length : Math.max(totalCount, items.length);
  const remainingCount = Math.max(remainingBase - activeIndex, 0);

  useEffect(() => {
    if (!activeItem) return;
    const currentSeekerId = seekerId(activeItem);
    if (currentSeekerId == null) return;
    void api.post(`/api/jobseekers/view?bakilanMusteriNr=${currentSeekerId}&kaynak=2&dil=${dil}`, {}).catch(() => undefined);
  }, [activeItem, dil]);

  function resetDrag() {
    setAnimating(true);
    setDragX(0);
    window.setTimeout(() => setAnimating(false), 180);
  }

  function finishSwipe(direction: "left" | "right") {
    if (!activeItem || animating) return;
    const currentSeekerId = seekerId(activeItem);
    if (currentSeekerId != null) {
      if (direction === "left") {
        void api.post(`/api/jobseekers/view?bakilanMusteriNr=${currentSeekerId}&kaynak=2&dil=${dil}`, {}).catch(() => undefined);
      } else {
        void api
          .post(`/api/jobseekers/favorite?favMusteriNr=${currentSeekerId}&kaynak=2&dil=${dil}`, {})
          .catch(() => undefined);
      }
    }
    setAnimating(true);
    setDragging(false);
    setDragStartX(null);
    setDragX(direction === "right" ? window.innerWidth : -window.innerWidth);
    window.setTimeout(() => {
      setActiveIndex((prev) => prev + 1);
      setDragX(0);
      setAnimating(false);
    }, 220);
  }

  function closeSendModal() {
    setSendModalOpen(false);
    setSendModalMode("form");
    setSendMessageError(null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    setMessageSeeker(null);
    window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
  }

  async function openMessageModal(seeker: JobSeekerItem) {
    const recipientId = seekerId(seeker);
    const name = seekerName(seeker);
    setMessageSeeker(seeker);
    setSendModalOpen(true);
    setSendModalMode("form");
    setSendMessageError(recipientId == null ? text.noRecipient : null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    setSendMessageInput(text.defaultMessage(name));
    setSendCoinFee(null);

    if (recipientId == null) return;

    try {
      setSendFeeLoading(true);
      const data = await api.get<CustomerMessageFeeResponse>(`/api/messages/customer-message-fee?dil=${dil}`);
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
    const recipientId = seekerId(messageSeeker ?? {});
    if (recipientId == null) {
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
      const data = await api.post<CustomerMessageSendResponse>(`/api/messages/customer-message-send?kaynak=2&dil=${dil}`, {
        mesajMusteriNrTo: recipientId,
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

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!activeItem || animating) return;
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
    if (dragX > 120) return finishSwipe("right");
    if (dragX < -120) return finishSwipe("left");
    resetDrag();
  }

  function applyFilters() {
    setAppliedCountryId(selectedCountryId);
    setAppliedCityIds([...selectedCityIds]);
    setAppliedGenderIds([...selectedGenderIds]);
    setAppliedMaritalIds([...selectedMaritalIds]);
    setAppliedServiceIds([...selectedServiceIds]);
    setActiveIndex(0);
    setDragX(0);
    setFilterOpen(false);
    setCountryMenuOpen(false);
  }

  function clearFilters() {
    setSelectedCountryId(null);
    setSelectedCityIds([]);
    setSelectedGenderIds([]);
    setSelectedMaritalIds([]);
    setSelectedServiceIds([]);
    setAppliedCountryId(null);
    setAppliedCityIds([]);
    setAppliedGenderIds([]);
    setAppliedMaritalIds([]);
    setAppliedServiceIds([]);
    setCities([]);
    setCountrySearch("");
    setCitySearch("");
    setCountryMenuOpen(false);
    setActiveIndex(0);
    setDragX(0);
  }

  const tabs = [
    { label: text.tabJobs, href: `/${lang}/home/jobs` },
    { label: text.tabJobSeekers, href: `/${lang}/home/jobseekers`, active: true },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <TopBar lang={lang} tabs={tabs} searchValue={search} onSearchChange={setSearch} />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 flex max-w-[1220px] flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase text-[#738096] shadow-sm">
            <Sparkles className="h-4 w-4 text-[#faa500]" />
            {text.badge}
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#64748b] shadow-sm">
            {remainingCount} {text.remaining}
          </span>
        </div>

        <div className="mx-auto mb-5 w-full max-w-[1220px] rounded-3xl border border-[#e4e7ec] bg-white p-3 shadow-sm sm:p-4">
          <button
            type="button"
            onClick={() => setFilterOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl px-2 py-2 text-left"
          >
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#1e293b]">
              {text.filtersTitle}
              {hasActiveFilters ? (
                <span className="rounded-full bg-[#151dcf] px-2 py-0.5 text-xs text-white">
                  {[
                    appliedCountryId != null ? 1 : 0,
                    appliedCityIds.length > 0 ? 1 : 0,
                    appliedGenderIds.length > 0 ? 1 : 0,
                    appliedMaritalIds.length > 0 ? 1 : 0,
                    appliedServiceIds.length > 0 ? 1 : 0,
                  ].filter(Boolean).length}
                </span>
              ) : null}
            </div>
            <ChevronDown className={`h-5 w-5 text-[#64748b] transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>

          {filterOpen ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {filtersLoading ? (
                <div className="sm:col-span-2 lg:col-span-5 rounded-xl border border-[#d7dce3] bg-[#f8fafc] p-3 text-sm text-[#64748b]">
                  {text.loading}
                </div>
              ) : null}
              <div className="grid gap-1 text-sm">
                <span className="font-semibold text-[#475569]">{text.countryLabel}</span>
                <div className="relative" ref={countryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCountryMenuOpen((prev) => !prev)}
                    className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#d7dce3] bg-white px-3 py-2 text-left text-sm outline-none focus:border-[#151dcf]"
                  >
                    {selectedCountryObj?.ResimUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedCountryObj.ResimUrl} alt={selectedCountryObj.UlkeAdi ?? "country"} className="h-5 w-7 shrink-0 rounded-sm object-cover" />
                    ) : (
                      <span className="h-5 w-7 shrink-0 rounded-sm bg-[#eef2f8]" />
                    )}
                    <span className="min-w-0 flex-1 truncate pr-2 text-[#1f232b]">
                      {selectedCountryObj?.UlkeAdi ?? text.allOption}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#66738e] transition ${countryMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {countryMenuOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-[#d7dbe3] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.14)]">
                      <div className="border-b border-[#e8edf5] p-2">
                        <input
                          value={countrySearch}
                          onChange={(event) => setCountrySearch(event.target.value)}
                          placeholder={text.countrySearchPlaceholder}
                          className="w-full rounded-lg border border-[#e1e7f0] bg-[#f8fafd] px-3 py-2 text-sm outline-none"
                          autoComplete="off"
                        />
                      </div>
                      <div className="max-h-56 overflow-auto py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCountryId(null);
                            setSelectedCityIds([]);
                            setCountryMenuOpen(false);
                            setCountrySearch("");
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f8fafd]"
                        >
                          {text.allOption}
                        </button>
                        {filteredCountries.length ? (
                          filteredCountries.map((option) => {
                            const id = Number(option.Id);
                            if (!Number.isInteger(id) || id <= 0) return null;
                            const selected = selectedCountryId === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setSelectedCountryId(id);
                                  setCountryMenuOpen(false);
                                  setCountrySearch("");
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${selected ? "bg-[#eef2ff] font-semibold text-[#151dcf]" : "text-[#334155] hover:bg-[#f8fafd]"}`}
                              >
                                {option.ResimUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={option.ResimUrl} alt={option.UlkeAdi ?? "country"} className="h-5 w-7 shrink-0 rounded-sm object-cover" />
                                ) : (
                                  <span className="h-5 w-7 shrink-0 rounded-sm bg-[#eef2f8]" />
                                )}
                                <span className="break-words">{option.UlkeAdi ?? "-"}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-3 text-xs text-[#64748b]">{text.noResultFound}</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <span className="font-semibold text-[#475569]">{text.cityLabel}</span>
                <div className="max-h-36 overflow-auto rounded-xl border border-[#d7dce3] bg-white p-2">
                  {!selectedCountryId ? (
                    <div className="text-xs text-[#64748b]">{text.selectCountryFirst}</div>
                  ) : cities.length === 0 ? (
                    <div className="text-xs text-[#64748b]">{text.noResultFound}</div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={citySearch}
                        onChange={(event) => setCitySearch(event.target.value)}
                        placeholder={text.citySearchPlaceholder}
                        className="w-full rounded-lg border border-[#e1e7f0] bg-[#f8fafd] px-3 py-2 text-sm outline-none"
                      />
                      {filteredCities.length ? filteredCities.map((option) => {
                      const cityId = Number(option.Id);
                      if (!Number.isInteger(cityId) || cityId <= 0) return null;
                      return (
                        <label key={cityId} className="flex items-center gap-2 py-1 text-sm text-[#334155]">
                          <input
                            type="checkbox"
                            checked={selectedCityIds.includes(cityId)}
                            onChange={(event) =>
                              setSelectedCityIds((prev) => (event.target.checked ? [...prev, cityId] : prev.filter((id) => id !== cityId)))
                            }
                          />
                          <span>{option.IlAdi ?? "-"}</span>
                        </label>
                      );
                    }) : <div className="text-xs text-[#64748b]">{text.noResultFound}</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <span className="font-semibold text-[#475569]">{text.genderLabel}</span>
                <div className="max-h-36 overflow-auto rounded-xl border border-[#d7dce3] bg-white p-2">
                  {genders.length === 0 ? (
                    <div className="text-xs text-[#64748b]">{text.noResultFound}</div>
                  ) : (
                    genders.map((option) => {
                      const genderId = Number(option.Id);
                      if (!Number.isInteger(genderId) || genderId <= 0) return null;
                      return (
                        <label key={genderId} className="flex items-center gap-2 py-1 text-sm text-[#334155]">
                          <input
                            type="checkbox"
                            checked={selectedGenderIds.includes(genderId)}
                            onChange={(event) =>
                              setSelectedGenderIds((prev) => (event.target.checked ? [...prev, genderId] : prev.filter((id) => id !== genderId)))
                            }
                          />
                          <span>{option.CinsiyetAdi ?? "-"}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <span className="font-semibold text-[#475569]">{text.maritalLabel}</span>
                <div className="max-h-36 overflow-auto rounded-xl border border-[#d7dce3] bg-white p-2">
                  {maritals.length === 0 ? (
                    <div className="text-xs text-[#64748b]">{text.noResultFound}</div>
                  ) : (
                    maritals.map((option) => {
                      const maritalId = Number(option.Id);
                      if (!Number.isInteger(maritalId) || maritalId <= 0) return null;
                      return (
                        <label key={maritalId} className="flex items-center gap-2 py-1 text-sm text-[#334155]">
                          <input
                            type="checkbox"
                            checked={selectedMaritalIds.includes(maritalId)}
                            onChange={(event) =>
                              setSelectedMaritalIds((prev) => (event.target.checked ? [...prev, maritalId] : prev.filter((id) => id !== maritalId)))
                            }
                          />
                          <span>{option.MedeniHalAdi ?? "-"}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <span className="font-semibold text-[#475569]">{text.serviceLabel}</span>
                <div className="max-h-36 overflow-auto rounded-xl border border-[#d7dce3] bg-white p-2">
                  {services.length === 0 ? (
                    <div className="text-xs text-[#64748b]">{text.noResultFound}</div>
                  ) : (
                    services.map((option) => {
                      const serviceId = Number(option.Id);
                      if (!Number.isInteger(serviceId) || serviceId <= 0) return null;
                      return (
                        <label key={serviceId} className="flex items-center gap-2 py-1 text-sm text-[#334155]">
                          <input
                            type="checkbox"
                            checked={selectedServiceIds.includes(serviceId)}
                            onChange={(event) =>
                              setSelectedServiceIds((prev) => (event.target.checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)))
                            }
                          />
                          <span>{option.HgAdi ?? "-"}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-[#d7dce3] bg-white px-4 py-2 text-sm font-bold text-[#475569] transition hover:bg-[#f8fafc]"
                >
                  {text.clear}
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="rounded-xl bg-[#151dcf] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
                >
                  {text.apply}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {loadError ? (
          <div className="mx-auto mb-5 flex max-w-[1220px] items-center gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <CircleAlert className="h-5 w-5" />
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="mx-auto flex min-h-[440px] max-w-[1220px] items-center justify-center gap-3 rounded-[24px] border border-[#e4e7ec] bg-white text-[#526071] shadow-sm sm:min-h-[560px] sm:rounded-[30px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{text.loading}</span>
          </div>
        ) : !activeItem && loadingMore ? (
          <div className="mx-auto flex min-h-[440px] max-w-[1220px] items-center justify-center gap-3 rounded-[24px] border border-[#e4e7ec] bg-white text-[#526071] shadow-sm sm:min-h-[560px] sm:rounded-[30px]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{text.loadMore}</span>
          </div>
        ) : !activeItem ? (
          <div className="mx-auto flex min-h-[440px] max-w-[1220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d3d9e2] bg-white px-4 text-center shadow-sm sm:min-h-[560px] sm:rounded-[30px] sm:px-6">
            <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-[#fff4df] text-[#faa500]">
              <UserRound className="h-10 w-10" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-[#17202b]">{(items.length > 0 && (search.trim() || hasActiveFilters)) ? text.noMatch : text.noData}</h1>
            {visibleItems.length > 0 || activeIndex > 0 ? (
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
            <div onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
              <SwipeSeekerCard
                seeker={activeItem}
                text={text}
                lang={lang}
                dragX={dragX}
                dragging={dragging}
                animating={animating}
                onPointerDown={handlePointerDown}
                onViewDetail={() => {
                  const id = seekerId(activeItem);
                  if (id) {
                    void api
                      .post(`/api/jobseekers/view?bakilanMusteriNr=${id}&kaynak=2&dil=${dil}`, {})
                      .catch(() => undefined)
                      .finally(() => {
                        router.push(`/${lang}/home/jobseekerdetail/${id}`);
                      });
                  }
                }}
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
                onClick={() => activeItem && void openMessageModal(activeItem)}
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
    </div>
  );
}
