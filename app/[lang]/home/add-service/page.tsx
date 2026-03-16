"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Briefcase, ImagePlus, Plus, Search, X } from "lucide-react";
import { normalizeLang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";

const DESCRIPTION_MAX = 250;
const CATEGORY_MAX_LENGTH = 30;
const CATEGORY_MAX_COUNT = 3;
const EXPERTISE_MAX_LENGTH = 30;
const EXPERTISE_MAX_COUNT = 3;
const DOCUMENT_MAX_LENGTH = 50;
const DOCUMENT_MAX_COUNT = 5;
const EXPERIENCE_MAX_LENGTH = 7;
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

function isValidImageType(file: File): boolean {
  const type = file.type.toLowerCase();
  if (ALLOWED_IMAGE_TYPES.has(type)) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_IMAGE_EXTENSIONS.has(extension) : false;
}

function isValidImageSize(file: File): boolean {
  return file.size <= IMAGE_MAX_SIZE_BYTES;
}

function normalizeToken(value: string): string {
  return value.trim().replace(/^#/, "");
}

function hasEducationId(item: EducationItem): item is EducationItem & { Id: number } {
  return typeof item.Id === "number";
}

function normalizeEducations(data?: EducationsResponse): EducationItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data
    .filter(hasEducationId)
    .sort((a, b) => Number(a.EgitimSira ?? 0) - Number(b.EgitimSira ?? 0));
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

function isValidExperienceValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return false;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric >= 0;
}

export default function AddServicePage() {
  const params = useParams<{ lang?: string | string[] }>();
  const router = useRouter();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = lang === "tr" ? 1 : 2;

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            title: "Hizmet Ekle",
            subtitle: "Hizmet bilgilerinizi girin, g\u00F6rselleri y\u00FCkleyin ve yay\u0131na al\u0131n.",
            category: "Hizmet Kategorileri",
            categoryPlaceholder: "Kategori girin ve Enter'a bas\u0131n",
            categoryRequired: "En az 1 kategori girin.",
            expertise: "Alt Uzmanl\u0131k Alanlar\u0131",
            expertisePlaceholder: "Uzmanl\u0131k alan\u0131 girin ve Enter'a bas\u0131n",
            expertiseRequired: "En az 1 uzmanl\u0131k alan\u0131 girin.",
            description: "Sunulan Hizmetin A\u00E7\u0131klamas\u0131",
            descriptionPlaceholder: "Hizmet a\u00E7\u0131klamas\u0131n\u0131 girin",
            descriptionRequired: "A\u00E7\u0131klama zorunludur.",
            experience: "Tecr\u00FCbe Y\u0131l\u0131",
            experiencePlaceholder: "\u00D6rn. 5",
            experienceRequired: "Tecr\u00FCbe y\u0131l\u0131 zorunludur.",
            experienceInvalid: "Tecr\u00FCbe y\u0131l\u0131 ge\u00E7erli bir say\u0131 olmal\u0131d\u0131r.",
            education: "E\u011Fitim Bilgisi",
            educationSelectPlaceholder: "E\u011Fitim bilgisi se\u00E7in",
            educationLoading: "E\u011Fitimler y\u00FCkleniyor...",
            educationError: "E\u011Fitimler y\u00FCklenemedi.",
            educationRequired: "E\u011Fitim bilgisi zorunludur.",
            documents: "Sertifikalar / Belgeler",
            documentsPlaceholder: "Belge girin ve Enter'a bas\u0131n",
            documentsRequired: "En az 1 belge girin.",
            categoryLimitHint: "En fazla 3 adet / 30 karakter",
            expertiseLimitHint: "En fazla 3 adet / 30 karakter",
            documentsLimitHint: "En fazla 5 adet / 50 karakter",
            cancel: "Vazge\u00E7",
            back: "Geri",
            submit: "Devam Et",
            imageTitle: "Hizmet G\u00F6rseli Ekle",
            imageSubtitle: "Hizmetiniz i\u00E7in en fazla 6 g\u00F6rsel y\u00FCkleyin.",
            imageLabel: "Hizmet G\u00F6rselleri",
            imageUploadPrimary: "Click to upload",
            imageUploadSecondary: "veya s\u00FCr\u00FCkle b\u0131rak",
            imageUploadHint: "PNG, JPG veya GIF (max. 6 adet, her biri max. 5MB)",
            coverAction: "Se\u00E7ili Foto\u011Fraf\u0131 Kapak Yap",
            stepCounter: "Ad\u0131m",
            close: "Kapat",
            loadingService: "Hizmet Ekleniyor.....",
            successTitle: "Tebrikler!",
            successDesc: "Hizmetiniz ba\u015Far\u0131yla eklendi. Daha fazla hizmet eklemeye devam edebilirsiniz.",
            goHome: "Anasayfa",
            viewService: "Hizmeti G\u00F6r",
          }
        : {
            title: "Create Service",
            subtitle: "Enter service details, upload images, and publish.",
            category: "Service Categories",
            categoryPlaceholder: "Type category and press Enter",
            categoryRequired: "Enter at least 1 category.",
            expertise: "Sub Expertise Areas",
            expertisePlaceholder: "Type expertise area and press Enter",
            expertiseRequired: "Enter at least 1 expertise area.",
            description: "Service Description",
            descriptionPlaceholder: "Describe your service",
            descriptionRequired: "Description is required.",
            experience: "Experience Year",
            experiencePlaceholder: "e.g. 5",
            experienceRequired: "Experience year is required.",
            experienceInvalid: "Experience year must be a valid number.",
            education: "Education",
            educationSelectPlaceholder: "Select education",
            educationLoading: "Loading educations...",
            educationError: "Failed to load educations.",
            educationRequired: "Education is required.",
            documents: "Certificates / Documents",
            documentsPlaceholder: "Type document and press Enter",
            documentsRequired: "Enter at least 1 document.",
            categoryLimitHint: "Up to 3 items / 30 chars",
            expertiseLimitHint: "Up to 3 items / 30 chars",
            documentsLimitHint: "Up to 5 items / 50 chars",
            cancel: "Cancel",
            back: "Back",
            submit: "Continue",
            imageTitle: "Add Service Images",
            imageSubtitle: "Upload up to 6 images for your service.",
            imageLabel: "Service Images",
            imageUploadPrimary: "Click to upload",
            imageUploadSecondary: "or drag and drop",
            imageUploadHint: "PNG, JPG or GIF (max. 6 files, up to 5MB each)",
            coverAction: "Set Selected as Cover",
            stepCounter: "Step",
            close: "Close",
            loadingService: "Adding Service.....",
            successTitle: "Congratulations!",
            successDesc: "Your service has been added successfully. You can continue adding more services.",
            goHome: "Home",
            viewService: "View Service",
          },
    [lang]
  );

  const imageValidationText = useMemo(
    () =>
      lang === "tr"
        ? {
            invalidType: "Sadece PNG, JPG veya GIF dosyalar\u0131 y\u00FCklenebilir.",
            invalidSize: `Her dosya en fazla ${IMAGE_MAX_SIZE_MB}MB olabilir.`,
            limitExceeded: `En fazla ${IMAGE_MAX_COUNT} g\u00F6rsel y\u00FCkleyebilirsiniz.`,
          }
        : {
            invalidType: "Only PNG, JPG or GIF files are allowed.",
            invalidSize: `Each file can be up to ${IMAGE_MAX_SIZE_MB}MB.`,
            limitExceeded: `You can upload up to ${IMAGE_MAX_COUNT} images.`,
          },
    [lang]
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [experienceYear, setExperienceYear] = useState("");
  const [educationId, setEducationId] = useState<number | null>(null);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [educationsLoading, setEducationsLoading] = useState(true);
  const [educationsError, setEducationsError] = useState<string | null>(null);
  const [documentInput, setDocumentInput] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);

  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<UploadImageItem[]>([]);
  const submitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imageRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
      if (submitTimerRef.current != null) {
        window.clearTimeout(submitTimerRef.current);
      }
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
        const list = normalizeEducations(data);
        setEducations(list);
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

  const hasDescription = description.trim() !== "";
  const hasExperience = experienceYear.trim() !== "";
  const hasValidExperience = isValidExperienceValue(experienceYear);
  const hasEducation = educationId != null;
  const canSubmitStepOne =
    categories.length > 0 &&
    expertiseAreas.length > 0 &&
    documents.length > 0 &&
    hasDescription &&
    hasExperience &&
    hasValidExperience &&
    hasEducation;
  const canContinueStepTwo = images.length > 0;
  const stepProgress = step === 1 ? 50 : 100;

  const inputClass =
    "w-full rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-4 py-3 text-[15px] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]";

  function addCategory() {
    const normalized = normalizeToken(categoryInput);
    if (!normalized) return;
    if (categories.length >= CATEGORY_MAX_COUNT) {
      setCategoryInput("");
      return;
    }
    if (categories.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setCategoryInput("");
      return;
    }
    setCategories((prev) => [...prev, normalized]);
    setCategoryInput("");
  }

  function addExpertise() {
    const normalized = normalizeToken(expertiseInput);
    if (!normalized) return;
    if (expertiseAreas.length >= EXPERTISE_MAX_COUNT) {
      setExpertiseInput("");
      return;
    }
    if (expertiseAreas.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setExpertiseInput("");
      return;
    }
    setExpertiseAreas((prev) => [...prev, normalized]);
    setExpertiseInput("");
  }

  function addDocument() {
    const normalized = normalizeToken(documentInput);
    if (!normalized) return;
    if (documents.length >= DOCUMENT_MAX_COUNT) {
      setDocumentInput("");
      return;
    }
    if (documents.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setDocumentInput("");
      return;
    }
    setDocuments((prev) => [...prev, normalized]);
    setDocumentInput("");
  }

  function removeCategory(value: string) {
    setCategories((prev) => prev.filter((item) => item !== value));
  }

  function removeExpertise(value: string) {
    setExpertiseAreas((prev) => prev.filter((item) => item !== value));
  }

  function removeDocument(value: string) {
    setDocuments((prev) => prev.filter((item) => item !== value));
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
    const invalidSizeCount = fileList.filter(
      (file) => isValidImageType(file) && !isValidImageSize(file)
    ).length;
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
    setSelectedImageId(selectedImageId);
  }

  function handleCompleteStepTwo() {
    if (!canContinueStepTwo || isSubmittingService) return;

    setPreviewImageId(null);
    setShowSuccessModal(false);
    setIsSubmittingService(true);

    if (submitTimerRef.current != null) {
      window.clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = window.setTimeout(() => {
      setIsSubmittingService(false);
      setShowSuccessModal(true);
      submitTimerRef.current = null;
    }, 4000);
  }

  const gridItems = useMemo(
    () => Array.from({ length: IMAGE_MAX_COUNT }, (_, index) => images[index] ?? null),
    [images]
  );

  return (
    <div className="min-h-screen bg-[rgba(30,41,59,0.30)] px-4 py-8 lg:px-10">
      <div className="grid min-h-[calc(100vh-64px)] place-items-center">
        <form className="w-full max-w-[860px] rounded-[22px] border border-[#d6d9df] bg-[#f5f5f6] p-6 shadow-2xl lg:p-8">
          <div className="mb-4 flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#d7dae0] bg-[#f2f3f5] text-[#111827]">
              {step === 1 ? <Briefcase size={22} /> : <ImagePlus size={22} />}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="relative h-16 w-16 rounded-full p-[5px] shadow"
                aria-label={`${text.stepCounter} ${step}/2`}
                title={`${text.stepCounter} ${step}/2`}
                style={{
                  background: `conic-gradient(var(--gtg-orange) ${stepProgress}%, var(--gtg-blue) ${stepProgress}% 100%)`,
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-[var(--gtg-blue)] text-white">
                  <span className="text-[19px] font-semibold leading-none">{step}/2</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${lang}/home/services`)}
                className="grid h-10 w-10 place-items-center rounded-full text-[#6b7280] transition hover:bg-[#eceff4]"
                aria-label={text.close}
              >
                <X size={26} />
              </button>
            </div>
          </div>

          <h1 className="text-[36px] font-semibold text-[#2b3038]">
            {step === 1 ? text.title : text.imageTitle}
          </h1>
          <p className="mt-1 max-w-[700px] text-[14px] leading-[1.4] text-[#8b95a7]">
            {step === 1 ? text.subtitle : text.imageSubtitle}
          </p>

          {step === 1 ? (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.category}*
                </label>
                <div className="relative">
                  <input
                    value={categoryInput}
                    onChange={(event) =>
                      setCategoryInput(event.target.value.slice(0, CATEGORY_MAX_LENGTH))
                    }
                    disabled={categories.length >= CATEGORY_MAX_COUNT}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addCategory();
                      }
                    }}
                    placeholder={text.categoryPlaceholder}
                    className={`${inputClass} ${categories.length >= CATEGORY_MAX_COUNT ? "cursor-not-allowed opacity-70" : ""}`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {categoryInput.length}/{CATEGORY_MAX_LENGTH}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#7b8390]">{text.categoryLimitHint}</p>
                {categories.length === 0 ? <p className="mt-1 text-xs text-red-600">{text.categoryRequired}</p> : null}
                {categories.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#eceff3] px-3 py-1.5 text-[14px] font-medium text-[#2f3442]"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeCategory(item)}
                          className="grid h-4 w-4 place-items-center rounded-full bg-black text-[10px] font-bold text-white"
                          aria-label={`Remove ${item}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.expertise}*
                </label>
                <div className="relative">
                  <input
                    value={expertiseInput}
                    onChange={(event) =>
                      setExpertiseInput(event.target.value.slice(0, EXPERTISE_MAX_LENGTH))
                    }
                    disabled={expertiseAreas.length >= EXPERTISE_MAX_COUNT}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addExpertise();
                      }
                    }}
                    placeholder={text.expertisePlaceholder}
                    className={`${inputClass} ${expertiseAreas.length >= EXPERTISE_MAX_COUNT ? "cursor-not-allowed opacity-70" : ""}`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {expertiseInput.length}/{EXPERTISE_MAX_LENGTH}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#7b8390]">{text.expertiseLimitHint}</p>
                {expertiseAreas.length === 0 ? (
                  <p className="mt-1 text-xs text-red-600">{text.expertiseRequired}</p>
                ) : null}
                {expertiseAreas.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {expertiseAreas.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#eceff3] px-3 py-1.5 text-[14px] font-medium text-[#2f3442]"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeExpertise(item)}
                          className="grid h-4 w-4 place-items-center rounded-full bg-black text-[10px] font-bold text-white"
                          aria-label={`Remove ${item}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.description}*</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX))}
                    placeholder={text.descriptionPlaceholder}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-4 py-3 pr-24 text-[15px] leading-[1.35] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
                {!hasDescription ? <p className="mt-1 text-xs text-red-600">{text.descriptionRequired}</p> : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.experience}*</label>
                  <input
                    value={experienceYear}
                    onChange={(event) => setExperienceYear(normalizeExperienceInput(event.target.value))}
                    placeholder={text.experiencePlaceholder}
                    className={inputClass}
                  />
                  {!hasExperience ? (
                    <p className="mt-1 text-xs text-red-600">{text.experienceRequired}</p>
                  ) : !hasValidExperience ? (
                    <p className="mt-1 text-xs text-red-600">{text.experienceInvalid}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.education}*</label>
                  <select
                    value={educationId == null ? "" : String(educationId)}
                    onChange={(event) => {
                      const value = event.target.value;
                      setEducationId(value === "" ? null : Number(value));
                    }}
                    disabled={educationsLoading}
                    className={`${inputClass} ${educationsLoading ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <option value="">
                      {educationsLoading ? text.educationLoading : text.educationSelectPlaceholder}
                    </option>
                    {educations.map((item) => (
                      <option key={item.Id} value={item.Id}>
                        {item.EgitimAdi ?? ""}
                      </option>
                    ))}
                  </select>
                  {educationsError ? <p className="mt-1 text-xs text-red-600">{educationsError}</p> : null}
                  {!educationsLoading && !hasEducation ? (
                    <p className="mt-1 text-xs text-red-600">{text.educationRequired}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.documents}*
                </label>
                <div className="relative">
                  <input
                    value={documentInput}
                    onChange={(event) =>
                      setDocumentInput(event.target.value.slice(0, DOCUMENT_MAX_LENGTH))
                    }
                    disabled={documents.length >= DOCUMENT_MAX_COUNT}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addDocument();
                      }
                    }}
                    placeholder={text.documentsPlaceholder}
                    className={`${inputClass} ${documents.length >= DOCUMENT_MAX_COUNT ? "cursor-not-allowed opacity-70" : ""}`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {documentInput.length}/{DOCUMENT_MAX_LENGTH}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#7b8390]">{text.documentsLimitHint}</p>
                {documents.length === 0 ? (
                  <p className="mt-1 text-xs text-red-600">{text.documentsRequired}</p>
                ) : null}
                {documents.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {documents.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#eceff3] px-3 py-1.5 text-[14px] font-medium text-[#2f3442]"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeDocument(item)}
                          className="grid h-4 w-4 place-items-center rounded-full bg-black text-[10px] font-bold text-white"
                          aria-label={`Remove ${item}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-6 border-t border-[#d9dde4] pt-5">
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

              <div className="grid items-center gap-3 lg:grid-cols-[140px_1fr_auto]">
                <label className="text-[15px] font-semibold text-[#2f3442]">{text.imageLabel}*</label>
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
                  className={`rounded-xl border border-[#ccd1da] px-4 py-3 text-center ${
                    isDraggingFiles ? "bg-[#fff5e6]" : "bg-[#f6f7f8]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={images.length >= IMAGE_MAX_COUNT}
                    className="text-[22px] font-semibold text-[var(--gtg-orange)]"
                  >
                    {text.imageUploadPrimary}
                  </button>
                  <span className="mx-1 text-[22px] text-[#4b5563]">{text.imageUploadSecondary}</span>
                  <div className="mt-1 text-[13px] text-[#6b7280]">{text.imageUploadHint}</div>
                  {imageValidationMessage ? (
                    <p className="mt-1 text-[12px] text-red-600">{imageValidationMessage}</p>
                  ) : null}
                </div>
                <div className="inline-flex h-9 min-w-[64px] items-center justify-center rounded-lg bg-[#7b7b7b] px-3 text-[13px] font-semibold text-white">
                  {images.length}/{IMAGE_MAX_COUNT}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                {gridItems.map((imageItem, index) =>
                  imageItem ? (
                    <div
                      key={imageItem.id}
                      onClick={() => {
                        setSelectedImageId(imageItem.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedImageId(imageItem.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group relative h-32 overflow-hidden rounded-xl border-2 ${
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
                      className={`grid h-32 place-items-center rounded-xl border border-dashed border-[#c7ccd5] bg-[#f7f8fa] text-[#9aa1ae] ${
                        images.length >= IMAGE_MAX_COUNT
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-[#f0f3f8]"
                      }`}
                    >
                      <Plus size={34} />
                    </button>
                  )
                )}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  disabled={!selectedImageId}
                  onClick={setSelectedAsCover}
                  className={`rounded-xl border px-4 py-2.5 text-[14px] font-semibold transition ${
                    selectedImageId
                      ? "border-[#ccd1da] bg-[#f5f5f6] text-[#2f3442] hover:bg-[#eef1f5]"
                      : "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                  }`}
                >
                  {text.coverAction}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/${lang}/home/services`)}
                  className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-5 py-3 text-[16px] font-medium text-[#6b7280] transition hover:bg-[#eef1f5]"
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  disabled={!canSubmitStepOne}
                  onClick={() => setStep(2)}
                  className={`rounded-xl px-5 py-3 text-[16px] font-semibold text-white transition ${
                    canSubmitStepOne
                      ? "bg-[var(--gtg-orange)] hover:brightness-95"
                      : "cursor-not-allowed bg-[#d9dde4]"
                  }`}
                >
                  {text.submit}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-5 py-3 text-[16px] font-semibold text-[#2f3442] transition hover:bg-[#eef1f5]"
                >
                  {text.back}
                </button>
                <button
                  type="button"
                  disabled={!canContinueStepTwo || isSubmittingService}
                  onClick={handleCompleteStepTwo}
                  className={`rounded-xl px-5 py-3 text-[16px] font-semibold text-white transition ${
                    canContinueStepTwo && !isSubmittingService
                      ? "bg-[var(--gtg-orange)] hover:brightness-95"
                      : "cursor-not-allowed bg-[#d9dde4]"
                  }`}
                >
                  {text.submit}
                </button>
              </>
            )}
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
            className="relative w-full max-w-5xl rounded-2xl bg-[#0b1220] p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageId(null)}
              aria-label={text.close}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <X size={18} />
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

      {isSubmittingService ? (
        <>
          <GtgLoading isLoading={true} />
          <div className="pointer-events-none fixed inset-0 z-[125]">
            <div className="absolute left-1/2 top-1/2 mt-20 -translate-x-1/2 rounded-full bg-[#101828]/80 px-5 py-2 text-sm font-semibold text-white">
              {text.loadingService}
            </div>
          </div>
        </>
      ) : null}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4">
          <div className="relative w-full max-w-[720px] rounded-2xl border border-[#d6d9df] bg-[#f5f5f6] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              aria-label={text.close}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#6b7280] transition hover:bg-[#eceff4]"
            >
              <X size={24} />
            </button>

            <div className="mt-8 flex flex-col items-center">
              <BadgeCheck size={92} className="text-[var(--gtg-orange)]" />
              <h3 className="mt-5 text-[36px] font-semibold text-[#2b3038]">{text.successTitle}</h3>
              <p className="mt-2 max-w-[460px] text-center text-[15px] leading-6 text-[#4b5563]">
                {text.successDesc}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push(`/${lang}/home/services`)}
                className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-5 py-3 text-[16px] font-semibold text-[#2f3442] transition hover:bg-[#eef1f5]"
              >
                {text.goHome}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${lang}/home/services`)}
                className="rounded-xl bg-[var(--gtg-orange)] px-5 py-3 text-[16px] font-semibold text-white transition hover:brightness-95"
              >
                {text.viewService}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

