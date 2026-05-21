"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Briefcase, ChevronDown, ImagePlus, Plus, Search, X } from "lucide-react";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";

const CATEGORY_MAX = 100;
const EXPERTISE_MAX = 100;
const DESCRIPTION_MAX = 600;
const KEYWORD_MAX = 2000;
const DOCUMENT_MAX = 400;
const EXPERIENCE_MAX_LENGTH = 10;
const IMAGE_MAX_COUNT = 6;
const IMAGE_MAX_SIZE_MB = 5;
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

type UploadImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type EducationItem = {
  Id?: number;
  EgitimAdi?: string;
  EgitimSira?: number;
  Aciklama?: string;
};

type EducationsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: EducationItem[] | null;
};

type ApiActionResponse = {
  StatusCode?: number;
  Message?: string;
  Error?: string;
  Meta?: unknown;
  message?: string;
  error?: string;
  raw?: string;
};

type ServiceCreateResponse = ApiActionResponse & {
  Data?: {
    Nr?: number | null;
  } | null;
};

function normalizeEducations(data?: EducationsResponse): EducationItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data
    .filter((item): item is EducationItem & { Id: number } => typeof item?.Id === "number")
    .sort((a, b) => Number(a.EgitimSira ?? 0) - Number(b.EgitimSira ?? 0));
}

function isValidImageType(file: File): boolean {
  const type = file.type.toLowerCase();
  if (ALLOWED_IMAGE_TYPES.has(type)) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_IMAGE_EXTENSIONS.has(extension) : false;
}

function isValidImageSize(file: File): boolean {
  return file.size <= IMAGE_MAX_SIZE_BYTES;
}

function normalizeExperienceInput(raw: string): string {
  const filtered = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
  const dotIndex = filtered.indexOf(".");
  const normalized =
    dotIndex >= 0
      ? `${filtered.slice(0, dotIndex + 1)}${filtered.slice(dotIndex + 1).replace(/\./g, "")}`
      : filtered;
  return normalized.slice(0, EXPERIENCE_MAX_LENGTH);
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNonNegativeFloat(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isSuccessfulStatusCode(statusCode: unknown): boolean {
  return statusCode === 200 || statusCode === 201;
}

function hasApiStatusCode(payload: ApiActionResponse | null | undefined): payload is ApiActionResponse & { StatusCode: number } {
  return typeof payload?.StatusCode === "number";
}

function readApiMessage(payload: ApiActionResponse | null | undefined, fallback: string): string {
  return String(payload?.Message ?? payload?.Error ?? payload?.message ?? payload?.error ?? payload?.raw ?? fallback);
}

function resolveCreatedServiceNr(response: ServiceCreateResponse): number | null {
  return toPositiveInt(response?.Data?.Nr);
}

export default function AddServicePage() {
  const params = useParams<{ lang?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const fallbackReturnPath = `/${lang}/home/jobs`;
  const rawReturnTo = (searchParams.get("returnTo") ?? "").trim();
  const returnPath = rawReturnTo.startsWith(`/${lang}/home/`) ? rawReturnTo : fallbackReturnPath;

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            title: "Hizmet Ekle",
            subtitle: "Hizmet bilgilerini doldurun ve sonraki adımda görselleri ekleyin.",
            imageTitle: "Hizmet Görselleri",
            imageSubtitle: "Önce hizmet oluşturulur, sonra görseller tek seferde yüklenir.",
            category: "Kategori",
            categoryPlaceholder: "Kategori girin",
            expertise: "Uzmanlık",
            expertisePlaceholder: "Uzmanlık alanını girin",
            description: "Açıklama",
            descriptionPlaceholder: "Hizmet açıklamasını girin",
            keyword: "Anahtar Kelime",
            keywordPlaceholder: "Anahtar kelimeleri virgülle ayırarak giriniz...",
            documents: "Belge",
            documentsPlaceholder: "Belgeleri virgülle ayırarak giriniz...",
            experience: "Tecrübe Yılı",
            experiencePlaceholder: "Örn. 5.5",
            experienceInvalid: "Tecrübe yılı geçerli bir sayı olmalıdır.",
            education: "Eğitim",
            educationPlaceholder: "Eğitim seçin",
            educationLoading: "Eğitimler yükleniyor...",
            educationError: "Eğitimler yüklenemedi.",
            imageLabel: "Hizmet Görselleri",
            imageUploadPrimary: "Yüklemek için tıklayın",
            imageUploadSecondary: "veya sürükleyip bırakın",
            imageUploadHint: "PNG, JPG veya GIF (en fazla 6 dosya, her biri en fazla 5MB)",
            coverAction: "Seçili Görseli Kapak Yap",
            cancel: "Vazgeç",
            back: "Geri",
            continue: "Devam Et",
            save: "Kaydet",
            goServices: "Hizmetlere Git",
            close: "Kapat",
            stepCounter: "Adım",
            loadingService: "Hizmet oluşturuluyor...",
            loadingImages: "Hizmet görselleri kaydediliyor...",
            successTitle: "Hizmet ve görseller kaydedildi",
            successDesc: "Hizmetiniz ve görselleri başarıyla oluşturuldu.",
            addAnother: "Yeni Hizmet Ekle",
            createError: "Hizmet oluşturulamadı.",
            imageSaveError: "Hizmet görselleri kaydedilemedi.",
          }
        : {
            title: "Add Service",
            subtitle: "Fill in the service details and upload images in the next step.",
            imageTitle: "Service Images",
            imageSubtitle: "The service is created first, then images are uploaded in one request.",
            category: "Category",
            categoryPlaceholder: "Enter category",
            expertise: "Expertise",
            expertisePlaceholder: "Enter expertise",
            description: "Description",
            descriptionPlaceholder: "Enter service description",
            keyword: "Keyword",
            keywordPlaceholder: "Enter keywords separated by commas...",
            documents: "Document",
            documentsPlaceholder: "Enter documents separated by commas...",
            experience: "Experience Year",
            experiencePlaceholder: "e.g. 5.5",
            experienceInvalid: "Experience year must be a valid number.",
            education: "Education",
            educationPlaceholder: "Select education",
            educationLoading: "Loading educations...",
            educationError: "Failed to load educations.",
            imageLabel: "Service Images",
            imageUploadPrimary: "Click to upload",
            imageUploadSecondary: "or drag and drop",
            imageUploadHint: "PNG, JPG or GIF (up to 6 files, max 5MB each)",
            coverAction: "Set Selected as Cover",
            cancel: "Cancel",
            back: "Back",
            continue: "Continue",
            save: "Save",
            goServices: "Go to Services",
            close: "Close",
            stepCounter: "Step",
            loadingService: "Creating service...",
            loadingImages: "Saving service images...",
            successTitle: "Service and images saved",
            successDesc: "Your service and images have been created successfully.",
            addAnother: "Add Another Service",
            createError: "Failed to create service.",
            imageSaveError: "Failed to save service images.",
          },
    [lang]
  );

  const imageValidationText = useMemo(
    () =>
      lang === "tr"
        ? {
            invalidType: "Sadece PNG, JPG veya GIF dosyaları yüklenebilir.",
            invalidSize: `Her dosya en fazla ${IMAGE_MAX_SIZE_MB}MB olabilir.`,
            limitExceeded: `En fazla ${IMAGE_MAX_COUNT} görsel yükleyebilirsiniz.`,
          }
        : {
            invalidType: "Only PNG, JPG or GIF files are allowed.",
            invalidSize: `Each file can be up to ${IMAGE_MAX_SIZE_MB}MB.`,
            limitExceeded: `You can upload up to ${IMAGE_MAX_COUNT} images.`,
          },
    [lang]
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [createdServiceNr, setCreatedServiceNr] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [expertise, setExpertise] = useState("");
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [documents, setDocuments] = useState("");
  const [experienceYear, setExperienceYear] = useState("");
  const [educationId, setEducationId] = useState<number | null>(null);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [educationsLoading, setEducationsLoading] = useState(true);
  const [educationsError, setEducationsError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<UploadImageItem[]>([]);

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imageRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setEducationsLoading(true);
        setEducationsError(null);
        const data = await api.get<EducationsResponse>(`/api/educations?dil=${dil}`);
        if (cancelled) return;
        setEducations(normalizeEducations(data));
      } catch (err: any) {
        if (cancelled) return;
        setEducations([]);
        setEducationsError(String(err?.message ?? text.educationError));
      } finally {
        if (!cancelled) setEducationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, text.educationError]);

  useEffect(() => {
    setEducationId((prev) => {
      if (prev == null) return prev;
      return educations.some((item) => item.Id === prev) ? prev : null;
    });
  }, [educations]);

  useEffect(() => {
    if (images.length === 0) {
      setSelectedImageId(null);
      setCoverImageId(null);
      setPreviewImageId(null);
      return;
    }
    if (!selectedImageId || !images.some((item) => item.id === selectedImageId)) {
      setSelectedImageId(images[0]?.id ?? null);
    }
    if (!coverImageId || !images.some((item) => item.id === coverImageId)) {
      setCoverImageId(images[0]?.id ?? null);
    }
  }, [coverImageId, images, selectedImageId]);

  useEffect(() => {
    if (!previewImageId) return;
    if (images.some((item) => item.id === previewImageId)) return;
    setPreviewImageId(null);
  }, [images, previewImageId]);

  useEffect(() => {
    if (!previewImageId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImageId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImageId]);

  const previewImage = useMemo(
    () => images.find((item) => item.id === previewImageId) ?? null,
    [images, previewImageId]
  );

  const parsedExperienceYear = useMemo(() => toNonNegativeFloat(experienceYear), [experienceYear]);

  const canSubmitStepOne =
    category.trim() !== "" &&
    expertise.trim() !== "" &&
    description.trim() !== "" &&
    keyword.trim() !== "" &&
    documents.trim() !== "" &&
    parsedExperienceYear != null &&
    educationId != null &&
    !isCreatingService;

  const canSubmitStepTwo = images.length > 0 && !isCreatingService && !isSavingImages;
  const stepProgress = step === 1 ? 50 : 100;
  const inputClass =
    "w-full rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 text-[14px] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]";

  function resetImageState() {
    imageRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setSelectedImageId(null);
    setCoverImageId(null);
    setPreviewImageId(null);
    setImageValidationMessage(null);
    imageRef.current = [];
  }

  function resetAll() {
    setStep(1);
    setCreatedServiceNr(null);
    setCategory("");
    setExpertise("");
    setDescription("");
    setKeyword("");
    setDocuments("");
    setExperienceYear("");
    setEducationId(null);
    setSubmitError(null);
    setShowSuccessModal(false);
    setSuccessMessage(null);
    resetImageState();
  }

  function openFilePicker() {
    if (images.length >= IMAGE_MAX_COUNT) {
      setImageValidationMessage(imageValidationText.limitExceeded);
      return;
    }
    setImageValidationMessage(null);
    fileInputRef.current?.click();
  }

  function appendFiles(fileList: File[]) {
    const room = IMAGE_MAX_COUNT - images.length;
    if (room <= 0) {
      setImageValidationMessage(imageValidationText.limitExceeded);
      return;
    }

    const invalidTypeCount = fileList.filter((file) => !isValidImageType(file)).length;
    const invalidSizeCount = fileList.filter((file) => isValidImageType(file) && !isValidImageSize(file)).length;
    const validFiles = fileList.filter((file) => isValidImageType(file) && isValidImageSize(file));
    const accepted = validFiles.slice(0, room);

    const messages: string[] = [];
    if (invalidTypeCount > 0) messages.push(imageValidationText.invalidType);
    if (invalidSizeCount > 0) messages.push(imageValidationText.invalidSize);
    if (validFiles.length > room) messages.push(imageValidationText.limitExceeded);
    setImageValidationMessage(messages.length > 0 ? messages.join(" ") : null);

    if (accepted.length === 0) return;

    const created = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...created]);
    setSelectedImageId((prev) => prev ?? created[0]?.id ?? null);
    setCoverImageId((prev) => prev ?? created[0]?.id ?? null);
  }

  function removeImage(imageId: string) {
    setImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((item) => item.id !== imageId);
      setSelectedImageId((selected) => (selected === imageId ? next[0]?.id ?? null : selected));
      setCoverImageId((cover) => (cover === imageId ? next[0]?.id ?? null : cover));
      return next;
    });
  }

  function setSelectedAsCover() {
    if (!selectedImageId) return;
    setCoverImageId(selectedImageId);
    setImages((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === selectedImageId);
      if (targetIndex <= 0) return prev;
      const next = [...prev];
      const [selected] = next.splice(targetIndex, 1);
      next.unshift(selected);
      return next;
    });
  }

  function handleContinueToImages() {
    if (!canSubmitStepOne) return;
    setSubmitError(null);
    setStep(2);
  }

  async function handleSaveImages() {
    if (!canSubmitStepTwo || educationId == null || parsedExperienceYear == null) return;

    setSubmitError(null);

    try {
      let hizmetNr = createdServiceNr;
      if (hizmetNr == null) {
        setIsCreatingService(true);
        const createResponse = await api.post<ServiceCreateResponse>(`/api/services/create?dil=${dil}&kaynak=2`, {
          kategori: category.trim(),
          uzmanlik: expertise.trim(),
          aciklamasi: description.trim(),
          etiket: keyword.trim(),
          belge: documents.trim(),
          tecrubeYil: parsedExperienceYear,
          egitimNr: educationId,
        });

        if (!isSuccessfulStatusCode(createResponse?.StatusCode)) {
          throw new Error(readApiMessage(createResponse, text.createError));
        }

        hizmetNr = resolveCreatedServiceNr(createResponse);
        if (hizmetNr == null) {
          throw new Error(
            lang === "tr"
              ? "Hizmet oluşturuldu ama response.Data.Nr alınamadı."
              : "Service was created but response.Data.Nr could not be resolved."
          );
        }

        setCreatedServiceNr(hizmetNr);
        setSuccessMessage(readApiMessage(createResponse, text.successDesc));
      }

      setIsCreatingService(false);
      setIsSavingImages(true);
      const orderedImages = coverImageId
        ? [
            ...images.filter((item) => item.id === coverImageId),
            ...images.filter((item) => item.id !== coverImageId),
          ]
        : images;

      const formData = new FormData();
      formData.append("HizmetNr", String(hizmetNr));
      formData.append("IsDefault", "true");
      formData.append("FirstHizmetResimNr", "0");
      orderedImages.forEach((image) => {
        formData.append("AddFiles", image.file, image.file.name);
      });

      const response = await api.postForm<ApiActionResponse>(
        `/api/services/images/save-all?dil=${dil}&kaynak=2`,
        formData
      );
      if (hasApiStatusCode(response) && !isSuccessfulStatusCode(response.StatusCode)) {
        throw new Error(readApiMessage(response, text.imageSaveError));
      }

      setSuccessMessage((prev) => prev ?? text.successDesc);
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(String(err?.message ?? (createdServiceNr == null ? text.createError : text.imageSaveError)));
    } finally {
      setIsCreatingService(false);
      setIsSavingImages(false);
    }
  }

  const gridItems = useMemo(
    () => Array.from({ length: IMAGE_MAX_COUNT }, (_, index) => images[index] ?? null),
    [images]
  );

  return (
    <div className="min-h-screen bg-[rgba(30,41,59,0.30)] px-4 py-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-48px)] place-items-center">
        <form className="w-full max-w-[800px] rounded-[20px] border border-[#d6d9df] bg-[#f5f5f6] p-5 shadow-2xl lg:p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#d7dae0] bg-[#f2f3f5] text-[#111827]">
              {step === 1 ? <Briefcase size={20} /> : <ImagePlus size={20} />}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="relative h-14 w-14 rounded-full p-1 shadow"
                aria-label={`${text.stepCounter} ${step}/2`}
                title={`${text.stepCounter} ${step}/2`}
                style={{
                  background: `conic-gradient(var(--gtg-orange) ${stepProgress}%, var(--gtg-blue) ${stepProgress}% 100%)`,
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-[var(--gtg-blue)] text-white">
                  <span className="text-[17px] font-semibold leading-none">{step}/2</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(returnPath)}
                className="grid h-9 w-9 place-items-center rounded-full text-[#6b7280] transition hover:bg-[#eceff4]"
                aria-label={text.close}
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <h1 className="text-[30px] font-semibold text-[#2b3038]">
            {step === 1 ? text.title : text.imageTitle}
          </h1>
          <p className="mt-1 max-w-[680px] text-[13px] leading-[1.45] text-[#8b95a7]">
            {step === 1 ? text.subtitle : text.imageSubtitle}
          </p>

          {submitError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                    {text.category}*
                  </label>
                  <div className="relative">
                    <input
                      value={category}
                      onChange={(event) => setCategory(event.target.value.slice(0, CATEGORY_MAX))}
                      placeholder={text.categoryPlaceholder}
                      className={inputClass}
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                      {category.length}/{CATEGORY_MAX}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                    {text.expertise}*
                  </label>
                  <div className="relative">
                    <input
                      value={expertise}
                      onChange={(event) => setExpertise(event.target.value.slice(0, EXPERTISE_MAX))}
                      placeholder={text.expertisePlaceholder}
                      className={inputClass}
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                      {expertise.length}/{EXPERTISE_MAX}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.description}*
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX))}
                    placeholder={text.descriptionPlaceholder}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 pr-20 text-[14px] leading-[1.35] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.keyword}*
                </label>
                <div className="relative">
                  <textarea
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value.slice(0, KEYWORD_MAX))}
                    placeholder={text.keywordPlaceholder}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 pr-20 text-[14px] leading-[1.35] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {keyword.length}/{KEYWORD_MAX}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.documents}*
                </label>
                <div className="relative">
                  <textarea
                    value={documents}
                    onChange={(event) => setDocuments(event.target.value.slice(0, DOCUMENT_MAX))}
                    placeholder={text.documentsPlaceholder}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 pr-20 text-[14px] leading-[1.35] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {documents.length}/{DOCUMENT_MAX}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                    {text.experience}*
                  </label>
                  <input
                    value={experienceYear}
                    onChange={(event) => setExperienceYear(normalizeExperienceInput(event.target.value))}
                    placeholder={text.experiencePlaceholder}
                    className={inputClass}
                  />
                  {experienceYear.trim() !== "" && parsedExperienceYear == null ? (
                    <p className="mt-1 text-xs text-red-600">{text.experienceInvalid}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                    {text.education}*
                  </label>
                  <div className="relative">
                    <select
                      value={educationId == null ? "" : String(educationId)}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEducationId(value === "" ? null : Number(value));
                      }}
                      disabled={educationsLoading}
                      className={`${inputClass} appearance-none pr-10 ${educationsLoading ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <option value="">
                        {educationsLoading ? text.educationLoading : text.educationPlaceholder}
                      </option>
                      {educations.map((item) => (
                        <option key={item.Id} value={item.Id}>
                          {item.EgitimAdi ?? ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                    />
                  </div>
                  {educationsError ? <p className="mt-1 text-xs text-red-600">{educationsError}</p> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 border-t border-[#d9dde4] pt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                multiple
                className="hidden"
                onChange={(event) => {
                  const fileList = event.target.files;
                  if (fileList && fileList.length > 0) {
                    appendFiles(Array.from(fileList));
                  }
                  event.currentTarget.value = "";
                }}
              />

              <div className="grid items-center gap-3 lg:grid-cols-[124px_1fr_auto]">
                <label className="text-[14px] font-semibold text-[#2f3442]">{text.imageLabel}*</label>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (images.length < IMAGE_MAX_COUNT) setIsDraggingFiles(true);
                  }}
                  onDragLeave={() => setIsDraggingFiles(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingFiles(false);
                    if (images.length >= IMAGE_MAX_COUNT) {
                      setImageValidationMessage(imageValidationText.limitExceeded);
                      return;
                    }
                    appendFiles(Array.from(event.dataTransfer.files || []));
                  }}
                  className={`rounded-xl border border-[#ccd1da] px-3.5 py-2.5 text-center ${
                    isDraggingFiles ? "bg-[#fff5e6]" : "bg-[#f6f7f8]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={images.length >= IMAGE_MAX_COUNT}
                    className="text-[18px] font-semibold text-[var(--gtg-orange)]"
                  >
                    {text.imageUploadPrimary}
                  </button>
                  <span className="mx-1 text-[18px] text-[#4b5563]">{text.imageUploadSecondary}</span>
                  <div className="mt-1 text-[12px] text-[#6b7280]">{text.imageUploadHint}</div>
                  {imageValidationMessage ? (
                    <p className="mt-1 text-[12px] text-red-600">{imageValidationMessage}</p>
                  ) : null}
                </div>
                <div className="inline-flex h-8 min-w-[58px] items-center justify-center rounded-lg bg-[#7b7b7b] px-3 text-[12px] font-semibold text-white">
                  {images.length}/{IMAGE_MAX_COUNT}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {gridItems.map((imageItem, index) =>
                  imageItem ? (
                    <div
                      key={imageItem.id}
                      onClick={() => setSelectedImageId(imageItem.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedImageId(imageItem.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group relative h-28 overflow-hidden rounded-xl border-2 ${
                        coverImageId === imageItem.id
                          ? "border-4 border-[var(--gtg-orange)] shadow-[0_0_0_2px_rgba(255,165,0,0.2)]"
                          : selectedImageId === imageItem.id
                          ? "border-[#1b3d91]"
                          : "border-[#d0d5dd]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageItem.previewUrl}
                        alt={imageItem.file.name || `image-${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {coverImageId === imageItem.id ? (
                        <span className="absolute left-2 top-2 rounded-md bg-[var(--gtg-orange)] px-2 py-0.5 text-sm font-extrabold text-white shadow">
                          C
                        </span>
                      ) : null}

                      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewImageId(imageItem.id);
                          }}
                          className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black/85"
                          aria-label="Preview image"
                        >
                          <Search size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeImage(imageItem.id);
                          }}
                          className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white transition hover:bg-black/85"
                          aria-label="Remove image"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      key={`empty-${index}`}
                      type="button"
                      onClick={openFilePicker}
                      disabled={images.length >= IMAGE_MAX_COUNT}
                      className={`grid h-28 place-items-center rounded-xl border border-dashed border-[#c7ccd5] bg-[#f7f8fa] text-[#9aa1ae] ${
                        images.length >= IMAGE_MAX_COUNT
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-[#f0f3f8]"
                      }`}
                    >
                      <Plus size={30} />
                    </button>
                  )
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!selectedImageId}
                  onClick={setSelectedAsCover}
                  className={`rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition ${
                    selectedImageId
                      ? "border-[#ccd1da] bg-[#f5f5f6] text-[#2f3442] hover:bg-[#eef1f5]"
                      : "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                  }`}
                >
                  {text.coverAction}
                </button>
                {createdServiceNr != null ? (
                  <div className="text-right text-sm text-[#6b7280]">#{createdServiceNr}</div>
                ) : null}
              </div>
            </div>
          )}

          <div className={`mt-6 grid grid-cols-1 gap-3 ${step === 1 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {step === 2 ? (
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setStep(1);
                }}
                className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-4 py-2.5 text-[15px] font-medium text-[#2f3442] transition hover:bg-[#eef1f5]"
              >
                {text.back}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-4 py-2.5 text-[15px] font-medium text-[#6b7280] transition hover:bg-[#eef1f5]"
            >
              {step === 1 ? text.cancel : text.goServices}
            </button>
            <button
              type="button"
              disabled={step === 1 ? !canSubmitStepOne : !canSubmitStepTwo}
              onClick={step === 1 ? handleContinueToImages : handleSaveImages}
              className={`rounded-xl px-4 py-2.5 text-[15px] font-semibold text-white transition ${
                (step === 1 ? canSubmitStepOne : canSubmitStepTwo)
                  ? "bg-[var(--gtg-orange)] hover:brightness-95"
                  : "cursor-not-allowed bg-[#d9dde4]"
              }`}
            >
              {step === 1 ? text.continue : text.save}
            </button>
          </div>
        </form>
      </div>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageId(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#0b1220] p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageId(null)}
              aria-label={text.close}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <X size={16} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.previewUrl}
              alt={previewImage.file.name || "Preview"}
              className="max-h-[86vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {isCreatingService || isSavingImages ? (
        <>
          <GtgLoading isLoading={true} />
          <div className="pointer-events-none fixed inset-0 z-[125]">
            <div className="absolute left-1/2 top-1/2 mt-20 -translate-x-1/2 rounded-full bg-[#101828]/80 px-5 py-2 text-sm font-semibold text-white">
              {isCreatingService ? text.loadingService : text.loadingImages}
            </div>
          </div>
        </>
      ) : null}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-service-result-title"
            className="relative w-full max-w-[660px] rounded-2xl border border-[#d6d9df] bg-[#f5f5f6] p-5 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              aria-label={text.close}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#6b7280] transition hover:bg-[#eceff4]"
            >
              <X size={20} />
            </button>

            <div className="mt-8 flex flex-col items-center">
              <BadgeCheck size={80} className="text-[var(--gtg-orange)]" />
              <h3 id="add-service-result-title" className="mt-4 text-[30px] font-semibold text-[#2b3038]">
                {text.successTitle}
              </h3>
              <p className="mt-2 max-w-[430px] text-center text-[14px] leading-6 text-[#4b5563]">
                {successMessage ?? text.successDesc}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push(returnPath)}
                className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-4 py-2.5 text-[15px] font-semibold text-[#2f3442] transition hover:bg-[#eef1f5]"
              >
                {text.goServices}
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-xl bg-[var(--gtg-orange)] px-4 py-2.5 text-[15px] font-semibold text-white transition hover:brightness-95"
              >
                {text.addAnother}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
