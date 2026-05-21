"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, ChevronRight, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { api } from "@/lib/api/client";
import { localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";

type ApiResponse<T> = { Data?: T | null; data?: T | null; Message?: string; message?: string };

type Detail = {
  Nr?: number;
  MusteriAdi?: string | null;
  MusteriSoyadi?: string | null;
  AdSoyad?: string | null;
  Email?: string | null;
  Tel?: string | null;
  UlkeAdi?: string | null;
  IlAdi?: string | null;
  CinsiyetAdi?: string | null;
  MedeniDurumAdi?: string | null;
  Hakkimda?: string | null;
  DogumTarihi?: string | null;
  OlusturmaZamani?: string | null;
  EhliyetTarihi?: string | null;
  AskerlikTarihi?: string | null;
  AskerlikAdi?: string | null;
  EhliyetAdi?: string | null;
  Resim1Url?: string | null;
  Resim2Url?: string | null;
  Resim3Url?: string | null;
  VideoUrl?: string | null;
  MusteriResimUrl?: string | null;
  HizmetGruplari?: string[] | null;
  Uyruklar?: string[] | null;
  YabanciDiller?: string[] | null;
  YabanciDilDetaylari?: Array<{ DilAdi?: string | null; SeviyeAdi?: string | null; Seviye?: number | null }> | null;
  IsTecrubeleri?: Array<{
    IsyeriAdi?: string | null;
    IsAdi?: string | null;
    IsTanimi?: string | null;
    IlAdi?: string | null;
    CalismaSekliAdi?: string | null;
    BaslamaTarihi?: string | null;
    BitisTarihi?: string | null;
    HalenCalisiyor?: boolean | null;
  }> | null;
  Referanslar?: Array<{ AdSoyad?: string | null; Tel?: string | null; Aciklama?: string | null }> | null;
  Pasaportlar?: Array<{ UlkeAdi?: string | null; GecerlilikTarihi?: string | null }> | null;
  Ozellikler?: Array<{ GrupSecenekAdi?: string | null; SecenekAdi?: string | null; EhAcik?: string | null; GrupsecenekTek?: boolean | null }> | null;
};

type TText = {
  tabJobs: string;
  tabJobSeekers: string;
  title: string;
  back: string;
  detail: string;
  about: string;
  location: string;
  birthYear: string;
  registerDate: string;
  licenseYear: string;
  militaryYear: string;
  phone: string;
  email: string;
  services: string;
  nationalities: string;
  features: string;
  languageLevels: string;
  media: string;
  workExperience: string;
  references: string;
  passports: string;
  military: string;
  license: string;
  noVideo: string;
  current: string;
  gender: string;
  marital: string;
  militaryInfo: string;
  licenseInfo: string;
  loading: string;
};

const TEXT: Record<Lang, TText> = {
  tr: { tabJobs: "İş İlanları", tabJobSeekers: "İş Arayanlar", title: "İş Arayan Detayı", back: "İş Arayanlar", detail: "Detay", about: "Hakkımda", location: "Konum", birthYear: "Doğum Yılı", registerDate: "Kayıt Tarihi", licenseYear: "Ehliyet Yılı", militaryYear: "Askerlik Yılı", phone: "Telefon", email: "Email", services: "Hizmet Grupları", nationalities: "Uyruklar", features: "Özellikler", languageLevels: "Yabancı Dil Seviyeleri", media: "Medya", workExperience: "İş Tecrübeleri", references: "Referanslar", passports: "Pasaportlar", military: "Askerlik", license: "Ehliyet", noVideo: "Video yok", current: "Devam Ediyor", gender: "Cinsiyet", marital: "Medeni Hal", militaryInfo: "Askerlik Bilgileri", licenseInfo: "Ehliyet Bilgileri", loading: "Detay yükleniyor..." },
  en: { tabJobs: "Job Listings", tabJobSeekers: "Job Seekers", title: "Job Seeker Detail", back: "Job Seekers", detail: "Detail", about: "About", location: "Location", birthYear: "Birth Year", registerDate: "Register Date", licenseYear: "License Year", militaryYear: "Military Year", phone: "Phone", email: "Email", services: "Service Groups", nationalities: "Nationalities", features: "Features", languageLevels: "Language Levels", media: "Media", workExperience: "Work Experience", references: "References", passports: "Passports", military: "Military", license: "License", noVideo: "No video", current: "Current", gender: "Gender", marital: "Marital Status", militaryInfo: "Military Info", licenseInfo: "License Info", loading: "Loading detail..." },
  ru: { tabJobs: "Вакансии", tabJobSeekers: "Соискатели", title: "Профиль соискателя", back: "Соискатели", detail: "Деталь", about: "О себе", location: "Местоположение", birthYear: "Год рождения", registerDate: "Дата регистрации", licenseYear: "Год прав", militaryYear: "Год службы", phone: "Телефон", email: "Email", services: "Группы услуг", nationalities: "Гражданство", features: "Особенности", languageLevels: "Уровни языков", media: "Медиа", workExperience: "Опыт работы", references: "Рекомендации", passports: "Паспорта", military: "Служба", license: "Права", noVideo: "Нет видео", current: "Текущая", gender: "Пол", marital: "Семейное положение", militaryInfo: "Сведения о службе", licenseInfo: "Сведения о правах", loading: "Загрузка..." },
  es: { tabJobs: "Ofertas", tabJobSeekers: "Buscadores de empleo", title: "Detalle del candidato", back: "Buscadores", detail: "Detalle", about: "Sobre mí", location: "Ubicación", birthYear: "Año de nacimiento", registerDate: "Fecha de registro", licenseYear: "Año de licencia", militaryYear: "Año militar", phone: "Teléfono", email: "Email", services: "Grupos de servicio", nationalities: "Nacionalidades", features: "Características", languageLevels: "Niveles de idioma", media: "Medios", workExperience: "Experiencia", references: "Referencias", passports: "Pasaportes", military: "Servicio militar", license: "Licencia", noVideo: "Sin video", current: "Actual", gender: "Género", marital: "Estado civil", militaryInfo: "Información militar", licenseInfo: "Información de licencia", loading: "Cargando detalle..." },
  fr: { tabJobs: "Offres", tabJobSeekers: "Chercheurs d'emploi", title: "Détail du profil", back: "Chercheurs d'emploi", detail: "Détail", about: "À propos", location: "Lieu", birthYear: "Année de naissance", registerDate: "Date d'inscription", licenseYear: "Année du permis", militaryYear: "Année militaire", phone: "Téléphone", email: "Email", services: "Groupes de service", nationalities: "Nationalités", features: "Caractéristiques", languageLevels: "Niveaux de langue", media: "Médias", workExperience: "Expériences", references: "Références", passports: "Passeports", military: "Service militaire", license: "Permis", noVideo: "Pas de vidéo", current: "En cours", gender: "Genre", marital: "État civil", militaryInfo: "Informations militaires", licenseInfo: "Informations permis", loading: "Chargement..." },
};

function yearOnly(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : String(d.getFullYear());
}

function fullDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function maskName(data: Detail): string {
  const first = (data.MusteriAdi ?? "").trim();
  const last = (data.MusteriSoyadi ?? "").trim();
  if (first || last) {
    const a = first ? `${first[0]?.toLocaleUpperCase("tr-TR") ?? ""}...` : "";
    const b = last ? `${last[0]?.toLocaleUpperCase("tr-TR") ?? ""}...` : "";
    return [a, b].filter(Boolean).join(" ") || "-";
  }
  const full = (data.AdSoyad ?? "").trim();
  if (!full) return "-";
  return full
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => `${x[0]?.toLocaleUpperCase("tr-TR") ?? ""}...`)
    .join(" ");
}

function maskPhone(phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length <= 4) return `${digits[0] ?? ""}***`;
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`;
}

function maskEmail(email?: string | null): string {
  const raw = (email ?? "").trim();
  if (!raw || !raw.includes("@")) return "-";
  const [local, domain] = raw.split("@");
  const first = local[0] ?? "*";
  return `${first}***@${domain}`;
}

function mediaItems(detail: Detail): string[] {
  return [detail.Resim1Url, detail.Resim2Url, detail.Resim3Url, detail.MusteriResimUrl]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function normalizeMediaUrl(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return encodeURI(raw);
}

export default function JobSeekerDetailPage() {
  const params = useParams<{ lang?: string | string[]; nr?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const rawNr = Array.isArray(params?.nr) ? params.nr[0] : params?.nr;
  const lang = normalizeLang(rawLang ?? "tr");
  const text = TEXT[lang];
  const dilMap: Record<Lang, number> = { tr: 1, en: 2, ru: 3, es: 4, fr: 5 };
  const dil = dilMap[lang];
  const nr = Number(rawNr);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [videoSourceIndex, setVideoSourceIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Number.isInteger(nr) || nr <= 0) {
        setError("Invalid id");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ApiResponse<Detail>>(`/api/jobseekers/getid/${nr}?dil=${dil}`);
        if (cancelled) return;
        const fetchedDetail = res?.Data ?? res?.data ?? null;
        setDetail(fetchedDetail);
        const fetchedNr = Number(fetchedDetail?.Nr);
        const viewedMusteriNr = Number.isInteger(fetchedNr) && fetchedNr > 0 ? fetchedNr : nr;
        void api
          .post(`/api/jobseekers/view?bakilanMusteriNr=${viewedMusteriNr}&kaynak=2&dil=${dil}`, {})
          .catch(() => undefined);
      } catch (err) {
        if (cancelled) return;
        setError(err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message ?? "") : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, nr]);

  const tabs = useMemo(
    () => [
      { label: text.tabJobs, href: `/${lang}/home/jobs` },
      { label: text.tabJobSeekers, href: `/${lang}/home/jobseekers`, active: true },
    ],
    [lang, text.tabJobSeekers, text.tabJobs]
  );
  const groupedFeatures = useMemo(() => {
    const map = new Map<
      string,
      Array<{ GrupSecenekAdi?: string | null; SecenekAdi?: string | null; EhAcik?: string | null; GrupsecenekTek?: boolean | null }>
    >();
    for (const f of detail?.Ozellikler ?? []) {
      const groupName = (f.GrupSecenekAdi ?? "").trim() || text.features;
      const list = map.get(groupName) ?? [];
      list.push(f);
      map.set(groupName, list);
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, [detail?.Ozellikler, text.features]);
  const rawVideoUrl = (detail?.VideoUrl ?? "").trim();
  const videoCandidates = useMemo(
    () => Array.from(new Set([rawVideoUrl, normalizeMediaUrl(rawVideoUrl)].filter(Boolean))),
    [rawVideoUrl]
  );
  const videoUrl = videoCandidates[videoSourceIndex] ?? "";

  useEffect(() => {
    setVideoSourceIndex(0);
  }, [rawVideoUrl]);

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <TopBar lang={lang} tabs={tabs} />
      <main className="mx-auto max-w-[1220px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 flex items-center text-sm text-[#8b95a7]">
          <Link href={`/${lang}/home/jobseekers`} className="hover:text-[#1f232b]">{text.back}</Link>
          <ChevronRight className="mx-1 h-4 w-4" />
          <span className="text-[#1f232b]">{text.detail}</span>
        </div>

        {loading ? <div className="rounded-2xl bg-white p-6 text-[#64748b]">{text.loading}</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

        {!loading && !error && detail ? (
          <section className="rounded-3xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[240px_1fr]">
              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white">
                  {(detail.MusteriResimUrl ?? "").trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.MusteriResimUrl!} alt={maskName(detail)} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-20 w-20 text-[#94a3b8]" />
                  )}
                </div>
                <h1 className="mt-4 break-words text-xl font-black text-[#111827] sm:text-2xl">{maskName(detail)}</h1>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.location}</div><div className="mt-2 flex items-center gap-2 break-words font-bold"><MapPin className="h-4 w-4 shrink-0" /><span className="break-words">{[(detail.UlkeAdi ?? "").trim(), (detail.IlAdi ?? "").trim()].filter(Boolean).join(" / ") || "-"}</span></div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.birthYear}</div><div className="mt-2 font-bold">{yearOnly(detail.DogumTarihi)}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.registerDate}</div><div className="mt-2 flex items-center gap-2 font-bold"><CalendarDays className="h-4 w-4" />{fullDate(detail.OlusturmaZamani, lang)}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.gender}</div><div className="mt-2 font-bold">{(detail.CinsiyetAdi ?? "").trim() || "-"}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.marital}</div><div className="mt-2 font-bold">{(detail.MedeniDurumAdi ?? "").trim() || "-"}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.phone}</div><div className="mt-2 flex items-center gap-2 font-bold"><Phone className="h-4 w-4" />{maskPhone(detail.Tel)}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.email}</div><div className="mt-2 flex items-center gap-2 break-all font-bold"><Mail className="h-4 w-4 shrink-0" />{maskEmail(detail.Email)}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.about}</div><div className="mt-2 font-medium text-[#334155]">{(detail.Hakkimda ?? "").trim() || "-"}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.services}</div><div className="mt-2 font-medium">{(detail.HizmetGruplari ?? []).join(", ") || "-"}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.languageLevels}</div><div className="mt-2 flex flex-wrap gap-2">{(detail.YabanciDilDetaylari ?? []).length ? (detail.YabanciDilDetaylari ?? []).map((x, i) => <span key={`${x.DilAdi ?? "d"}-${i}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#334155]">{`${(x.DilAdi ?? "").trim() || "-"} (${(x.SeviyeAdi ?? "").trim() || x.Seviye || "-"})`}</span>) : <span>-</span>}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2"><div className="text-xs font-bold uppercase text-[#94a3b8]">{text.nationalities}</div><div className="mt-2 font-medium">{(detail.Uyruklar ?? []).join(", ") || "-"}</div></div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.militaryInfo}</div>
                  <div className="mt-2 rounded-lg bg-white p-3 text-sm text-[#334155]">
                    <div className="flex items-start justify-between gap-2"><span className="font-bold text-[#111827]">{text.military}</span><span className="text-right break-words">{(detail.AskerlikAdi ?? "").trim() || "-"}</span></div>
                    <div className="mt-1 flex items-start justify-between gap-2"><span>{text.militaryYear}</span><span className="text-right">{yearOnly(detail.AskerlikTarihi)}</span></div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.licenseInfo}</div>
                  <div className="mt-2 rounded-lg bg-white p-3 text-sm text-[#334155]">
                    <div className="flex items-start justify-between gap-2"><span className="font-bold text-[#111827]">{text.license}</span><span className="text-right break-words">{(detail.EhliyetAdi ?? "").trim() || "-"}</span></div>
                    <div className="mt-1 flex items-start justify-between gap-2"><span>{text.licenseYear}</span><span className="text-right">{yearOnly(detail.EhliyetTarihi)}</span></div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.features}</div>
                  <div className="mt-3 space-y-4">
                    {groupedFeatures.length ? groupedFeatures.map((group, gIndex) => {
                      const singleMode = group.items.some((x) => x.GrupsecenekTek === true);
                      return (
                        <div key={`${group.group}-${gIndex}`} className="rounded-xl border border-[#d9dee7] bg-[#f8fafc] p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-[#111827] break-words">{group.group}</h3>
                            <span className="text-xs font-semibold text-[#64748b]">{singleMode ? "Evet / Hayır" : "Çoklu seçim"}</span>
                          </div>
                          {singleMode ? (
                            <div className="space-y-2">
                              {group.items.map((f, i) => {
                                const answer = (f.EhAcik ?? "").trim().toLocaleLowerCase("tr-TR");
                                const isYes = answer === "evet" || answer === "yes" || answer === "oui" || answer === "sí" || answer === "да";
                                const isNo = answer === "hayır" || answer === "hayir" || answer === "no" || answer === "non" || answer === "нет";
                                return (
                                  <div key={`${f.SecenekAdi ?? "s"}-${i}`} className="flex items-start justify-between gap-2 rounded-lg border border-[#d9dee7] bg-white px-3 py-2">
                                    <span className="text-sm font-semibold text-[#0f172a] break-words">{(f.SecenekAdi ?? "").trim() || "-"}</span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isYes ? "bg-green-100 text-green-700" : isNo ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                                      {(f.EhAcik ?? "").trim() || "-"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {group.items.map((f, i) => {
                                const answer = (f.EhAcik ?? "").trim().toLocaleLowerCase("tr-TR");
                                const isYes = answer === "evet" || answer === "yes" || answer === "oui" || answer === "sí" || answer === "да";
                                const isNo = answer === "hayır" || answer === "hayir" || answer === "no" || answer === "non" || answer === "нет";
                                return (
                                  <div key={`${f.SecenekAdi ?? "m"}-${i}`} className={`rounded-lg border px-3 py-2 text-sm font-semibold break-words ${isYes ? "border-green-400 bg-green-100 text-green-800" : isNo ? "border-red-300 bg-red-100 text-red-800" : "border-[#d0d7e2] bg-[#eef2f7] text-[#1e293b]"}`}>
                                    {(f.SecenekAdi ?? "").trim() || "-"}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }) : <span>-</span>}
                  </div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.media}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {mediaItems(detail).length ? mediaItems(detail).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={`${src}-${i}`} src={src} alt={`media-${i + 1}`} className="h-24 w-full rounded-lg object-cover sm:h-28" />
                    )) : <span>-</span>}
                  </div>
                  <div className="mt-3">
                    {videoUrl ? (
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        preload="metadata"
                        playsInline
                        onError={() => {
                          setVideoSourceIndex((prev) => (prev + 1 < videoCandidates.length ? prev + 1 : prev));
                        }}
                        className="h-56 w-full rounded-lg bg-black object-cover"
                      />
                    ) : (
                      <span className="text-sm text-[#64748b]">{text.noVideo}</span>
                    )}
                    {rawVideoUrl ? (
                      <a
                        href={rawVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-[#1d4ed8] underline"
                      >
                        Videoyu yeni sekmede aç
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.workExperience}</div>
                  <div className="mt-2 space-y-2">
                    {(detail.IsTecrubeleri ?? []).length ? (detail.IsTecrubeleri ?? []).map((x, i) => (
                      <div key={`${x.IsyeriAdi ?? "w"}-${i}`} className="rounded-lg bg-white p-3 text-sm text-[#334155]">
                        <div className="break-words font-bold text-[#111827]">{[(x.IsyeriAdi ?? "").trim(), (x.IsAdi ?? "").trim()].filter(Boolean).join(" - ") || "-"}</div>
                        <div className="break-words">{[(x.IlAdi ?? "").trim(), (x.CalismaSekliAdi ?? "").trim()].filter(Boolean).join(" / ") || "-"}</div>
                        <div>{`${yearOnly(x.BaslamaTarihi)} - ${x.HalenCalisiyor ? text.current : yearOnly(x.BitisTarihi)}`}</div>
                        <div className="mt-1">{(x.IsTanimi ?? "").trim() || "-"}</div>
                      </div>
                    )) : <span>-</span>}
                  </div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.references}</div>
                  <div className="mt-2 space-y-2">
                    {(detail.Referanslar ?? []).length ? (detail.Referanslar ?? []).map((x, i) => (
                      <div key={`${x.AdSoyad ?? "r"}-${i}`} className="rounded-lg bg-white p-3 text-sm text-[#334155]">
                        <div className="break-words font-bold text-[#111827]">{(x.AdSoyad ?? "").trim() || "-"}</div>
                        <div>{maskPhone(x.Tel)}</div>
                        <div>{(x.Aciklama ?? "").trim() || "-"}</div>
                      </div>
                    )) : <span>-</span>}
                  </div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-4 sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-[#94a3b8]">{text.passports}</div>
                  <div className="mt-2 space-y-2">
                    {(detail.Pasaportlar ?? []).length ? (detail.Pasaportlar ?? []).map((x, i) => (
                      <div key={`${x.UlkeAdi ?? "p"}-${i}`} className="rounded-lg bg-white p-3 text-sm text-[#334155]">
                        <span className="font-bold text-[#111827]">{(x.UlkeAdi ?? "").trim() || "-"}</span>
                        <span>{` - ${yearOnly(x.GecerlilikTarihi)}`}</span>
                      </div>
                    )) : <span>-</span>}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
