"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Loader2, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { langToDil, normalizeLang, type Lang } from "@/lib/i18n/languages";

type ApiActionResponse = {
  StatusCode?: number;
  statusCode?: number;
  Message?: string;
  Error?: string;
  message?: string;
  error?: string;
  raw?: string;
};

type JobCreateResponse = ApiActionResponse & {
  Data?: {
    Nr?: number | null;
    nr?: number | null;
    Id?: number | null;
    id?: number | null;
  } | null;
  data?: {
    Nr?: number | null;
    nr?: number | null;
    Id?: number | null;
    id?: number | null;
  } | null;
};

type GenericResponse<T> = {
  StatusCode?: number;
  statusCode?: number;
  Message?: string;
  message?: string;
  Data?: T[] | null;
  data?: T[] | null;
};

type GenericItem = Record<string, unknown>;

const JOB_TITLE_MAX = 2000;

function normalizeApiArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeApiResponseArray<T>(response: GenericResponse<T> | null | undefined): T[] {
  return normalizeApiArray(response?.Data ?? response?.data);
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readApiMessage(payload: ApiActionResponse | null | undefined, fallback: string): string {
  return String(payload?.Message ?? payload?.Error ?? payload?.message ?? payload?.error ?? payload?.raw ?? fallback);
}

function readStatusCode(payload: ApiActionResponse | null | undefined): number | undefined {
  if (typeof payload?.StatusCode === "number") return payload.StatusCode;
  if (typeof payload?.statusCode === "number") return payload.statusCode;
  return undefined;
}

function isSuccessfulResponse(payload: ApiActionResponse | null | undefined): boolean {
  const statusCode = readStatusCode(payload);
  return statusCode == null || statusCode === 200 || statusCode === 201;
}

function resolveCreatedJobNr(response: JobCreateResponse): number | null {
  const data = response?.Data ?? response?.data;
  return toPositiveInt(data?.Nr) ?? toPositiveInt(data?.nr) ?? toPositiveInt(data?.Id) ?? toPositiveInt(data?.id);
}

function resolveItemId(item: GenericItem): number | null {
  return toPositiveInt(item.Id) ?? toPositiveInt(item.id) ?? toPositiveInt(item.Nr) ?? toPositiveInt(item.nr);
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
    item.Ad,
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

const ADD_JOB_TEXT: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    stepOneTitle: string;
    stepTwoTitle: string;
    serviceGroup: string;
    workType: string;
    jobTitle: string;
    serviceGroupPlaceholder: string;
    workTypePlaceholder: string;
    jobTitlePlaceholder: string;
    next: string;
    back: string;
    saveAndPublish: string;
    close: string;
    loadingRefs: string;
    refsError: string;
    createError: string;
    featureError: string;
    success: string;
    emptyFeatures: string;
    requiredFields: string;
    backToJobs: string;
    stepTwoHint: string;
    missingCreatedJobId: string;
  }
> = {
  tr: {
    title: "İlan Ver",
    subtitle: "İlanı iki adımda hazırlayın. İlk adım sadece formu doldurur, yayınlama ikinci adımda olur.",
    stepOneTitle: "Temel Bilgiler",
    stepTwoTitle: "İlan Özellikleri",
    serviceGroup: "Hizmet Grubu",
    workType: "Çalışma Şekli",
    jobTitle: "İşin Tanımı",
    serviceGroupPlaceholder: "Hizmet grubu seçin",
    workTypePlaceholder: "Çalışma şekli seçin",
    jobTitlePlaceholder: "Örn. Hafta içi çocuk bakıcısı aranıyor",
    next: "İleri",
    back: "Geri",
    saveAndPublish: "Kaydet ve Yayınla",
    close: "Kapat",
    loadingRefs: "İlan formu hazırlanıyor...",
    refsError: "Form verileri yüklenemedi.",
    createError: "İlan oluşturulamadı.",
    featureError: "İlan özellikleri kaydedilemedi.",
    success: "İlan kaydedildi ve yayına alındı.",
    emptyFeatures: "Bu grup için seçenek bulunamadı.",
    requiredFields: "Lütfen hizmet grubu, çalışma şekli ve işin tanımını doldurun.",
    backToJobs: "İlanlarıma dön",
    stepTwoHint: "Seçtiğiniz özelliklerle birlikte ilan tek seferde yayınlanır.",
    missingCreatedJobId: "İlan oluşturuldu ancak response.Data.Nr bulunamadı.",
  },
  en: {
    title: "Post a Job",
    subtitle: "Prepare your listing in two steps. Step one only fills the form, publishing happens on step two.",
    stepOneTitle: "Main Details",
    stepTwoTitle: "Job Features",
    serviceGroup: "Service Group",
    workType: "Work Type",
    jobTitle: "Job Description",
    serviceGroupPlaceholder: "Select a service group",
    workTypePlaceholder: "Select a work type",
    jobTitlePlaceholder: "e.g. Weekday nanny needed",
    next: "Next",
    back: "Back",
    saveAndPublish: "Save and Publish",
    close: "Close",
    loadingRefs: "Preparing the job form...",
    refsError: "Failed to load form data.",
    createError: "Failed to create the job post.",
    featureError: "Failed to save the job features.",
    success: "The job post has been saved and published.",
    emptyFeatures: "There are no options in this group yet.",
    requiredFields: "Please select the service group, work type, and enter the job description.",
    backToJobs: "Back to my jobs",
    stepTwoHint: "The listing is published in one go with the selected features.",
    missingCreatedJobId: "Job post was created but response.Data.Nr was missing.",
  },
  ru: {
    title: "Разместить вакансию",
    subtitle: "Подготовьте объявление в два шага. Первый шаг заполняет форму, публикация происходит на втором.",
    stepOneTitle: "Основные данные",
    stepTwoTitle: "Характеристики объявления",
    serviceGroup: "Группа услуг",
    workType: "Тип работы",
    jobTitle: "Описание работы",
    serviceGroupPlaceholder: "Выберите группу услуг",
    workTypePlaceholder: "Выберите тип работы",
    jobTitlePlaceholder: "Напр. нужна няня в будние дни",
    next: "Далее",
    back: "Назад",
    saveAndPublish: "Сохранить и опубликовать",
    close: "Закрыть",
    loadingRefs: "Форма объявления подготавливается...",
    refsError: "Не удалось загрузить данные формы.",
    createError: "Не удалось создать объявление.",
    featureError: "Не удалось сохранить характеристики объявления.",
    success: "Объявление сохранено и опубликовано.",
    emptyFeatures: "Для этой группы пока нет вариантов.",
    requiredFields: "Выберите группу услуг, тип работы и заполните описание.",
    backToJobs: "Вернуться к моим объявлениям",
    stepTwoHint: "Объявление будет опубликовано сразу с выбранными характеристиками.",
    missingCreatedJobId: "Объявление создано, но response.Data.Nr отсутствует.",
  },
  es: {
    title: "Publicar empleo",
    subtitle: "Prepara tu anuncio en dos pasos. El primer paso solo completa el formulario; la publicación ocurre en el segundo.",
    stepOneTitle: "Datos principales",
    stepTwoTitle: "Características del anuncio",
    serviceGroup: "Grupo de servicio",
    workType: "Tipo de trabajo",
    jobTitle: "Descripción del trabajo",
    serviceGroupPlaceholder: "Selecciona un grupo de servicio",
    workTypePlaceholder: "Selecciona un tipo de trabajo",
    jobTitlePlaceholder: "Ej. Se necesita niñera entre semana",
    next: "Siguiente",
    back: "Atrás",
    saveAndPublish: "Guardar y publicar",
    close: "Cerrar",
    loadingRefs: "Preparando el formulario...",
    refsError: "No se pudieron cargar los datos del formulario.",
    createError: "No se pudo crear la publicación.",
    featureError: "No se pudieron guardar las características.",
    success: "La publicación se guardó y fue publicada.",
    emptyFeatures: "Aún no hay opciones en este grupo.",
    requiredFields: "Selecciona el grupo de servicio, el tipo de trabajo e ingresa la descripción.",
    backToJobs: "Volver a mis empleos",
    stepTwoHint: "El anuncio se publica de una vez con las características seleccionadas.",
    missingCreatedJobId: "La publicación se creó, pero falta response.Data.Nr.",
  },
  fr: {
    title: "Publier une annonce",
    subtitle: "Préparez votre annonce en deux étapes. La première remplit le formulaire, la publication se fait à la deuxième.",
    stepOneTitle: "Informations principales",
    stepTwoTitle: "Caractéristiques de l'annonce",
    serviceGroup: "Groupe de service",
    workType: "Type de travail",
    jobTitle: "Description du poste",
    serviceGroupPlaceholder: "Sélectionner un groupe de service",
    workTypePlaceholder: "Sélectionner un type de travail",
    jobTitlePlaceholder: "Ex. Recherche nounou en semaine",
    next: "Suivant",
    back: "Retour",
    saveAndPublish: "Enregistrer et publier",
    close: "Fermer",
    loadingRefs: "Préparation du formulaire...",
    refsError: "Impossible de charger les données du formulaire.",
    createError: "Impossible de créer l'annonce.",
    featureError: "Impossible d'enregistrer les caractéristiques.",
    success: "L'annonce a été enregistrée et publiée.",
    emptyFeatures: "Il n'y a pas encore d'options dans ce groupe.",
    requiredFields: "Sélectionnez le groupe de service, le type de travail et saisissez la description.",
    backToJobs: "Retour à mes annonces",
    stepTwoHint: "L'annonce est publiée en une seule fois avec les caractéristiques sélectionnées.",
    missingCreatedJobId: "L'annonce a été créée, mais response.Data.Nr est manquant.",
  },
};

export default function AddJobPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const rawReturnTo = (searchParams.get("returnTo") ?? "").trim();
  const returnPath = rawReturnTo.startsWith(`/${lang}/home/`) ? rawReturnTo : `/${lang}/home/myjobs`;

  const text = useMemo(() => ADD_JOB_TEXT[lang], [lang]);

  const [step, setStep] = useState<1 | 2>(1);
  const [serviceGroups, setServiceGroups] = useState<GenericItem[]>([]);
  const [workTypes, setWorkTypes] = useState<GenericItem[]>([]);
  const [featureGroups, setFeatureGroups] = useState<GenericItem[]>([]);
  const [featureOptionsByGroup, setFeatureOptionsByGroup] = useState<Record<number, GenericItem[]>>({});
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [refsError, setRefsError] = useState<string | null>(null);
  const [serviceGroupId, setServiceGroupId] = useState<number | null>(null);
  const [workTypeId, setWorkTypeId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canContinue = serviceGroupId != null && workTypeId != null && jobTitle.trim().length > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      try {
        setIsLoadingRefs(true);
        setRefsError(null);

        const [serviceGroupsRes, workTypesRes, featureGroupsRes] = await Promise.all([
          api.get<GenericResponse<GenericItem>>(`/api/customer/hizmet-gruplari?dil=${dil}`),
          api.get<GenericResponse<GenericItem>>(`/api/work-experiences/work-types?dil=${dil}`),
          api.get<GenericResponse<GenericItem>>(`/api/customer-features/groups?dil=${dil}`),
        ]);

        const nextServiceGroups = normalizeApiResponseArray(serviceGroupsRes);
        const nextWorkTypes = normalizeApiResponseArray(workTypesRes);
        const nextFeatureGroups = normalizeApiResponseArray(featureGroupsRes);

        const nextOptionsEntries = await Promise.all(
          nextFeatureGroups.map(async (group) => {
            const groupId = resolveItemId(group);
            if (groupId == null) return [0, []] as const;
            const optionsRes = await api.get<GenericResponse<GenericItem>>(
              `/api/customer-features/options?dil=${dil}&grupSecenekId=${groupId}`
            );
            return [groupId, normalizeApiResponseArray(optionsRes)] as const;
          })
        );

        if (cancelled) return;

        setServiceGroups(nextServiceGroups);
        setWorkTypes(nextWorkTypes);
        setFeatureGroups(nextFeatureGroups);
        setFeatureOptionsByGroup(
          nextOptionsEntries.reduce<Record<number, GenericItem[]>>((acc, [groupId, items]) => {
            if (groupId > 0) acc[groupId] = [...items];
            return acc;
          }, {})
        );
      } catch (err: any) {
        if (cancelled) return;
        setRefsError(String(err?.message ?? text.refsError));
      } finally {
        if (!cancelled) {
          setIsLoadingRefs(false);
        }
      }
    }

    void loadReferences();
    return () => {
      cancelled = true;
    };
  }, [dil, text.refsError]);

  function handleGoNext() {
    if (!canContinue) {
      setSubmitError(text.requiredFields);
      return;
    }
    setSubmitError(null);
    setStep(2);
  }

  function toggleFeature(optionId: number) {
    setSelectedFeatureIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  }

  async function handleSaveAndPublish() {
    if (!canContinue) {
      setSubmitError(text.requiredFields);
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError(null);
      setSuccessMessage(null);

      const createResponse = await api.post<JobCreateResponse>(`/api/ilan/create?dil=${dil}&kaynak=2`, {
        HizmetGrupId: serviceGroupId,
        CalismaSekilId: workTypeId,
        IsTanimi: jobTitle.trim(),
        Aciklama: "",
        Aktif: true,
      });

      if (!isSuccessfulResponse(createResponse)) {
        throw new Error(readApiMessage(createResponse, text.createError));
      }

      const createdJobNr = resolveCreatedJobNr(createResponse);
      if (createdJobNr == null) {
        throw new Error(text.missingCreatedJobId);
      }

      for (const optionId of selectedFeatureIds) {
        const featureResponse = await api.post<ApiActionResponse>(`/api/ilan/create-ozellik?dil=${dil}&kaynak=2`, {
          IlanId: createdJobNr,
          SecenekId: optionId,
          Eh: true,
          Aciklama: "",
          Aktif: true,
        });

        if (!isSuccessfulResponse(featureResponse)) {
          throw new Error(readApiMessage(featureResponse, text.featureError));
        }
      }

      setSuccessMessage(text.success);
      router.push(returnPath);
    } catch (err: any) {
      setSubmitError(String(err?.message ?? text.createError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingRefs) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] px-4 py-10">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-3xl border border-[#dbe4ef] bg-white px-6 py-12 text-[#526071] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{text.loadingRefs}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <Link href={returnPath} className="text-sm font-medium text-[#5a6a7c] transition hover:text-[#111827]">
            {text.backToJobs}
          </Link>
          <button
            type="button"
            onClick={() => router.push(returnPath)}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#d7e1eb] bg-white text-[#6b7280] transition hover:bg-[#f3f6f9]"
            aria-label={text.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="rounded-[28px] bg-[linear-gradient(135deg,#74c9ee_0%,#f69b63_100%)] p-[1px] shadow-[0_24px_80px_rgba(47,67,88,0.12)]">
          <div className="rounded-[27px] bg-[#fcfdff] p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#3a88ad]">
                  <Sparkles className="h-4 w-4" />
                  {step === 1 ? text.stepOneTitle : text.stepTwoTitle}
                </div>
                <h1 className="text-3xl font-semibold text-[#15212d] md:text-4xl">{text.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#607080]">{text.subtitle}</p>
              </div>

              <div className="rounded-3xl border border-[#dfe8f0] bg-[#f7fbff] px-5 py-4 text-sm text-[#38566d]">
                <div className="font-semibold">{step} / 2</div>
                <div className={step === 1 ? "mt-2 font-semibold text-[#111827]" : "mt-2 text-[#8aa0b3]"}>{text.stepOneTitle}</div>
                <div className={step === 2 ? "mt-1 font-semibold text-[#111827]" : "mt-1 text-[#8aa0b3]"}>{text.stepTwoTitle}</div>
              </div>
            </div>

            {refsError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {refsError}
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#263647]">{text.serviceGroup}</span>
                    <select
                      value={serviceGroupId ?? ""}
                      onChange={(event) => setServiceGroupId(event.target.value ? Number(event.target.value) : null)}
                      className="h-14 w-full rounded-2xl border border-[#d5e0ea] bg-white px-4 text-sm text-[#1f2937] outline-none transition focus:border-[#73c8ee]"
                    >
                      <option value="">{text.serviceGroupPlaceholder}</option>
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
                      value={workTypeId ?? ""}
                      onChange={(event) => setWorkTypeId(event.target.value ? Number(event.target.value) : null)}
                      className="h-14 w-full rounded-2xl border border-[#d5e0ea] bg-white px-4 text-sm text-[#1f2937] outline-none transition focus:border-[#73c8ee]"
                    >
                      <option value="">{text.workTypePlaceholder}</option>
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
                        value={jobTitle}
                        onChange={(event) => setJobTitle(event.target.value.slice(0, JOB_TITLE_MAX))}
                        rows={8}
                        placeholder={text.jobTitlePlaceholder}
                        className="w-full rounded-3xl border border-[#d5e0ea] bg-white px-4 py-4 pr-20 text-sm leading-6 text-[#1f2937] outline-none transition focus:border-[#73c8ee]"
                      />
                      <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-medium text-[#607080]">
                        {jobTitle.length}/{JOB_TITLE_MAX}
                      </span>
                    </div>
                  </label>
                </div>

                <aside className="rounded-[28px] border border-[#e2ebf3] bg-[#f8fbfe] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ff] text-[#2b90c2]">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-[#15212d]">{text.stepOneTitle}</h2>
                </aside>
              </div>
            ) : (
              <div className="mt-8">
                <div className="mb-4 rounded-3xl border border-[#dce7f0] bg-[#f8fbff] px-5 py-4 text-sm text-[#587084]">
                  {text.stepTwoHint}
                </div>

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
                          {options.length === 0 ? (
                            <div className="rounded-2xl bg-[#f7fafc] px-4 py-3 text-sm text-[#7a8796]">
                              {text.emptyFeatures}
                            </div>
                          ) : (
                            options.map((option) => {
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
                            })
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <div>
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#d7e1eb] bg-white px-5 text-sm font-semibold text-[#4b5563] transition hover:bg-[#f7fafc]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {text.back}
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleGoNext}
                    disabled={!canContinue}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#9aa8b6]"
                  >
                    {text.next}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSaveAndPublish()}
                    disabled={isSaving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#9aa8b6]"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {text.saveAndPublish}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
