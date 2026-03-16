"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, Paperclip, Search, SendHorizontal, Smile } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { normalizeLang } from "@/lib/i18n/languages";
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
  Urun?: {
    UrunAdi?: string;
    Aciklama?: string;
    Etiketler?: string;
    UrunResimUrl?: string | null;
  } | null;
  Hizmet?: {
    Kategori?: string;
    Uzmanlik?: string;
    Aciklama?: string;
    Belge?: string;
    HizmetTecrubeYil?: number;
    Egitim?: string;
    HizmetResimUrl?: string | null;
  } | null;
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

function formatDateTime(value: string | undefined, lang: "tr" | "en"): string {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export default function ChatHomePage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = lang === "tr" ? 1 : 2;
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
          if (prev != null && nextItems.some((it) => it.MusteriNr === prev)) return prev;
          return nextItems[0]?.MusteriNr ?? null;
        });
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? "Failed to load chat list"));
        setItems([]);
        setActiveCustomerNr(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, search]);

  const activeItem = useMemo(() => {
    if (!items.length) return null;
    return items.find((it) => it.MusteriNr === activeCustomerNr) ?? items[0];
  }, [activeCustomerNr, items]);

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
            search: "",
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
        setConversationItems(deduped);
      } catch (err: any) {
        if (cancelled) return;
        setConversationError(String(err?.message ?? "Failed to load conversation"));
        setConversationItems([]);
      } finally {
        if (!cancelled) setConversationLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCustomerNr, dil]);

  const listTitle = lang === "tr" ? "Mesajlar" : "Messages";
  const emptyText = lang === "tr" ? "Mesaj bulunamadı." : "No messages found.";
  const loadingText = lang === "tr" ? "Yükleniyor..." : "Loading...";
  const rightTitle = lang === "tr" ? "Kişi Bilgisi" : "Person Information";
  const conversationEmptyText = lang === "tr" ? "Konuşma bulunamadı." : "No conversation found.";

  const composerPlaceholder = lang === "tr" ? "Mesajınızı yazın..." : "Type your message...";
  const composerSubmitLabel = lang === "tr" ? "Gönder" : "Send";
  const composerAttachLabel = lang === "tr" ? "Dosya ekle" : "Attach file";
  const composerEmojiLabel = lang === "tr" ? "Emoji seç" : "Pick emoji";

  const handleComposerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!composerInput.trim()) return;
    setComposerInput("");
  };

  return (
    <div className="min-h-screen">
      <TopBar
        lang={lang}
        titleLeft={<span className="ml-14 text-lg font-semibold text-neutral-900 lg:ml-0">{listTitle}</span>}
        hideSearch
      />

      <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 bg-white xl:grid-cols-[360px_1fr_320px]">
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
                placeholder={lang === "tr" ? "Ara..." : "Search..."}
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
                <div className="h-[calc(100vh-330px)] overflow-y-auto rounded-2xl bg-neutral-50 p-4">
                {conversationLoading ? <div className="text-sm text-neutral-500">{loadingText}</div> : null}
                {!conversationLoading && conversationError ? (
                  <div className="text-sm text-red-600">{conversationError}</div>
                ) : null}
                {!conversationLoading && !conversationError && conversationItems.length === 0 ? (
                  <div className="text-sm text-neutral-500">{conversationEmptyText}</div>
                ) : null}

                <div className="space-y-3">
                  {conversationItems.map((message) => {
                    const incoming = message.Yon === "Gelen";
                    const urunCard = message.Urun
                      ? {
                          key: "urun",
                          titlePrefix: lang === "tr" ? "Ürün" : "Product",
                          title: message.Urun.UrunAdi ?? "",
                          description: message.Urun.Aciklama ?? "",
                          tags: message.Urun.Etiketler ?? "",
                          imageUrl: (message.Urun.UrunResimUrl ?? "").trim(),
                        }
                      : null;
                    const hizmetCard = message.Hizmet
                      ? {
                          key: "hizmet",
                          titlePrefix: lang === "tr" ? "Hizmet" : "Service",
                          title: `${message.Hizmet.Kategori ?? ""} ${message.Hizmet.Uzmanlik ? `- ${message.Hizmet.Uzmanlik}` : ""}`.trim(),
                          description: message.Hizmet.Aciklama ?? "",
                          tags: [
                            message.Hizmet.Belge ? `Belge: ${message.Hizmet.Belge}` : "",
                            message.Hizmet.Egitim ? `Eğitim: ${message.Hizmet.Egitim}` : "",
                            typeof message.Hizmet.HizmetTecrubeYil === "number"
                              ? `Tecrübe: ${message.Hizmet.HizmetTecrubeYil} yıl`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" | "),
                          imageUrl: (message.Hizmet.HizmetResimUrl ?? "").trim(),
                        }
                      : null;
                    const cards = [urunCard, hizmetCard].filter(Boolean) as Array<{
                      key: string;
                      titlePrefix: string;
                      title: string;
                      description: string;
                      tags: string;
                      imageUrl: string;
                    }>;

                    return (
                      <div
                        key={message.Nr}
                        className={`flex w-full ${incoming ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                            incoming ? "bg-white text-neutral-800" : "bg-amber-400 text-white"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{message.MesajMetin ?? "-"}</div>
                          {cards.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {cards.map((card) => (
                                <div key={`${message.Nr}-${card.key}`} className="rounded-xl bg-white/95 p-2 text-neutral-900">
                                  <div className="flex gap-2">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                                      {card.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={card.imageUrl} alt={card.title || card.titlePrefix} className="h-full w-full object-cover" />
                                      ) : null}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate text-xs font-semibold text-neutral-500">{card.titlePrefix}</div>
                                      <div className="truncate text-sm font-semibold">{card.title || "-"}</div>
                                      <div className="truncate text-xs text-neutral-600">{card.description || "-"}</div>
                                      <div className="truncate text-[11px] text-neutral-500">{card.tags || "-"}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
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
                className="flex items-center gap-2 rounded-full border border-[#d9dde5] bg-[#eceff5] px-4 py-2.5"
                onSubmit={handleComposerSubmit}
              >
                <input
                  value={composerInput}
                  onChange={(event) => setComposerInput(event.target.value)}
                  placeholder={composerPlaceholder}
                  className="h-8 flex-1 bg-transparent text-base text-[#4f5c7a] outline-none placeholder:text-[#4f5c7a]/80"
                />
                <button
                  type="button"
                  aria-label={composerEmojiLabel}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#7482a8] transition hover:bg-white/65"
                >
                  <Smile size={20} />
                </button>
                <button
                  type="button"
                  aria-label={composerAttachLabel}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#7482a8] transition hover:bg-white/65"
                >
                  <Paperclip size={20} />
                </button>
                <span className="h-7 w-px bg-[#cbd2e2]" />
                <button
                  type="submit"
                  aria-label={composerSubmitLabel}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#7482a8] transition hover:bg-white/65"
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

        <aside className="p-5">
          <div className="text-xl font-semibold text-neutral-900">{rightTitle}</div>
          {activeItem ? (
            <div className="mt-6 space-y-4">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-neutral-300">
                {activeItem.Musteri?.MusteriResimUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeItem.Musteri.MusteriResimUrl}
                    alt={`${activeItem.Musteri?.MusteriAdi ?? ""} ${activeItem.Musteri?.MusteriSoyadi ?? ""}`.trim()}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="text-center text-lg font-semibold text-neutral-900">
                {`${activeItem.Musteri?.MusteriAdi ?? ""} ${activeItem.Musteri?.MusteriSoyadi ?? ""}`.trim() ||
                  `#${activeItem.MusteriNr}`}
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-neutral-500">{emptyText}</div>
          )}
        </aside>
      </div>
    </div>
  );
}
