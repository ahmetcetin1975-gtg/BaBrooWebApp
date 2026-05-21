"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { api } from "@/lib/api/client";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { CUSTOMER_UPDATED_EVENT, type CustomerUpdatedDetail } from "@/lib/customer/events";

type MissionItem = {
  Nr?: number;
  GorevAdi?: string;
  GorevAciklamasi?: string;
  GorevAdres?: string;
  GorevResim?: string;
  GorevCoin?: number;
  Aktif?: boolean;
  GorevDone?: boolean;
};

type MissionsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: MissionItem[] | null;
};

const MISSIONS_TEXT: Record<
  Lang,
  {
    title: string;
    desc: string;
    loading: string;
    empty: string;
    takeCoin: string;
    done: string;
    loadError: string;
    completeError: string;
  }
> = {
  tr: {
    title: "Görevler",
    desc: "Görevleri tamamlayın ve coin kazanın.",
    loading: "Görevler yükleniyor...",
    empty: "Aktif görev bulunamadı.",
    takeCoin: "Coini Al",
    done: "Görev Tamamlandı",
    loadError: "Görevler yüklenemedi.",
    completeError: "Görev tamamlanamadı.",
  },
  en: {
    title: "Missions",
    desc: "Complete missions and earn coins.",
    loading: "Loading missions...",
    empty: "No active missions found.",
    takeCoin: "Take the Coin",
    done: "Mission Completed",
    loadError: "Failed to load missions.",
    completeError: "Failed to complete mission.",
  },
  ru: {
    title: "Задания",
    desc: "Выполняйте задания и зарабатывайте coin.",
    loading: "Задания загружаются...",
    empty: "Активные задания не найдены.",
    takeCoin: "Получить coin",
    done: "Задание выполнено",
    loadError: "Не удалось загрузить задания.",
    completeError: "Не удалось выполнить задание.",
  },
  es: {
    title: "Misiones",
    desc: "Completa misiones y gana coin.",
    loading: "Cargando misiones...",
    empty: "No se encontraron misiones activas.",
    takeCoin: "Tomar coin",
    done: "Misión completada",
    loadError: "No se pudieron cargar las misiones.",
    completeError: "No se pudo completar la misión.",
  },
  fr: {
    title: "Missions",
    desc: "Terminez des missions et gagnez des coin.",
    loading: "Chargement des missions...",
    empty: "Aucune mission active trouvée.",
    takeCoin: "Récupérer le coin",
    done: "Mission terminée",
    loadError: "Impossible de charger les missions.",
    completeError: "Impossible de terminer la mission.",
  },
};

function formatMissionHeadline(lang: Lang, coin: string, fallbackTitle: string): string {
  if (coin === "-") return fallbackTitle;
  switch (lang) {
    case "tr":
      return `${coin} Coin Kazan!`;
    case "ru":
      return `Бесплатно ${coin} Coin!`;
    case "es":
      return `${coin} Coin gratis!`;
    case "fr":
      return `${coin} Coin gratuit!`;
    case "en":
    default:
      return `Free ${coin} Coin!`;
  }
}

export default function MissionsPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [missionSubmittingNr, setMissionSubmittingNr] = useState<number | null>(null);
  const locale = localeForLang(lang);
  const text = useMemo(() => MISSIONS_TEXT[lang], [lang]);

  function formatMissionCoin(value: number | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return value.toLocaleString(locale, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  function getMissionHeadline(item: MissionItem, fallbackTitle: string): string {
    const coin = formatMissionCoin(item.GorevCoin);
    return formatMissionHeadline(lang, coin, fallbackTitle);
  }

  async function handleMissionComplete(item: MissionItem) {
    const gorevNr = item.Nr;
    if (!gorevNr || item.GorevDone || missionSubmittingNr === gorevNr) return;

    const missionUrl = (item.GorevAdres ?? "").trim();
    if (missionUrl) {
      window.open(missionUrl, "_blank", "noopener,noreferrer");
    }

    try {
      setMissionSubmittingNr(gorevNr);
      setError(null);
      await api.post(`/api/missions/done?gorevNr=${gorevNr}&kaynak=2&dil=${dil}`, {});
      setMissions((prev) =>
        prev.map((mission) => (mission.Nr === gorevNr ? { ...mission, GorevDone: true } : mission))
      );
      window.dispatchEvent(
        new CustomEvent<CustomerUpdatedDetail>(CUSTOMER_UPDATED_EVENT, { detail: {} })
      );
    } catch (err: any) {
      setError(String(err?.message ?? text.completeError));
    } finally {
      setMissionSubmittingNr(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<MissionsResponse>(`/api/missions?dil=${dil}`);
        if (cancelled) return;
        const items = Array.isArray(data?.Data) ? data.Data : [];
        setMissions(items.filter((item) => item?.Aktif !== false));
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? text.loadError));
        setMissions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, text.loadError]);

  return (
    <div className="min-h-screen">
      <TopBar
        lang={lang}
        titleLeft={<span className="ml-14 text-lg font-semibold text-neutral-900 lg:ml-0">{text.title}</span>}
        hideSearch
      />

      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-[1220px]">
          <p className="text-[15px] text-[#66738e]">{text.desc}</p>

          {loading ? <div className="mt-8 text-sm text-neutral-500">{text.loading}</div> : null}
          {!loading && error ? <div className="mt-8 text-sm text-red-600">{error}</div> : null}
          {!loading && !error && missions.length === 0 ? (
            <div className="mt-8 text-sm text-neutral-500">{text.empty}</div>
          ) : null}

          {!loading && !error && missions.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {missions.map((item, index) => {
                const gorevNr = item.Nr ?? index + 1;
                const missionTitle = (item.GorevAdi ?? "").trim() || `#${gorevNr}`;
                const missionDesc = (item.GorevAciklamasi ?? "").trim() || "-";
                const missionImg = (item.GorevResim ?? "").trim();
                const missionHeadline = getMissionHeadline(item, missionTitle);
                const isDone = Boolean(item.GorevDone);
                const isSubmitting = missionSubmittingNr === item.Nr;
                const buttonDisabled = isDone || isSubmitting;

                return (
                  <article
                    key={item.Nr ?? `${missionTitle}-${index}`}
                    className="flex min-h-[360px] flex-col rounded-[24px] border border-[#2d3036] bg-gradient-to-br from-[#2a2b31] to-[#1f2126] p-6"
                  >
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-[20px] bg-[#32353b] p-3">
                      {missionImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={missionImg} alt={missionTitle} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/80">
                          {missionTitle.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <h3 className="mt-6 text-[20px] font-semibold leading-[1.15] text-white">
                      {missionHeadline}
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.35] text-white/65">{missionDesc}</p>

                    <button
                      type="button"
                      disabled={buttonDisabled}
                      onClick={() => handleMissionComplete(item)}
                      className={`mt-auto w-full rounded-[18px] px-4 py-3 text-[18px] font-semibold transition ${
                        isDone
                          ? "cursor-not-allowed bg-[#a7a7ab] text-[#e4e4e5]"
                          : "bg-[var(--gtg-orange)] text-white hover:brightness-95"
                      } ${isSubmitting ? "opacity-70" : "opacity-100"}`}
                    >
                      {isDone ? text.done : text.takeCoin}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
