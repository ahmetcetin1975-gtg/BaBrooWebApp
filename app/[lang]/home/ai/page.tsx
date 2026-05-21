"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bot,
  CircleEllipsis,
  Search,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { OfferFlowModal, type OfferModalMode } from "@/components/offers/OfferFlowModal";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import {
  CUSTOMER_UPDATED_EVENT,
  OPEN_COIN_PURCHASE_EVENT,
  type CustomerUpdatedDetail,
} from "@/lib/customer/events";

type ConversationItem = {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  unread: number;
  dateKey: string;
  dateLabel: string;
  dateSort: number;
};

type ConversationGroup = {
  key: string;
  label: string;
  items: ConversationItem[];
};

type AiMessageItem = {
  Nr?: number;
  AimesajMesajcointipNr?: number;
  AimesajMetin?: string;
  AimesajMetinAiCevap?: string;
  AimesajCoinTuketilen?: number;
  Aciklama?: string;
  OlusturmaZamani?: string;
  GuncellemeZamani?: string;
};

type AiMessagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    TotalCount?: number;
    Page?: number;
    PageSize?: number;
    Data?: AiMessageItem[] | null;
  } | null;
};

type AiSendResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    Nr?: number;
    KalanCoin?: number;
    AimesajMetinAiCevap?: string;
    aiCevap?: string;
  } | null;
};

type AiFeeResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: {
    MesajUcreti?: number;
  } | null;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const AI_TEXT: Record<
  Lang,
  {
    title: string;
    messages: string;
    totalCountLabel: string;
    search: string;
    loading: string;
    loadingMore: string;
    empty: string;
    upgrade: string;
    placeholder: string;
    today: string;
    yesterday: string;
    unknownDate: string;
    loadError: string;
    loadMoreError: string;
    feeLoadError: string;
    thinking: string;
    noReply: string;
    sendError: string;
    sendCouldNot: string;
    sent: string;
  }
> = {
  tr: {
    title: "Yapay Zeka Mesajları",
    messages: "Yapay Zeka Mesajları",
    totalCountLabel: "Toplam Kayıt Sayısı",
    search: "Ara...",
    loading: "Yükleniyor...",
    loadingMore: "Daha fazla yükleniyor...",
    empty: "Mesaj bulunamadı.",
    upgrade: "Pro Gemini AI BOT'a yükselt",
    placeholder: "Mesajınızı yazın...",
    today: "Bugün",
    yesterday: "Dün",
    unknownDate: "Tarih bilinmiyor",
    loadError: "AI mesajları yüklenemedi.",
    loadMoreError: "Daha fazla AI mesajı yüklenemedi.",
    feeLoadError: "Coin ücreti yüklenemedi.",
    thinking: "Gemini AI yanıtı hazırlanıyor...",
    noReply: "AI cevabı henüz alınamadı.",
    sendError: "Mesaj gönderimi başarısız.",
    sendCouldNot: "Mesaj gönderilemedi.",
    sent: "AI mesaj gönderildi.",
  },
  en: {
    title: "AI Messages",
    messages: "AI Messages",
    totalCountLabel: "Total Record Count",
    search: "Search...",
    loading: "Loading...",
    loadingMore: "Loading more...",
    empty: "No messages found.",
    upgrade: "Upgrade to Pro Gemini AI BOT",
    placeholder: "Type your message...",
    today: "Today",
    yesterday: "Yesterday",
    unknownDate: "Unknown date",
    loadError: "Failed to load AI messages.",
    loadMoreError: "Failed to load more AI messages.",
    feeLoadError: "The coin fee could not be loaded.",
    thinking: "Gemini AI response is being prepared...",
    noReply: "AI response has not been received yet.",
    sendError: "Failed to send message.",
    sendCouldNot: "Message could not be sent.",
    sent: "AI message sent.",
  },
  ru: {
    title: "Сообщения ИИ",
    messages: "Сообщения ИИ",
    totalCountLabel: "Общее количество записей",
    search: "Поиск...",
    loading: "Загрузка...",
    loadingMore: "Загружается еще...",
    empty: "Сообщения не найдены.",
    upgrade: "Перейти на Pro Gemini AI BOT",
    placeholder: "Напишите сообщение...",
    today: "Сегодня",
    yesterday: "Вчера",
    unknownDate: "Дата неизвестна",
    loadError: "Не удалось загрузить сообщения ИИ.",
    loadMoreError: "Не удалось загрузить дополнительные сообщения ИИ.",
    feeLoadError: "Не удалось загрузить стоимость в coin.",
    thinking: "Gemini AI готовит ответ...",
    noReply: "Ответ ИИ пока не получен.",
    sendError: "Не удалось отправить сообщение.",
    sendCouldNot: "Сообщение не удалось отправить.",
    sent: "Сообщение ИИ отправлено.",
  },
  es: {
    title: "Mensajes de IA",
    messages: "Mensajes de IA",
    totalCountLabel: "Cantidad total de registros",
    search: "Buscar...",
    loading: "Cargando...",
    loadingMore: "Cargando más...",
    empty: "No se encontraron mensajes.",
    upgrade: "Actualizar a Pro Gemini AI BOT",
    placeholder: "Escribe tu mensaje...",
    today: "Hoy",
    yesterday: "Ayer",
    unknownDate: "Fecha desconocida",
    loadError: "No se pudieron cargar los mensajes de IA.",
    loadMoreError: "No se pudieron cargar más mensajes de IA.",
    feeLoadError: "No se pudo cargar el costo en coin.",
    thinking: "Gemini AI está preparando la respuesta...",
    noReply: "La respuesta de IA aún no se ha recibido.",
    sendError: "No se pudo enviar el mensaje.",
    sendCouldNot: "El mensaje no se pudo enviar.",
    sent: "Mensaje de IA enviado.",
  },
  fr: {
    title: "Messages IA",
    messages: "Messages IA",
    totalCountLabel: "Nombre total d'enregistrements",
    search: "Rechercher...",
    loading: "Chargement...",
    loadingMore: "Chargement de plus...",
    empty: "Aucun message trouvé.",
    upgrade: "Passer à Pro Gemini AI BOT",
    placeholder: "Écrivez votre message...",
    today: "Aujourd'hui",
    yesterday: "Hier",
    unknownDate: "Date inconnue",
    loadError: "Impossible de charger les messages IA.",
    loadMoreError: "Impossible de charger plus de messages IA.",
    feeLoadError: "Impossible de charger le coût en coin.",
    thinking: "Gemini AI prépare la réponse...",
    noReply: "La réponse IA n'a pas encore été reçue.",
    sendError: "Échec de l'envoi du message.",
    sendCouldNot: "Le message n'a pas pu être envoyé.",
    sent: "Message IA envoyé.",
  },
};

function resolveBackendMessage(payload: any): string {
  const candidates = [payload?.Message, payload?.message, payload?.Error, payload?.error];
  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }
  return "";
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function getDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfDayMs(value: Date): number {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function formatConversationGroupLabel(value: Date, lang: Lang, labels: { today: string; yesterday: string }): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (dayDiff === 0) return labels.today;
  if (dayDiff === 1) return labels.yesterday;

  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatConversationTime(value: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mergeUniqueByNr(prev: AiMessageItem[], next: AiMessageItem[]): AiMessageItem[] {
  const result: AiMessageItem[] = [...prev];
  const seen = new Set<number>();

  for (const item of prev) {
    if (typeof item.Nr === "number" && Number.isFinite(item.Nr)) seen.add(item.Nr);
  }

  for (const item of next) {
    const nr = item.Nr;
    if (typeof nr !== "number" || !Number.isFinite(nr)) {
      result.push(item);
      continue;
    }
    if (seen.has(nr)) continue;
    seen.add(nr);
    result.push(item);
  }

  return result;
}

export default function AiPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);

  const text = useMemo(() => AI_TEXT[lang], [lang]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AiMessageItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [composerInput, setComposerInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [pendingConversationNr, setPendingConversationNr] = useState<number | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMode, setSendModalMode] = useState<OfferModalMode>("form");
  const [sendCoinFee, setSendCoinFee] = useState<number | null>(null);
  const [sendFeeLoading, setSendFeeLoading] = useState(false);
  const [sendMessageInput, setSendMessageInput] = useState("");
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const queryTokenRef = useRef(0);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const requestToken = queryTokenRef.current + 1;
    queryTokenRef.current = requestToken;

    (async () => {
      try {
        setLoading(true);
        setLoadingMore(false);
        setError(null);
        setItems([]);
        setPage(1);
        setPageSize(10);
        setTotalCount(0);

        const qs = new URLSearchParams({
          dil: String(dil),
          search,
          page: "1",
          pageSize: "10",
        });

        const data = await api.get<AiMessagesResponse>(`/api/ai-messages?${qs.toString()}`);
        if (cancelled || requestToken !== queryTokenRef.current) return;

        const nextItems = Array.isArray(data?.Data?.Data) ? data.Data.Data : [];
        const nextTotal = Number(data?.Data?.TotalCount ?? 0);
        const nextPageSize = Number(data?.Data?.PageSize ?? 10);

        setItems(nextItems);
        setTotalCount(Number.isFinite(nextTotal) && nextTotal >= 0 ? nextTotal : nextItems.length);
        setPageSize(Number.isFinite(nextPageSize) && nextPageSize > 0 ? nextPageSize : 10);
        setPage(1);
        setSelectedConversation((prev) => {
          if (prev != null && nextItems.some((it) => it.Nr === prev)) return prev;
          return nextItems[0]?.Nr ?? null;
        });
      } catch (err: any) {
        if (cancelled || requestToken !== queryTokenRef.current) return;
        setError(String(err?.message ?? text.loadError));
        setItems([]);
        setSelectedConversation(null);
      } finally {
        if (!cancelled && requestToken === queryTokenRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, search, reloadTick, text.loadError]);

  const hasMore = totalCount > 0 && items.length < totalCount;

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || error || !hasMore) return;

    const nextPage = page + 1;
    const requestToken = queryTokenRef.current;

    try {
      setLoadingMore(true);
      const qs = new URLSearchParams({
        dil: String(dil),
        search,
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      const data = await api.get<AiMessagesResponse>(`/api/ai-messages?${qs.toString()}`);
      if (requestToken !== queryTokenRef.current) return;

      const chunk = Array.isArray(data?.Data?.Data) ? data.Data.Data : [];
      const nextTotal = Number(data?.Data?.TotalCount ?? totalCount);
      const nextPageSize = Number(data?.Data?.PageSize ?? pageSize);

      setItems((prev) => mergeUniqueByNr(prev, chunk));
      setPage(nextPage);
      if (Number.isFinite(nextTotal) && nextTotal >= 0) setTotalCount(nextTotal);
      if (Number.isFinite(nextPageSize) && nextPageSize > 0) setPageSize(nextPageSize);
    } catch (err: any) {
      if (requestToken !== queryTokenRef.current) return;
      setError(String(err?.message ?? text.loadMoreError));
    } finally {
      if (requestToken === queryTokenRef.current) setLoadingMore(false);
    }
  }, [dil, error, hasMore, loading, loadingMore, page, pageSize, search, text.loadMoreError, totalCount]);

  useEffect(() => {
    const root = listContainerRef.current;
    const target = loadMoreRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      {
        root,
        rootMargin: "120px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  const conversations = useMemo<ConversationItem[]>(() => {
    return items.map((item) => {
      const id = item.Nr ?? 0;
      const subtitle = (item.AimesajMetin ?? "").trim() || "-";
      const conversationDate = parseDate(item.OlusturmaZamani) ?? parseDate(item.GuncellemeZamani);
      const dateKey = conversationDate ? getDateKey(conversationDate) : "unknown";
      const dateLabel = conversationDate
        ? formatConversationGroupLabel(conversationDate, lang, text)
        : text.unknownDate;
      const dateSort = conversationDate ? getStartOfDayMs(conversationDate) : Number.NEGATIVE_INFINITY;
      const time = conversationDate ? formatConversationTime(conversationDate, lang) : "";
      return { id, title: "AI Bot", subtitle, time, unread: 1, dateKey, dateLabel, dateSort };
    });
  }, [items, lang, text]);

  const conversationGroups = useMemo<ConversationGroup[]>(() => {
    const groupMap = new Map<string, ConversationGroup>();

    for (const item of conversations) {
      const existing = groupMap.get(item.dateKey);
      if (existing) {
        existing.items.push(item);
        continue;
      }

      groupMap.set(item.dateKey, {
        key: item.dateKey,
        label: item.dateLabel,
        items: [item],
      });
    }

    return Array.from(groupMap.values()).sort((a, b) => {
      const aSort = a.items[0]?.dateSort ?? Number.NEGATIVE_INFINITY;
      const bSort = b.items[0]?.dateSort ?? Number.NEGATIVE_INFINITY;
      return bSort - aSort;
    });
  }, [conversations]);

  const messages = useMemo<ChatMessage[]>(() => {
    const list: ChatMessage[] = [];
    const selectedItem =
      selectedConversation != null
        ? items.find((item) => item.Nr === selectedConversation) ?? null
        : null;

    if (selectedItem) {
      const nr = selectedItem.Nr ?? 0;
      const userText = (selectedItem.AimesajMetin ?? "").trim();
      const aiText = (selectedItem.AimesajMetinAiCevap ?? "").trim();
      if (userText) list.push({ id: `u-${nr}`, role: "user", text: userText });
      if (aiText) list.push({ id: `b-${nr}`, role: "bot", text: aiText });
    }

    if (
      pendingMessages.length > 0 &&
      ((pendingConversationNr == null && selectedConversation == null) ||
        pendingConversationNr === selectedConversation)
    ) {
      list.push(...pendingMessages);
    }

    return list;
  }, [items, pendingConversationNr, pendingMessages, selectedConversation]);

  const waitForAiReply = async (aiMesajNr: number): Promise<string | null> => {
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const qs = new URLSearchParams({
        dil: String(dil),
        search: "",
        page: "1",
        pageSize: "20",
      });
      const data = await api.get<AiMessagesResponse>(`/api/ai-messages?${qs.toString()}`);
      const list = Array.isArray(data?.Data?.Data) ? data.Data.Data : [];
      const target = list.find((item) => item.Nr === aiMesajNr);
      const aiCevap = (target?.AimesajMetinAiCevap ?? "").trim();
      if (aiCevap) return aiCevap;
      await delay(1200);
    }

    return null;
  };

  const closeSendModal = () => {
    setSendModalOpen(false);
    setSendModalMode("form");
    setSendMessageError(null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    window.dispatchEvent(new CustomEvent(CUSTOMER_UPDATED_EVENT));
  };

  const openSendModal = async () => {
    setSendModalOpen(true);
    setSendModalMode("form");
    setSendMessageError(null);
    setSendSuccessMessage(null);
    setSendMessageLoading(false);
    setSendFeeLoading(true);
    setSendMessageInput(composerInput.trim());

    try {
      const data = await api.get<AiFeeResponse>(`/api/ai-messages/fee?dil=${dil}`);
      const nextFee =
        typeof data?.Data?.MesajUcreti === "number" && Number.isFinite(data.Data.MesajUcreti)
          ? data.Data.MesajUcreti
          : null;
      setSendCoinFee(nextFee);
    } catch (error) {
      setSendCoinFee(null);
      setSendMessageError(resolveBackendMessage(error) || text.feeLoadError);
    } finally {
      setSendFeeLoading(false);
    }
  };

  const openCoinPurchase = () => {
    closeSendModal();
    window.dispatchEvent(new CustomEvent(OPEN_COIN_PURCHASE_EVENT));
  };

  const finalizeAiReply = async (
    aiMesajNr: number | null,
    pendingUserId: string,
    pendingBotId: string,
    initialReply: string,
    noReplyText: string
  ) => {
    let aiCevap = initialReply;

    try {
      if (!aiCevap && aiMesajNr != null) {
        aiCevap = (await waitForAiReply(aiMesajNr)) ?? "";
      }

      if (aiCevap && aiMesajNr != null) {
        setPendingMessages((prev) =>
          prev.map((message) =>
            message.id === pendingBotId ? { ...message, text: aiCevap } : message
          )
        );
        await api.post(`/api/ai-messages/update?dil=${dil}`, {
          aiMesajNr,
          aiCevap,
        });
      } else {
        setPendingMessages((prev) =>
          prev.map((message) =>
            message.id === pendingBotId ? { ...message, text: noReplyText } : message
          )
        );
      }
    } catch {
      setPendingMessages((prev) =>
        prev.map((message) =>
          message.id === pendingBotId ? { ...message, text: noReplyText } : message
        )
      );
    } finally {
      setReloadTick((prev) => prev + 1);
      setPendingMessages((prev) =>
        prev.filter((message) => message.id !== pendingUserId && message.id !== pendingBotId)
      );
      setPendingConversationNr(null);
    }
  };

  const submitAiMessage = async () => {
    const value = sendMessageInput.trim();
    if (!value) return;

    const pendingBase = Date.now();
    const pendingUserId = `p-u-${pendingBase}`;
    const pendingBotId = `p-b-${pendingBase}`;
    const thinkingText = text.thinking;
    const noReplyText = text.noReply;
    const sendErrorText = text.sendError;
    const currentConversationNr = selectedConversation;

    setPendingMessages((prev) => [
      ...prev,
      { id: pendingUserId, role: "user", text: value },
      { id: pendingBotId, role: "bot", text: thinkingText },
    ]);
    setPendingConversationNr(currentConversationNr);
    setSendMessageLoading(true);
    setSendMessageError(null);

    try {
      const sendResponse = await api.post<AiSendResponse>(
        `/api/ai-messages/send?kaynak=2&dil=${dil}`,
        { mesajMetin: value }
      );
      const sendStatusCode = Number(sendResponse?.StatusCode);
      if (sendStatusCode !== 201) {
        const backendMessage = resolveBackendMessage(sendResponse);
        const popupMessage = backendMessage || text.sendCouldNot;
        setPendingMessages((prev) =>
          prev.filter((message) => message.id !== pendingUserId && message.id !== pendingBotId)
        );
        setPendingConversationNr(null);
        if (/Yetersiz coin bakiyesi|Insufficient coin balance/i.test(popupMessage)) {
          setSendModalMode("insufficient");
        } else {
          setSendMessageError(popupMessage);
        }
        return;
      }

      const successMessage = resolveBackendMessage(sendResponse);
      setSendModalMode("success");
      setSendSuccessMessage(successMessage || text.sent);
      setComposerInput("");
      setSendMessageInput("");

      const aiMesajNrValue = Number(sendResponse?.Data?.Nr);
      const aiMesajNr =
        Number.isInteger(aiMesajNrValue) && aiMesajNrValue > 0 ? aiMesajNrValue : null;
      if (aiMesajNr != null) {
        setSelectedConversation(aiMesajNr);
        setPendingConversationNr(aiMesajNr);
      }
      const kalanCoinValue = Number(sendResponse?.Data?.KalanCoin);
      const kalanCoin =
        Number.isFinite(kalanCoinValue) && kalanCoinValue >= 0 ? kalanCoinValue : undefined;

      let aiCevap =
        (typeof sendResponse?.Data?.AimesajMetinAiCevap === "string"
          ? sendResponse.Data.AimesajMetinAiCevap
          : typeof sendResponse?.Data?.aiCevap === "string"
          ? sendResponse.Data.aiCevap
          : ""
        ).trim();

      if (!aiCevap && aiMesajNr != null) {
        aiCevap = (await waitForAiReply(aiMesajNr)) ?? "";
      }

      if (aiCevap && aiMesajNr != null) {
        setPendingMessages((prev) =>
          prev.map((message) =>
            message.id === pendingBotId ? { ...message, text: aiCevap } : message
          )
        );
        await api.post(`/api/ai-messages/update?dil=${dil}`, {
          aiMesajNr,
          aiCevap,
        });
      } else {
        setPendingMessages((prev) =>
          prev.map((message) =>
            message.id === pendingBotId ? { ...message, text: noReplyText } : message
          )
        );
      }

      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, {
          detail: kalanCoin != null ? { coin: kalanCoin } : {},
        })
      );
      setReloadTick((prev) => prev + 1);
      void finalizeAiReply(aiMesajNr, pendingUserId, pendingBotId, aiCevap, noReplyText);
    } catch (err: any) {
      setPendingMessages((prev) =>
        prev.filter((message) => message.id !== pendingUserId && message.id !== pendingBotId)
      );
      setPendingConversationNr(null);
      if (/Yetersiz coin bakiyesi|Insufficient coin balance/i.test(resolveBackendMessage(err))) {
        setSendModalMode("insufficient");
      } else {
        setSendMessageError(resolveBackendMessage(err) || sendErrorText);
      }
    } finally {
      setSendMessageLoading(false);
    }
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!composerInput.trim()) return;
    void openSendModal();
  };

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <header className="flex items-center border-b border-[#d8dde6] bg-[#f3f3f5] px-4 py-4 lg:px-7">
        <h1 className="ml-14 text-[24px] font-semibold text-[#1f232b] lg:ml-0">{text.title}</h1>
      </header>

      <div className="grid min-h-[calc(100vh-81px)] grid-cols-1 xl:grid-cols-[420px_1fr]">
        <aside className="flex max-h-[calc(100vh-81px)] flex-col border-r border-[#d8dde6] bg-[#f7f7f8]">
          <div className="px-5 py-4">
            <div className="mb-3 text-[13px] font-semibold text-[#4f5870]">
              {text.totalCountLabel}: {loading && totalCount === 0 ? "-" : totalCount}
            </div>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4f5870]"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={text.search}
                className="h-11 w-full rounded-xl border border-[#d2d7e0] bg-[#f7f7f8] px-4 pr-10 text-[16px] text-[#2e3441] outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold text-[#2f3442]">{text.messages}</h2>
              <CircleEllipsis size={20} className="text-[#2f3442]" />
            </div>
          </div>

          <div ref={listContainerRef} className="flex-1 overflow-y-auto pb-4">
            {loading ? <div className="px-5 py-4 text-[14px] text-[#66738e]">{text.loading}</div> : null}
            {!loading && error ? <div className="px-5 py-4 text-[14px] text-red-600">{error}</div> : null}
            {!loading && !error && conversations.length === 0 ? (
              <div className="px-5 py-4 text-[14px] text-[#66738e]">{text.empty}</div>
            ) : null}

            {conversationGroups.map((group) => (
              <div key={group.key}>
                <div className="px-5 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b95a7]">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const selected = selectedConversation === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedConversation(item.id)}
                      className={`flex w-full items-center gap-3 px-5 py-4 text-left transition ${
                        selected ? "bg-[#efe4ca]" : "hover:bg-[#eceff5]"
                      }`}
                    >
                      <div className="h-12 w-12 shrink-0 rounded-full bg-[#2b3243]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[18px] font-semibold leading-none text-[#1f232b]">
                            {item.title}
                          </p>
                          {selected ? <Sparkles size={16} className="shrink-0 text-[var(--gtg-orange)]" /> : null}
                        </div>
                        <p className="truncate text-[14px] text-[#2f3442]">{item.subtitle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[12px] text-[#8b95a7]">{item.time}</p>
                        <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-[var(--gtg-orange)] px-1 text-[12px] font-semibold text-[var(--gtg-orange)]">
                          {item.unread}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            {loadingMore ? (
              <div className="px-5 py-3 text-center text-[13px] text-[#66738e]">{text.loadingMore}</div>
            ) : null}
            <div ref={loadMoreRef} className="h-4" />
          </div>
        </aside>

        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_70%_80%,_#334e71_0%,_#223a5d_38%,_#122a4b_62%,_#09182f_100%)]">
          <div className="flex items-center justify-between border-b border-[#0f65cf] px-5 py-4">
            <div className="inline-flex items-center gap-2 text-[15px] text-white">
              <Bot size={18} className="text-[#c7ddff]" />
              <span>{text.upgrade}</span>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#95b7e7] text-[#cbe1ff]"
            >
              <CircleEllipsis size={20} />
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4 px-4 pb-40 pt-8">
            {!loading && !error && messages.length === 0 ? (
              <div className="self-center rounded-2xl bg-black/40 px-5 py-3 text-[16px] text-white/80">
                {text.empty}
              </div>
            ) : null}
            {!loading &&
              !error &&
              messages.map((item) => (
                <div
                  key={item.id}
                  className={`w-full max-w-[760px] rounded-2xl px-5 py-3 text-center text-[16px] leading-[1.4] ${
                    item.role === "user"
                      ? "self-center bg-[#0f65cf] text-[#d6e8ff]"
                      : "self-center bg-black/75 text-[#eceff6]"
                  }`}
                >
                  {item.text}
                </div>
              ))}
          </div>

          <div className="absolute bottom-4 left-4 right-4 xl:left-5 xl:right-5">
            <form
              onSubmit={handleSendMessage}
              className="flex w-full min-w-0 items-center gap-2 rounded-full border border-[#d2d7e0] bg-[#eceff5] px-3 py-2 sm:px-4 sm:py-2.5"
            >
              <input
                value={composerInput}
                onChange={(event) => setComposerInput(event.target.value)}
                placeholder={text.placeholder}
                className="h-8 min-w-0 flex-1 bg-transparent text-[16px] text-[#4f5c7a] outline-none placeholder:text-[#4f5c7a]/85"
              />
              <button
                type="submit"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#7482a8] transition hover:bg-white/65"
              >
                <SendHorizontal size={18} />
              </button>
            </form>
          </div>
        </section>
      </div>

      <OfferFlowModal
        open={sendModalOpen}
        lang={lang}
        kind="ai"
        mode={sendModalMode}
        coinFee={sendCoinFee}
        loadingFee={sendFeeLoading}
        message={sendMessageInput}
        sending={sendMessageLoading}
        error={sendMessageError}
        successMessage={sendSuccessMessage}
        onMessageChange={setSendMessageInput}
        onClose={closeSendModal}
        onSubmit={() => void submitAiMessage()}
        onOpenTopUp={openCoinPurchase}
      />
    </div>
  );
}

