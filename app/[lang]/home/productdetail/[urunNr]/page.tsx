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
  readSelectedProductNrCookie,
  setSelectedProductNrCookie,
  toPositiveProductNr,
} from "@/lib/products/selection";

type ProductDetailData = {
  Nr: number;
  UrunMusteriNr: number;
  MusteriAdi: string;
  MusteriSoyadi: string;
  MusteriEmail: string;
  MusteriTel: string;
  UlkeAdi: string;
  UlkeTelKodu: string;
  UlkeFlagUrl: string | null;
  UrunAdi: string;
  UrunAciklamasi: string;
  UrunFiyat: number;
  DovizAdi: string;
  DovizKisaAdi: string;
  DovizSembolu: string;
  UrunMiktar: number;
  BirimAdi: string;
  UrunEtiketList: string;
  UrunIhracatMi: boolean;
  UrunFavcount: number;
  UrunBakcount: number;
  UrunOnay: boolean;
  UrunResimUrl: string | null;
};

type ProductDetailResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ProductDetailData | null;
};

type ProductImageItem = {
  Nr: number;
  UrunresimVarsayilan: boolean;
  ResimUrl: string;
};

type ProductImagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ProductImageItem[];
};

function formatNumber(value: number | null | undefined, lang: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", {
    maximumFractionDigits: 2,
  }).format(numeric);
}

export default function ProductDetailPage() {
  const params = useParams<{ lang?: string | string[]; urunNr?: string | string[] }>();
  const router = useRouter();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const rawUrunNr = Array.isArray(params?.urunNr) ? params.urunNr[0] : params?.urunNr;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const t = getMessages(lang);
  const routeProductNr = toPositiveProductNr(rawUrunNr);

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            pageTitle: "Ürün Detayı",
            subtitlePrefix: "@",
            edit: "Düzenle & Değiştir",
            exportType: "İHRACAT",
            importType: "İTHALAT",
            price: "Fiyat",
            quantity: "Miktar",
            currency: "Döviz",
            favorites: "Favoriler",
            views: "Görüntülenme",
            tags: "Anahtar Kelimeler",
            seller: "Sahibi",
            approved: "Onaylandı",
            pendingApproval: "Onayda Bekliyor",
            loadError: "Ürün detayı yüklenemedi.",
            selectionMissing: "Açılacak ürün seçimi bulunamadı.",
            delete: "Ürünü Sil",
            close: "Kapat",
            confirmDeleteTitle: "Silmek istediğinizden emin misiniz?",
            confirmDeleteMessage: "Bu işlem ürünü listeden kaldırır. Devam etmek istiyorsanız onaylayın.",
            confirmDeleteApprove: "Evet, Sil",
            confirmDeleteCancel: "Vazgeç",
            deleting: "Siliniyor...",
            deleteFailed: "Ürün silinemedi.",
            optionsTitle: "Ürün İşlemleri",
            back: t.sidebar.items.myProducts,
          }
        : {
            pageTitle: "Product Detail",
            subtitlePrefix: "@",
            edit: "Edit & Update",
            exportType: "EXPORT",
            importType: "IMPORT",
            price: "Price",
            quantity: "Quantity",
            currency: "Currency",
            favorites: "Favorites",
            views: "Views",
            tags: "Keywords",
            seller: "Owner",
            approved: "Approved",
            pendingApproval: "Pending Approval",
            loadError: "Failed to load product detail.",
            selectionMissing: "No product selection was found.",
            delete: "Delete Product",
            close: "Close",
            confirmDeleteTitle: "Are you sure you want to delete this product?",
            confirmDeleteMessage: "This action removes the product from your list. Confirm to continue.",
            confirmDeleteApprove: "Yes, Delete",
            confirmDeleteCancel: "Cancel",
            deleting: "Deleting...",
            deleteFailed: "Failed to delete product.",
            optionsTitle: "Product Actions",
            back: t.sidebar.items.myProducts,
          },
    [lang, t.sidebar.items.myProducts]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetailData | null>(null);
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState<"delete" | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [resolvedProductNr, setResolvedProductNr] = useState<number | null>(routeProductNr);

  useEffect(() => {
    const nextProductNr = routeProductNr ?? readSelectedProductNrCookie();
    if (nextProductNr != null) {
      setSelectedProductNrCookie(nextProductNr);
      setResolvedProductNr(nextProductNr);
      setError(null);
      return;
    }

    setResolvedProductNr(null);
    setError(text.selectionMissing);
    setLoading(false);
  }, [routeProductNr, text.selectionMissing]);

  useEffect(() => {
    if (resolvedProductNr == null) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [detailData, imageData] = await Promise.all([
          api.get<ProductDetailResponse>(`/api/products/detail?urunNr=${resolvedProductNr}&dil=${dil}`),
          api.get<ProductImagesResponse>(`/api/products/images-unapproved?urunNr=${resolvedProductNr}&dil=${dil}`),
        ]);

        if (cancelled) return;

        const nextDetail = detailData?.Data ?? null;
        const nextImages = Array.isArray(imageData?.Data)
          ? imageData.Data.filter((item) => typeof item?.ResimUrl === "string" && item.ResimUrl.trim() !== "")
          : [];

        setDetail(nextDetail);
        setImages(nextImages);

        const defaultImage =
          nextImages.find((item) => item.UrunresimVarsayilan)?.ResimUrl ??
          nextImages[0]?.ResimUrl ??
          nextDetail?.UrunResimUrl ??
          null;
        setSelectedImage(defaultImage);
      } catch (err: any) {
        if (cancelled) return;
        setDetail(null);
        setImages([]);
        setSelectedImage(null);
        setError(String(err?.message ?? text.loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, resolvedProductNr, text.loadError]);

  const gallery = useMemo(() => {
    if (images.length > 0) return images;
    if (detail?.UrunResimUrl) {
      return [{ Nr: detail.Nr, UrunresimVarsayilan: true, ResimUrl: detail.UrunResimUrl }];
    }
    return [];
  }, [detail?.Nr, detail?.UrunResimUrl, images]);

  const mainImage = selectedImage ?? gallery[0]?.ResimUrl ?? null;
  const tradeTypeLabel = detail?.UrunIhracatMi ? text.exportType : text.importType;
  const sellerName = `${detail?.MusteriAdi ?? ""} ${detail?.MusteriSoyadi ?? ""}`.trim() || "-";
  const editHref = resolvedProductNr != null
    ? `/${lang}/home/edit-product?returnTo=${encodeURIComponent(`/${lang}/home/productdetail`)}`
    : `/${lang}/home/myproducts`;
  const tagList = (detail?.UrunEtiketList ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  async function handleDeleteProduct() {
    if (!detail?.Nr || optionsLoading) return;

    try {
      setOptionsLoading("delete");
      setOptionsError(null);
      await api.post(`/api/products/soft-delete?urunNr=${detail.Nr}&dil=${dil}&kaynak=2`);
      router.push(`/${lang}/home/myproducts`);
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
          <Link href={`/${lang}/home/myproducts`} className="transition hover:text-[#1f232b]">
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
                        <img src={image.ResimUrl} alt={detail?.UrunAdi ?? text.pageTitle} className="max-h-full max-w-full object-contain" />
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
                    <button
                      type="button"
                      onClick={() => setPreviewImage(mainImage)}
                      className="grid place-items-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt={detail?.UrunAdi ?? text.pageTitle} className="max-h-[480px] max-w-full object-contain" />
                    </button>
                  ) : (
                    <ImageIcon className="h-28 w-28 text-[#d9d9d9]" />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="rounded-[18px] border border-[#ece8df] bg-[#fcfbf8] px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.favorites}</div>
                    <div className="mt-1 text-[18px] font-bold text-[#2b3139]">{formatNumber(detail?.UrunFavcount, lang)}</div>
                  </div>
                  <div className="rounded-[18px] border border-[#ece8df] bg-[#fcfbf8] px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.views}</div>
                    <div className="mt-1 text-[18px] font-bold text-[#2b3139]">{formatNumber(detail?.UrunBakcount, lang)}</div>
                  </div>
                </div>
              </div>

              <div className="order-3 flex min-w-0 flex-col justify-start py-1">
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full bg-[#f1f2f4] px-4 py-2 text-[14px] font-semibold tracking-[0.08em] text-[#4a4f55]">
                      {tradeTypeLabel}
                    </div>
                    <div
                      className={clsx(
                        "rounded-full px-4 py-2 text-[13px] font-semibold",
                        detail?.UrunOnay
                          ? "bg-[#e8f7ee] text-[#166534]"
                          : "bg-[#fff4e5] text-[#b45309]"
                      )}
                    >
                      {detail?.UrunOnay ? text.approved : text.pendingApproval}
                    </div>
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
                    <div className="absolute right-0 top-14 z-20 w-[240px] rounded-[22px] border border-[#ece8df] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
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

                <div className="mt-8">
                  <h1 className="text-[42px] font-extrabold tracking-tight text-[#2b3139]">{detail?.UrunAdi || "-"}</h1>
                  <div className="mt-2 flex items-center gap-2 text-[16px] text-[#9aa1ad]">
                    <span>{text.subtitlePrefix}{detail?.UlkeAdi || "-"}</span>
                    {detail?.UlkeFlagUrl ? (
                      <span className="grid h-5 w-7 place-items-center overflow-hidden rounded-[5px] border border-[#ece8df] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={detail.UlkeFlagUrl} alt={detail.UlkeAdi || "Flag"} className="max-h-full max-w-full object-contain" />
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 max-w-[560px] whitespace-pre-line text-[18px] leading-[1.8] text-[#4a4f55]">
                  {detail?.UrunAciklamasi || "-"}
                </p>

                <div className="mt-7 space-y-4">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9aa1ad]">{text.seller}</div>
                    <div className="mt-2 text-[17px] font-medium text-[#2b3139]">{sellerName}</div>
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
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={detail?.UrunAdi ?? text.pageTitle}
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
              <img src={previewImage} alt={detail?.UrunAdi ?? text.pageTitle} className="max-h-[74vh] w-auto max-w-full object-contain" />
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
                onClick={() => void handleDeleteProduct()}
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
