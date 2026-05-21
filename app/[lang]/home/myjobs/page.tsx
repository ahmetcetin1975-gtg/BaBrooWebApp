"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { TopBar } from "@/components/layout/TopBar";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/i18n/languages";

const EDIT_JOB_TITLE_MAX = 2000;

type ApiResponse<T> = {
  StatusCode?: number;
  statusCode?: number;
  Message?: string;
  Data?: T | null;
  data?: T | null;
  message?: string;
  error?: string;
  raw?: string;
};

type JobItem = {
  Nr?: number;
  HizmetGrupId?: number | null;
  HizmetGrupAdi?: string | null;
  CalismaSekilId?: number | null;
  CalismaSekilAdi?: string | null;
  IsTanimi?: string | null;
  Aktif?: boolean | null;
  OlusturmaZamani?: string | null;
};

type GenericItem = Record<string, unknown>;
type FeatureRecordItem = {
  Nr?: number;
  nr?: number;
  SecenekId?: number;
  secenekId?: number;
};

function normalizeJobs(data?: ApiResponse<JobItem[]>): JobItem[] {
  const items = data?.Data ?? data?.data;
  if (!Array.isArray(items)) return [];
  return items.filter((item) => typeof item?.Nr === "number");
}

function normalizeItems(data?: ApiResponse<GenericItem[]>): GenericItem[] {
  const items = data?.Data ?? data?.data;
  return Array.isArray(items) ? items : [];
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readApiMessage(payload: ApiResponse<unknown> | null | undefined, fallback: string): string {
  return String(payload?.Message ?? payload?.message ?? payload?.error ?? payload?.raw ?? fallback);
}

function readStatusCode(payload: ApiResponse<unknown> | null | undefined): number | undefined {
  if (typeof payload?.StatusCode === "number") return payload.StatusCode;
  if (typeof payload?.statusCode === "number") return payload.statusCode;
  return undefined;
}

function isSuccessfulResponse(payload: ApiResponse<unknown> | null | undefined): boolean {
  const statusCode = readStatusCode(payload);
  return statusCode == null || statusCode === 200 || statusCode === 201;
}

function resolveItemId(item: GenericItem): number | null {
  return toPositiveInt(item.Id) ?? toPositiveInt(item.id) ?? toPositiveInt(item.Nr) ?? toPositiveInt(item.nr);
}

function formatJobDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function resolveServiceGroupLabel(item: GenericItem, lang: Lang): string {
  const candidates = [
    item.HizmetGrupAdi,
    lang === "en" ? item.HgAdiEn : null,
    lang === "tr" ? item.HgAdiTr : null,
    item.HgAdi,
    lang === "en" ? item.AdiEn : null,
    lang === "tr" ? item.AdiTr : null,
    item.Adi,
  ];
  return String(candidates.find((value) => typeof value === "string" && value.trim()) ?? "-").trim();
}

function resolveWorkTypeLabel(item: GenericItem, lang: Lang): string {
  const candidates = [
    lang === "en" ? item.CalismaSekliAdiEn : null,
    lang === "en" ? item.CalismaSekilAdiEn : null,
    lang === "en" ? item.CalismasekilAdiEn : null,
    lang === "tr" ? item.CalismasekilAdiTr : null,
    item.CalismaSekliAdi,
    item.CalismaSekilAdi,
    lang === "en" ? item.AdiEn : null,
    lang === "tr" ? item.AdiTr : null,
    item.Adi,
  ];
  return String(candidates.find((value) => typeof value === "string" && value.trim()) ?? "-").trim();
}

function resolveFeatureGroupLabel(item: GenericItem, lang: Lang): string {
  const candidates = [
    lang === "en" ? item.GrupSecenekAdiEn : null,
    lang === "en" ? item.GrupsecenekAdiEn : null,
    lang === "tr" ? item.GrupsecenekAdiTr : null,
    item.GrupSecenekAdi,
    lang === "en" ? item.AdiEn : null,
    lang === "tr" ? item.AdiTr : null,
    item.Adi,
  ];
  return String(candidates.find((value) => typeof value === "string" && value.trim()) ?? "-").trim();
}

function resolveFeatureOptionLabel(item: GenericItem, lang: Lang): string {
  const candidates = [
    lang === "en" ? item.SecenekAdiEn : null,
    lang === "tr" ? item.SecenekAdiTr : null,
    item.SecenekAdi,
    lang === "en" ? item.AdiEn : null,
    lang === "tr" ? item.AdiTr : null,
    item.Adi,
  ];
  return String(candidates.find((value) => typeof value === "string" && value.trim()) ?? "-").trim();
}

const MY_JOBS_TEXT: Record<
  Lang,
  {
    pageTitle: string;
    heading: string;
    subtitle: string;
    addNew: string;
    edit: string;
    delete: string;
    cancel: string;
    next: string;
    back: string;
    save: string;
    loading: string;
    loadError: string;
    empty: string;
    createdAt: string;
    active: string;
    inactive: string;
    editTitle: string;
    editStepOneTitle: string;
    editStepTwoTitle: string;
    serviceGroup: string;
    workType: string;
    jobTitle: string;
    saveError: string;
    deleteError: string;
    saveSuccess: string;
    deleteSuccess: string;
    confirmDelete: string;
    confirmDeleteTitle: string;
    confirmDeleteApprove: string;
    close: string;
  }
> = {
  tr: {
    pageTitle: "İlanlarım",
    heading: "Eklediğim ilanlar",
    subtitle: "Buradan ilanlarını düzenleyebilir, silebilir veya yeni ilan verebilirsin.",
    addNew: "Yeni İlan Ver",
    edit: "Düzenle",
    delete: "Sil",
    cancel: "Vazgeç",
    next: "İleri",
    back: "Geri",
    save: "Kaydet",
    loading: "İlanlar yükleniyor...",
    loadError: "İlanlar yüklenemedi.",
    empty: "Henüz eklediğin bir ilan görünmüyor.",
    createdAt: "Yayın Tarihi",
    active: "Aktif",
    inactive: "Pasif",
    editTitle: "İlanı Düzenle",
    editStepOneTitle: "Temel Bilgiler",
    editStepTwoTitle: "İlan Özellikleri",
    serviceGroup: "Hizmet Grubu",
    workType: "Çalışma Şekli",
    jobTitle: "İş Tanımı",
    saveError: "İlan güncellenemedi.",
    deleteError: "İlan silinemedi.",
    saveSuccess: "İlan güncellendi.",
    deleteSuccess: "İlan silindi.",
    confirmDelete: "Bu ilanı silmek istediğine emin misin?",
    confirmDeleteTitle: "İlanı sil",
    confirmDeleteApprove: "Evet, Sil",
    close: "Kapat",
  },
  en: {
    pageTitle: "My Jobs",
    heading: "My job posts",
    subtitle: "Manage your listings here, edit them, delete them, or create a new one.",
    addNew: "Post a New Job",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    next: "Next",
    back: "Back",
    save: "Save",
    loading: "Loading job posts...",
    loadError: "Failed to load job posts.",
    empty: "You have not added any job post yet.",
    createdAt: "Published",
    active: "Active",
    inactive: "Inactive",
    editTitle: "Edit Job Post",
    editStepOneTitle: "Main Details",
    editStepTwoTitle: "Job Features",
    serviceGroup: "Service Group",
    workType: "Work Type",
    jobTitle: "Job Title",
    saveError: "Failed to update the job post.",
    deleteError: "Failed to delete the job post.",
    saveSuccess: "Job post updated.",
    deleteSuccess: "Job post deleted.",
    confirmDelete: "Are you sure you want to delete this job post?",
    confirmDeleteTitle: "Delete job post",
    confirmDeleteApprove: "Yes, Delete",
    close: "Close",
  },
  ru: {
    pageTitle: "Мои вакансии",
    heading: "Мои объявления",
    subtitle: "Здесь можно редактировать, удалять объявления или создать новое.",
    addNew: "Разместить новую вакансию",
    edit: "Редактировать",
    delete: "Удалить",
    cancel: "Отмена",
    next: "Далее",
    back: "Назад",
    save: "Сохранить",
    loading: "Объявления загружаются...",
    loadError: "Не удалось загрузить объявления.",
    empty: "Вы пока не добавили ни одного объявления.",
    createdAt: "Опубликовано",
    active: "Активно",
    inactive: "Неактивно",
    editTitle: "Редактировать объявление",
    editStepOneTitle: "Основные данные",
    editStepTwoTitle: "Характеристики объявления",
    serviceGroup: "Группа услуг",
    workType: "Тип работы",
    jobTitle: "Описание работы",
    saveError: "Не удалось обновить объявление.",
    deleteError: "Не удалось удалить объявление.",
    saveSuccess: "Объявление обновлено.",
    deleteSuccess: "Объявление удалено.",
    confirmDelete: "Вы уверены, что хотите удалить это объявление?",
    confirmDeleteTitle: "Удалить объявление",
    confirmDeleteApprove: "Да, удалить",
    close: "Закрыть",
  },
  es: {
    pageTitle: "Mis empleos",
    heading: "Mis publicaciones",
    subtitle: "Administra tus anuncios aquí, edítalos, elimínalos o crea uno nuevo.",
    addNew: "Publicar nuevo empleo",
    edit: "Editar",
    delete: "Eliminar",
    cancel: "Cancelar",
    next: "Siguiente",
    back: "Atrás",
    save: "Guardar",
    loading: "Cargando publicaciones...",
    loadError: "No se pudieron cargar las publicaciones.",
    empty: "Aún no has agregado ninguna publicación.",
    createdAt: "Publicado",
    active: "Activo",
    inactive: "Inactivo",
    editTitle: "Editar publicación",
    editStepOneTitle: "Datos principales",
    editStepTwoTitle: "Características del anuncio",
    serviceGroup: "Grupo de servicio",
    workType: "Tipo de trabajo",
    jobTitle: "Descripción del trabajo",
    saveError: "No se pudo actualizar la publicación.",
    deleteError: "No se pudo eliminar la publicación.",
    saveSuccess: "Publicación actualizada.",
    deleteSuccess: "Publicación eliminada.",
    confirmDelete: "¿Seguro que quieres eliminar esta publicación?",
    confirmDeleteTitle: "Eliminar publicación",
    confirmDeleteApprove: "Sí, eliminar",
    close: "Cerrar",
  },
  fr: {
    pageTitle: "Mes emplois",
    heading: "Mes annonces",
    subtitle: "Gérez vos annonces ici, modifiez-les, supprimez-les ou créez-en une nouvelle.",
    addNew: "Publier une nouvelle annonce",
    edit: "Modifier",
    delete: "Supprimer",
    cancel: "Annuler",
    next: "Suivant",
    back: "Retour",
    save: "Enregistrer",
    loading: "Chargement des annonces...",
    loadError: "Impossible de charger les annonces.",
    empty: "Vous n'avez encore ajouté aucune annonce.",
    createdAt: "Publié",
    active: "Actif",
    inactive: "Inactif",
    editTitle: "Modifier l'annonce",
    editStepOneTitle: "Informations principales",
    editStepTwoTitle: "Caractéristiques de l'annonce",
    serviceGroup: "Groupe de service",
    workType: "Type de travail",
    jobTitle: "Description du poste",
    saveError: "Impossible de mettre à jour l'annonce.",
    deleteError: "Impossible de supprimer l'annonce.",
    saveSuccess: "Annonce mise à jour.",
    deleteSuccess: "Annonce supprimée.",
    confirmDelete: "Voulez-vous vraiment supprimer cette annonce ?",
    confirmDeleteTitle: "Supprimer l'annonce",
    confirmDeleteApprove: "Oui, supprimer",
    close: "Fermer",
  },
};

export default function MyJobsPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const rawLang = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);

  const text = useMemo(() => MY_JOBS_TEXT[lang], [lang]);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [serviceGroups, setServiceGroups] = useState<GenericItem[]>([]);
  const [workTypes, setWorkTypes] = useState<GenericItem[]>([]);
  const [featureGroups, setFeatureGroups] = useState<GenericItem[]>([]);
  const [featureOptionsByGroup, setFeatureOptionsByGroup] = useState<Record<number, GenericItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [editStep, setEditStep] = useState<1 | 2>(1);
  const [savingJob, setSavingJob] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<JobItem | null>(null);
  const [editingFeatureRecords, setEditingFeatureRecords] = useState<FeatureRecordItem[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);
  const [initialSelectedFeatureIds, setInitialSelectedFeatureIds] = useState<number[]>([]);
  const [form, setForm] = useState({
    hizmetGrupId: "",
    calismaSekilId: "",
    isTanimi: "",
    aktif: true,
  });
  const canGoNext =
    form.hizmetGrupId.trim().length > 0 &&
    form.calismaSekilId.trim().length > 0 &&
    form.isTanimi.trim().length > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [jobsRes, serviceGroupRes, workTypesRes, featureGroupsRes] = await Promise.all([
          api.get<ApiResponse<JobItem[]>>(`/api/ilan/getall?dil=${dil}`),
          api.get<ApiResponse<GenericItem[]>>(`/api/customer/hizmet-gruplari?dil=${dil}`),
          api.get<ApiResponse<GenericItem[]>>(`/api/work-experiences/work-types?dil=${dil}`),
          api.get<ApiResponse<GenericItem[]>>(`/api/customer-features/groups?dil=${dil}`),
        ]);

        const nextFeatureGroups = normalizeItems(featureGroupsRes);
        const nextOptionsEntries = await Promise.all(
          nextFeatureGroups.map(async (group) => {
            const groupId = resolveItemId(group);
            if (groupId == null) return [0, []] as const;
            const optionsRes = await api.get<ApiResponse<GenericItem[]>>(
              `/api/customer-features/options?dil=${dil}&grupSecenekId=${groupId}`
            );
            return [groupId, normalizeItems(optionsRes)] as const;
          })
        );

        if (cancelled) return;
        setJobs(normalizeJobs(jobsRes));
        setServiceGroups(normalizeItems(serviceGroupRes));
        setWorkTypes(normalizeItems(workTypesRes));
        setFeatureGroups(nextFeatureGroups);
        setFeatureOptionsByGroup(
          nextOptionsEntries.reduce<Record<number, GenericItem[]>>((acc, [groupId, items]) => {
            if (groupId > 0) acc[groupId] = [...items];
            return acc;
          }, {})
        );
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(String(err?.message ?? text.loadError));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [dil, text.loadError]);

  async function openEdit(job: JobItem) {
    const jobId = toPositiveInt(job.Nr);
    if (jobId == null) return;

    try {
      setFeedback(null);
      setLoadError(null);
      setEditLoading(true);
      const featureRes = await api.get<ApiResponse<FeatureRecordItem[]>>(`/api/ilan/get-ozellikler?ilanId=${jobId}&dil=${dil}`);
      const featureData = featureRes?.Data ?? featureRes?.data;
      const records = Array.isArray(featureData) ? featureData : [];
      const nextSelectedFeatureIds = records
        .map((item) => toPositiveInt(item.SecenekId ?? item.secenekId))
        .filter((value): value is number => value != null);

      setEditingJob(job);
      setEditStep(1);
      setEditingFeatureRecords(records);
      setSelectedFeatureIds(nextSelectedFeatureIds);
      setInitialSelectedFeatureIds(nextSelectedFeatureIds);
      setForm({
        hizmetGrupId: String(job.HizmetGrupId ?? ""),
        calismaSekilId: String(job.CalismaSekilId ?? ""),
        isTanimi: (job.IsTanimi ?? "").trim(),
        aktif: Boolean(job.Aktif),
      });
    } catch (err: any) {
      setLoadError(String(err?.message ?? text.loadError));
    } finally {
      setEditLoading(false);
    }
  }

  function closeEdit() {
    if (savingJob) return;
    setEditingJob(null);
    setEditStep(1);
  }

  async function refreshJobs() {
    const jobsRes = await api.get<ApiResponse<JobItem[]>>(`/api/ilan/getall?dil=${dil}`);
    setJobs(normalizeJobs(jobsRes));
  }

  async function handleSaveEdit() {
    const id = toPositiveInt(editingJob?.Nr);
    if (id == null) return;

    try {
      setSavingJob(true);
      setLoadError(null);
      setFeedback(null);
      const response = await api.post<ApiResponse<unknown>>(`/api/ilan/saveid?id=${id}&dil=${dil}&kaynak=2`, {
        HizmetGrupId: Number(form.hizmetGrupId),
        CalismaSekilId: Number(form.calismaSekilId),
        IsTanimi: form.isTanimi.trim(),
        Aciklama: "",
        Aktif: form.aktif,
      });

      if (!isSuccessfulResponse(response)) {
        throw new Error(readApiMessage(response, text.saveError));
      }

      const featureRecordByOptionId = new Map<number, FeatureRecordItem>();
      editingFeatureRecords.forEach((item) => {
        const secenekId = toPositiveInt(item.SecenekId ?? item.secenekId);
        if (secenekId != null) {
          featureRecordByOptionId.set(secenekId, item);
        }
      });

      const addedIds = selectedFeatureIds.filter((optionId) => !initialSelectedFeatureIds.includes(optionId));
      const removedIds = initialSelectedFeatureIds.filter((optionId) => !selectedFeatureIds.includes(optionId));

      for (const optionId of addedIds) {
        const featureResponse = await api.post<ApiResponse<unknown>>(`/api/ilan/create-ozellik?dil=${dil}&kaynak=2`, {
          IlanId: id,
          SecenekId: optionId,
          Eh: true,
          Aciklama: "",
          Aktif: true,
        });

        if (!isSuccessfulResponse(featureResponse)) {
          throw new Error(readApiMessage(featureResponse, text.saveError));
        }
      }

      for (const optionId of removedIds) {
        const currentRecord = featureRecordByOptionId.get(optionId);
        const recordId = toPositiveInt(currentRecord?.Nr ?? currentRecord?.nr);
        if (recordId == null) continue;
        const featureResponse = await api.post<ApiResponse<unknown>>(
          `/api/ilan/softdelete-ozellik?id=${recordId}&dil=${dil}&kaynak=2`,
          {}
        );

        if (!isSuccessfulResponse(featureResponse)) {
          throw new Error(readApiMessage(featureResponse, text.saveError));
        }
      }

      await refreshJobs();
      setEditingJob(null);
      setEditStep(1);
      setFeedback(text.saveSuccess);
    } catch (err: any) {
      setLoadError(String(err?.message ?? text.saveError));
    } finally {
      setSavingJob(false);
    }
  }

  function requestDelete(job: JobItem) {
    setConfirmDeleteJob(job);
  }

  async function handleDelete(id: number | undefined) {
    const jobId = toPositiveInt(id);
    if (jobId == null || deletingJobId != null) return;

    try {
      setDeletingJobId(jobId);
      setLoadError(null);
      setFeedback(null);
      const response = await api.post<ApiResponse<unknown>>(`/api/ilan/softdelete?id=${jobId}&dil=${dil}&kaynak=2`, {});

      if (!isSuccessfulResponse(response)) {
        throw new Error(readApiMessage(response, text.deleteError));
      }

      setJobs((prev) => prev.filter((item) => item.Nr !== jobId));
      setFeedback(text.deleteSuccess);
      setConfirmDeleteJob(null);
    } catch (err: any) {
      setLoadError(String(err?.message ?? text.deleteError));
    } finally {
      setDeletingJobId(null);
    }
  }

  function toggleFeature(optionId: number) {
    setSelectedFeatureIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafc]">
      <TopBar
        lang={lang}
        hideSearch
        titleLeft={
          <div>
            <div className="text-lg font-semibold text-[#15212d]">{text.pageTitle}</div>
          </div>
        }
      />

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <section className="rounded-[28px] border border-[#e2ebf2] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#368ab0]">
                <BriefcaseBusiness className="h-4 w-4" />
                {text.pageTitle}
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-[#15212d]">{text.heading}</h1>
              <p className="mt-3 text-sm leading-7 text-[#607080]">{text.subtitle}</p>
            </div>

            <Link
              href={`/${lang}/home/add-job?returnTo=${encodeURIComponent(`/${lang}/home/myjobs`)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#1f2937]"
            >
              <Plus className="h-4 w-4" />
              {text.addNew}
            </Link>
          </div>

          {feedback ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          ) : null}

          {loadError ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <CircleAlert className="h-5 w-5" />
              <span>{loadError}</span>
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-8 flex min-h-[240px] items-center justify-center gap-3 rounded-3xl border border-[#e5edf3] bg-[#fbfdff] text-[#526071]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{text.loading}</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[#d4dde7] bg-[#fbfdff] px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef6fb] text-[#5aaed2]">
                <BriefcaseBusiness className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#15212d]">{text.empty}</h3>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {jobs.map((job) => (
                <article key={job.Nr} className="rounded-[26px] border border-[#e6edf3] bg-[#fbfdff] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {job.HizmetGrupAdi?.trim() ? (
                          <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-semibold text-[#0369a1]">
                            {job.HizmetGrupAdi.trim()}
                          </span>
                        ) : null}
                        {job.CalismaSekilAdi?.trim() ? (
                          <span className="rounded-full bg-[#fff4e8] px-3 py-1 text-xs font-semibold text-[#c26610]">
                            {job.CalismaSekilAdi.trim()}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            job.Aktif ? "bg-[#e8f8ee] text-[#15803d]" : "bg-[#f2f4f7] text-[#667085]"
                          }`}
                        >
                          {job.Aktif ? text.active : text.inactive}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-semibold text-[#1b2733]">
                        {(job.IsTanimi ?? "").trim() || "-"}
                      </h2>
                      <div className="mt-3 text-sm text-[#64748b]">
                        {text.createdAt}: {formatJobDate(job.OlusturmaZamani, lang)}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void openEdit(job)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#cfe0eb] bg-white px-4 text-sm font-semibold text-[#284052] transition hover:border-[#9fc7dd]"
                      >
                        <PencilLine className="h-4 w-4" />
                        {text.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(job)}
                        disabled={deletingJobId === job.Nr}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#f3d0d0] bg-white px-4 text-sm font-semibold text-[#b42318] transition hover:border-[#e9aaaa] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deletingJobId === job.Nr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {text.delete}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {editingJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[#dce7f0] bg-white shadow-2xl">
            <div className="overflow-y-auto px-4 py-5 md:px-7 md:py-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#15212d]">{text.editTitle}</h2>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#d7e1eb] bg-white text-[#6b7280] transition hover:bg-[#f3f6f9]"
                aria-label={text.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-[#dfe8f0] bg-[#f7fbff] px-5 py-4 text-sm text-[#38566d]">
                <div className="font-semibold">{editStep} / 2</div>
                <div className={editStep === 1 ? "mt-2 font-semibold text-[#111827]" : "mt-2 text-[#8aa0b3]"}>{text.editStepOneTitle}</div>
                <div className={editStep === 2 ? "mt-1 font-semibold text-[#111827]" : "mt-1 text-[#8aa0b3]"}>{text.editStepTwoTitle}</div>
              </div>

              {editLoading ? (
                <div className="flex min-h-[220px] items-center justify-center gap-3 rounded-3xl border border-[#e5edf3] bg-[#fbfdff] text-[#526071]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{text.loading}</span>
                </div>
              ) : editStep === 1 ? (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#263647]">{text.serviceGroup}</span>
                    <select
                      value={form.hizmetGrupId}
                      onChange={(event) => setForm((prev) => ({ ...prev, hizmetGrupId: event.target.value }))}
                      className="h-14 w-full rounded-2xl border border-[#d5e0ea] bg-white px-4 text-sm text-[#1f2937] outline-none transition focus:border-[#73c8ee]"
                    >
                      <option value="" />
                      {serviceGroups.map((item) => {
                        const id = resolveItemId(item);
                        if (id == null) return null;
                        return (
                          <option key={id} value={id}>
                            {resolveServiceGroupLabel(item, lang)}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#263647]">{text.workType}</span>
                    <select
                      value={form.calismaSekilId}
                      onChange={(event) => setForm((prev) => ({ ...prev, calismaSekilId: event.target.value }))}
                      className="h-14 w-full rounded-2xl border border-[#d5e0ea] bg-white px-4 text-sm text-[#1f2937] outline-none transition focus:border-[#73c8ee]"
                    >
                      <option value="" />
                      {workTypes.map((item) => {
                        const id = resolveItemId(item);
                        if (id == null) return null;
                        return (
                          <option key={id} value={id}>
                            {resolveWorkTypeLabel(item, lang)}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#263647]">{text.jobTitle}</span>
                    <div className="relative">
                      <textarea
                        rows={8}
                        value={form.isTanimi}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, isTanimi: event.target.value.slice(0, EDIT_JOB_TITLE_MAX) }))
                        }
                        className="w-full rounded-3xl border border-[#d5e0ea] bg-white px-4 py-4 pr-20 text-sm leading-6 text-[#1f2937] outline-none transition focus:border-[#73c8ee]"
                      />
                      <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-medium text-[#607080]">
                        {form.isTanimi.length}/{EDIT_JOB_TITLE_MAX}
                      </span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {featureGroups.map((group) => {
                    const groupId = resolveItemId(group);
                    if (groupId == null) return null;
                    const options = featureOptionsByGroup[groupId] ?? [];
                    return (
                      <section key={groupId} className="rounded-[26px] border border-[#e1e8ef] bg-white p-5">
                        <h2 className="text-lg font-semibold text-[#15212d]">
                          {resolveFeatureGroupLabel(group, lang)}
                        </h2>
                        <div className="mt-4 space-y-3">
                          {options.map((option) => {
                            const optionId = resolveItemId(option);
                            if (optionId == null) return null;
                            const checked = selectedFeatureIds.includes(optionId);
                            return (
                              <label
                                key={optionId}
                                className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#edf2f7] px-4 py-3 transition hover:border-[#cfe5f3]"
                              >
                                <span className="text-sm font-medium text-[#243444]">
                                  {resolveFeatureOptionLabel(option, lang)}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleFeature(optionId)}
                                  className="h-5 w-5 rounded border-[#b8c7d6] text-[#0ea5e9]"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <div>
                  {editStep === 2 ? (
                    <button
                      type="button"
                      onClick={() => setEditStep(1)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#d7e1eb] bg-white px-5 text-sm font-semibold text-[#4b5563] transition hover:bg-[#f7fafc]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {text.back}
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d7e1eb] bg-white px-5 text-sm font-semibold text-[#4b5563] transition hover:bg-[#f7fafc]"
                  >
                    {text.cancel}
                  </button>
                  {editStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setEditStep(2)}
                      disabled={!canGoNext}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#9aa8b6]"
                    >
                      {text.next}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit()}
                      disabled={savingJob || !canGoNext}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#9aa8b6]"
                    >
                      {savingJob ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {text.save}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] border border-[#dce7f0] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-[#15212d]">{text.confirmDeleteTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-[#607080]">{text.confirmDelete}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteJob(null)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d7e1eb] bg-white px-5 text-sm font-semibold text-[#4b5563] transition hover:bg-[#f7fafc]"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(confirmDeleteJob.Nr)}
                disabled={deletingJobId != null}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#b42318] px-5 text-sm font-semibold text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingJobId != null ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {text.confirmDeleteApprove}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
