"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { NOTIFICATIONS_UPDATED_EVENT, type NotificationsUpdatedDetail } from "@/lib/notifications/events";
import { setSelectedProductNrCookie } from "@/lib/products/selection";
import { setSelectedServiceNrCookie } from "@/lib/services/selection";

type NotificationsModalProps = {
  lang: string;
  open: boolean;
  onClose: () => void;
};

type NotificationItem = {
  Nr: number;
  BildirimBaslik?: string | null;
  BildirimMesaj?: string | null;
  BildirimMesajTipi?: string | null;
  BildirimMusteriNrFrom?: number | null;
  BildirimRefNr?: number | null;
  BildirimOkundu?: boolean | null;
  BildirimOkunduZamani?: string | null;
  OlusturmaZamani?: string | null;
  Aciklama?: string | null;
};

type NotificationListPayload = {
  TotalCount?: number;
  Page?: number;
  PageSize?: number;
  Data?: NotificationItem[];
};

type NotificationListResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: NotificationListPayload | null;
};

type NotificationUnreadCountResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    UnreadCount?: number;
  } | null;
};

const PAGE_SIZE = 10;

const NOTIFICATION_COPY: Record<Lang, {
  title: string;
  subtitle: string;
  total: string;
  empty: string;
  loading: string;
  loadingMore: string;
  error: string;
  retry: string;
  read: string;
  unread: string;
  close: string;
  unknownDate: string;
  types: Record<string, string>;
}> = {
  tr: {
    title: "Bildirimler",
    subtitle: "Son bildirimlerinizi buradan takip edin.",
    total: "Toplam",
    empty: "Bildirim bulunamadı.",
    loading: "Bildirimler yükleniyor...",
    loadingMore: "Daha fazla bildirim yükleniyor...",
    error: "Bildirimler yüklenemedi.",
    retry: "Tekrar Dene",
    read: "Okundu",
    unread: "Okunmadı",
    close: "Kapat",
    unknownDate: "Tarih bilinmiyor",
    types: {
      task: "Görev",
      serviceapproval: "Hizmet Onayı",
      productapproval: "Ürün Onayı",
      offertoservice: "Hizmet Teklifi",
      offertoproduct: "Ürün Teklifi",
      message: "Mesaj",
      home: "Ana Sayfa",
    },
  },
  en: {
    title: "Notifications",
    subtitle: "Track your latest notifications here.",
    total: "Total",
    empty: "No notifications found.",
    loading: "Loading notifications...",
    loadingMore: "Loading more notifications...",
    error: "Failed to load notifications.",
    retry: "Retry",
    read: "Read",
    unread: "Unread",
    close: "Close",
    unknownDate: "Unknown date",
    types: {
      task: "Task",
      serviceapproval: "Service Approval",
      productapproval: "Product Approval",
      offertoservice: "Service Offer",
      offertoproduct: "Product Offer",
      message: "Message",
      home: "Home",
    },
  },
  ru: {
    title: "Уведомления",
    subtitle: "Следите за последними уведомлениями здесь.",
    total: "Всего",
    empty: "Уведомления не найдены.",
    loading: "Уведомления загружаются...",
    loadingMore: "Загружаются дополнительные уведомления...",
    error: "Не удалось загрузить уведомления.",
    retry: "Повторить",
    read: "Прочитано",
    unread: "Не прочитано",
    close: "Закрыть",
    unknownDate: "Дата неизвестна",
    types: {
      task: "Задача",
      serviceapproval: "Подтверждение услуги",
      productapproval: "Подтверждение товара",
      offertoservice: "Предложение услуги",
      offertoproduct: "Предложение товара",
      message: "Сообщение",
      home: "Главная",
    },
  },
  es: {
    title: "Notificaciones",
    subtitle: "Sigue aquí tus notificaciones recientes.",
    total: "Total",
    empty: "No se encontraron notificaciones.",
    loading: "Cargando notificaciones...",
    loadingMore: "Cargando más notificaciones...",
    error: "No se pudieron cargar las notificaciones.",
    retry: "Reintentar",
    read: "Leída",
    unread: "No leída",
    close: "Cerrar",
    unknownDate: "Fecha desconocida",
    types: {
      task: "Tarea",
      serviceapproval: "Aprobación de servicio",
      productapproval: "Aprobación de producto",
      offertoservice: "Oferta de servicio",
      offertoproduct: "Oferta de producto",
      message: "Mensaje",
      home: "Inicio",
    },
  },
  fr: {
    title: "Notifications",
    subtitle: "Suivez vos dernières notifications ici.",
    total: "Total",
    empty: "Aucune notification trouvée.",
    loading: "Chargement des notifications...",
    loadingMore: "Chargement d'autres notifications...",
    error: "Impossible de charger les notifications.",
    retry: "Réessayer",
    read: "Lue",
    unread: "Non lue",
    close: "Fermer",
    unknownDate: "Date inconnue",
    types: {
      task: "Mission",
      serviceapproval: "Validation du service",
      productapproval: "Validation du produit",
      offertoservice: "Offre de service",
      offertoproduct: "Offre de produit",
      message: "Message",
      home: "Accueil",
    },
  },
};

type NotificationDestination = {
  href: string;
  productNr?: number | null;
  serviceNr?: number | null;
};

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function resolveNotificationDestination(item: NotificationItem, lang: string): NotificationDestination {
  const type = String(item.BildirimMesajTipi ?? "").trim().toLowerCase();
  const refNr = toPositiveInt(item.BildirimRefNr);
  const messageFrom = toPositiveInt(item.BildirimMusteriNrFrom);

  switch (type) {
    case "serviceapproval":
      return {
        href: `/${lang}/home/servicedetail`,
        serviceNr: refNr,
      };
    case "productapproval":
      return {
        href: `/${lang}/home/productdetail`,
        productNr: refNr,
      };
    case "message":
    case "offertoservice":
    case "offertoproduct": {
      const query = new URLSearchParams();
      if (messageFrom != null) query.set("mesajFrom", String(messageFrom));
      if (refNr != null) query.set("mesajNr", String(refNr));
      const queryString = query.toString();

      return {
        href: `/${lang}/home/chat${queryString ? `?${queryString}` : ""}`,
      };
    }
    case "home":
      return { href: `/${lang}/home/products` };
    case "task":
      return { href: `/${lang}/home/missions` };
    default:
      return { href: `/${lang}/home/products` };
  }
}

function getTypeColorClasses(type: string) {
  switch (type.trim().toLowerCase()) {
    case "task":
      return { title: "text-red-600", accent: "bg-red-500" };
    case "serviceapproval":
      return { title: "text-green-600", accent: "bg-green-500" };
    case "productapproval":
      return { title: "text-[#006400]", accent: "bg-[#006400]" };
    case "offertoservice":
      return { title: "text-orange-500", accent: "bg-orange-500" };
    case "offertoproduct":
      return { title: "text-[#FF8C00]", accent: "bg-[#FF8C00]" };
    case "message":
      return { title: "text-blue-600", accent: "bg-blue-500" };
    case "home":
    default:
      return { title: "text-neutral-900", accent: "bg-neutral-900" };
  }
}

function formatNotificationTime(timeRaw: string | null | undefined, lang: Lang, fallback: string) {
  if (!timeRaw) return fallback;
  const parsed = new Date(timeRaw);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getNotificationTypeLabel(type: string, lang: Lang): string {
  const normalized = type.trim().toLowerCase();
  return NOTIFICATION_COPY[lang].types[normalized] ?? type;
}

function mergeNotifications(prev: NotificationItem[], next: NotificationItem[]) {
  const seen = new Set<number>();
  const merged = [...prev, ...next].filter((item) => {
    if (!item || typeof item.Nr !== "number") return false;
    if (seen.has(item.Nr)) return false;
    seen.add(item.Nr);
    return true;
  });
  return merged;
}

export function NotificationsModal({ lang, open, onClose }: NotificationsModalProps) {
  const router = useRouter();
  const currentLang = normalizeLang(lang);
  const dil = langToDil(currentLang);
  const text = useMemo(() => NOTIFICATION_COPY[currentLang], [currentLang]);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialUnreadIds, setInitialUnreadIds] = useState<number[]>([]);
  const [markingIds, setMarkingIds] = useState<number[]>([]);

  const hasMore = items.length < totalCount;

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await api.get<NotificationUnreadCountResponse>(`/api/notifications/unread-count?dil=${dil}`);
      const unreadCount =
        typeof data?.Data?.UnreadCount === "number" && Number.isFinite(data.Data.UnreadCount)
          ? Math.max(0, data.Data.UnreadCount)
          : 0;

      window.dispatchEvent(
        new CustomEvent<NotificationsUpdatedDetail>(NOTIFICATIONS_UPDATED_EVENT, {
          detail: { unreadCount },
        })
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent<NotificationsUpdatedDetail>(NOTIFICATIONS_UPDATED_EVENT, {
          detail: {},
        })
      );
    }
  }, [dil]);

  const fetchNotificationsPage = useCallback(async (nextPage: number) => {
    const data = await api.get<NotificationListResponse>(
      `/api/notifications/list?dil=${dil}&page=${nextPage}&pageSize=${PAGE_SIZE}`
    );
    const payload = data?.Data;
    const nextItems = Array.isArray(payload?.Data) ? payload.Data : [];
    const nextTotalCount =
      typeof payload?.TotalCount === "number" && Number.isFinite(payload.TotalCount)
        ? payload.TotalCount
        : 0;

    return { nextItems, nextTotalCount };
  }, [dil]);

  const loadNotifications = useCallback(
    async (nextPage: number, reset: boolean) => {
      try {
        if (reset) {
          setLoadingInitial(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const { nextItems, nextTotalCount } = await fetchNotificationsPage(nextPage);
        const unreadIds = nextItems
          .filter((item) => item?.BildirimOkundu === false && typeof item?.Nr === "number")
          .map((item) => item.Nr);

        setPage(nextPage);
        setTotalCount(nextTotalCount);
        setItems((prev) => (reset ? nextItems : mergeNotifications(prev, nextItems)));
        setInitialUnreadIds((prev) => (reset ? unreadIds : Array.from(new Set([...prev, ...unreadIds]))));
      } catch (err: any) {
        setError(String(err?.message ?? text.error));
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [fetchNotificationsPage, text.error]
  );

  useEffect(() => {
    if (!open) return;

    setItems([]);
    setPage(1);
    setTotalCount(0);
    setError(null);
    setInitialUnreadIds([]);
    setMarkingIds([]);
    void loadNotifications(1, true);
  }, [loadNotifications, open]);

  const handleNotificationClick = useCallback(
    async (item: NotificationItem) => {
      const destination = resolveNotificationDestination(item, currentLang);
      const notificationNr = typeof item?.Nr === "number" ? item.Nr : 0;
      const shouldMarkRead =
        notificationNr > 0 && item.BildirimOkundu !== true && !markingIds.includes(notificationNr);

      if (shouldMarkRead) {
        setMarkingIds((prev) => [...prev, notificationNr]);

        try {
          await api.post(`/api/notifications/mark-read?bildirimNr=${notificationNr}&dil=${dil}&kaynak=2`, {});

          setItems((prev) =>
            prev.map((entry) =>
              entry.Nr === notificationNr
                ? {
                    ...entry,
                    BildirimOkundu: true,
                    BildirimOkunduZamani: entry.BildirimOkunduZamani ?? new Date().toISOString(),
                  }
                : entry
            )
          );
          setInitialUnreadIds((prev) => prev.filter((nr) => nr !== notificationNr));
          await refreshUnreadCount();
        } catch {
          // Keep the row unread when mark-read fails.
        } finally {
          setMarkingIds((prev) => prev.filter((nr) => nr !== notificationNr));
        }
      }

      if (destination.serviceNr != null) setSelectedServiceNrCookie(destination.serviceNr);
      if (destination.productNr != null) setSelectedProductNrCookie(destination.productNr);

      onClose();
      router.push(destination.href);
    },
    [currentLang, dil, markingIds, onClose, refreshUnreadCount, router]
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="gtg-modal-viewport fixed inset-0 z-[120] bg-black/45" onClick={onClose}>
      <div className="flex min-h-full items-start justify-center px-4 py-4 sm:items-center sm:py-6 lg:justify-start lg:pl-[316px] xl:pl-[344px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={text.title}
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[780px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:rounded-[30px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-5 sm:px-7 sm:py-7">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-[var(--gtg-orange)] sm:h-12 sm:w-12">
                  <Bell size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 sm:text-[28px]">
                      {text.title}
                    </h2>
                    <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[12px] font-semibold text-[var(--gtg-orange)]">
                      {text.total}: {totalCount}
                    </div>
                  </div>
                  <p className="text-[14px] text-neutral-500">{text.subtitle}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={text.close}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-neutral-200 text-neutral-400 transition hover:bg-neutral-50 hover:text-neutral-700 sm:h-11 sm:w-11"
            >
              <X size={24} />
            </button>
          </div>

          <div
            onScroll={(event) => {
              if (loadingInitial || loadingMore || !hasMore) return;
              const target = event.currentTarget;
              const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
              if (remaining > 120) return;
              void loadNotifications(page + 1, false);
            }}
            className="min-h-0 flex-1 overflow-y-auto px-0 [scrollbar-color:var(--gtg-orange)_rgba(163,163,163,0.55)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-300/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--gtg-orange)]"
          >
            {loadingInitial ? (
              <div className="flex min-h-[280px] items-center justify-center gap-3 text-neutral-500">
                <Loader2 size={20} className="animate-spin" />
                <span>{text.loading}</span>
              </div>
            ) : error ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadNotifications(1, true)}
                  className="rounded-xl border border-[var(--gtg-orange)] px-4 py-2 text-sm font-semibold text-[var(--gtg-orange)] transition hover:bg-amber-50"
                >
                  {text.retry}
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-sm text-neutral-500">
                {text.empty}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {items.map((item) => {
                  const title = item.BildirimBaslik ?? "";
                  const body = item.BildirimMesaj ?? "";
                  const type = item.BildirimMesajTipi ?? "";
                  const timeRaw = item.OlusturmaZamani ?? "";
                  const colors = getTypeColorClasses(type);
                  const typeLabel = getNotificationTypeLabel(type, currentLang);
                  const wasUnreadOnOpen = initialUnreadIds.includes(item.Nr);
                  const isRead = item.BildirimOkundu === true;
                  const isMarking = markingIds.includes(item.Nr);

                  return (
                    <div
                      key={item.Nr}
                      onClick={() => void handleNotificationClick(item)}
                      className={`flex cursor-pointer gap-4 px-5 py-4 transition sm:px-7 sm:py-5 ${
                        wasUnreadOnOpen ? "bg-amber-50/70 hover:bg-amber-50" : "bg-white hover:bg-neutral-50"
                      } ${
                        isMarking ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex shrink-0 items-start pt-1.5">
                        <div className={`mt-1 h-12 w-1 rounded-full ${colors.accent}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className={`text-[17px] font-semibold [overflow-wrap:anywhere] ${colors.title}`}>
                              {title || "-"}
                            </h3>
                            <p className="mt-1 text-[14px] leading-6 text-neutral-600 [overflow-wrap:anywhere]">
                              {body || "-"}
                            </p>
                          </div>
                          <div className="shrink-0 pt-1 text-[11px] text-neutral-400">
                            {isMarking ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              formatNotificationTime(timeRaw, currentLang, text.unknownDate)
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                          {type ? <span className="rounded-full bg-neutral-100 px-2.5 py-1">{typeLabel}</span> : null}
                          {item.Aciklama ? <span>{item.Aciklama}</span> : null}
                          <span
                            className={`rounded-full px-2.5 py-1 font-medium ${
                              isRead ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isRead ? text.read : text.unread}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {loadingMore ? (
              <div className="flex items-center justify-center gap-3 px-6 py-4 text-sm text-neutral-500">
                <Loader2 size={18} className="animate-spin" />
                <span>{text.loadingMore}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
