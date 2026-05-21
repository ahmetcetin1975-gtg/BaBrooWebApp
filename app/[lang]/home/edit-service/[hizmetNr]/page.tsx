"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, BadgeCheck, ChevronDown, ChevronRight, Image as ImageIcon, Plus, Search, X } from "lucide-react";
import clsx from "clsx";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";
import { getMessages } from "@/lib/i18n/messages";
import {
  readSelectedServiceNrCookie,
  setSelectedServiceNrCookie,
  toPositiveServiceNr as toSelectedServiceNr,
} from "@/lib/services/selection";

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

type EducationItem = {
  Id?: number;
  EgitimAdi?: string;
  EgitimSira?: number;
};

type EducationsResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: EducationItem[] | null;
};

type ServiceDetailData = {
  Nr: number;
  HizmetMusteriNr: number;
  MusteriAdi?: string;
  MusteriSoyadi?: string;
  MusteriEmail?: string;
  MusteriTel?: string;
  Kategori?: string;
  Uzmanlik?: string;
  Aciklama?: string;
  Etiket?: string;
  Belge?: string;
  HizmetTecrubeYil?: number;
  EgitimAdi?: string;
  HizmetFavcount?: number;
  HizmetBakcount?: number;
  HizmetOnay?: boolean;
  HizmetResimUrl?: string | null;
  Favorimi?: boolean;
};

type ServiceDetailResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ServiceDetailData | null;
};

type ServiceImageItem = {
  Nr: number;
  HizmetresimVarsayilan: boolean;
  ResimUrl: string;
};

type ServiceImagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ServiceImageItem[] | null;
};

type ApiActionResponse = {
  StatusCode?: number;
  Message?: string;
  Error?: string;
  message?: string;
  error?: string;
  raw?: string;
};

type ExistingImageDraft = {
  id: string;
  kind: "existing";
  imageNr: number;
  url: string;
  deleted: boolean;
  isDefault: boolean;
  replaceFile: File | null;
  replacePreviewUrl: string | null;
};

type NewImageDraft = {
  id: string;
  kind: "new";
  file: File;
  previewUrl: string;
};

type ImageDraft = ExistingImageDraft | NewImageDraft;

function normalizeEducations(data?: EducationsResponse): EducationItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data
    .filter((item): item is EducationItem & { Id: number } => typeof item?.Id === "number")
    .sort((left, right) => Number(left.EgitimSira ?? 0) - Number(right.EgitimSira ?? 0));
}

function normalizeEducationName(value: string | null | undefined, lang: string): string {
  return (value ?? "").trim().toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US");
}

function resolveEducationId(
  detail: ServiceDetailData | null,
  educations: EducationItem[],
  lang: string
): number | null {
  const normalizedDetailEducation = normalizeEducationName(detail?.EgitimAdi, lang);
  if (!normalizedDetailEducation) return null;
  const matched = educations.find(
    (item) => normalizeEducationName(item.EgitimAdi, lang) === normalizedDetailEducation
  );
  return typeof matched?.Id === "number" ? matched.Id : null;
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

function createImageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isVisibleImage(item: ImageDraft): boolean {
  return item.kind === "new" || !item.deleted;
}

function getImagePreviewUrl(item: ImageDraft): string {
  return item.kind === "new" ? item.previewUrl : item.replacePreviewUrl ?? item.url;
}

function revokeImagePreview(item: ImageDraft) {
  if (item.kind === "new") {
    URL.revokeObjectURL(item.previewUrl);
    return;
  }
  if (item.replacePreviewUrl) {
    URL.revokeObjectURL(item.replacePreviewUrl);
  }
}

function normalizeInitialImages(data: ServiceImagesResponse | undefined): ExistingImageDraft[] {
  if (!Array.isArray(data?.Data)) return [];

  return data.Data
    .filter((item) => typeof item?.ResimUrl === "string" && item.ResimUrl.trim() !== "")
    .sort((left, right) => Number(Boolean(right?.HizmetresimVarsayilan)) - Number(Boolean(left?.HizmetresimVarsayilan)))
    .map((item) => ({
      id: `existing-${item.Nr}`,
      kind: "existing" as const,
      imageNr: item.Nr,
      url: item.ResimUrl.trim(),
      deleted: false,
      isDefault: Boolean(item.HizmetresimVarsayilan),
      replaceFile: null,
      replacePreviewUrl: null,
    }));
}

async function cloneRemoteImageAsFile(url: string, fallbackName: string): Promise<File> {
  const res = await fetch(`/api/services/images/source-file?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    throw new Error(`Failed to clone image: ${res.status}`);
  }

  const blob = await res.blob();
  const extensionFromUrl = url.split("?")[0]?.split(".").pop()?.trim().toLowerCase();
  const extensionFromType = blob.type.split("/")[1]?.toLowerCase();
  const extension = extensionFromUrl || extensionFromType || "jpg";
  const fileName = `${fallbackName}.${extension}`;
  return new File([blob], fileName, { type: blob.type || `image/${extension}` });
}

export default function EditServicePage() {
  const params = useParams<{ lang?: string | string[]; hizmetNr?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const rawHizmetNr = Array.isArray(params?.hizmetNr) ? params.hizmetNr[0] : params?.hizmetNr;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const t = getMessages(lang);
  const routeServiceNr = toSelectedServiceNr(rawHizmetNr);
  const fallbackReturnPath = `/${lang}/home/servicedetail`;
  const rawReturnTo = (searchParams.get("returnTo") ?? "").trim();
  const returnPath =
    rawReturnTo.startsWith(`/${lang}/home/servicedetail`) ? `/${lang}/home/servicedetail` :
    rawReturnTo.startsWith(`/${lang}/home/`) ? rawReturnTo : fallbackReturnPath;

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            title: "Hizmet Düzenle",
            subtitle: "Önce hizmet bilgilerini güncelleyin, sonra görselleri düzenleyin.",
            imageTitle: "Hizmet Görselleri",
            imageSubtitle: "Mevcut görselleri silebilir, değiştirebilir veya yeni görsel ekleyebilirsiniz.",
            category: "Kategori",
            categoryPlaceholder: "Kategori girin",
            expertise: "Uzmanlık",
            expertisePlaceholder: "Uzmanlık alanını girin",
            description: "Açıklama",
            descriptionPlaceholder: "Hizmet açıklamasını girin",
            keyword: "Anahtar Kelime",
            keywordPlaceholder: "Anahtar kelimeleri virgülle ayırarak giriniz...",
            documents: "Belge & Sertifikalar",
            documentsPlaceholder: "Belge ve sertifikaları virgülle ayırarak giriniz...",
            experience: "Tecrübe Yılı",
            experiencePlaceholder: "Örn. 5.5",
            experienceInvalid: "Tecrübe yılı geçerli bir sayı olmalıdır.",
            education: "Eğitim",
            educationPlaceholder: "Eğitim seçin",
            educationLoading: "Eğitimler yükleniyor...",
            educationError: "Eğitimler yüklenemedi.",
            imageLabel: "Hizmet Görselleri",
            imageUploadPrimary: "Yeni görsel ekle",
            imageUploadSecondary: "veya sürükleyip bırakın",
            imageUploadHint: "PNG, JPG veya GIF (en fazla 6 dosya, her biri en fazla 5MB)",
            coverAction: "Seçili Görseli Kapak Yap",
            replaceAction: "Seçili Görseli Değiştir",
            replaceDisabled: "Sadece mevcut görseller değiştirilebilir.",
            existingBadge: "Mevcut",
            newBadge: "Yeni",
            coverBadge: "C",
            cancel: "Vazgeç",
            back: "Geri",
            continue: "Devam Et",
            save: "Kaydet",
            goDetail: "Hizmet Detayına Dön",
            close: "Kapat",
            stepCounter: "Adım",
            loadingPage: "Hizmet düzenleme ekranı yükleniyor...",
            loadingService: "Hizmet güncelleniyor...",
            loadingImages: "Hizmet görselleri güncelleniyor...",
            loadingSave: "Değişiklikler kaydediliyor...",
            saveError: "Hizmet güncellenemedi.",
            imageSaveError: "Hizmet görselleri güncellenemedi.",
            imageRequired: "En az 1 görsel bırakmalısınız.",
            previewImage: "Görseli büyüt",
            loadError: "Hizmet düzenleme bilgileri yüklenemedi.",
            selectionMissing: "Düzenlenecek hizmet seçimi bulunamadı.",
            detailLabel: "Detay",
            successModalTitle: "Başarılı 🎉",
            successModalDesc: "Kaydınız güncellendi. Denetim tamamlandığında bilgilendirme yapılacak ve ilanınız yayına alınacaktır.",
            errorModalTitle: "Bir hata oluştu",
            stayHere: "Kapat",
          }
        : {
            title: "Edit Service",
            subtitle: "Update the service details first, then manage the images.",
            imageTitle: "Service Images",
            imageSubtitle: "You can delete, replace, or add new images.",
            category: "Category",
            categoryPlaceholder: "Enter category",
            expertise: "Expertise",
            expertisePlaceholder: "Enter expertise",
            description: "Description",
            descriptionPlaceholder: "Enter service description",
            keyword: "Keywords",
            keywordPlaceholder: "Enter keywords separated by commas...",
            documents: "Documents & Certificates",
            documentsPlaceholder: "Enter documents and certificates separated by commas...",
            experience: "Experience Year",
            experiencePlaceholder: "e.g. 5.5",
            experienceInvalid: "Experience year must be a valid number.",
            education: "Education",
            educationPlaceholder: "Select education",
            educationLoading: "Loading educations...",
            educationError: "Failed to load educations.",
            imageLabel: "Service Images",
            imageUploadPrimary: "Add new image",
            imageUploadSecondary: "or drag and drop",
            imageUploadHint: "PNG, JPG or GIF (up to 6 files, max 5MB each)",
            coverAction: "Set Selected as Cover",
            replaceAction: "Replace Selected Image",
            replaceDisabled: "Only existing images can be replaced.",
            existingBadge: "Existing",
            newBadge: "New",
            coverBadge: "C",
            cancel: "Cancel",
            back: "Back",
            continue: "Continue",
            save: "Save",
            goDetail: "Back to Service Detail",
            close: "Close",
            stepCounter: "Step",
            loadingPage: "Loading service editor...",
            loadingService: "Saving service...",
            loadingImages: "Saving service images...",
            loadingSave: "Saving the changes...",
            saveError: "Failed to save service.",
            imageSaveError: "Failed to save service images.",
            imageRequired: "You must keep at least 1 image.",
            previewImage: "Preview image",
            loadError: "Failed to load service editor data.",
            selectionMissing: "No service selection was found for editing.",
            detailLabel: "Detail",
            successModalTitle: "Success",
            successModalDesc: "Your listing was updated. You will be notified after review is completed and your listing is published.",
            errorModalTitle: "Something went wrong",
            stayHere: "Close",
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
  const [detailSnapshot, setDetailSnapshot] = useState<ServiceDetailData | null>(null);
  const [category, setCategory] = useState("");
  const [expertise, setExpertise] = useState("");
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [documents, setDocuments] = useState("");
  const [experienceYear, setExperienceYear] = useState("");
  const [educationId, setEducationId] = useState<number | null>(null);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [educationsError, setEducationsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [resolvedServiceNr, setResolvedServiceNr] = useState<number | null>(routeServiceNr);
  const [resultModal, setResultModal] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<ImageDraft[]>([]);

  useEffect(() => {
    imageRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imageRef.current.forEach(revokeImagePreview);
    };
  }, []);

  useEffect(() => {
    const nextServiceNr = routeServiceNr ?? readSelectedServiceNrCookie();
    if (nextServiceNr != null) {
      setSelectedServiceNrCookie(nextServiceNr);
      setResolvedServiceNr(nextServiceNr);
      setInitialError(null);
      return;
    }

    setResolvedServiceNr(null);
    setInitialError(text.selectionMissing);
    setLoadingInitial(false);
  }, [routeServiceNr, text.selectionMissing]);

  useEffect(() => {
    if (resolvedServiceNr == null) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingInitial(true);
        setInitialError(null);
        setEducationsError(null);
        setSubmitError(null);

        const [detailData, imageData, educationData] = await Promise.all([
          api.get<ServiceDetailResponse>(`/api/services/detail?hizmetNr=${resolvedServiceNr}&dil=${dil}`),
          api.get<ServiceImagesResponse>(`/api/services/images-unapproved?hizmetNr=${resolvedServiceNr}&dil=${dil}`),
          api.get<EducationsResponse>(`/api/educations?dil=${dil}`),
        ]);

        if (cancelled) return;

        const nextDetail = detailData?.Data ?? null;
        if (!nextDetail) {
          throw new Error(text.loadError);
        }

        const nextEducations = normalizeEducations(educationData);
        const nextImages = normalizeInitialImages(imageData);
        const defaultImageId = nextImages.find((item) => item.isDefault)?.id ?? nextImages[0]?.id ?? null;

        setDetailSnapshot(nextDetail);
        setEducations(nextEducations);
        setCategory((nextDetail.Kategori ?? "").trim());
        setExpertise((nextDetail.Uzmanlik ?? "").trim());
        setDescription((nextDetail.Aciklama ?? "").trim());
        setKeyword((nextDetail.Etiket ?? "").trim());
        setDocuments((nextDetail.Belge ?? "").trim());
        setExperienceYear(
          Number.isFinite(Number(nextDetail.HizmetTecrubeYil)) ? String(nextDetail.HizmetTecrubeYil) : ""
        );
        setEducationId(resolveEducationId(nextDetail, nextEducations, lang));
        setStep(1);
        setImageValidationMessage(null);
        setImages((prev) => {
          prev.forEach(revokeImagePreview);
          return nextImages;
        });
        setSelectedImageId(defaultImageId);
        setCoverImageId(defaultImageId);
        setPreviewImageId(null);
      } catch (err: any) {
        if (cancelled) return;
        setDetailSnapshot(null);
        setEducations([]);
        setImages((prev) => {
          prev.forEach(revokeImagePreview);
          return [];
        });
        setSelectedImageId(null);
        setCoverImageId(null);
        setPreviewImageId(null);
        setInitialError(String(err?.message ?? text.loadError));
      } finally {
        if (!cancelled) {
          setLoadingInitial(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, lang, resolvedServiceNr, text.loadError]);

  useEffect(() => {
    setEducationId((prev) => {
      if (prev != null && educations.some((item) => item.Id === prev)) return prev;
      return resolveEducationId(detailSnapshot, educations, lang);
    });
  }, [detailSnapshot, educations, lang]);

  const visibleImages = useMemo(() => images.filter(isVisibleImage), [images]);

  useEffect(() => {
    if (visibleImages.length === 0) {
      setSelectedImageId(null);
      setCoverImageId(null);
      setPreviewImageId(null);
      return;
    }

    if (!selectedImageId || !visibleImages.some((item) => item.id === selectedImageId)) {
      setSelectedImageId(visibleImages[0]?.id ?? null);
    }
    if (!coverImageId || !visibleImages.some((item) => item.id === coverImageId)) {
      setCoverImageId(visibleImages[0]?.id ?? null);
    }
  }, [coverImageId, selectedImageId, visibleImages]);

  useEffect(() => {
    if (!previewImageId) return;
    if (visibleImages.some((item) => item.id === previewImageId)) return;
    setPreviewImageId(null);
  }, [previewImageId, visibleImages]);

  useEffect(() => {
    if (!previewImageId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImageId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImageId]);

  const previewImage = useMemo(
    () => visibleImages.find((item) => item.id === previewImageId) ?? null,
    [previewImageId, visibleImages]
  );
  const selectedImage = useMemo(
    () => visibleImages.find((item) => item.id === selectedImageId) ?? null,
    [selectedImageId, visibleImages]
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
    !isSavingService;

  const canSubmitStepTwo = visibleImages.length > 0 && !isSavingService && !isSavingImages;
  const stepProgress = step === 1 ? 50 : 100;
  const gridItems = useMemo(
    () => Array.from({ length: IMAGE_MAX_COUNT }, (_, index) => visibleImages[index] ?? null),
    [visibleImages]
  );
  const inputClass =
    "w-full rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 text-[14px] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]";

  function openAddFilePicker() {
    if (visibleImages.length >= IMAGE_MAX_COUNT) {
      setImageValidationMessage(imageValidationText.limitExceeded);
      return;
    }
    setImageValidationMessage(null);
    addFileInputRef.current?.click();
  }

  function openReplaceFilePicker() {
    if (!selectedImage || selectedImage.kind !== "existing") {
      setImageValidationMessage(text.replaceDisabled);
      return;
    }
    setImageValidationMessage(null);
    replaceFileInputRef.current?.click();
  }

  function appendFiles(fileList: File[]) {
    const room = IMAGE_MAX_COUNT - visibleImages.length;
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

    const created: NewImageDraft[] = accepted.map((file) => ({
      id: createImageId("new"),
      kind: "new",
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...created]);
    setSelectedImageId((prev) => prev ?? created[0]?.id ?? null);
    setCoverImageId((prev) => prev ?? created[0]?.id ?? null);
  }

  function replaceSelectedImage(file: File) {
    if (!selectedImage || selectedImage.kind !== "existing") {
      setImageValidationMessage(text.replaceDisabled);
      return;
    }

    if (!isValidImageType(file)) {
      setImageValidationMessage(imageValidationText.invalidType);
      return;
    }
    if (!isValidImageSize(file)) {
      setImageValidationMessage(imageValidationText.invalidSize);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImageValidationMessage(null);
    setImages((prev) =>
      prev.map((item) => {
        if (item.id !== selectedImage.id || item.kind !== "existing") return item;
        if (item.replacePreviewUrl) URL.revokeObjectURL(item.replacePreviewUrl);
        return {
          ...item,
          replaceFile: file,
          replacePreviewUrl: previewUrl,
          deleted: false,
        };
      })
    );
  }

  function removeImage(imageId: string) {
    setImages((prev) =>
      prev.flatMap((item) => {
        if (item.id !== imageId) return [item];

        if (item.kind === "new") {
          URL.revokeObjectURL(item.previewUrl);
          return [];
        }

        if (item.replacePreviewUrl) {
          URL.revokeObjectURL(item.replacePreviewUrl);
        }

        return [
          {
            ...item,
            deleted: true,
            replaceFile: null,
            replacePreviewUrl: null,
          },
        ];
      })
    );
  }

  function setSelectedAsCover() {
    if (!selectedImageId) return;

    setCoverImageId(selectedImageId);
    setImages((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === selectedImageId);
      if (targetIndex <= 0) return prev;
      const next = [...prev];
      const [selectedItem] = next.splice(targetIndex, 1);
      next.unshift(selectedItem);
      return next;
    });
  }

  async function buildImageSaveFormData(): Promise<FormData | null> {
    const activeImages = images.filter(isVisibleImage);
    const firstVisibleImage = activeImages[0] ?? null;
    const activeExistingImages = activeImages.filter((item): item is ExistingImageDraft => item.kind === "existing");
    const defaultExistingImageNr = firstVisibleImage?.kind === "existing" ? firstVisibleImage.imageNr : null;
    const deleteIds = images.flatMap((item) => (item.kind === "existing" && item.deleted ? [item.imageNr] : []));
    const replacementMap = new Map<number, File>();

    images.forEach((item) => {
      if (item.kind === "existing" && !item.deleted && item.replaceFile) {
        replacementMap.set(item.imageNr, item.replaceFile);
      }
    });

    const defaultOrderChanged =
      activeExistingImages.length > 0 &&
      activeExistingImages.some((item) => item.isDefault !== (item.imageNr === defaultExistingImageNr));

    if (defaultOrderChanged) {
      for (const item of activeExistingImages) {
        if (replacementMap.has(item.imageNr)) {
          continue;
        }

        try {
          const clonedFile = await cloneRemoteImageAsFile(item.url, `service-image-${item.imageNr}`);
          replacementMap.set(item.imageNr, clonedFile);
        } catch {
          // Best-effort fallback. Service save continues even if one of the current images cannot be cloned.
        }
      }
    }

    const replacementItems = Array.from(replacementMap.entries())
      .map(([imageNr, file]) => ({
        imageNr,
        file,
        isDefault: imageNr === defaultExistingImageNr,
        visualIndex: activeImages.findIndex((item) => item.kind === "existing" && item.imageNr === imageNr),
      }))
      .sort((left, right) => {
        if (left.visualIndex !== right.visualIndex) {
          return left.visualIndex - right.visualIndex;
        }
        return Number(right.isDefault) - Number(left.isDefault);
      });

    const orderedAddItems = activeImages.filter((item): item is NewImageDraft => item.kind === "new");

    if (deleteIds.length === 0 && replacementItems.length === 0 && orderedAddItems.length === 0) {
      return null;
    }

    if (resolvedServiceNr == null) {
      return null;
    }

    const formData = new FormData();
    formData.append("HizmetNr", String(resolvedServiceNr));
    deleteIds.forEach((id) => {
      formData.append("DeleteIds", String(id));
    });
    replacementItems.forEach((item, index) => {
      formData.append(`ReplaceItems[${index}].Id`, String(item.imageNr));
      formData.append(`ReplaceItems[${index}].File`, item.file, item.file.name);
      formData.append(`ReplaceItems[${index}].IsDefault`, item.isDefault ? "true" : "false");
    });
    orderedAddItems.forEach((item, index) => {
      formData.append(`AddItems[${index}].File`, item.file, item.file.name);
      formData.append(`AddItems[${index}].IsDefault`, firstVisibleImage?.id === item.id ? "true" : "false");
    });

    return formData;
  }

  async function handleSave() {
    if (resolvedServiceNr == null || educationId == null || !canSubmitStepTwo) {
      return;
    }

    setSubmitError(null);
    setResultModal(null);

    try {
      setIsSavingService(true);
      const saveResponse = await api.post<ApiActionResponse>(
        `/api/services/save?dil=${dil}&kaynak=1`,
        {
          nr: resolvedServiceNr,
          kategori: category.trim(),
          uzmanlik: expertise.trim(),
          aciklamasi: description.trim(),
          etiket: keyword.trim(),
          belge: documents.trim(),
          tecrubeYil: parsedExperienceYear,
          egitimNr: educationId,
        }
      );

      if (hasApiStatusCode(saveResponse) && !isSuccessfulStatusCode(saveResponse.StatusCode)) {
        throw new Error(readApiMessage(saveResponse, text.saveError));
      }

      const successMessage = readApiMessage(saveResponse, text.successModalDesc);

      setIsSavingService(false);
      const imageFormData = await buildImageSaveFormData();
      if (imageFormData) {
        setIsSavingImages(true);
        const imageSaveResponse = await api.postForm<ApiActionResponse>(
          `/api/services/images/save-all?dil=${dil}&kaynak=2`,
          imageFormData
        );

        if (hasApiStatusCode(imageSaveResponse) && !isSuccessfulStatusCode(imageSaveResponse.StatusCode)) {
          throw new Error(readApiMessage(imageSaveResponse, text.imageSaveError));
        }
      }

      setResultModal({
        kind: "success",
        message: successMessage,
      });
    } catch (err: any) {
      setResultModal({
        kind: "error",
        message: String(err?.message ?? text.imageSaveError),
      });
    } finally {
      setIsSavingImages(false);
    }
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[rgba(30,41,59,0.30)]">
        <GtgLoading isLoading={true} />
        <div className="pointer-events-none fixed inset-0 z-[125]">
          <div className="absolute left-1/2 top-1/2 mt-20 -translate-x-1/2 rounded-full bg-[#101828]/80 px-5 py-2 text-sm font-semibold text-white">
            {text.loadingPage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(30,41,59,0.30)] px-4 py-6 lg:px-8">
      <div className="mx-auto mb-4 flex max-w-[980px] items-center text-[14px] text-white/85">
        <Link href={`/${lang}/home`} className="transition hover:text-white">
          {t.sidebar.items.home}
        </Link>
        <ChevronRight className="mx-1 h-4 w-4" />
        <Link href={`/${lang}/home/myservices`} className="transition hover:text-white">
          {t.sidebar.items.myServices}
        </Link>
        <ChevronRight className="mx-1 h-4 w-4" />
        <Link href={fallbackReturnPath} className="transition hover:text-white">
          {text.detailLabel}
        </Link>
        <ChevronRight className="mx-1 h-4 w-4" />
        <span>{text.title}</span>
      </div>

      <div className="grid place-items-center">
        <form className="w-full max-w-[980px] rounded-[24px] border border-[#d6d9df] bg-[#f5f5f6] p-5 shadow-2xl lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-[#2b3038]">{text.title}</h1>
              <p className="mt-1 text-[14px] text-[#667085]">{step === 1 ? text.subtitle : text.imageSubtitle}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#475467]">
              <span>
                {text.stepCounter} {step}/2
              </span>
              <span>{step === 1 ? text.title : text.imageTitle}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#e5e7eb]">
              <div
                className="h-full rounded-full bg-[var(--gtg-orange)] transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </div>

          {initialError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {initialError}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.category}*</label>
                <div className="relative">
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value.slice(0, CATEGORY_MAX))}
                    placeholder={text.categoryPlaceholder}
                    className={`${inputClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#4b5563]">
                    {category.length}/{CATEGORY_MAX}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.expertise}*</label>
                <div className="relative">
                  <input
                    value={expertise}
                    onChange={(event) => setExpertise(event.target.value.slice(0, EXPERTISE_MAX))}
                    placeholder={text.expertisePlaceholder}
                    className={`${inputClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#4b5563]">
                    {expertise.length}/{EXPERTISE_MAX}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.description}*</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX))}
                    placeholder={text.descriptionPlaceholder}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 pr-20 text-[14px] leading-[1.5] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.keyword}*</label>
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

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.documents}*</label>
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

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.experience}*</label>
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
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.education}*</label>
                <div className="relative">
                  <select
                    value={educationId == null ? "" : String(educationId)}
                    onChange={(event) => {
                      const value = event.target.value;
                      setEducationId(value === "" ? null : Number(value));
                    }}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">{educations.length > 0 ? text.educationPlaceholder : text.educationLoading}</option>
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
          ) : (
            <div className="mt-5 border-t border-[#d9dde4] pt-4">
              <input
                ref={addFileInputRef}
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
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    replaceSelectedImage(file);
                  }
                  event.currentTarget.value = "";
                }}
              />

              <div className="grid items-center gap-3 lg:grid-cols-[124px_1fr_auto]">
                <label className="text-[14px] font-semibold text-[#2f3442]">{text.imageLabel}*</label>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (visibleImages.length < IMAGE_MAX_COUNT) setIsDraggingFiles(true);
                  }}
                  onDragLeave={() => setIsDraggingFiles(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingFiles(false);
                    appendFiles(Array.from(event.dataTransfer.files || []));
                  }}
                  className={`rounded-xl border border-[#ccd1da] px-3.5 py-2.5 text-center ${
                    isDraggingFiles ? "bg-[#fff5e6]" : "bg-[#f6f7f8]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={openAddFilePicker}
                    disabled={visibleImages.length >= IMAGE_MAX_COUNT}
                    className="text-[18px] font-semibold text-[var(--gtg-orange)] disabled:cursor-not-allowed disabled:text-[#9aa3b2]"
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
                  {visibleImages.length}/{IMAGE_MAX_COUNT}
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
                      className={clsx(
                        "group relative h-28 overflow-hidden rounded-xl border-2 bg-white",
                        coverImageId === imageItem.id
                          ? "border-4 border-[var(--gtg-orange)] shadow-[0_0_0_2px_rgba(255,165,0,0.2)]"
                          : selectedImageId === imageItem.id
                          ? "border-[#1b3d91]"
                          : "border-[#d0d5dd]"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImagePreviewUrl(imageItem)}
                        alt={imageItem.kind === "new" ? imageItem.file.name : `service-image-${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute left-2 top-2 flex items-center gap-1">
                        <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#374151] shadow-sm">
                          {imageItem.kind === "existing" ? text.existingBadge : text.newBadge}
                        </span>
                        {coverImageId === imageItem.id ? (
                          <span className="rounded-md bg-[var(--gtg-orange)] px-2 py-0.5 text-[11px] font-extrabold text-white shadow">
                            {text.coverBadge}
                          </span>
                        ) : null}
                      </div>

                      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewImageId(imageItem.id);
                          }}
                          className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black/85"
                          aria-label={text.previewImage}
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
                          aria-label={text.close}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      key={`empty-${index}`}
                      type="button"
                      onClick={openAddFilePicker}
                      disabled={visibleImages.length >= IMAGE_MAX_COUNT}
                      className={`grid h-28 place-items-center rounded-xl border border-dashed border-[#c7ccd5] bg-[#f7f8fa] text-[#9aa1ae] ${
                        visibleImages.length >= IMAGE_MAX_COUNT
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-[#f0f3f8]"
                      }`}
                    >
                      <Plus size={30} />
                    </button>
                  )
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
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
                  <button
                    type="button"
                    disabled={!selectedImage || selectedImage.kind !== "existing"}
                    onClick={openReplaceFilePicker}
                    className={`rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition ${
                      selectedImage && selectedImage.kind === "existing"
                        ? "border-[#ccd1da] bg-[#f5f5f6] text-[#2f3442] hover:bg-[#eef1f5]"
                        : "cursor-not-allowed border-[#d9dde4] bg-[#f2f3f6] text-[#9aa3b2]"
                    }`}
                  >
                    {text.replaceAction}
                  </button>
                </div>
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
              {step === 1 ? text.cancel : text.goDetail}
            </button>

            <button
              type="button"
              disabled={step === 1 ? !canSubmitStepOne : !canSubmitStepTwo}
              onClick={
                step === 1
                  ? () => {
                      setSubmitError(null);
                      setStep(2);
                    }
                  : () => {
                      if (visibleImages.length === 0) {
                        setSubmitError(text.imageRequired);
                        return;
                      }
                      void handleSave();
                    }
              }
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
              src={getImagePreviewUrl(previewImage)}
              alt={previewImage.kind === "new" ? previewImage.file.name : text.previewImage}
              className="max-h-[86vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {isSavingService || isSavingImages ? (
        <>
          <GtgLoading isLoading={true} />
          <div className="pointer-events-none fixed inset-0 z-[125]">
            <div className="absolute left-1/2 top-1/2 mt-20 -translate-x-1/2 rounded-full bg-[#101828]/80 px-5 py-2 text-sm font-semibold text-white">
              {text.loadingSave}
            </div>
          </div>
        </>
      ) : null}

      {resultModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-service-result-title"
            className="relative w-full max-w-[660px] rounded-2xl border border-[#d6d9df] bg-[#f5f5f6] p-5 shadow-2xl"
          >
            {resultModal.kind === "error" ? (
              <button
                type="button"
                onClick={() => setResultModal(null)}
                aria-label={text.close}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#6b7280] transition hover:bg-[#eceff4]"
              >
                <X size={20} />
              </button>
            ) : null}

            <div className="mt-8 flex flex-col items-center">
              {resultModal.kind === "success" ? (
                <BadgeCheck size={80} className="text-[var(--gtg-orange)]" />
              ) : (
                <AlertCircle size={80} className="text-[#dc2626]" />
              )}
              <h3 id="edit-service-result-title" className="mt-4 text-center text-[30px] font-semibold text-[#2b3038]">
                {resultModal.kind === "success" ? text.successModalTitle : text.errorModalTitle}
              </h3>
              <p className="mt-2 max-w-[460px] text-center text-[14px] leading-6 text-[#4b5563]">
                {resultModal.message}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {resultModal.kind === "success" ? (
                <button
                  type="button"
                  onClick={() => {
                    setResultModal(null);
                    router.push(returnPath);
                    router.refresh();
                  }}
                  className="rounded-xl bg-[var(--gtg-orange)] px-4 py-2.5 text-[15px] font-semibold text-white transition hover:brightness-95"
                >
                  {text.goDetail}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setResultModal(null)}
                  className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-4 py-2.5 text-[15px] font-semibold text-[#2f3442] transition hover:bg-[#eef1f5]"
                >
                  {text.stayHere}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
