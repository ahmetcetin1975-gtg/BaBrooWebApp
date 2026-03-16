"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Eye, Flag, Star, ThumbsUp, X } from "lucide-react";
import { GtgLoading } from "@/components/gtg/GtgLoading";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";

type ServiceItem = {
  Nr: number;
  HizmetMusteriNr: number;
  HizmetKategori: string;
  HizmetUzmanlik: string;
  HizmetAciklama: string;
  HizmetBelge: string;
  HizmetTecrubeYil: number;
  HizmetEgitim: string;
  HizmetFavcount: number;
  HizmetBakcount: number;
  VarsayilanResim: string;
  MusteriFavHizmet: boolean;
};

type ServicesResponse = {
  LastId?: number;
  PageSize?: number;
  TotalCount?: number;
  Data?: ServiceItem[];
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

function normalizeServiceImages(data?: ServiceImagesResponse): ServiceImageItem[] {
  return Array.isArray(data?.Data)
    ? data.Data.filter((img) => typeof img?.ResimUrl === "string" && img.ResimUrl.trim() !== "")
    : [];
}

function preloadImage(url: string) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveLastId(data: ServicesResponse | undefined, fallbackItems: ServiceItem[]): number | null {
  const apiLastId = toNumberOrNull(data?.LastId);
  if (apiLastId != null) return apiLastId;
  if (fallbackItems.length === 0) return null;
  return toNumberOrNull(fallbackItems[fallbackItems.length - 1]?.Nr);
}

function buildServicesQuery(dil: number, pageSize: number, search: string, lastId?: number | null) {
  const qs = new URLSearchParams({ dil: String(dil), pageSize: String(pageSize) });
  const normalizedSearch = search.trim();
  if (normalizedSearch !== "") qs.set("search", normalizedSearch);
  if (lastId != null) qs.set("lastId", String(lastId));
  return qs;
}

function getDilFromLang(lang: string): number {
  return lang === "tr" ? 1 : 2;
}

type SwipeAction = "like" | "pass";

const SWIPE_TRIGGER_PX = 90;
const SWIPE_MAX_OFFSET_PX = 140;
const AUTO_ROTATE_MS = 30000;
const LIKE_TRANSITION_MS = 520;

export default function ServicesHome() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const t = getMessages(lang);
  const dil = getDilFromLang(lang);

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastId, setLastId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [serviceImages, setServiceImages] = useState<ServiceImageItem[]>([]);
  const [serviceImagesLoading, setServiceImagesLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const [swipeActionHint, setSwipeActionHint] = useState<SwipeAction | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [likeTransitionActive, setLikeTransitionActive] = useState(false);
  const pagingRef = useRef(false);
  const viewedNrRef = useRef<number | null>(null);
  const imageCacheRef = useRef<Record<string, ServiceImageItem[]>>({});
  const imageRequestRef = useRef<Partial<Record<string, Promise<ServiceImageItem[]>>>>({});
  const likeTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeRef = useRef<{ pointerId: number | null; startX: number; startY: number }>({
    pointerId: null,
    startX: 0,
    startY: 0,
  });

  const clearLikeTransitionTimer = () => {
    if (likeTransitionTimerRef.current == null) return;
    clearTimeout(likeTransitionTimerRef.current);
    likeTransitionTimerRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearLikeTransitionTimer();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    viewedNrRef.current = null;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setTransitionLoading(false);

        const qs = buildServicesQuery(dil, 4, search);
        const data = await api.get<ServicesResponse>(`/api/services?${qs.toString()}`);
        if (cancelled) return;

        const nextItems = Array.isArray(data?.Data) ? data.Data : [];
        setItems(nextItems);
        setIdx(0);
        setLastId(resolveLastId(data, nextItems));
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? "Failed to load services"));
        setItems([]);
        setLastId(null);
      } finally {
        if (!cancelled) {
          pagingRef.current = false;
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, search]);

  useEffect(() => {
    if (loading || items.length === 0 || likeTransitionActive) return;

    let cancelled = false;

    const fetchNextPageOrRestart = async () => {
      if (pagingRef.current) return;

      try {
        pagingRef.current = true;
        setTransitionLoading(true);

        const qs = buildServicesQuery(dil, 4, search, lastId);
        const data = await api.get<ServicesResponse>(`/api/services?${qs.toString()}`);
        if (cancelled) return;

        const nextItems = Array.isArray(data?.Data) ? data.Data : [];
        const nextLastId = resolveLastId(data, nextItems);

        if (nextItems.length > 0) {
          setItems(nextItems);
          setIdx(0);
          setLastId(nextLastId);
          setError(null);
          return;
        }

        const restartQs = buildServicesQuery(dil, 4, search);
        const restartData = await api.get<ServicesResponse>(`/api/services?${restartQs.toString()}`);
        if (cancelled) return;

        const restartItems = Array.isArray(restartData?.Data) ? restartData.Data : [];
        setItems(restartItems);
        setIdx(0);
        setLastId(resolveLastId(restartData, restartItems));
        setError(null);
        if (restartItems.length === 0) setTransitionLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? "Failed to rotate services"));
        setTransitionLoading(false);
      } finally {
        if (!cancelled) pagingRef.current = false;
      }
    };

    const rotate = async () => {
      if (cancelled) return;

      if (idx < items.length - 1) {
        setTransitionLoading(true);
        setIdx((prev) => Math.min(prev + 1, items.length - 1));
        return;
      }

      await fetchNextPageOrRestart();
    };

    const timer = setInterval(() => {
      void rotate();
    }, AUTO_ROTATE_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [dil, idx, items, lastId, likeTransitionActive, loading, search]);

  const item = useMemo(() => {
    if (items.length === 0) return null;
    return items[Math.min(idx, items.length - 1)];
  }, [idx, items]);

  useEffect(() => {
    const currentNr = item?.Nr;
    if (currentNr == null) return;

    if (viewedNrRef.current == null) {
      viewedNrRef.current = currentNr;
      return;
    }

    if (viewedNrRef.current === currentNr) return;
    viewedNrRef.current = currentNr;

    const qs = new URLSearchParams({
      hizmetNr: String(currentNr),
      kaynak: "2",
      dil: String(dil),
    });

    void api.post(`/api/services/view?${qs.toString()}`).catch(() => undefined);
  }, [dil, item?.Nr]);

  useEffect(() => {
    const currentNr = item?.Nr;
    if (currentNr == null) {
      setServiceImages([]);
      setServiceImagesLoading(false);
      setPreviewImageUrl(null);
      return;
    }

    const cacheKey = `${dil}-${currentNr}`;
    const cached = imageCacheRef.current[cacheKey];
    if (cached) {
      setServiceImages(cached);
      setServiceImagesLoading(false);
      return;
    }

    let cancelled = false;
    setServiceImages([]);
    setServiceImagesLoading(true);

    (async () => {
      let request = imageRequestRef.current[cacheKey];
      if (!request) {
        const qs = new URLSearchParams({ hizmetNr: String(currentNr), dil: String(dil) });
        request = api
          .get<ServiceImagesResponse>(`/api/services/images?${qs.toString()}`)
          .then((data) => {
            const nextImages = normalizeServiceImages(data);
            imageCacheRef.current[cacheKey] = nextImages;
            nextImages.forEach((img) => preloadImage(img.ResimUrl));
            return nextImages;
          })
          .catch(() => [])
          .finally(() => {
            delete imageRequestRef.current[cacheKey];
          });
        imageRequestRef.current[cacheKey] = request;
      }

      try {
        const nextImages = await request;
        if (cancelled) return;
        setServiceImages(nextImages);
      } catch {
        if (cancelled) return;
        setServiceImages([]);
      } finally {
        if (!cancelled) setServiceImagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, item?.Nr]);

  useEffect(() => {
    if (items.length === 0) return;

    for (const service of items) {
      const cacheKey = `${dil}-${service.Nr}`;
      if (imageCacheRef.current[cacheKey] || imageRequestRef.current[cacheKey]) continue;

      const qs = new URLSearchParams({ hizmetNr: String(service.Nr), dil: String(dil) });
      const request = api
        .get<ServiceImagesResponse>(`/api/services/images?${qs.toString()}`)
        .then((data) => {
          const nextImages = normalizeServiceImages(data);
          imageCacheRef.current[cacheKey] = nextImages;
          nextImages.forEach((img) => preloadImage(img.ResimUrl));
          return nextImages;
        })
        .catch(() => [])
        .finally(() => {
          delete imageRequestRef.current[cacheKey];
        });

      imageRequestRef.current[cacheKey] = request;
      void request;
    }
  }, [dil, items]);

  useEffect(() => {
    clearLikeTransitionTimer();
    setLikeTransitionActive(false);
    setPreviewImageUrl(null);
    setSwipeOffsetX(0);
    setSwipeActionHint(null);
    setIsDraggingImage(false);
    swipeRef.current.pointerId = null;
  }, [item?.Nr]);

  const goToItemIndex = (nextIndex: number) => {
    if (items.length === 0) return;
    const safeNextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
    if (safeNextIndex === idx) return;
    setTransitionLoading(true);
    setIdx(safeNextIndex);
  };

  const showNextService = async () => {
    if (items.length === 0 || likeTransitionActive) return;

    if (idx < items.length - 1) {
      goToItemIndex(idx + 1);
      return;
    }

    if (pagingRef.current) return;

    try {
      pagingRef.current = true;
      setTransitionLoading(true);

      const qs = buildServicesQuery(dil, 4, search, lastId);
      const data = await api.get<ServicesResponse>(`/api/services?${qs.toString()}`);
      const nextItems = Array.isArray(data?.Data) ? data.Data : [];
      const nextLastId = resolveLastId(data, nextItems);

      if (nextItems.length > 0) {
        setItems(nextItems);
        setIdx(0);
        setLastId(nextLastId);
        setError(null);
        return;
      }

      const restartQs = buildServicesQuery(dil, 4, search);
      const restartData = await api.get<ServicesResponse>(`/api/services?${restartQs.toString()}`);
      const restartItems = Array.isArray(restartData?.Data) ? restartData.Data : [];
      setItems(restartItems);
      setIdx(0);
      setLastId(resolveLastId(restartData, restartItems));
      setError(null);
      if (restartItems.length === 0) setTransitionLoading(false);
    } catch (err: any) {
      setError(String(err?.message ?? "Failed to rotate services"));
      setTransitionLoading(false);
    } finally {
      pagingRef.current = false;
    }
  };

  const handleLikeClick = () => {
    const currentNr = item?.Nr;
    if (currentNr == null || likeTransitionActive) return;

    const qs = new URLSearchParams({
      hizmetNr: String(currentNr),
      kaynak: "2",
      dil: String(dil),
    });

    clearLikeTransitionTimer();
    setSwipeOffsetX(0);
    setSwipeActionHint(null);
    setIsDraggingImage(false);
    swipeRef.current.pointerId = null;
    setLikeTransitionActive(true);

    likeTransitionTimerRef.current = setTimeout(() => {
      setLikeTransitionActive(false);
      likeTransitionTimerRef.current = null;
      void showNextService();
    }, LIKE_TRANSITION_MS);

    void api.post(`/api/services/favorite?${qs.toString()}`).catch(() => undefined);
  };

  const resetSwipeVisuals = () => {
    setSwipeOffsetX(0);
    setSwipeActionHint(null);
  };

  const handleSwipeAction = (action: SwipeAction) => {
    if (action === "like") {
      handleLikeClick();
      return;
    }
    void showNextService();
  };

  const handleImagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (loading || transitionLoading || likeTransitionActive || items.length === 0) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };

    setIsDraggingImage(true);
    setSwipeOffsetX(0);
    setSwipeActionHint(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleImagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipeRef.current.startX;
    const deltaY = event.clientY - swipeRef.current.startY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 12) return;

    const limitedDeltaX = Math.max(-SWIPE_MAX_OFFSET_PX, Math.min(SWIPE_MAX_OFFSET_PX, deltaX));
    setSwipeOffsetX(limitedDeltaX);

    if (limitedDeltaX >= SWIPE_TRIGGER_PX) {
      setSwipeActionHint("like");
    } else if (limitedDeltaX <= -SWIPE_TRIGGER_PX) {
      setSwipeActionHint("pass");
    } else {
      setSwipeActionHint(null);
    }
  };

  const handleImagePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipeRef.current.startX;
    const deltaY = event.clientY - swipeRef.current.startY;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    swipeRef.current.pointerId = null;
    setIsDraggingImage(false);

    const shouldTriggerSwipe = Math.abs(deltaX) >= SWIPE_TRIGGER_PX && Math.abs(deltaX) > Math.abs(deltaY) * 1.1;
    const swipeAction: SwipeAction = deltaX > 0 ? "like" : "pass";

    resetSwipeVisuals();
    if (shouldTriggerSwipe) {
      handleSwipeAction(swipeAction);
    }
  };

  const handleImagePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeRef.current.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    swipeRef.current.pointerId = null;
    setIsDraggingImage(false);
    resetSwipeVisuals();
  };

  const title = item?.HizmetKategori ?? t.home.servicesTitle;
  const subtitle = item?.HizmetUzmanlik ?? "";
  const description = item?.HizmetAciklama ?? "";
  const defaultImage = serviceImages.find((img) => img.HizmetresimVarsayilan);
  const imageUrl = defaultImage?.ResimUrl || serviceImages[0]?.ResimUrl || item?.VarsayilanResim || "/demo/person.jpg";
  const favCount = item ? String(item.HizmetFavcount ?? 0) : "0";
  const viewCount = item ? String(item.HizmetBakcount ?? 0) : "0";
  const isCustomerFavorite = Boolean(item?.MusteriFavHizmet);
  const loadingText = lang === "tr" ? "Yükleniyor..." : "Loading...";
  const emptyText = lang === "tr" ? "Hizmet bulunamadı." : "No services found.";
  const blockAndReport = lang === "tr" ? "Engelle ve şikayet et" : "Block and report";
  const passHint = lang === "tr" ? "Geç" : "Pass";
  const superSwipeHint = lang === "tr" ? "Kaydır" : "SuperSwipe";
  const likeHint = lang === "tr" ? "Beğen" : "Like";
  const descriptionText = item ? description : loading ? loadingText : error ?? emptyText;
  const detailsText = item
    ? [
        item.HizmetBelge ? `${lang === "tr" ? "Belge" : "Document"}: ${item.HizmetBelge}` : "",
        typeof item.HizmetTecrubeYil === "number"
          ? `${lang === "tr" ? "Tecrübe" : "Experience"}: ${item.HizmetTecrubeYil} ${lang === "tr" ? "yıl" : "years"}`
          : "",
        item.HizmetEgitim ? `${lang === "tr" ? "Eğitim" : "Education"}: ${item.HizmetEgitim}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : "";
  const tabs = [
    { label: t.home.productsTitle, href: `/${lang}/home/products` },
    { label: t.home.servicesTitle, href: `/${lang}/home/services`, active: true },
  ];

  return (
    <div className="min-h-screen">
      <TopBar lang={lang} tabs={tabs} searchValue={searchInput} onSearchChange={setSearchInput} />

      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-[1220px]">
          <div className="relative">
            <div className="grid gap-4 xl:grid-cols-[1.03fr_1fr] xl:gap-0">
              <div className="relative min-h-[560px] overflow-hidden rounded-[30px] bg-[#CCC1C0]/15 xl:rounded-r-none">
                <div
                  className={`absolute left-6 top-5 z-10 rounded-lg px-2.5 py-1 text-xs font-semibold text-white ${
                    isCustomerFavorite ? "bg-red-600/90" : "bg-black/45"
                  }`}
                >
                  <Star className="mr-1 inline h-3.5 w-3.5" />
                  {favCount}
                </div>

                <div
                  className="relative flex h-full select-none items-center justify-center px-8 py-10"
                  style={{ touchAction: "pan-y" }}
                  onPointerDown={handleImagePointerDown}
                  onPointerMove={handleImagePointerMove}
                  onPointerUp={handleImagePointerUp}
                  onPointerCancel={handleImagePointerCancel}
                >
                  {likeTransitionActive ? (
                    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden bg-[var(--gtg-orange)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_46%)]" />
                      <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
                        <div className="grid h-40 w-40 place-items-center rounded-full bg-white shadow-[0_20px_42px_rgba(0,0,0,0.28)]">
                          <ThumbsUp className="h-16 w-16 text-[var(--gtg-orange)]" fill="currentColor" strokeWidth={0} />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 rounded-t-[30px] bg-gradient-to-b from-[#ff971b] to-[#ff8c08] px-7 pb-8 pt-7 text-white shadow-[0_-12px_24px_rgba(0,0,0,0.24)]">
                        <div className="text-3xl font-extrabold leading-none tracking-tight lg:text-5xl">{title}</div>
                        <div className="mt-3 text-2xl font-medium leading-none lg:text-4xl">{subtitle || "\u00A0"}</div>
                      </div>
                    </div>
                  ) : null}
                  {swipeActionHint ? (
                    <div
                      className={`pointer-events-none absolute top-8 z-10 rounded-lg px-3 py-1 text-xs font-semibold text-white ${
                        swipeActionHint === "like" ? "left-8 bg-emerald-600/90" : "right-8 bg-red-600/90"
                      }`}
                    >
                      {swipeActionHint === "like" ? likeHint : passHint}
                    </div>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={item?.Nr ?? "fallback-service-image"}
                    src={imageUrl}
                    alt={title}
                    draggable={false}
                    className="max-h-[480px] w-full object-contain"
                    style={{
                      transform: `translateX(${swipeOffsetX}px) rotate(${swipeOffsetX * 0.04}deg)`,
                      transition: isDraggingImage ? "none" : "transform 200ms ease-out",
                    }}
                    onLoad={() => setTransitionLoading(false)}
                    onError={() => setTransitionLoading(false)}
                  />
                </div>

                <div className="absolute bottom-5 left-6 z-10 rounded-lg bg-black/45 px-2.5 py-1 text-xs font-semibold text-white">
                  <Eye className="mr-1 inline h-3.5 w-3.5" />
                  {viewCount}
                </div>

                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToItemIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full ${i === idx ? "bg-blue-500" : "bg-white/45"}`}
                      aria-label={t.carousel.goTo.replace("{index}", String(i + 1))}
                    />
                  ))}
                </div>
              </div>

              <div className="relative min-h-[560px] rounded-[30px] border border-[#e5dcc0] bg-[#f2ebca] p-6 xl:rounded-l-none xl:p-8">
                <div className="pointer-events-none absolute right-3 top-8 hidden h-24 w-[3px] rounded-full bg-neutral-400/45 xl:block">
                  <span className="absolute left-0 top-0 h-9 w-[3px] rounded-full bg-amber-500" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-800 lg:text-5xl">{title}</h1>
                    <p className="mt-1 text-2xl font-medium text-neutral-700 lg:text-4xl">{subtitle}</p>
                  </div>
                  <button className="rounded-xl bg-[var(--gtg-orange)] px-7 py-2.5 text-base font-semibold text-white shadow-sm">
                    {t.common.makeOffer}
                  </button>
                </div>

                <div className="my-5 h-px bg-neutral-500/20" />

                <p className="whitespace-pre-line text-base leading-10 text-neutral-700 lg:text-[22px] lg:leading-[1.9]">
                  {descriptionText}
                </p>

                {item && detailsText ? (
                  <p className="mt-4 text-sm leading-6 text-neutral-600">{detailsText}</p>
                ) : null}

                {item && serviceImages.length > 0 ? (
                  <div className="mt-6">
                    <div className="text-sm flex justify-end font-semibold text-neutral-700">
                      {lang === "tr" ? "Hizmet görselleri" : "Service images"}
                    </div>
                    <div className="mt-2 flex justify-end gap-2 overflow-x-auto pb-1">
                      {serviceImages.map((img) => (
                        <button
                          key={img.Nr}
                          type="button"
                          onClick={() => setPreviewImageUrl(img.ResimUrl)}
                          className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${
                            img.HizmetresimVarsayilan ? "border-amber-500" : "border-neutral-300"
                          }`}
                          title={img.HizmetresimVarsayilan ? (lang === "tr" ? "Varsayılan resim" : "Default image") : undefined}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.ResimUrl} alt={title} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 xl:absolute xl:-bottom-10 xl:left-1/2 xl:mt-0 xl:-translate-x-1/2">
              <button
                aria-label={passHint}
                onClick={() => void showNextService()}
                disabled={likeTransitionActive}
                className="group relative transition hover:scale-[1.02] hover:drop-shadow-[0_12px_24px_rgba(27,61,145,0.4)] active:scale-[0.98]"
              >
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[var(--gtg-navy)] px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">
                  {passHint}
                </span>
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gtg-navy)]/14 opacity-0 transition group-hover:opacity-100" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/_gtg_new/Button-Pass.svg" alt={passHint} className="h-20 w-20" />
              </button>
              <button
                aria-label={superSwipeHint}
                onClick={() => void showNextService()}
                disabled={likeTransitionActive}
                className="group relative transition hover:scale-[1.02] hover:drop-shadow-[0_12px_24px_rgba(27,61,145,0.4)] active:scale-[0.98]"
              >
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[var(--gtg-navy)] px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">
                  {superSwipeHint}
                </span>
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-[var(--gtg-navy)]/14 opacity-0 transition group-hover:opacity-100" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/_gtg_new/Button-SuperSwipe.svg" alt={superSwipeHint} className="h-24 w-24" />
              </button>
              <button
                aria-label={likeHint}
                onClick={handleLikeClick}
                disabled={likeTransitionActive}
                className="group relative transition hover:scale-[1.02] hover:drop-shadow-[0_12px_24px_rgba(27,61,145,0.4)] active:scale-[0.98]"
              >
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[var(--gtg-navy)] px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100">
                  {likeHint}
                </span>
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gtg-navy)]/14 opacity-0 transition group-hover:opacity-100" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/_gtg_new/Button-Like.svg" alt={likeHint} className="h-20 w-20" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-neutral-500 xl:mt-12">
            <Flag className="h-3.5 w-3.5" />
            <span>{blockAndReport}</span>
          </div>
        </div>
      </div>

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              aria-label={lang === "tr" ? "Kapat" : "Close"}
              className="absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt={title}
              className="max-h-[85vh] w-full rounded-2xl bg-black object-contain"
            />
          </div>
        </div>
      ) : null}

      <GtgLoading isLoading={transitionLoading || serviceImagesLoading} />
    </div>
  );
}
