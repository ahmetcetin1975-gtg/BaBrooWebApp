"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BadgeCheck, Search, SendHorizontal, X } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { OfferFlowModal, type OfferModalMode } from "@/components/offers/OfferFlowModal";
import { CUSTOMER_UPDATED_EVENT, OPEN_COIN_PURCHASE_EVENT } from "@/lib/customer/events";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";

type GroupedMessageItem = {
  MusteriNr: number;
  ToplamMesaj: number;
  OkunmamisMesaj: number;
  SonMesajTarihi?: string;
  SonMesaj?: {
    MesajMetin?: string;
    MesajOkundu?: boolean;
    OlusturmaZamani?: string;
    Yon?: string;
  } | null;
  Musteri?: {
    MusteriAdi?: string;
    MusteriSoyadi?: string;
    MusteriTel?: string;
    MusteriEmail?: string;
    MusteriResimUrl?: string | null;
  } | null;
};

type GroupedMessagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Page?: number;
    PageSize?: number;
    Data?: GroupedMessageItem[];
  } | null;
};

type CustomerMessageItem = {
  Nr: number;
  MesajMetin?: string;
  MesajOkundu?: boolean;
  OlusturmaZamani?: string;
  MesajOkunduZamani?: string | null;
  Yon?: "Gelen" | "Giden" | string;
};

type CustomerMessagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    TotalCount?: number;
    Page?: number;
    PageSize?: number;
    Data?: CustomerMessageItem[];
  } | null;
};

type ApiActionResponse = {
  StatusCode?: number;
  Message?: string;
  message?: string;
  Error?: string;
  error?: string;
  raw?: string;
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

function formatDateTime(value: string | undefined, lang: Lang): string {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

function toTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

function isIncomingMessageDirection(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "gelen" || normalized === "incoming" || normalized === "входящее" || normalized === "entrante" || normalized === "entrant";
}

const CHAT_TEXT: Record<
  Lang,
  {
    listTitle: string;
    pageTitle: string;
    empty: string;
    loading: string;
    conversationEmpty: string;
    searchPlaceholder: string;
    composerPlaceholder: string;
    composerSubmit: string;
    actionPopupTitle: string;
    close: string;
    deleteMessage: string;
    report: string;
    reporting: string;
    deleting: string;
    loadChatListError: string;
    loadConversationError: string;
    feeLoadError: string;
    enterMessage: string;
    messageSent: string;
    messageSendError: string;
  }
> = {
  tr: {
    listTitle: "Mesajlar",
    pageTitle: "Sohbet",
    empty: "Mesaj bulunamadı.",
    loading: "Yükleniyor...",
    conversationEmpty: "Konuşma bulunamadı.",
    searchPlaceholder: "Ara...",
    composerPlaceholder: "Mesajınızı yazın...",
    composerSubmit: "Gönder",
    actionPopupTitle: "Mesaj İşlemleri",
    close: "Kapat",
    deleteMessage: "Mesajı Sil",
    report: "Rapor Et",
    reporting: "Raporlanıyor...",
    deleting: "Siliniyor...",
    loadChatListError: "Sohbet listesi yüklenemedi.",
    loadConversationError: "Konuşma yüklenemedi.",
    feeLoadError: "Coin ücreti yüklenemedi.",
    enterMessage: "Lütfen mesajınızı girin.",
    messageSent: "Mesaj gönderildi.",
    messageSendError: "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
  },
  en: {
    listTitle: "Messages",
    pageTitle: "Chat",
    empty: "No messages found.",
    loading: "Loading...",
    conversationEmpty: "No conversation found.",
    searchPlaceholder: "Search...",
    composerPlaceholder: "Type your message...",
    composerSubmit: "Send",
    actionPopupTitle: "Message Actions",
    close: "Close",
    deleteMessage: "Delete Message",
    report: "Report",
    reporting: "Reporting...",
    deleting: "Deleting...",
    loadChatListError: "Failed to load chat list.",
    loadConversationError: "Failed to load conversation.",
    feeLoadError: "The coin fee could not be loaded.",
    enterMessage: "Please enter your message.",
    messageSent: "Message sent.",
    messageSendError: "The message could not be sent. Please try again.",
  },
  ru: {
    listTitle: "Сообщения",
    pageTitle: "Чат",
    empty: "Сообщения не найдены.",
    loading: "Загрузка...",
    conversationEmpty: "Переписка не найдена.",
    searchPlaceholder: "Поиск...",
    composerPlaceholder: "Напишите сообщение...",
    composerSubmit: "Отправить",
    actionPopupTitle: "Действия с сообщением",
    close: "Закрыть",
    deleteMessage: "Удалить сообщение",
    report: "Пожаловаться",
    reporting: "Отправка жалобы...",
    deleting: "Удаление...",
    loadChatListError: "Не удалось загрузить список чатов.",
    loadConversationError: "Не удалось загрузить переписку.",
    feeLoadError: "Не удалось загрузить стоимость в coin.",
    enterMessage: "Введите сообщение.",
    messageSent: "Сообщение отправлено.",
    messageSendError: "Не удалось отправить сообщение. Попробуйте еще раз.",
  },
  es: {
    listTitle: "Mensajes",
    pageTitle: "Chat",
    empty: "No se encontraron mensajes.",
    loading: "Cargando...",
    conversationEmpty: "No se encontró conversación.",
    searchPlaceholder: "Buscar...",
    composerPlaceholder: "Escribe tu mensaje...",
    composerSubmit: "Enviar",
    actionPopupTitle: "Acciones del mensaje",
    close: "Cerrar",
    deleteMessage: "Eliminar mensaje",
    report: "Reportar",
    reporting: "Reportando...",
    deleting: "Eliminando...",
    loadChatListError: "No se pudo cargar la lista de chats.",
    loadConversationError: "No se pudo cargar la conversación.",
    feeLoadError: "No se pudo cargar el costo en coin.",
    enterMessage: "Ingresa tu mensaje.",
    messageSent: "Mensaje enviado.",
    messageSendError: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
  },
  fr: {
    listTitle: "Messages",
    pageTitle: "Chat",
    empty: "Aucun message trouvé.",
    loading: "Chargement...",
    conversationEmpty: "Aucune conversation trouvée.",
    searchPlaceholder: "Rechercher...",
    composerPlaceholder: "Écrivez votre message...",
    composerSubmit: "Envoyer",
    actionPopupTitle: "Actions du message",
    close: "Fermer",
    deleteMessage: "Supprimer le message",
    report: "Signaler",
    reporting: "Signalement...",
    deleting: "Suppression...",
    loadChatListError: "Impossible de charger la liste des chats.",
    loadConversationError: "Impossible de charger la conversation.",
    feeLoadError: "Impossible de charger le coût en coin.",
    enterMessage: "Veuillez saisir votre message.",
    messageSent: "Message envoyé.",
    messageSendError: "Impossible d'envoyer le message. Veuillez réessayer.",
  },
};

export default function ChatHomePage() {
  const params = useParams<{ lang?: string | string[] }>();
  const searchParams = useSearchParams();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const text = useMemo(() => CHAT_TEXT[lang], [lang]);
  const routeMessageFrom = toPositiveInt(searchParams.get("mesajFrom"));
  const routeMessageNr = toPositiveInt(searchParams.get("mesajNr"));
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<GroupedMessageItem[]>([]);
  const [activeCustomerNr, setActiveCustomerNr] = useState<number | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationItems, setConversationItems] = useState<CustomerMessageItem[]>([]);
  const [composerInput, setComposerInput] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessageItem | null>(null);
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const [messageActionError, setMessageActionError] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMode, setSendModalMode] = useState<OfferModalMode>("form");
  const [sendCoinFee, setSendCoinFee] = useState<number | null>(null);
  const [sendFeeLoading, setSendFeeLoading] = useState(false);
  const [sendMessageInput, setSendMessageInput] = useState("");
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [listReloadKey, setListReloadKey] = useState(0);
  const [conversationReloadKey, setConversationReloadKey] = useState(0);
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const qs = new URLSearchParams({
          dil: String(dil),
          search,
          page: "1",
          pageSize: "10",
        });

        const data = await api.get<GroupedMessagesResponse>(`/api/messages/grouped?${qs.toString()}`);
        if (cancelled) return;

        const nextItems = Array.isArray(data?.Data?.Data) ? data.Data.Data : [];
        setItems(nextItems);
        setActiveCustomerNr((prev) => {
          if (routeMessageFrom != null) return routeMessageFrom;
          if (prev != null && nextItems.some((it) => it.MusteriNr === prev)) return prev;
          return nextItems[0]?.MusteriNr ?? null;
        });
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? text.loadChatListError));
        setItems([]);
        setActiveCustomerNr(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, listReloadKey, routeMessageFrom, search, text.loadChatListError]);

  const activeItem = useMemo(() => {
    if (!items.length) {
      return activeCustomerNr != null ? ({ MusteriNr: activeCustomerNr } as GroupedMessageItem) : null;
    }

    return items.find((it) => it.MusteriNr === activeCustomerNr) ?? items[0];
  }, [activeCustomerNr, items]);

  useEffect(() => {
    if (routeMessageFrom == null) return;
    setActiveCustomerNr(routeMessageFrom);
  }, [routeMessageFrom]);

  useEffect(() => {
    if (activeCustomerNr == null) {
      setConversationItems([]);
      setConversationError(null);
      setConversationLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setConversationLoading(true);
        setConversationError(null);
        const allItems: CustomerMessageItem[] = [];
        let page = 1;
        let pageSize = 10;
        let totalCount = 0;
        const maxPages = 100;

        while (page <= maxPages) {
          const qs = new URLSearchParams({
            dil: String(dil),
            search,
            page: String(page),
            pageSize: String(pageSize),
            musteriid: String(activeCustomerNr),
          });

          const data = await api.get<CustomerMessagesResponse>(`/api/messages/by-customer?${qs.toString()}`);
          if (cancelled) return;

          const chunk = Array.isArray(data?.Data?.Data) ? data.Data.Data : [];
          const nextTotal = Number(data?.Data?.TotalCount ?? 0);
          const nextPageSize = Number(data?.Data?.PageSize ?? pageSize);

          if (Number.isFinite(nextTotal) && nextTotal >= 0) totalCount = nextTotal;
          if (Number.isFinite(nextPageSize) && nextPageSize > 0) pageSize = nextPageSize;

          allItems.push(...chunk);

          if (chunk.length === 0) break;
          if (totalCount > 0 && allItems.length >= totalCount) break;
          if (chunk.length < pageSize) break;

          page += 1;
        }

        const deduped = allItems.filter((msg, idx, arr) => arr.findIndex((it) => it.Nr === msg.Nr) === idx);
        const sortedConversation = [...deduped].sort((a, b) => {
          const timeDiff = toTimestamp(a.OlusturmaZamani) - toTimestamp(b.OlusturmaZamani);
          if (timeDiff !== 0) return timeDiff;
          return a.Nr - b.Nr;
        });
        setConversationItems(sortedConversation);
      } catch (err: any) {
        if (cancelled) return;
        setConversationError(String(err?.message ?? text.loadConversationError));
        setConversationItems([]);
      } finally {
        if (!cancelled) setConversationLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCustomerNr, conversationReloadKey, dil, search, text.loadConversationError]);

  useEffect(() => {
    if (conversationLoading) return;
    const container = conversationScrollRef.current;
    if (!container) return;

    const frame = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeCustomerNr, conversationItems, conversationLoading]);

  useEffect(() => {
    if (conversationLoading || routeMessageNr == null) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`chat-message-${routeMessageNr}`);
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [conversationItems, conversationLoading, routeMessageNr]);

  const listTitle = text.listTitle;
  const pageTitle = text.pageTitle;
  const emptyText = text.empty;
  const loadingText = text.loading;
  const conversationEmptyText = text.conversationEmpty;
  const composerPlaceholder = text.composerPlaceholder;
  const composerSubmitLabel = text.composerSubmit;
  const actionPopupTitle = text.actionPopupTitle;
  const actionPopupClose = text.close;
  const actionDelete = text.deleteMessage;
  const actionReport = text.report;

  const closeSendModal = () => {
    setSendModalOpen(false);
    setSendModalMode("form");
    setSendMessageError(null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
  };

  const openSendModal = async () => {
    if (activeCustomerNr == null) return;

    setSendModalOpen(true);
    setSendModalMode("form");
    setSendMessageError(null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    setSendFeeLoading(true);
    setSendMessageInput(composerInput.trim());

    try {
      const data = await api.get<CustomerMessageFeeResponse>(`/api/messages/customer-message-fee?dil=${dil}`);
      const nextFee =
        typeof data?.Data?.MesajUcreti === "number" && Number.isFinite(data.Data.MesajUcreti)
          ? data.Data.MesajUcreti
          : null;
      setSendCoinFee(nextFee);
    } catch (error) {
      setSendCoinFee(null);
      setSendMessageError(
        readErrorMessage(error, text.feeLoadError)
      );
    } finally {
      setSendFeeLoading(false);
    }
  };

  const submitCustomerMessage = async () => {
    if (activeCustomerNr == null) return;

    const trimmedMessage = sendMessageInput.trim();
    if (!trimmedMessage) {
      setSendMessageError(text.enterMessage);
      return;
    }

    setSendMessageLoading(true);
    setSendMessageError(null);

    try {
      const data = await api.post<CustomerMessageSendResponse>(`/api/messages/customer-message-send?kaynak=2&dil=${dil}`, {
        mesajMusteriNrTo: activeCustomerNr,
        mesajMetin: trimmedMessage,
      });

      setSendModalMode("success");
      setSendSuccessMessage(
        typeof data?.Message === "string" && data.Message.trim()
          ? data.Message
          : text.messageSent
      );
      setComposerInput("");
      setSendMessageInput("");
      setConversationReloadKey((prev) => prev + 1);
      setListReloadKey((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
    } catch (error) {
      if (isInsufficientBalanceError(error)) {
        setSendModalMode("insufficient");
      } else {
        setSendMessageError(
          readErrorMessage(
            error,
            text.messageSendError
          )
        );
      }
    } finally {
      setSendMessageLoading(false);
    }
  };

  const openCoinPurchase = () => {
    closeSendModal();
    window.dispatchEvent(new CustomEvent(OPEN_COIN_PURCHASE_EVENT));
  };

  const handleComposerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!composerInput.trim()) return;
    void openSendModal();
  };

  const handleMessageSelect = (message: CustomerMessageItem) => {
    setMessageActionError(null);
    setSelectedMessage(message);
  };

  const selectedMessageIncoming = isIncomingMessageDirection(selectedMessage?.Yon);
  const selectedMessageActionLabel = selectedMessageIncoming ? actionReport : actionDelete;
  const selectedMessageActionLoadingLabel = selectedMessageIncoming
    ? text.reporting
    : text.deleting;

  const handleSelectedMessageAction = async () => {
    if (!selectedMessage || messageActionLoading) return;

    const mesajNr = selectedMessage.Nr;
    if (!Number.isFinite(mesajNr) || mesajNr <= 0) return;

    try {
      setMessageActionLoading(true);
      setMessageActionError(null);

      if (selectedMessageIncoming) {
        const response = await api.post<ApiActionResponse>(`/api/messages/report?mesajNr=${mesajNr}&dil=${dil}&kaynak=2`, {});
        const maybeError = String(response?.Error ?? response?.error ?? "").trim();
        if (maybeError) {
          throw new Error(maybeError);
        }
      } else {
        const response = await api.post<ApiActionResponse>(`/api/messages/soft-delete?mesajNr=${mesajNr}&dil=${dil}&kaynak=2`, {});
        const maybeError = String(response?.Error ?? response?.error ?? "").trim();
        if (maybeError) {
          throw new Error(maybeError);
        }
        setConversationItems((prev) => prev.filter((item) => item.Nr !== mesajNr));
        setConversationReloadKey((prev) => prev + 1);
        setListReloadKey((prev) => prev + 1);
      }

      setSelectedMessage(null);
    } catch (err: any) {
      setMessageActionError(String(err?.message ?? (selectedMessageIncoming ? actionReport : actionDelete)));
    } finally {
      setMessageActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar
        lang={lang}
        titleLeft={<span className="ml-14 text-lg font-semibold text-neutral-900 lg:ml-0">{pageTitle}</span>}
        hideSearch
      />

      <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 bg-white xl:grid-cols-[360px_1fr]">
        <aside className="border-r border-gtg-border">
          <div className="border-b border-gtg-border px-5 py-4">
            <h2 className="text-lg font-semibold text-neutral-900">{listTitle}</h2>
          </div>
          <div className="border-b border-gtg-border px-5 py-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={text.searchPlaceholder}
                className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          <div className="space-y-1 p-3">
            {loading ? <div className="px-2 py-2 text-sm text-neutral-500">{loadingText}</div> : null}
            {!loading && error ? <div className="px-2 py-2 text-sm text-red-600">{error}</div> : null}
            {!loading && !error && items.length === 0 ? (
              <div className="px-2 py-2 text-sm text-neutral-500">{emptyText}</div>
            ) : null}

            {items.map((it) => {
              const person = it.Musteri ?? {};
              const fullName = `${person.MusteriAdi ?? ""} ${person.MusteriSoyadi ?? ""}`.trim() || `#${it.MusteriNr}`;
              const imageUrl = (person.MusteriResimUrl ?? "").trim();
              const preview = (it.SonMesaj?.MesajMetin ?? "").trim();
              const dateText = formatDateTime(it.SonMesajTarihi, lang);
              const unreadCount = Number(it.OkunmamisMesaj ?? 0);
              const selected = it.MusteriNr === (activeItem?.MusteriNr ?? null);
              const initial = (person.MusteriAdi ?? fullName).trim().charAt(0).toUpperCase() || "?";

              return (
                <button
                  key={it.MusteriNr}
                  type="button"
                  onClick={() => setActiveCustomerNr(it.MusteriNr)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    selected ? "bg-amber-50" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-neutral-300">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt={fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs font-semibold text-white">{initial}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="min-w-0 flex-1 truncate text-base font-semibold text-neutral-900">{fullName}</div>
                      {selected ? <BadgeCheck size={14} className="shrink-0 text-amber-500" /> : null}
                    </div>
                    <div className="truncate text-sm text-neutral-500">{preview || "-"}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-neutral-400">{dateText}</div>
                    {unreadCount > 0 ? (
                      <div className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
                        {unreadCount}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="border-r border-gtg-border p-5">
          {activeItem ? (
            <div className="space-y-6">
              <div className="border-b border-gtg-border pb-4">
                <div className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
                  <span className="truncate">
                    {`${activeItem.Musteri?.MusteriAdi ?? ""} ${activeItem.Musteri?.MusteriSoyadi ?? ""}`.trim() ||
                      `#${activeItem.MusteriNr}`}
                  </span>
                  <BadgeCheck size={16} className="shrink-0 text-amber-500" />
                </div>
              </div>

              <div className="space-y-4">
                <div
                  ref={conversationScrollRef}
                  className="h-[calc(100vh-330px)] overflow-x-hidden overflow-y-auto rounded-2xl bg-neutral-50 p-4"
                >
                {conversationLoading ? <div className="text-sm text-neutral-500">{loadingText}</div> : null}
                {!conversationLoading && conversationError ? (
                  <div className="text-sm text-red-600">{conversationError}</div>
                ) : null}
                {!conversationLoading && !conversationError && conversationItems.length === 0 ? (
                  <div className="text-sm text-neutral-500">{conversationEmptyText}</div>
                ) : null}

                <div className="min-w-0 space-y-3">
                  {conversationItems.map((message) => {
                    const incoming = isIncomingMessageDirection(message.Yon);

                    return (
                      <div
                        id={`chat-message-${message.Nr}`}
                        key={message.Nr}
                        className={`flex w-full min-w-0 overflow-hidden ${incoming ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleMessageSelect(message)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleMessageSelect(message);
                            }
                          }}
                          className={`min-w-0 max-w-[340px] overflow-hidden rounded-2xl px-4 py-2 text-sm sm:max-w-[400px] lg:max-w-[460px] ${
                            incoming ? "bg-white text-neutral-800" : "bg-amber-400 text-white"
                          } ${
                            routeMessageNr === message.Nr ? "ring-2 ring-[var(--gtg-orange)] ring-offset-2 ring-offset-neutral-50" : ""
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {message.MesajMetin ?? "-"}
                          </div>
                          <div
                            className={`mt-1 text-right text-[11px] ${
                              incoming ? "text-neutral-500" : "text-white/80"
                            }`}
                          >
                            {formatDateTime(message.OlusturmaZamani, lang)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <form
                className="flex w-full min-w-0 items-center gap-2 rounded-full border border-[#d9dde5] bg-[#eceff5] px-3 py-2 sm:px-4 sm:py-2.5"
                onSubmit={handleComposerSubmit}
              >
                <input
                  value={composerInput}
                  onChange={(event) => setComposerInput(event.target.value)}
                  placeholder={composerPlaceholder}
                  className="h-8 min-w-0 flex-1 bg-transparent text-base text-[#4f5c7a] outline-none placeholder:text-[#4f5c7a]/80"
                />
                <button
                  type="submit"
                  aria-label={composerSubmitLabel}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#7482a8] transition hover:bg-white/65"
                >
                  <SendHorizontal size={20} />
                </button>
              </form>
            </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">{emptyText}</div>
          )}
        </section>

      </div>

      {selectedMessage ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={actionPopupTitle}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-semibold text-neutral-900">{actionPopupTitle}</h2>
                <p className="mt-2 text-[14px] leading-6 text-neutral-500">
                  {selectedMessage.MesajMetin?.trim() || "-"}
                </p>
              </div>
              <button
                type="button"
                aria-label={actionPopupClose}
                onClick={() => setSelectedMessage(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-neutral-200 text-neutral-400 transition hover:bg-neutral-50 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-2xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                {actionPopupClose}
              </button>
              <button
                type="button"
                onClick={() => void handleSelectedMessageAction()}
                disabled={messageActionLoading}
                className="rounded-2xl bg-[var(--gtg-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {messageActionLoading ? selectedMessageActionLoadingLabel : selectedMessageActionLabel}
              </button>
            </div>
            {messageActionError ? (
              <p className="mt-4 text-right text-[13px] text-red-600">{messageActionError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

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
