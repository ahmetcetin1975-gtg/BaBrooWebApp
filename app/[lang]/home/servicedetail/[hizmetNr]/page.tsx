"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Image as ImageIcon, MoreVertical, X } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";
import { getMessages } from "@/lib/i18n/messages";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
import {
  readSelectedServiceNrCookie,
  setSelectedServiceNrCookie,
  toPositiveServiceNr,
} from "@/lib/services/selection";

type ServiceDetailData = {
  Nr: number;
  HizmetMusteriNr: number;
  MusteriAdi: string;
  MusteriSoyadi: string;
  MusteriEmail: string;
  MusteriTel: string;
  Kategori: string;
  Uzmanlik: string;
  Aciklama: string;
  Etiket: string;
  Belge: string;
  HizmetTecrubeYil: number;
  EgitimAdi: string;
  HizmetFavcount: number;
  HizmetBakcount: number;
  HizmetOnay: boolean;
  HizmetResimUrl: string | null;
  Favorimi: boolean;
};

type ServiceDetailResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ServiceDetailData | null;
};

type ServiceImageItem = {
  Nr: number;
  HizmetresimVarsayilan: boolean;
  ResimUrl: string;
};

type ServiceImagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ServiceImageItem[];
};

function formatNumber(value: number | null | undefined, lang: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", {
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatExperienceYears(value: number | null | undefined, lang: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  const formatted = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
  return lang === "tr" ? `${formatted} yıl` : `${formatted} years`;
}

export default function ServiceDetailPage() {
  const params = useParams<{ lang?: string | string[]; hizmetNr?: string | string[] }>();
  const router = useRouter();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const rawHizmetNr = Array.isArray(params?.hizmetNr) ? params.hizmetNr[0] : params?.hizmetNr;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const t = getMessages(lang);
  const routeServiceNr = toPositiveServiceNr(rawHizmetNr);

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            pageTitle: "Hizmet Detayı",
            edit: "Düzenle & Değiştir",
            favorites: "Favoriler",
            views: "Görüntülenme",
            expertise: "Uzmanlık",
            experience: "Eğitim & Tecrübe",
            documents: "Belge & Sertifikalar",
            tags: "Anahtar Kelimeler",
            seller: "Sahibi",
            approved: "Onaylandı",
            pendingApproval: "Onayda Bekliyor",
            loadError: "Hizmet detayı yüklenemedi.",
            selectionMissing: "Açılacak hizmet seçimi bulunamadı.",
            delete: "Hizmeti Sil",
            close: "Kapat",
            confirmDeleteTitle: "Silmek istediğinizden emin misiniz?",
            confirmDeleteMessage: "Bu işlem hizmeti listeden kaldırır. Devam etmek istiyorsanız onaylayın.",
            confirmDeleteApprove: "Evet, Sil",
            confirmDeleteCancel: "Vazgeç",
            deleting: "Siliniyor...",
            deleteFailed: "Hizmet silinemedi.",
            optionsTitle: "Hizmet İşlemleri",
            back: t.sidebar.items.myServices,
          }
        : {
            pageTitle: "Service Detail",
            edit: "Edit & Update",
            favorites: "Favorites",
            views: "Views",
            expertise: "Expertise",
            experience: "Education & Experience",
            documents: "Documents & Certificates",
            tags: "Keywords",
            seller: "Owner",
            approved: "Approved",
            pendingApproval: "Pending Approval",
            loadError: "Failed to load service detail.",
            selectionMissing: "No service selection was found.",
            delete: "Delete Service",
            close: "Close",
            confirmDeleteTitle: "Are you sure you want to delete this service?",
            confirmDeleteMessage: "This action removes the service from your list. Confirm to continue.",
            confirmDeleteApprove: "Yes, Delete",
            confirmDeleteCancel: "Cancel",
            deleting: "Deleting...",
            deleteFailed: "Failed to delete service.",
            optionsTitle: "Service Actions",
            back: t.sidebar.items.myServices,
          },
    [lang, t.sidebar.items.myServices]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceDetailData | null>(null);
  const [images, setImages] = useState<ServiceImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState<"delete" | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [resolvedServiceNr, setResolvedServiceNr] = useState<number | null>(routeServiceNr);

  useEffect(() => {
    const nextServiceNr = routeServiceNr ?? readSelectedServiceNrCookie();
    if (nextServiceNr != null) {
      setSelectedServiceNrCookie(nextServiceNr);
      setResolvedServiceNr(nextServiceNr);
      setError(null);
      return;
    }

    setResolvedServiceNr(null);
    setError(text.selectionMissing);
    setLoading(false);
  }, [routeServiceNr, text.selectionMissing]);

  useEffect(() => {
    if (resolvedServiceNr == null) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [detailData, imageData] = await Promise.all([
          api.get<ServiceDetailResponse>(`/api/services/detail?hizmetNr=${resolvedServiceNr}&dil=${dil}`),
          api.get<ServiceImagesResponse>(`/api/services/images-unapproved?hizmetNr=${resolvedServiceNr}&dil=${dil}`),
        ]);

        if (cancelled) return;

        const nextDetail = detailData?.Data ?? null;
        const nextImages = Array.isArray(imageData?.Data)
          ? imageData.Data.filter((item) => typeof item?.ResimUrl === "string" && item.ResimUrl.trim() !== "")
          : [];

        setDetail(nextDetail);
        setImages(nextImages);

        const defaultImage =
          nextImages.find((item) => item.HizmetresimVarsayilan)?.ResimUrl ??
          nextImages[0]?.ResimUrl ??
          nextDetail?.HizmetResimUrl ??
          null;
        setSelectedImage(defaultImage);
      } catch (err: any) {
        if (cancelled) return;
        setDetail(null);
        setImages([]);
        setSelectedImage(null);
        setError(String(err?.message ?? text.loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, resolvedServiceNr, text.loadError]);

  const gallery = useMemo(() => {
    if (images.length > 0) return images;
    if (detail?.HizmetResimUrl) {
      return [{ Nr: detail.Nr, HizmetresimVarsayilan: true, ResimUrl: detail.HizmetResimUrl }];
    }
    return [];
  }, [detail?.HizmetResimUrl, detail?.Nr, images]);

  const mainImage = selectedImage ?? gallery[0]?.ResimUrl ?? null;
  const editHref =
    resolvedServiceNr != null
      ? `/${lang}/home/edit-service?returnTo=${encodeURIComponent(`/${lang}/home/servicedetail`)}`
      : `/${lang}/home/myservices`;
  const sellerName = `${detail?.MusteriAdi ?? ""} ${detail?.MusteriSoyadi ?? ""}`.trim() || "-";
  const experienceLabel = `${detail?.EgitimAdi ?? "-"} • ${formatExperienceYears(detail?.HizmetTecrubeYil, lang)}`;
  const tagList = (detail?.Etiket ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  async function handleDeleteService() {
    if (!detail?.Nr || optionsLoading) return;

    try {
      setOptionsLoading("delete");
      setOptionsError(null);
      await api.post(`/api/services/soft-delete?hizmetNr=${detail.Nr}&dil=${dil}&kaynak=2`);
      router.push(`/${lang}/home/myservices`);
      router.refresh();
    } catch (err: any) {
      setOptionsError(String(err?.message ?? text.deleteFailed));
    } finally {
      setOptionsLoading(null);
    }
  }

  useEffect(() => {
    if (!previewImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImage]);

  return (
    <div className="min-h-screen bg-[#f3f3f5] px-4 py-6 lg:px-8">
      <GtgLoading isLoading={loading} />

      <div className="mx-auto max-w-[1460px]">
        <div className="mb-5 flex items-center text-[14px] text-[#8b95a7]">
          <Link href={`/${lang}/home`} className="transition hover:text-[#1f232b]">
            {t.sidebar.items.home}
          </Link>
          <ChevronRight className="mx-1 h-4 w-4" />
          <Link href={`/${lang}/home/myservices`} className="transition hover:text-[#1f232b]">
            {text.back}
          </Link>
          <ChevronRight className="mx-1 h-4 w-4" />
          <span className="text-[#1f232b]">{text.pageTitle}</span>
        </div>

        {error ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : null}

        {!error ? (
          <section className="overflow-hidden rounded-[34px] border border-[#ece8df] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <div className="grid gap-8 px-5 py-5 lg:grid-cols-[92px_minmax(0,1.1fr)_0.92fr] lg:px-8 lg:py-8 xl:gap-10">
              <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible">
                {gallery.length > 0 ? (
                  gallery.map((image) => {
                    const active = image.ResimUrl === mainImage;
                    return (
                      <button
                        key={image.Nr}
                        type="button"
                        onClick={() => setSelectedImage(image.ResimUrl)}
                        className={clsx(
                          "grid h-[94px] w-[78px] shrink-0 place-items-center overflow-hidden rounded-[18px] border bg-[#f1f1f1] p-2 transition",
                          active ? "border-[var(--gtg-orange)] shadow-[0_10px_22px_rgba(250,165,0,0.18)]" : "border-[#ece8df]"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.ResimUrl} alt={detail?.Kategori ?? text.pageTitle} className="max-h-full max-w-full object-contain" />
                      </button>
                    );
                  })
                ) : (
                  Array.from({ length: 6 }, (_, index) => (
                    <div
                      key={index}
                      className={clsx(
                        "grid h-[94px] w-[78px] shrink-0 place-items-center overflow-hidden rounded-[18px] border bg-[#f1f1f1] p-2",
                        index === 1 ? "border-[var(--gtg-orange)]" : "border-[#ece8df]"
                      )}
                    >
                      <ImageIcon className="h-8 w-8 text-[#c7c7c7]" />
                    </div>
                  ))
                )}
              </div>

              <div className="order-1 lg:order-2">
                <div className="grid min-h-[540px] place-items-center rounded-[30px] border border-[#e7e3da] bg-[#f7f7f7] p-8">
                  {mainImage ? (
                    <button type="button" onClick={() => setPreviewImage(mainImage)} className="grid place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt={detail?.Kategori ?? text.pageTitle} className="max-h-[480px] max-w-full object-contain" />
                    </button>
                  ) : (
                    <ImageIcon className="h-28 w-28 text-[#d9d9d9]" />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="rounded-[18px] border border-[#ece8df] bg-[#fcfbf8] px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.favorites}</div>
                    <div className="mt-1 text-[18px] font-bold text-[#2b3139]">{formatNumber(detail?.HizmetFavcount, lang)}</div>
                  </div>
                  <div className="rounded-[18px] border border-[#ece8df] bg-[#fcfbf8] px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.views}</div>
                    <div className="mt-1 text-[18px] font-bold text-[#2b3139]">{formatNumber(detail?.HizmetBakcount, lang)}</div>
                  </div>
                </div>
              </div>

              <div className="order-3 flex min-w-0 flex-col justify-start py-1">
                <div className="relative flex items-start justify-between gap-4">
                  <div
                    className={clsx(
                      "rounded-full px-4 py-2 text-[13px] font-semibold",
                      detail?.HizmetOnay
                        ? "bg-[#e8f7ee] text-[#166534]"
                        : "bg-[#fff4e5] text-[#b45309]"
                    )}
                  >
                    {detail?.HizmetOnay ? text.approved : text.pendingApproval}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={text.optionsTitle}
                      onClick={() => {
                        setOptionsOpen((prev) => !prev);
                        setOptionsError(null);
                      }}
                      className="grid h-11 w-11 place-items-center rounded-full text-[var(--gtg-orange)] transition hover:bg-[#fff7ec]"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  {optionsOpen ? (
                    <div className="absolute right-0 top-14 z-20 w-[248px] rounded-[22px] border border-[#ece8df] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOptionsOpen(false);
                            setOptionsError(null);
                            router.push(editHref);
                          }}
                          className="w-full rounded-[14px] bg-[var(--gtg-orange)] px-4 py-3 text-left text-[15px] font-semibold text-white transition hover:brightness-95"
                        >
                          {text.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOptionsOpen(false);
                            setOptionsError(null);
                            setConfirmDeleteOpen(true);
                          }}
                          disabled={optionsLoading != null}
                          className="w-full rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-left text-[15px] font-medium text-[#555d6b] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed"
                        >
                          {optionsLoading === "delete" ? text.deleting : text.delete}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOptionsOpen(false);
                            setOptionsError(null);
                          }}
                          className="w-full rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-left text-[15px] font-medium text-[#555d6b] transition hover:bg-[#f8fafc]"
                        >
                          {text.close}
                        </button>
                        {optionsError ? <p className="px-1 pt-1 text-sm text-red-600">{optionsError}</p> : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  <h1 className="text-[42px] font-extrabold tracking-tight text-[#2b3139]">{detail?.Kategori || "-"}</h1>
                  <p className="mt-3 text-[18px] font-semibold text-[#2563eb]">{detail?.Uzmanlik || "-"}</p>
                </div>

                <p className="mt-4 max-w-[560px] whitespace-pre-line text-[18px] leading-[1.8] text-[#4a4f55]">
                  {detail?.Aciklama || "-"}
                </p>

                <div className="mt-7 space-y-4">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.seller}</div>
                    <div className="mt-2 text-[17px] font-medium text-[#2b3139]">{sellerName}</div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.experience}</div>
                    <div className="mt-2 text-[17px] font-medium text-[#0f766e]">{experienceLabel}</div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.documents}</div>
                    <div className="mt-2 text-[17px] font-medium text-[#2b3139]">{detail?.Belge || "-"}</div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.tags}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tagList.length > 0 ? (
                        tagList.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#f1d4a4] bg-[#fff7ec] px-3 py-1.5 text-[13px] font-medium text-[#9a5e00]"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-[15px] text-[#9aa1ad]">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {previewImage ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 px-4 py-6" onClick={() => setPreviewImage(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={detail?.Kategori ?? text.pageTitle}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[1120px] rounded-[28px] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.32)] sm:p-5"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              aria-label={text.close}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-[var(--gtg-orange)] text-white shadow-sm transition hover:brightness-95"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid max-h-[84vh] min-h-[320px] place-items-center overflow-hidden rounded-[22px] bg-[#f7f7f7] p-4 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt={detail?.Kategori ?? text.pageTitle} className="max-h-[74vh] w-auto max-w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={() => {
            if (optionsLoading == null) setConfirmDeleteOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={text.confirmDeleteTitle}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[460px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.26)]"
          >
            <h2 className="text-[24px] font-semibold tracking-tight text-[#2b3139]">{text.confirmDeleteTitle}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#5d6675]">{text.confirmDeleteMessage}</p>
            {optionsError ? <p className="mt-3 text-sm text-red-600">{optionsError}</p> : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={optionsLoading != null}
                className="rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-[15px] font-medium text-[#555d6b] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed"
              >
                {text.confirmDeleteCancel}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteService()}
                disabled={optionsLoading != null}
                className="rounded-[14px] bg-[var(--gtg-orange)] px-4 py-3 text-[15px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed"
              >
                {optionsLoading === "delete" ? text.deleting : text.confirmDeleteApprove}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
