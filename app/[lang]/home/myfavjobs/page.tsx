"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPin,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { api } from "@/lib/api/client";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";
import { getMessages } from "@/lib/i18n/messages";

const PAGE_SIZE = 9;

type ApiResponse<T> = {
  StatusCode?: number;
  statusCode?: number;
  Message?: string;
  message?: string;
  Data?: T | null;
  data?: T | null;
  TotalCount?: number;
  totalCount?: number;
  Total?: number;
  total?: number;
  Pagination?: {
    Total?: number;
    total?: number;
  } | null;
  pagination?: {
    Total?: number;
    total?: number;
  } | null;
};

type JobFeature = {
  SecenekAdi?: string | null;
  GrupSecenekAdi?: string | null;
  IlanozEhAcik?: string | null;
};

type FavoriteJobItem = {
  FavoriNr?: number;
  IlanNr?: number;
  MusteriResimUrl?: string | null;
  MusteriUlkeAdi?: string | null;
  MusteriIlAdi?: string | null;
  HizmetGrupAdi?: string | null;
  CalismaSekilAdi?: string | null;
  IsTanimi?: string | null;
  Aciklama?: string | null;
  Aktif?: boolean | null;
  FavoriOlusturmaZamani?: string | null;
  Ozellikler?: JobFeature[] | null;
};

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readItems<T>(response?: ApiResponse<T[]>): T[] {
  const data = response?.Data ?? response?.data;
  return Array.isArray(data) ? data : [];
}

function readTotalCount(response: ApiResponse<unknown> | undefined, fallback: number): number {
  const topLevel = response?.TotalCount ?? response?.totalCount ?? response?.Total ?? response?.total;
  const paged =
    response?.Pagination?.Total ??
    response?.Pagination?.total ??
    response?.pagination?.Total ??
    response?.pagination?.total;

  const next = Number(topLevel ?? paged ?? fallback);
  return Number.isFinite(next) && next >= 0 ? next : fallback;
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return fallback;
}

function formatDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function itemLocation(item: FavoriteJobItem): string {
  const country = (item.MusteriUlkeAdi ?? "").trim();
  const city = (item.MusteriIlAdi ?? "").trim();
  return [country, city].filter(Boolean).join(" / ");
}

function featureLines(item: FavoriteJobItem): string[] {
  const list = Array.isArray(item.Ozellikler) ? item.Ozellikler : [];
  return list
    .map((feature) => {
      const group = (feature.GrupSecenekAdi ?? "").trim();
      const name = (feature.SecenekAdi ?? "").trim();
      const extra = (feature.IlanozEhAcik ?? "").trim();
      if (group && name) return `${group}: ${name}`;
      return name || extra || group;
    })
    .filter(Boolean);
}

export default function MyFavoriteJobsPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const t = getMessages(lang);

  const text = useMemo(() => {
    if (lang === "tr") {
      return {
        title: "Fovori İlanlarım",
        subtitle: "Favoriye aldığın ilanları buradan yönetebilirsin.",
        loading: "Favori ilanlar yükleniyor...",
        loadError: "Favori ilanlar yüklenemedi.",
        empty: "Favori ilan bulunamadı.",
        remove: "Favoriden Kaldır",
        removing: "Kaldırılıyor...",
        removeError: "Favori ilan kaldırılamadı.",
        search: "İlan ara",
        serviceGroup: "Hizmet Grubu",
        workType: "Çalışma Şekli",
        location: "Konum",
        date: "Favoriye Eklenme",
        features: "Özellikler",
        active: "Aktif",
        inactive: "Pasif",
        prev: "Önceki",
        next: "Sonraki",
        confirmTitle: "Favoriden kaldır",
        confirmBody: "Bu ilanı favorilerinden kaldırmak istediğine emin misin?",
        confirmApprove: "Evet, Kaldır",
        confirmCancel: "Vazgeç",
      };
    }

    if (lang === "ru") {
      return {
        title: t.sidebar.items.favJobs,
        subtitle: "Управляйте объявлениями, добавленными в избранное.",
        loading: "Загрузка избранных объявлений...",
        loadError: "Не удалось загрузить избранные объявления.",
        empty: "Избранные объявления не найдены.",
        remove: "Удалить из избранного",
        removing: "Удаление...",
        removeError: "Не удалось удалить объявление из избранного.",
        search: "Поиск объявлений",
        serviceGroup: "Группа услуг",
        workType: "Тип работы",
        location: "Местоположение",
        date: "Добавлено в избранное",
        features: "Особенности",
        active: "Активно",
        inactive: "Неактивно",
        prev: "Назад",
        next: "Вперёд",
        confirmTitle: "Удалить из избранного",
        confirmBody: "Вы уверены, что хотите удалить это объявление из избранного?",
        confirmApprove: "Да, удалить",
        confirmCancel: "Отмена",
      };
    }

    if (lang === "es") {
      return {
        title: t.sidebar.items.favJobs,
        subtitle: "Gestiona los anuncios que marcaste como favoritos.",
        loading: "Cargando anuncios favoritos...",
        loadError: "No se pudieron cargar los anuncios favoritos.",
        empty: "No se encontraron anuncios favoritos.",
        remove: "Quitar de favoritos",
        removing: "Quitando...",
        removeError: "No se pudo quitar el anuncio de favoritos.",
        search: "Buscar anuncios",
        serviceGroup: "Grupo de servicio",
        workType: "Tipo de trabajo",
        location: "Ubicación",
        date: "Agregado a favoritos",
        features: "Características",
        active: "Activo",
        inactive: "Inactivo",
        prev: "Anterior",
        next: "Siguiente",
        confirmTitle: "Quitar de favoritos",
        confirmBody: "¿Seguro que quieres quitar este anuncio de favoritos?",
        confirmApprove: "Sí, quitar",
        confirmCancel: "Cancelar",
      };
    }

    if (lang === "fr") {
      return {
        title: t.sidebar.items.favJobs,
        subtitle: "Gérez les annonces que vous avez ajoutées aux favoris.",
        loading: "Chargement des annonces favorites...",
        loadError: "Impossible de charger les annonces favorites.",
        empty: "Aucune annonce favorite trouvée.",
        remove: "Retirer des favoris",
        removing: "Suppression...",
        removeError: "Impossible de retirer l'annonce des favoris.",
        search: "Rechercher des annonces",
        serviceGroup: "Groupe de service",
        workType: "Type de travail",
        location: "Lieu",
        date: "Ajouté aux favoris",
        features: "Caractéristiques",
        active: "Actif",
        inactive: "Inactif",
        prev: "Précédent",
        next: "Suivant",
        confirmTitle: "Retirer des favoris",
        confirmBody: "Voulez-vous vraiment retirer cette annonce des favoris ?",
        confirmApprove: "Oui, retirer",
        confirmCancel: "Annuler",
      };
    }

    return {
      title: t.sidebar.items.favJobs,
      subtitle: "Manage the job listings you have marked as favorite.",
      loading: "Loading favorite jobs...",
      loadError: "Failed to load favorite jobs.",
      empty: "No favorite jobs found.",
      remove: "Remove from Favorites",
      removing: "Removing...",
      removeError: "Failed to remove favorite job.",
      search: "Search listings",
      serviceGroup: "Service Group",
      workType: "Work Type",
      location: "Location",
      date: "Favorited At",
      features: "Features",
      active: "Active",
      inactive: "Inactive",
      prev: "Previous",
      next: "Next",
      confirmTitle: "Remove from favorites",
      confirmBody: "Are you sure you want to remove this listing from favorites?",
      confirmApprove: "Yes, Remove",
      confirmCancel: "Cancel",
    };
  }, [lang, t.sidebar.items.favJobs]);

  const [items, setItems] = useState<FavoriteJobItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [removeLoadingId, setRemoveLoadingId] = useState<number | null>(null);
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<FavoriteJobItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams({
          dil: String(dil),
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (search) qs.set("search", search);

        const response = await api.get<ApiResponse<FavoriteJobItem[]>>(`/api/jobs/favorites?${qs.toString()}`);
        if (cancelled) return;

        const nextItems = readItems(response);
        setItems(nextItems);
        setTotalCount(readTotalCount(response, nextItems.length));
      } catch (loadErr) {
        if (cancelled) return;
        setItems([]);
        setTotalCount(0);
        setError(readErrorMessage(loadErr, text.loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [dil, page, search, text.loadError]);

  async function removeFavorite(item: FavoriteJobItem) {
    const ilanNr = toPositiveInt(item.IlanNr);
    if (ilanNr == null || removeLoadingId != null) return;

    setRemoveLoadingId(ilanNr);
    try {
      await api.post(`/api/jobs/remove-favorite?ilanNr=${ilanNr}&kaynak=2&dil=${dil}`, {});
      setItems((prev) => prev.filter((it) => toPositiveInt(it.IlanNr) !== ilanNr));
      setTotalCount((prev) => Math.max(prev - 1, 0));
    } catch (removeErr) {
      setError(readErrorMessage(removeErr, text.removeError));
    } finally {
      setRemoveLoadingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <TopBar
        lang={lang}
        titleLeft={
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#98a2b3]">{t.sidebar.items.home}</div>
            <h1 className="text-2xl font-black text-[#18212f]">{text.title}</h1>
            <p className="mt-1 text-sm text-[#667085]">{text.subtitle}</p>
          </div>
        }
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center gap-2 rounded-3xl bg-white text-[#667085] shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            {text.loading}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl bg-white text-center shadow-sm">
            <BriefcaseBusiness className="h-10 w-10 text-[#faa500]" />
            <p className="mt-3 text-sm font-semibold text-[#667085]">{text.empty}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => {
              const ilanNr = toPositiveInt(item.IlanNr);
              const title = (item.IsTanimi ?? "").trim() || "-";
              const serviceGroup = (item.HizmetGrupAdi ?? "").trim() || "-";
              const workType = (item.CalismaSekilAdi ?? "").trim() || "-";
              const description = (item.Aciklama ?? "").trim() || "-";
              const imageUrl = (item.MusteriResimUrl ?? "").trim();
              const active = item.Aktif !== false;
              const removing = removeLoadingId != null && ilanNr === removeLoadingId;
              const features = featureLines(item);

              return (
                <article
                  key={`${ilanNr ?? "job"}-${index}`}
                  className="overflow-hidden rounded-[26px] border border-[#e5e7eb] bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between p-5">
                    <div>
                      <h2 className="text-lg font-black text-[#111827]">{title}</h2>
                      <p className="mt-1 text-sm text-[#6b7280]">{serviceGroup}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveItem(item)}
                      disabled={removing || ilanNr == null}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-xs font-bold text-[#b91c1c] transition hover:bg-[#ffe4e6] disabled:opacity-60"
                    >
                      {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      {removing ? text.removing : text.remove}
                    </button>
                  </div>

                  <div className="px-5 pb-5">
                    <div className="mb-4 flex items-center gap-4">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={title} className="h-16 w-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#f3f4f6] text-[#6b7280]">
                          <Star className="h-6 w-6 text-[#faa500]" />
                        </div>
                      )}
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          active ? "bg-[#ecfdf3] text-[#047857]" : "bg-[#f3f4f6] text-[#6b7280]"
                        }`}
                      >
                        {active ? text.active : text.inactive}
                      </span>
                    </div>

                    <p className="line-clamp-3 text-sm leading-6 text-[#4b5563]">{description}</p>

                    <div className="mt-4 space-y-2 text-xs font-semibold text-[#6b7280]">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-3.5 w-3.5 text-[#9ca3af]" />
                        {text.serviceGroup}: {serviceGroup}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#9ca3af]" />
                        {text.location}: {itemLocation(item) || "-"}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-[#9ca3af]" />
                        {text.date}: {formatDate(item.FavoriOlusturmaZamani, lang)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-[#9ca3af]" />
                        {text.workType}: {workType}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-bold uppercase text-[#98a2b3]">{text.features}</div>
                      {features.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {features.slice(0, 8).map((feature, featureIndex) => (
                            <span
                              key={`${ilanNr ?? index}-${featureIndex}`}
                              className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-bold text-[#475467]"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-[#98a2b3]">-</div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => canPrev && setPage((prev) => prev - 1)}
              disabled={!canPrev}
              className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold text-[#475467] disabled:opacity-50"
            >
              {text.prev}
            </button>
            <span className="px-3 text-sm font-bold text-[#344054]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => canNext && setPage((prev) => prev + 1)}
              disabled={!canNext}
              className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold text-[#475467] disabled:opacity-50"
            >
              {text.next}
            </button>
          </div>
        ) : null}
      </main>

      {confirmRemoveItem ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-black text-[#111827]">{text.confirmTitle}</h3>
              <button
                type="button"
                onClick={() => setConfirmRemoveItem(null)}
                className="rounded-lg p-1 text-[#667085] transition hover:bg-[#f2f4f7]"
                aria-label={text.confirmCancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#475467]">{text.confirmBody}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveItem(null)}
                className="rounded-xl border border-[#e4e7ec] px-4 py-2 text-sm font-bold text-[#344054]"
              >
                {text.confirmCancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  void removeFavorite(confirmRemoveItem);
                  setConfirmRemoveItem(null);
                }}
                className="rounded-xl bg-[#b42318] px-4 py-2 text-sm font-bold text-white"
              >
                {text.confirmApprove}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
