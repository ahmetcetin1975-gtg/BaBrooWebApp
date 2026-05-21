"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  Search,
  X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";
import { getMessages } from "@/lib/i18n/messages";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
import { setSelectedProductNrCookie } from "@/lib/products/selection";

const PAGE_SIZE = 6;

type MyProductItem = {
  Nr: number;
  FavoriNr?: number;
  UrunNr?: number;
  UrunMusteriNr: number;
  UrunAdi: string;
  UrunAciklamasi: string;
  UrunEtiketList: string;
  UrunIhracatMi: boolean;
  UrunFavcount: number;
  UrunBakcount: number;
  UrunOnay: boolean;
  VarsayilanResim: string;
  VarsayilanResimUrl?: string | null;
  MusteriFavUrun: boolean;
  Aktif?: boolean;
  UlkeAdi?: string;
  UlkeFlagUrl?: string;
};

type MyProductsResponse = {
  LastId?: number;
  PageSize?: number;
  TotalCount?: number;
  Data?: MyProductItem[];
};

type FavoriteProductItem = {
  FavoriNr: number;
  UrunNr: number;
  UrunMusteriNr: number;
  UrunAdi: string;
  UrunAciklamasi: string;
  UrunEtiketList: string;
  UrunIhracatMi: boolean;
  UrunOnay: boolean;
  VarsayilanResimUrl: string | null;
  OlusturmaZamani?: string;
  Aktif?: boolean;
  UlkeAdi?: string;
  UlkeFlagUrl?: string;
};

type FavoriteProductsResponse = {
  LastId?: number;
  PageSize?: number;
  TotalCount?: number;
  Data?: FavoriteProductItem[];
};

type MyProductsPage = {
  items: MyProductItem[];
  nextCursor: number | null;
  totalCount: number;
};

type CountState = {
  active: number | null;
  inactive: number | null;
};

type ProductActionKind = "toggle-active" | "delete" | "remove-favorite";

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function resolveLastId(data: MyProductsResponse | undefined, fallbackItems: MyProductItem[]): number | null {
  const apiLastId = toNumberOrNull(data?.LastId);
  if (apiLastId != null) return apiLastId;
  if (fallbackItems.length === 0) return null;
  return toNumberOrNull(fallbackItems[fallbackItems.length - 1]?.Nr);
}

function buildMyProductsQuery(dil: number, aktif: boolean, search: string, lastId?: number | null) {
  const qs = new URLSearchParams({
    dil: String(dil),
    aktif: String(aktif),
    pageSize: String(PAGE_SIZE),
  });
  const normalizedSearch = search.trim();
  if (normalizedSearch !== "") qs.set("search", normalizedSearch);
  if (lastId != null) qs.set("lastId", String(lastId));
  return qs;
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | string> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("left-ellipsis");
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < totalPages - 1) pages.push("right-ellipsis");
  pages.push(totalPages);

  return pages;
}

function truncateText(value: string | null | undefined, maxLength: number): string {
  const normalized = (value ?? "").trim();
  if (normalized === "") return "-";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function normalizeFavoriteProductItem(item: FavoriteProductItem): MyProductItem {
  return {
    Nr: item.FavoriNr,
    FavoriNr: item.FavoriNr,
    UrunNr: item.UrunNr,
    UrunMusteriNr: item.UrunMusteriNr,
    UrunAdi: item.UrunAdi,
    UrunAciklamasi: item.UrunAciklamasi,
    UrunEtiketList: item.UrunEtiketList,
    UrunIhracatMi: item.UrunIhracatMi,
    UrunFavcount: 0,
    UrunBakcount: 0,
    UrunOnay: item.UrunOnay,
    VarsayilanResim: item.VarsayilanResimUrl ?? "",
    VarsayilanResimUrl: item.VarsayilanResimUrl,
    MusteriFavUrun: true,
    Aktif: item.Aktif,
    UlkeAdi: item.UlkeAdi,
    UlkeFlagUrl: item.UlkeFlagUrl,
  };
}

export default function MyProductsPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const pathname = usePathname();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const t = getMessages(lang);
  const favoriteMode = pathname?.includes("/home/myfavproducts") ?? false;
  const pageTitle = favoriteMode ? t.sidebar.items.favProducts : t.sidebar.items.myProducts;
  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            pageTitle,
            create: "Ürün Oluştur",
            active: "Aktif",
            inactive: "İnaktif",
            total: "Toplam",
            imagePreview: "Görseli büyüt",
            description: "Ürün Açıklaması",
            empty: favoriteMode ? "Bu filtre için favori ürün bulunamadı." : "Bu filtre için ürün bulunamadı.",
            loadError: favoriteMode ? "Favori ürünler yüklenemedi." : "Ürünler yüklenemedi.",
            previous: "Önceki",
            next: "Sonraki",
            exportType: "İhracat",
            importType: "İthalat",
            edit: "Düzenle",
            editSoon: "Ürün düzenleme yakında eklenecek.",
            optionsTitle: "Ürün Seçenekleri",
            optionsDescription: "Bu ürün için aşağıdaki işlemleri kullanabilirsiniz.",
            activate: "Ürünü Aktif Yap",
            deactivate: "Ürünü İnaktif Yap",
            delete: "Ürünü Sil",
            close: "Kapat",
            removeFavorite: "Favori Listesinden Kaldır",
            confirmDeleteTitle: "Silmek istediğinizden emin misiniz?",
            confirmDeleteMessage: "Bu işlem ürünü listenizden kaldırır. Devam etmek istiyorsanız onaylayın.",
            confirmDeleteApprove: "Evet, Sil",
            confirmDeleteCancel: "Vazgeç",
            actionFailed: "Ürün işlemi başarısız oldu.",
            processing: "İşleniyor...",
            approved: "Onaylandı",
            pendingApproval: "Onayda Bekliyor",
          }
        : {
            pageTitle,
            create: "Create Product",
            active: "Active",
            inactive: "Inactive",
            total: "Total",
            imagePreview: "Preview image",
            description: "Product Description",
            empty: favoriteMode ? "No favorite products found for this filter." : "No products found for this filter.",
            loadError: favoriteMode ? "Failed to load favorite products." : "Failed to load products.",
            previous: "Previous",
            next: "Next",
            exportType: "Export",
            importType: "Import",
            edit: "Edit",
            editSoon: "Product editing will be added soon.",
            optionsTitle: "Product Options",
            optionsDescription: "You can use the following actions for this product.",
            activate: "Activate Product",
            deactivate: "Make Product Inactive",
            delete: "Delete Product",
            close: "Close",
            removeFavorite: "Remove From Favorites",
            confirmDeleteTitle: "Are you sure you want to delete this product?",
            confirmDeleteMessage: "This action removes the product from your list. Confirm to continue.",
            confirmDeleteApprove: "Yes, Delete",
            confirmDeleteCancel: "Cancel",
            actionFailed: "Product action failed.",
            processing: "Processing...",
            approved: "Approved",
            pendingApproval: "Pending Approval",
          },
    [favoriteMode, lang, pageTitle]
  );

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<MyProductItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState<CountState>({ active: null, inactive: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optionsProduct, setOptionsProduct] = useState<MyProductItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [optionsActionLoading, setOptionsActionLoading] = useState<ProductActionKind | null>(null);
  const [optionsActionError, setOptionsActionError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const pagesRef = useRef<Record<number, MyProductsPage>>({});
  const cursorsRef = useRef<Record<number, number | null>>({ 1: null });
  const requestIdRef = useRef(0);

  const resetCachedPages = useCallback(() => {
    pagesRef.current = {};
    cursorsRef.current = { 1: null };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProductsPage = useCallback(
    async (cursor?: number | null): Promise<MyProductsPage> => {
      const qs = buildMyProductsQuery(dil, showActive, search, cursor);
      if (favoriteMode) {
        const data = await api.get<FavoriteProductsResponse>(`/api/products/favorites?${qs.toString()}`);
        const nextItems = Array.isArray(data?.Data) ? data.Data.map(normalizeFavoriteProductItem) : [];
        return {
          items: nextItems,
          nextCursor: resolveLastId(data as MyProductsResponse, nextItems),
          totalCount: toNonNegativeNumber(data?.TotalCount, nextItems.length),
        };
      }

      const data = await api.get<MyProductsResponse>(`/api/products/my?${qs.toString()}`);
      const nextItems = Array.isArray(data?.Data) ? data.Data : [];
      return {
        items: nextItems,
        nextCursor: resolveLastId(data, nextItems),
        totalCount: toNonNegativeNumber(data?.TotalCount, nextItems.length),
      };
    },
    [dil, favoriteMode, search, showActive]
  );

  const ensurePageLoaded = useCallback(
    async function loadPage(page: number): Promise<MyProductsPage> {
      const cached = pagesRef.current[page];
      if (cached) return cached;

      if (page > 1 && !(page in cursorsRef.current)) {
        const previousPage = await loadPage(page - 1);
        if (previousPage.nextCursor == null) {
          const emptyPage = {
            items: [],
            nextCursor: null,
            totalCount: previousPage.totalCount,
          };
          pagesRef.current[page] = emptyPage;
          return emptyPage;
        }
        cursorsRef.current[page] = previousPage.nextCursor;
      }

      const cursor = page === 1 ? null : cursorsRef.current[page] ?? null;
      const nextPage = await fetchProductsPage(cursor);
      pagesRef.current[page] = nextPage;
      cursorsRef.current[page + 1] = nextPage.nextCursor;
      return nextPage;
    },
    [fetchProductsPage]
  );

  const openPage = useCallback(
    async (page: number): Promise<MyProductsPage | null> => {
      const safePage = Math.max(1, page);
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const nextPage = await ensurePageLoaded(safePage);
        if (requestId !== requestIdRef.current) return null;
        setItems(nextPage.items);
        setTotalCount(nextPage.totalCount);
        setCurrentPage(safePage);
        return nextPage;
      } catch (err: any) {
        if (requestId !== requestIdRef.current) return null;
        setItems([]);
        setTotalCount(0);
        setError(String(err?.message ?? text.loadError));
        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [ensurePageLoaded, text.loadError]
  );

  useEffect(() => {
    resetCachedPages();
    setCurrentPage(1);
    void openPage(1);
  }, [openPage, resetCachedPages, search, showActive]);

  const loadCounts = useCallback(async () => {
    if (favoriteMode) {
      const [activeData, inactiveData] = await Promise.all([
        api.get<FavoriteProductsResponse>(`/api/products/favorites?${buildMyProductsQuery(dil, true, search).toString()}`),
        api.get<FavoriteProductsResponse>(`/api/products/favorites?${buildMyProductsQuery(dil, false, search).toString()}`),
      ]);

      setCounts({
        active: toNonNegativeNumber(activeData?.TotalCount, 0),
        inactive: toNonNegativeNumber(inactiveData?.TotalCount, 0),
      });
      return;
    }

    const [activeData, inactiveData] = await Promise.all([
      api.get<MyProductsResponse>(`/api/products/my?${buildMyProductsQuery(dil, true, search).toString()}`),
      api.get<MyProductsResponse>(`/api/products/my?${buildMyProductsQuery(dil, false, search).toString()}`),
    ]);

    setCounts({
      active: toNonNegativeNumber(activeData?.TotalCount, 0),
      inactive: toNonNegativeNumber(inactiveData?.TotalCount, 0),
    });
  }, [dil, favoriteMode, search]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadCounts();
        if (cancelled) return;
      } catch {
        if (cancelled) return;
        setCounts({ active: null, inactive: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadCounts]);

  const reloadAfterMutation = useCallback(async () => {
    const preferredPage = currentPage;
    resetCachedPages();
    const result = await openPage(preferredPage);
    if (preferredPage > 1 && result && result.items.length === 0) {
      resetCachedPages();
      await openPage(preferredPage - 1);
    }
  }, [currentPage, openPage, resetCachedPages]);

  const handleProductAction = useCallback(
    async (kind: ProductActionKind) => {
      if (!optionsProduct) return;

      const productNr = optionsProduct.UrunNr ?? optionsProduct.Nr;
      const qs = new URLSearchParams({
        urunNr: String(productNr),
        dil: String(dil),
        kaynak: "2",
      });
      const url = favoriteMode
        ? `/api/products/remove-favorite?${qs.toString()}`
        : kind === "delete"
        ? `/api/products/soft-delete?${qs.toString()}`
        : optionsProduct.Aktif
        ? `/api/products/make-inactive?${qs.toString()}`
        : `/api/products/make-active?${qs.toString()}`;

      try {
        setOptionsActionLoading(kind);
        setOptionsActionError(null);
        await api.post(url);
        if (kind === "delete") {
          setConfirmDeleteOpen(false);
        }
        setOptionsProduct(null);
        await Promise.all([reloadAfterMutation(), loadCounts()]);
      } catch (err: any) {
        setOptionsActionError(String(err?.message ?? text.actionFailed));
      } finally {
        setOptionsActionLoading(null);
      }
    },
    [dil, favoriteMode, loadCounts, optionsProduct, reloadAfterMutation, text.actionFailed]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const visiblePages = useMemo(() => getVisiblePages(currentPage, totalPages), [currentPage, totalPages]);
  const optionsTradeTypeLabel = optionsProduct ? (optionsProduct.UrunIhracatMi ? text.exportType : text.importType) : "";
  const optionsDescription = optionsProduct ? truncateText(optionsProduct.UrunAciklamasi, 100) : text.optionsDescription;
  const toggleActionLabel = optionsProduct?.Aktif ? text.deactivate : text.activate;
  const getProductDetailHref = useCallback(
    (product: MyProductItem | null | undefined) => {
      const productNr = product?.UrunNr ?? product?.Nr;
      return productNr ? `/${lang}/home/productdetail` : `/${lang}/home/myproducts`;
    },
    [lang]
  );
  const persistSelectedProduct = useCallback((product: MyProductItem | null | undefined) => {
    const productNr = product?.UrunNr ?? product?.Nr;
    if (!productNr) return;
    setSelectedProductNrCookie(productNr);
  }, []);
  const openImagePreview = useCallback((src: string | null | undefined, alt: string) => {
    const normalizedSrc = src?.trim() ?? "";
    if (!normalizedSrc) return;
    setPreviewImage({ src: normalizedSrc, alt: alt.trim() || text.pageTitle });
  }, [text.pageTitle]);

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <GtgLoading isLoading={loading && items.length === 0} />

      <header className="border-b border-[#d9dde4] bg-white">
        <div className="flex flex-wrap items-center gap-4 px-4 py-4 lg:px-7">
          <div className="min-w-[180px]">
            <div className="ml-14 flex items-center text-[14px] text-[#8b95a7] lg:ml-0">
              <span>{t.sidebar.items.home}</span>
              <ChevronRight className="mx-1 h-4 w-4" />
              <span className="text-[#1f232b]">{text.pageTitle}</span>
            </div>
            <h1 className="ml-14 mt-1 text-[31px] font-semibold text-[#1f232b] lg:ml-0">{text.pageTitle}</h1>
          </div>

          {!favoriteMode ? (
            <Link
              href={`/${lang}/home/add-product?returnTo=${encodeURIComponent(`/${lang}/home/myproducts`)}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gtg-orange)] px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              <Plus size={18} />
              {text.create}
            </Link>
          ) : null}

          {favoriteMode ? (
            <div className="flex items-center rounded-2xl border border-[#d9dde4] bg-white px-4 py-3 text-[15px] font-semibold text-[#1f232b] shadow-sm">
              {text.total} ({totalCount})
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-[#d9dde4] bg-white p-1">
              <button
                type="button"
                onClick={() => setShowActive(true)}
                className={clsx(
                  "rounded-xl px-4 py-2 text-[15px] font-semibold transition",
                  showActive ? "bg-[#f7f7f9] text-[#1f232b] shadow-sm" : "text-[#6b7280] hover:bg-[#f7f7f9]"
                )}
              >
                {text.active} ({counts.active ?? (showActive ? totalCount : 0)})
              </button>
              <button
                type="button"
                onClick={() => setShowActive(false)}
                className={clsx(
                  "rounded-xl px-4 py-2 text-[15px] font-semibold transition",
                  !showActive ? "bg-[#f7f7f9] text-[#1f232b] shadow-sm" : "text-[#6b7280] hover:bg-[#f7f7f9]"
                )}
              >
                {text.inactive} ({counts.inactive ?? (!showActive ? totalCount : 0)})
              </button>
            </div>
          )}

          <div className="relative w-full min-w-[260px] max-w-[460px] lg:ml-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b95a7]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t.common.search}
              className="w-full rounded-2xl border border-[#d9dde4] bg-white py-3 pl-12 pr-4 text-[15px] text-[#1f232b] outline-none transition focus:border-[var(--gtg-orange)]"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] px-4 py-6 lg:px-7">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : null}

        {!error && !loading && items.length === 0 ? (
          <div className="rounded-3xl border border-[#d9dde4] bg-white px-6 py-12 text-center text-[15px] text-[#6b7280]">
            {text.empty}
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="grid justify-items-center gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const imageUrl = item.VarsayilanResim?.trim() ?? "";
              const tradeTypeLabel = item.UrunIhracatMi ? text.exportType : text.importType;
              const descriptionPreview = truncateText(item.UrunAciklamasi, 200);

              return (
                <article
                  key={item.Nr}
                  className="w-full max-w-[360px] rounded-[26px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.09)] ring-1 ring-[#eef0f4]"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-[18px] font-semibold text-[#2f3136]">{item.UrunAdi || "-"}</h2>
                        <div className="mt-1 flex items-center gap-2 text-[14px] text-[#7b7f87]">
                          <span
                            className={clsx(
                              "font-semibold",
                              item.UrunIhracatMi ? "text-[#2563eb]" : "text-[#c27b00]"
                            )}
                          >
                            {tradeTypeLabel}
                          </span>
                          {item.UlkeAdi ? (
                            <>
                              <span className="text-[#c5cad3]">•</span>
                              <span className="truncate">{item.UlkeAdi}</span>
                            </>
                          ) : null}
                          {item.UlkeFlagUrl ? (
                            <span className="grid h-5 w-7 place-items-center overflow-hidden rounded-[4px] border border-[#e5e7eb] bg-white">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.UlkeFlagUrl}
                                alt={item.UlkeAdi || "Flag"}
                                className="max-h-full max-w-full object-contain"
                              />
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center text-[#77737a]">
                        <button
                          type="button"
                          onClick={() => {
                            setOptionsActionError(null);
                            setOptionsProduct(item);
                          }}
                          aria-label={text.optionsTitle}
                          className="rounded-full p-1 text-[var(--gtg-orange)] transition hover:bg-[#fff5e5]"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 flow-root">
                      <button
                        type="button"
                        onClick={() => openImagePreview(imageUrl, item.UrunAdi || text.pageTitle)}
                        disabled={!imageUrl}
                        aria-label={text.imagePreview}
                        className="float-left mr-4 grid h-[92px] w-[92px] shrink-0 place-items-center overflow-hidden rounded-[22px] bg-[#ebecef] p-2 transition enabled:cursor-zoom-in enabled:hover:bg-[#e4e6eb] disabled:cursor-default"
                      >
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={item.UrunAdi} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-[#7b7f87]" />
                        )}
                      </button>
                      {!favoriteMode ? (
                        <p
                          className={clsx(
                            "pt-1 text-[15px] font-semibold",
                            item.UrunOnay ? "text-[#166534]" : "text-[#b91c1c]"
                          )}
                        >
                          {item.UrunOnay ? text.approved : text.pendingApproval}
                        </p>
                      ) : null}
                      <p className="mt-2 min-h-[92px] text-[14px] leading-7 text-[#666671]">
                        {descriptionPreview}
                      </p>
                    </div>
                  </div>

                  {!favoriteMode ? (
                    <div className="flex items-center justify-end border-t border-[#edf0f4] px-5 py-3.5">
                      <Link
                        href={getProductDetailHref(item)}
                        onClick={() => persistSelectedProduct(item)}
                        className="rounded-2xl bg-[var(--gtg-orange)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm"
                      >
                        {text.edit}
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        {!error && totalPages > 1 ? (
          <div className="mt-10 flex justify-center">
            <nav
              aria-label="Pagination"
              className="inline-flex items-center overflow-hidden rounded-2xl border border-[#d9dde4] bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => void openPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="inline-flex items-center gap-2 border-r border-[#d9dde4] px-5 py-3 text-[15px] text-[#374151] transition hover:bg-[#f7f7f9] disabled:cursor-not-allowed disabled:text-[#b2b8c3]"
              >
                <ArrowLeft className="h-4 w-4" />
                {text.previous}
              </button>

              {visiblePages.map((page) =>
                typeof page === "number" ? (
                  <button
                    key={page}
                    type="button"
                    onClick={() => void openPage(page)}
                    disabled={loading}
                    className={clsx(
                      "min-w-[44px] border-r border-[#d9dde4] px-4 py-3 text-[15px] transition last:border-r-0",
                      page === currentPage ? "bg-[#f7f7f9] font-semibold text-[#1f232b]" : "text-[#4b5563] hover:bg-[#f7f7f9]"
                    )}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={page} className="min-w-[44px] border-r border-[#d9dde4] px-4 py-3 text-center text-[#6b7280]">
                    ...
                  </span>
                )
              )}

              <button
                type="button"
                onClick={() => void openPage(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-2 px-5 py-3 text-[15px] text-[#374151] transition hover:bg-[#f7f7f9] disabled:cursor-not-allowed disabled:text-[#b2b8c3]"
              >
                {text.next}
                <ArrowRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        ) : null}
      </div>

      {optionsProduct ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4 py-8"
          onClick={() => {
            setOptionsProduct(null);
            setConfirmDeleteOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={text.optionsTitle}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[480px] rounded-[24px] bg-white px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:px-6 sm:py-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[22px] font-semibold tracking-tight text-[#2f3136] sm:text-[24px]">{text.optionsTitle}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOptionsProduct(null);
                  setConfirmDeleteOpen(false);
                }}
                aria-label={text.close}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--gtg-orange)] text-white shadow-sm transition hover:brightness-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {optionsProduct ? (
              <div className="mt-4 rounded-[18px] border border-[#eceff4] bg-[#fafbfc] p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      openImagePreview(optionsProduct.VarsayilanResim, optionsProduct.UrunAdi || text.pageTitle)
                    }
                    disabled={!optionsProduct.VarsayilanResim?.trim()}
                    aria-label={text.imagePreview}
                    className="grid h-[64px] w-[64px] shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[#ebecef] p-2 transition enabled:cursor-zoom-in enabled:hover:bg-[#e4e6eb] disabled:cursor-default"
                  >
                    {optionsProduct.VarsayilanResim?.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optionsProduct.VarsayilanResim}
                        alt={optionsProduct.UrunAdi}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-[#7b7f87]" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-semibold text-[#2f3136]">{optionsProduct.UrunAdi || "-"}</h3>
                    <div className="mt-1 flex items-center gap-2 text-[13px] text-[#7b7f87]">
                      <span
                        className={clsx(
                          "font-semibold",
                          optionsProduct.UrunIhracatMi ? "text-[#2563eb]" : "text-[#c27b00]"
                        )}
                      >
                        {optionsTradeTypeLabel}
                      </span>
                      {optionsProduct.UlkeAdi ? (
                        <>
                          <span className="text-[#c5cad3]">•</span>
                          <span className="truncate">{optionsProduct.UlkeAdi}</span>
                        </>
                      ) : null}
                      {optionsProduct.UlkeFlagUrl ? (
                        <span className="grid h-4 w-6 place-items-center overflow-hidden rounded-[4px] border border-[#e5e7eb] bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={optionsProduct.UlkeFlagUrl}
                            alt={optionsProduct.UlkeAdi || "Flag"}
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                      ) : null}
                    </div>
                    {!favoriteMode ? (
                      <p
                        className={clsx(
                          "mt-2 text-[13px] font-semibold",
                          optionsProduct.UrunOnay ? "text-[#166534]" : "text-[#b91c1c]"
                        )}
                      >
                        {optionsProduct.UrunOnay ? text.approved : text.pendingApproval}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-[#666671]">{optionsDescription}</p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {favoriteMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleProductAction("remove-favorite")}
                    disabled={optionsActionLoading != null}
                    className="w-full rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-[15px] font-medium text-[#555d6b] shadow-[0_4px_18px_rgba(15,23,42,0.08)] transition hover:bg-[#f8fafc]"
                  >
                    {optionsActionLoading === "remove-favorite" ? text.processing : text.removeFavorite}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOptionsProduct(null);
                      setConfirmDeleteOpen(false);
                    }}
                    className="w-full rounded-[14px] bg-[var(--gtg-orange)] px-4 py-3 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(250,165,0,0.32)] transition hover:brightness-95"
                  >
                    {text.close}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void handleProductAction("toggle-active")}
                    disabled={optionsActionLoading != null}
                    className="w-full rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-[15px] font-medium text-[#555d6b] shadow-[0_4px_18px_rgba(15,23,42,0.08)] transition hover:bg-[#f8fafc]"
                  >
                    {optionsActionLoading === "toggle-active" ? text.processing : toggleActionLabel}
                  </button>
                  <Link
                    href={getProductDetailHref(optionsProduct)}
                    onClick={() => persistSelectedProduct(optionsProduct)}
                    className="block w-full rounded-[14px] bg-[var(--gtg-orange)] px-4 py-3 text-center text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(250,165,0,0.32)] transition hover:brightness-95"
                  >
                    {text.edit}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOptionsActionError(null);
                      setConfirmDeleteOpen(true);
                    }}
                    disabled={optionsActionLoading != null}
                    className="w-full rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-[15px] font-medium text-[#555d6b] shadow-[0_4px_18px_rgba(15,23,42,0.08)] transition hover:bg-[#f8fafc]"
                  >
                    {optionsActionLoading === "delete" ? text.processing : text.delete}
                  </button>
                </>
              )}
              {optionsActionError ? <p className="text-sm text-red-600">{optionsActionError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {optionsProduct && !favoriteMode && confirmDeleteOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={() => {
            if (optionsActionLoading == null) setConfirmDeleteOpen(false);
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
            {optionsActionError ? <p className="mt-3 text-sm text-red-600">{optionsActionError}</p> : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={optionsActionLoading != null}
                className="rounded-[14px] border border-[#d3d8e0] bg-white px-4 py-3 text-[15px] font-medium text-[#555d6b] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed"
              >
                {text.confirmDeleteCancel}
              </button>
              <button
                type="button"
                onClick={() => void handleProductAction("delete")}
                disabled={optionsActionLoading != null}
                className="rounded-[14px] bg-[var(--gtg-orange)] px-4 py-3 text-[15px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed"
              >
                {optionsActionLoading === "delete" ? text.processing : text.confirmDeleteApprove}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewImage ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/65 px-4 py-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={text.imagePreview}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[920px] rounded-[28px] bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.32)] sm:p-5"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              aria-label={text.close}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-[var(--gtg-orange)] text-white shadow-sm transition hover:brightness-95"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid max-h-[82vh] min-h-[280px] place-items-center overflow-hidden rounded-[22px] bg-[#f5f6f8] p-4 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[72vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
