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
  readSelectedProductNrCookie,
  setSelectedProductNrCookie,
  toPositiveProductNr as toSelectedProductNr,
} from "@/lib/products/selection";

const PRODUCT_NAME_MAX = 100;
const DESCRIPTION_MAX = 600;
const KEYWORD_MAX = 2000;
const IMAGE_MAX_COUNT = 6;
const IMAGE_MAX_SIZE_MB = 5;
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);
const DEFAULT_PRODUCT_VALUES = {
  urunFiyat: 1,
  urunMiktar: 1,
};
const DEFAULT_PRODUCT_IDENTIFIERS = {
  urunBirimNr: 1,
  urunDovizNr: 1,
};

type CountryItem = {
  Id?: number;
  UlkeAdi?: string;
  ResimUrl?: string;
};

type CountriesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CountryItem[] | null;
};

type ProductDetailData = {
  Nr: number;
  UrunMusteriNr: number;
  MusteriAdi?: string;
  MusteriSoyadi?: string;
  UlkeAdi?: string;
  UlkeFlagUrl?: string | null;
  UrunAdi?: string;
  UrunAciklamasi?: string;
  UrunFiyat?: number;
  DovizAdi?: string;
  DovizKisaAdi?: string;
  DovizSembolu?: string;
  UrunMiktar?: number;
  BirimAdi?: string;
  UrunEtiketList?: string;
  UrunIhracatMi?: boolean;
  UrunFavcount?: number;
  UrunBakcount?: number;
  UrunOnay?: boolean;
  UrunResimUrl?: string | null;
  UrunBirimNr?: number;
  UrunDovizNr?: number;
  UrunUlkeNr?: number;
};

type ProductDetailResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ProductDetailData | null;
};

type ProductImageItem = {
  Nr: number;
  UrunresimVarsayilan: boolean;
  ResimUrl: string;
};

type ProductImagesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: ProductImageItem[] | null;
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
function normalizeCountries(data?: CountriesResponse): CountryItem[] {
  if (!Array.isArray(data?.Data)) return [];
  return data.Data.filter((item) => typeof item?.Id === "number");
}

function hasCountryId(item: CountryItem): item is CountryItem & { Id: number } {
  return typeof item.Id === "number";
}

function countryDisplay(item: CountryItem): string {
  return (item.UlkeAdi ?? "").trim() || "-";
}

function normalizeCountryName(value: string | null | undefined, lang: string): string {
  return (value ?? "").trim().toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");
}

function resolveCountryId(detail: ProductDetailData | null, countries: CountryItem[], lang: string): number | null {
  if (!detail) return countries.find(hasCountryId)?.Id ?? null;
  const detailCountryId = Number(detail.UrunUlkeNr);
  if (Number.isInteger(detailCountryId) && detailCountryId > 0 && countries.some((item) => item.Id === detailCountryId)) {
    return detailCountryId;
  }

  const normalizedDetailCountry = normalizeCountryName(detail.UlkeAdi, lang);
  const matchedCountry = countries.find(
    (item) => normalizeCountryName(item.UlkeAdi, lang) === normalizedDetailCountry
  );
  if (matchedCountry && hasCountryId(matchedCountry)) return matchedCountry.Id;

  const defaultCountry = countries.find((item) => item.Id === 1);
  if (defaultCountry && hasCountryId(defaultCountry)) return defaultCountry.Id;

  return countries.find(hasCountryId)?.Id ?? null;
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

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

function normalizeInitialImages(data: ProductImagesResponse | undefined): ExistingImageDraft[] {
  if (!Array.isArray(data?.Data)) return [];

  return data.Data
    .filter((item) => typeof item?.ResimUrl === "string" && item.ResimUrl.trim() !== "")
    .sort((left, right) => Number(Boolean(right?.UrunresimVarsayilan)) - Number(Boolean(left?.UrunresimVarsayilan)))
    .map((item) => ({
      id: `existing-${item.Nr}`,
      kind: "existing" as const,
      imageNr: item.Nr,
      url: item.ResimUrl.trim(),
      deleted: false,
      isDefault: Boolean(item.UrunresimVarsayilan),
      replaceFile: null,
      replacePreviewUrl: null,
    }));
}

async function cloneRemoteImageAsFile(url: string, fallbackName: string): Promise<File> {
  const res = await fetch(`/api/products/images/source-file?url=${encodeURIComponent(url)}`);
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

export default function EditProductPage() {
  const params = useParams<{ lang?: string | string[]; urunNr?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const rawUrunNr = Array.isArray(params?.urunNr) ? params.urunNr[0] : params?.urunNr;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = langToDil(lang);
  const t = getMessages(lang);
  const routeProductNr = toSelectedProductNr(rawUrunNr);
  const fallbackReturnPath = `/${lang}/home/productdetail`;
  const rawReturnTo = (searchParams.get("returnTo") ?? "").trim();
  const returnPath =
    rawReturnTo.startsWith(`/${lang}/home/productdetail`) ? `/${lang}/home/productdetail` :
    rawReturnTo.startsWith(`/${lang}/home/`) ? rawReturnTo : fallbackReturnPath;

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            title: "Ürün Düzenle",
            subtitle: "Önce ürün bilgilerini güncelleyin, sonra görselleri düzenleyin.",
            imageTitle: "Ürün Görselleri",
            imageSubtitle: "Mevcut görselleri silebilir, değiştirebilir veya yeni görsel ekleyebilirsiniz.",
            productName: "Ürün Adı",
            productNamePlaceholder: "Ürün adını girin",
            description: "Açıklama",
            descriptionPlaceholder: "Ürün açıklamasını girin",
            country: "Ülke",
            countryPlaceholder: "Ülke seçin",
            countrySearchPlaceholder: "Ülke ara",
            countryLoading: "Ülkeler yükleniyor...",
            countryError: "Ülkeler yüklenemedi.",
            countryNoResults: "Sonuç bulunamadı.",
            productType: "Ürün Tipi",
            productTypeExport: "İhracat",
            productTypeImport: "İthalat",
            keyword: "Anahtar Kelime",
            keywordPlaceholder: "Anahtar kelimeleri virgülle ayırarak giriniz...",
            imageLabel: "Ürün Görselleri",
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
            goDetail: "Ürün Detayına Dön",
            close: "Kapat",
            stepCounter: "Adım",
            loadingPage: "Ürün düzenleme ekranı yükleniyor...",
            loadingProduct: "Ürün güncelleniyor...",
            loadingImages: "Ürün görselleri güncelleniyor...",
            loadingSave: "Değişiklikler kaydediliyor...",
            saveError: "Ürün güncellenemedi.",
            imageSaveError: "Ürün görselleri güncellenemedi.",
            requiredCountry: "Ülke seçimi zorunludur.",
            imageRequired: "En az 1 görsel bırakmalısınız.",
            previewImage: "Görseli büyüt",
            loadError: "Ürün düzenleme bilgileri yüklenemedi.",
            selectionMissing: "Düzenlenecek ürün seçimi bulunamadı.",
            detailLabel: "Detay",
            successModalTitle: "Başarılı 🎉",
            successModalDesc: "Kaydınız güncellendi. Denetim tamamlandığında bilgilendirme yapılacak ve ilanınız yayına alınacaktır.",
            errorModalTitle: "Bir hata oluştu",
            stayHere: "Kapat",
          }
        : {
            title: "Edit Product",
            subtitle: "Update the product details first, then manage the images.",
            imageTitle: "Product Images",
            imageSubtitle: "You can delete, replace, or add new images.",
            productName: "Product Name",
            productNamePlaceholder: "Enter product name",
            description: "Description",
            descriptionPlaceholder: "Enter product description",
            country: "Country",
            countryPlaceholder: "Select country",
            countrySearchPlaceholder: "Search country",
            countryLoading: "Loading countries...",
            countryError: "Failed to load countries.",
            countryNoResults: "No results found.",
            productType: "Product Type",
            productTypeExport: "Export",
            productTypeImport: "Import",
            keyword: "Keywords",
            keywordPlaceholder: "Enter keywords separated by commas...",
            imageLabel: "Product Images",
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
            goDetail: "Back to Product Detail",
            close: "Close",
            stepCounter: "Step",
            loadingPage: "Loading product editor...",
            loadingProduct: "Saving product...",
            loadingImages: "Saving product images...",
            loadingSave: "Saving the changes...",
            saveError: "Failed to save product.",
            imageSaveError: "Failed to save product images.",
            requiredCountry: "Country selection is required.",
            imageRequired: "You must keep at least 1 image.",
            previewImage: "Preview image",
            loadError: "Failed to load product editor data.",
            selectionMissing: "No product selection was found for editing.",
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
  const [detailSnapshot, setDetailSnapshot] = useState<ProductDetailData | null>(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [productType, setProductType] = useState<"export" | "import">("export");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [resolvedProductNr, setResolvedProductNr] = useState<number | null>(routeProductNr);
  const [resultModal, setResultModal] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const countryMenuRef = useRef<HTMLDivElement | null>(null);
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
    const nextProductNr = routeProductNr ?? readSelectedProductNrCookie();
    if (nextProductNr != null) {
      setSelectedProductNrCookie(nextProductNr);
      setResolvedProductNr(nextProductNr);
      setInitialError(null);
      return;
    }

    setResolvedProductNr(null);
    setInitialError(text.selectionMissing);
    setLoadingInitial(false);
  }, [routeProductNr, text.selectionMissing]);

  useEffect(() => {
    if (resolvedProductNr == null) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingInitial(true);
        setInitialError(null);
        setSubmitError(null);

        const [detailData, imageData, countryData] = await Promise.all([
          api.get<ProductDetailResponse>(`/api/products/detail?urunNr=${resolvedProductNr}&dil=${dil}`),
          api.get<ProductImagesResponse>(`/api/products/images-unapproved?urunNr=${resolvedProductNr}&dil=${dil}`),
          api.get<CountriesResponse>(`/api/countries?dil=${dil}`),
        ]);

        if (cancelled) return;

        const nextDetail = detailData?.Data ?? null;
        if (!nextDetail) {
          throw new Error(text.loadError);
        }

        const nextCountries = normalizeCountries(countryData);
        const nextImages = normalizeInitialImages(imageData);
        const defaultImageId = nextImages.find((item) => item.isDefault)?.id ?? nextImages[0]?.id ?? null;

        setDetailSnapshot(nextDetail);
        setCountries(nextCountries);
        setProductName((nextDetail.UrunAdi ?? "").trim());
        setDescription((nextDetail.UrunAciklamasi ?? "").trim());
        setKeyword((nextDetail.UrunEtiketList ?? "").trim());
        setProductType(nextDetail.UrunIhracatMi ? "export" : "import");
        setCountryId(resolveCountryId(nextDetail, nextCountries, lang));
        setStep(1);
        setCountryMenuOpen(false);
        setCountrySearch("");
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
        setCountries([]);
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
  }, [dil, lang, resolvedProductNr, text.loadError]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!countryMenuRef.current) return;
      if (countryMenuRef.current.contains(event.target as Node)) return;
      setCountryMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!countryMenuOpen) {
      setCountrySearch("");
    }
  }, [countryMenuOpen]);

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

  const selectedCountry = useMemo(
    () => countries.find((item) => item.Id === countryId) ?? null,
    [countries, countryId]
  );
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim();
    if (query === "") return countries;

    const normalizedQuery = query.toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US");
    return countries.filter((item) =>
      countryDisplay(item).toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US").includes(normalizedQuery)
    );
  }, [countries, countrySearch, lang]);
  const previewImage = useMemo(
    () => visibleImages.find((item) => item.id === previewImageId) ?? null,
    [previewImageId, visibleImages]
  );
  const selectedImage = useMemo(
    () => visibleImages.find((item) => item.id === selectedImageId) ?? null,
    [selectedImageId, visibleImages]
  );

  const canSubmitStepOne =
    productName.trim() !== "" &&
    description.trim() !== "" &&
    keyword.trim() !== "" &&
    countryId != null &&
    !isSavingProduct &&
    !isSavingImages;
  const canSubmitStepTwo = visibleImages.length > 0 && !isSavingProduct && !isSavingImages;
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
          const clonedFile = await cloneRemoteImageAsFile(item.url, `product-image-${item.imageNr}`);
          replacementMap.set(item.imageNr, clonedFile);
        } catch {
          // Best-effort fallback. Product save continues even if one of the current images cannot be cloned.
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

    const formData = new FormData();
    if (resolvedProductNr == null) {
      return null;
    }

    formData.append("UrunNr", String(resolvedProductNr));
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
    if (resolvedProductNr == null || countryId == null || !canSubmitStepTwo) {
      return;
    }

    setSubmitError(null);
    setResultModal(null);

    try {
      setIsSavingProduct(true);
      const saveResponse = await api.post<ApiActionResponse>(`/api/products/save?dil=${dil}&kaynak=2`, {
        nr: resolvedProductNr,
        urunAdi: productName.trim(),
        urunAciklama: description.trim(),
        urunEtiket: keyword.trim(),
        urunIhracatMi: productType === "export",
        urunFiyat: Number.isFinite(Number(detailSnapshot?.UrunFiyat))
          ? Number(detailSnapshot?.UrunFiyat)
          : DEFAULT_PRODUCT_VALUES.urunFiyat,
        urunMiktar: Number.isFinite(Number(detailSnapshot?.UrunMiktar))
          ? Number(detailSnapshot?.UrunMiktar)
          : DEFAULT_PRODUCT_VALUES.urunMiktar,
        urunBirimNr: toPositiveInt(detailSnapshot?.UrunBirimNr) ?? DEFAULT_PRODUCT_IDENTIFIERS.urunBirimNr,
        urunDovizNr: toPositiveInt(detailSnapshot?.UrunDovizNr) ?? DEFAULT_PRODUCT_IDENTIFIERS.urunDovizNr,
        urunUlkeNr: countryId,
      });

      if (hasApiStatusCode(saveResponse) && !isSuccessfulStatusCode(saveResponse.StatusCode)) {
        throw new Error(readApiMessage(saveResponse, text.saveError));
      }

      const successMessage = readApiMessage(saveResponse, text.successModalDesc);

      setIsSavingProduct(false);
      const imageFormData = await buildImageSaveFormData();

      if (imageFormData) {
        setIsSavingImages(true);
        const imageSaveResponse = await api.postForm<ApiActionResponse>(
          `/api/products/images/save-all?dil=${dil}&kaynak=2`,
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
        message: String(err?.message ?? text.saveError),
      });
    } finally {
      setIsSavingProduct(false);
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
        <Link href={`/${lang}/home/myproducts`} className="transition hover:text-white">
          {t.sidebar.items.myProducts}
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
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.productName}*
                </label>
                <div className="relative">
                  <input
                    value={productName}
                    onChange={(event) => setProductName(event.target.value.slice(0, PRODUCT_NAME_MAX))}
                    placeholder={text.productNamePlaceholder}
                    className={`${inputClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#4b5563]">
                    {productName.length}/{PRODUCT_NAME_MAX}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.description}*
                </label>
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

              <div ref={countryMenuRef}>
                <label className="mb-2 block text-[14px] font-semibold text-[#2f3442]">{text.country}*</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCountryMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-3.5 py-2.5 text-left text-[14px] text-[#2a313d] transition hover:bg-[#eef1f5]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {selectedCountry?.ResimUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedCountry.ResimUrl}
                          alt={selectedCountry.UlkeAdi ?? "Country"}
                          className="h-5 w-7 rounded-sm border border-black/10 object-cover"
                        />
                      ) : (
                        <span className="h-5 w-7 rounded-sm border border-black/10 bg-[#e5e7eb]" />
                      )}
                      <span className="truncate">
                        {selectedCountry
                          ? countryDisplay(selectedCountry)
                          : countries.length > 0
                          ? text.countryPlaceholder
                          : text.countryLoading}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[#6b7280] transition ${countryMenuOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>

                  {countryMenuOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-auto rounded-xl border border-[#d6d9df] bg-white shadow-xl">
                      <div className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-white p-3">
                        <div className="relative">
                          <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                          />
                          <input
                            value={countrySearch}
                            onChange={(event) => setCountrySearch(event.target.value)}
                            placeholder={text.countrySearchPlaceholder}
                            className="w-full rounded-lg border border-[#d6d9df] bg-[#f6f7f8] py-2 pl-9 pr-3 text-sm text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]"
                          />
                        </div>
                      </div>

                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((item) => {
                          if (!hasCountryId(item)) return null;
                          const selected = item.Id === countryId;
                          return (
                            <button
                              key={item.Id}
                              type="button"
                              onClick={() => {
                                setCountryId(item.Id);
                                setCountryMenuOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] ${
                                selected ? "bg-[#eef1f6] text-[#1f2937]" : "text-[#374151] hover:bg-[#f6f7f9]"
                              }`}
                            >
                              {item.ResimUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.ResimUrl}
                                  alt={item.UlkeAdi ?? "Country"}
                                  className="h-5 w-7 shrink-0 rounded-sm border border-black/10 object-cover"
                                />
                              ) : (
                                <span className="h-5 w-7 shrink-0 rounded-sm border border-black/10 bg-[#e5e7eb]" />
                              )}
                              <span className="truncate">{countryDisplay(item)}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-sm text-[#6b7280]">{text.countryNoResults}</div>
                      )}
                    </div>
                  ) : null}
                </div>
                {countries.length === 0 ? <p className="mt-1 text-xs text-red-600">{text.countryError}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2f3442]">{text.productType}*</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setProductType("export")}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                      productType === "export"
                        ? "border-[var(--gtg-orange)] bg-[#fff4e6] text-[#2f3442]"
                        : "border-[#ccd1da] bg-[#f6f7f8] text-[#4b5563] hover:bg-[#eef1f5]"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        productType === "export" ? "border-[var(--gtg-orange)]" : "border-[#9ca3af]"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          productType === "export" ? "bg-[var(--gtg-orange)]" : "bg-transparent"
                        }`}
                      />
                    </span>
                    <span className="font-medium">{text.productTypeExport}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType("import")}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                      productType === "import"
                        ? "border-[var(--gtg-orange)] bg-[#fff4e6] text-[#2f3442]"
                        : "border-[#ccd1da] bg-[#f6f7f8] text-[#4b5563] hover:bg-[#eef1f5]"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        productType === "import" ? "border-[var(--gtg-orange)]" : "border-[#9ca3af]"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          productType === "import" ? "bg-[var(--gtg-orange)]" : "bg-transparent"
                        }`}
                      />
                    </span>
                    <span className="font-medium">{text.productTypeImport}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
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
                        alt={imageItem.kind === "new" ? imageItem.file.name : `product-image-${index + 1}`}
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
                      if (countryId == null) {
                        setSubmitError(text.requiredCountry);
                        return;
                      }
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

      {isSavingProduct || isSavingImages ? (
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
            aria-labelledby="edit-product-result-title"
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
              <h3 id="edit-product-result-title" className="mt-4 text-center text-[30px] font-semibold text-[#2b3038]">
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
