"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, ChevronDown, ImagePlus, Package, Plus, Search, X } from "lucide-react";
import { langToDil, normalizeLang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";

const PRODUCT_NAME_MAX = 100;
const DESCRIPTION_MAX = 600;
const KEYWORD_MAX = 2000;
const IMAGE_MAX_COUNT = 6;
const IMAGE_MAX_SIZE_MB = 5;
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);
const DEFAULT_PRODUCT_NUMBERS = {
  urunFiyat: 1,
  urunMiktar: 1,
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

type ApiActionResponse = {
  StatusCode?: number;
  Message?: string;
  Error?: string;
  Meta?: unknown;
  message?: string;
  error?: string;
  raw?: string;
};

type ProductCreateResponse = ApiActionResponse & {
  Data?: {
    Nr?: number | null;
  } | null;
};

type UploadImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

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

function resolveCreatedProductNr(response: ProductCreateResponse): number | null {
  return toPositiveInt(response?.Data?.Nr);
}

export default function AddProductPage() {
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
            title: "Ürün Ekle",
            subtitle: "Ürün bilgilerini doldurun ve sonraki adımda görselleri ekleyin.",
            imageTitle: "Ürün Görselleri",
            imageSubtitle: "Önce ürün oluşturulur, sonra görseller tek seferde yüklenir.",
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
            imageUploadPrimary: "Yüklemek için tıklayın",
            imageUploadSecondary: "veya sürükleyip bırakın",
            imageUploadHint: "PNG, JPG veya GIF (en fazla 6 dosya, her biri en fazla 5MB)",
            coverAction: "Seçili Görseli Kapak Yap",
            cancel: "Vazgeç",
            back: "Geri",
            continue: "Devam Et",
            save: "Kaydet",
            goProducts: "Ürünlere Git",
            close: "Kapat",
            stepCounter: "Adım",
            loadingProduct: "Ürün oluşturuluyor...",
            loadingImages: "Ürün görselleri kaydediliyor...",
            successTitle: "Ürün ve görseller kaydedildi",
            successDesc: "Ürününüz ve görselleri başarıyla oluşturuldu.",
            addAnother: "Yeni Ürün Ekle",
            createError: "Ürün oluşturulamadı.",
            imageSaveError: "Ürün görselleri kaydedilemedi.",
            requiredCountry: "Ülke seçimi zorunludur.",
            imageRequired: "En az 1 görsel yükleyin.",
          }
        : {
            title: "Add Product",
            subtitle: "Fill in the product details and upload images in the next step.",
            imageTitle: "Product Images",
            imageSubtitle: "The product is created first, then images are uploaded in one request.",
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
            keyword: "Keyword",
            keywordPlaceholder: "Enter keywords separated by commas...",
            imageLabel: "Product Images",
            imageUploadPrimary: "Click to upload",
            imageUploadSecondary: "or drag and drop",
            imageUploadHint: "PNG, JPG or GIF (up to 6 files, max 5MB each)",
            coverAction: "Set Selected as Cover",
            cancel: "Cancel",
            back: "Back",
            continue: "Continue",
            save: "Save",
            goProducts: "Go to Products",
            close: "Close",
            stepCounter: "Step",
            loadingProduct: "Creating product...",
            loadingImages: "Saving product images...",
            successTitle: "Product and images saved",
            successDesc: "Your product and images have been created successfully.",
            addAnother: "Add Another Product",
            createError: "Failed to create product.",
            imageSaveError: "Failed to save product images.",
            requiredCountry: "Country selection is required.",
            imageRequired: "Upload at least 1 image.",
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
  const [createdProductNr, setCreatedProductNr] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [productType, setProductType] = useState<"export" | "import">("export");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const countryMenuRef = useRef<HTMLDivElement | null>(null);
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
        setCountriesLoading(true);
        setCountriesError(null);
        const data = await api.get<CountriesResponse>(`/api/countries?dil=${dil}`);
        if (cancelled) return;
        setCountries(normalizeCountries(data));
      } catch (err: any) {
        if (cancelled) return;
        setCountries([]);
        setCountriesError(String(err?.message ?? text.countryError));
      } finally {
        if (!cancelled) setCountriesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dil, text.countryError]);

  useEffect(() => {
    setCountryId((prev) => {
      if (countries.length === 0) return null;
      if (typeof prev === "number" && countries.some((item) => item.Id === prev)) return prev;
      const defaultCountry = countries.find((item) => item.Id === 1);
      if (defaultCountry && hasCountryId(defaultCountry)) return defaultCountry.Id;
      const first = countries.find(hasCountryId);
      return first?.Id ?? null;
    });
  }, [countries]);

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
    () => images.find((item) => item.id === previewImageId) ?? null,
    [images, previewImageId]
  );

  const canSubmitStepOne =
    productName.trim() !== "" &&
    description.trim() !== "" &&
    keyword.trim() !== "" &&
    countryId != null &&
    !isCreatingProduct;

  const canSubmitStepTwo = images.length > 0 && !isCreatingProduct && !isSavingImages;
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
    setCreatedProductNr(null);
    setProductName("");
    setDescription("");
    setKeyword("");
    setProductType("export");
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
    if (!canSubmitStepTwo || countryId == null) return;

    setSubmitError(null);

    try {
      let urunNr = createdProductNr;
      if (urunNr == null) {
        setIsCreatingProduct(true);
        const createResponse = await api.post<ProductCreateResponse>(`/api/products/create?dil=${dil}&kaynak=2`, {
          urunAdi: productName.trim(),
          urunAciklama: description.trim(),
          urunEtiket: keyword.trim(),
          urunIhracatMi: productType === "export",
          urunUlkeNr: countryId,
          ...DEFAULT_PRODUCT_NUMBERS,
        });

        if (!isSuccessfulStatusCode(createResponse?.StatusCode)) {
          throw new Error(readApiMessage(createResponse, text.createError));
        }

        urunNr = resolveCreatedProductNr(createResponse);
        if (urunNr == null) {
          throw new Error(
            lang === "tr"
              ? "Ürün oluşturuldu ama response.Data.Nr alınamadı."
              : "Product was created but response.Data.Nr could not be resolved."
          );
        }

        setCreatedProductNr(urunNr);
        setSuccessMessage(readApiMessage(createResponse, text.successDesc));
      }

      setIsCreatingProduct(false);
      setIsSavingImages(true);
      const orderedImages = coverImageId
        ? [
            ...images.filter((item) => item.id === coverImageId),
            ...images.filter((item) => item.id !== coverImageId),
          ]
        : images;

      const formData = new FormData();
      formData.append("UrunNr", String(urunNr));
      formData.append("IsDefault", "true");
      formData.append("FirstUrunResimNr", "0");
      orderedImages.forEach((image) => {
        formData.append("AddFiles", image.file, image.file.name);
      });

      const response = await api.postForm<ApiActionResponse>(
        `/api/products/images/save-all?dil=${dil}&kaynak=2`,
        formData
      );
      if (hasApiStatusCode(response) && !isSuccessfulStatusCode(response.StatusCode)) {
        throw new Error(readApiMessage(response, text.imageSaveError));
      }

      setSuccessMessage((prev) => prev ?? text.successDesc);
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(String(err?.message ?? (createdProductNr == null ? text.createError : text.imageSaveError)));
    } finally {
      setIsCreatingProduct(false);
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
              {step === 1 ? <Package size={20} /> : <ImagePlus size={20} />}
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
              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.productName}*
                </label>
                <div className="relative">
                  <input
                    value={productName}
                    onChange={(event) => setProductName(event.target.value.slice(0, PRODUCT_NAME_MAX))}
                    placeholder={text.productNamePlaceholder}
                    className={inputClass}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {productName.length}/{PRODUCT_NAME_MAX}
                  </span>
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

              <div ref={countryMenuRef}>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">
                  {text.country}*
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => !countriesLoading && setCountryMenuOpen((prev) => !prev)}
                    disabled={countriesLoading}
                    className={`${inputClass} flex items-center justify-between text-left ${countriesLoading ? "opacity-70" : "opacity-100"}`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3">
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
                          : countriesLoading
                          ? text.countryLoading
                          : text.countryPlaceholder}
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
                {countriesError ? <p className="mt-1 text-xs text-red-600">{countriesError}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2f3442]">
                  {text.productType}*
                </label>
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
                        productType === "export"
                          ? "border-[var(--gtg-orange)]"
                          : "border-[#9ca3af]"
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
                        productType === "import"
                          ? "border-[var(--gtg-orange)]"
                          : "border-[#9ca3af]"
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
                {createdProductNr != null ? (
                  <div className="text-right text-sm text-[#6b7280]">#{createdProductNr}</div>
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
              {step === 1 ? text.cancel : text.goProducts}
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

      {isCreatingProduct || isSavingImages ? (
        <>
          <GtgLoading isLoading={true} />
          <div className="pointer-events-none fixed inset-0 z-[125]">
            <div className="absolute left-1/2 top-1/2 mt-20 -translate-x-1/2 rounded-full bg-[#101828]/80 px-5 py-2 text-sm font-semibold text-white">
              {isCreatingProduct ? text.loadingProduct : text.loadingImages}
            </div>
          </div>
        </>
      ) : null}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-result-title"
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
              <h3 id="add-product-result-title" className="mt-4 text-[30px] font-semibold text-[#2b3038]">
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
                {text.goProducts}
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
