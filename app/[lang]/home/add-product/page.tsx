"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, ChevronDown, ImagePlus, Package, Plus, Search, X } from "lucide-react";
import { normalizeLang } from "@/lib/i18n/languages";
import { api } from "@/lib/api/client";
import { GtgLoading } from "@/components/gtg/GtgLoading";

const PRODUCT_NAME_MAX = 80;
const DESCRIPTION_MAX = 250;
const HASHTAG_MAX = 30;
const HASHTAG_COUNT_MAX = 3;
const IMAGE_MAX_COUNT = 6;
const IMAGE_MAX_SIZE_MB = 5;
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

type CountryItem = {
  Id?: number;
  UlkeAdi?: string;
  TelKodu?: string;
  ResimUrl?: string;
};

type CountriesResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CountryItem[] | null;
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
  const name = (item.UlkeAdi ?? "").trim() || "-";
  const code = (item.TelKodu ?? "").trim();
  return code ? `${name} (+${code})` : name;
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

export default function AddProductPage() {
  const params = useParams<{ lang?: string | string[] }>();
  const router = useRouter();
  const rawLang = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
  const lang = normalizeLang(rawLang ?? "tr");
  const dil = lang === "tr" ? 1 : 2;

  const text = useMemo(
    () =>
      lang === "tr"
        ? {
            title: "Ürün Ekle",
            subtitle: "Ürününüzü ekleyin, detayları tamamlayın ve yayına alın.",
            productName: "Ürün Adı",
            productNamePlaceholder: "Ürün adını girin",
            description: "Açıklama",
            descriptionPlaceholder: "Ürün açıklamasını girin",
            country: "Ülke",
            countryPlaceholder: "Ülke Seçin",
            countryLoading: "Ülkeler yükleniyor...",
            countryError: "Ülkeler yüklenemedi.",
            hashtag: "Hashtag",
            hashtagPlaceholder: "Hashtag girin ve Enter'a basın",
            hashtagRequired: "En az 1 hashtag girin.",
            cancel: "Vazgeç",
            back: "Geri",
            submit: "Devam Et",
            imageTitle: "Ürün Görseli Ekle",
            imageSubtitle: "Ürününüz için en fazla 6 görsel yükleyin.",
            imageLabel: "Ürün Görselleri",
            imageUploadPrimary: "Click to upload",
            imageUploadSecondary: "veya sürükle bırak",
            imageUploadHint: "PNG, JPG veya GIF (max. 6 adet, her biri max. 5MB)",
            coverAction: "Seçili Fotoğrafı Kapak Yap",
            stepCounter: "Adım",
            close: "Kapat",
            loadingProduct: "Ürün Ekleniyor.....",
            successTitle: "Tebrikler! 🎉",
            successDesc: "Ürününüz başarıyla eklendi. Daha fazla ürün eklemeye devam edebilirsiniz.",
            goHome: "Anasayfa",
            viewProduct: "Ürünü Gör",
          }
        : {
            title: "Add Product",
            subtitle: "Add your product, complete the details, and publish.",
            productName: "Product Name",
            productNamePlaceholder: "What is your product name?",
            description: "Description",
            descriptionPlaceholder: "Describe your product",
            country: "Country",
            countryPlaceholder: "Select country",
            countryLoading: "Loading countries...",
            countryError: "Failed to load countries.",
            hashtag: "Hashtag",
            hashtagPlaceholder: "Type hashtag and press Enter",
            hashtagRequired: "Enter at least 1 hashtag.",
            cancel: "Cancel",
            back: "Back",
            submit: "Continue",
            imageTitle: "Add Product Images",
            imageSubtitle: "Upload up to 6 images for your product.",
            imageLabel: "Product Images",
            imageUploadPrimary: "Click to upload",
            imageUploadSecondary: "or drag and drop",
            imageUploadHint: "PNG, JPG or GIF (max. 6 files, up to 5MB each)",
            coverAction: "Set Selected as Cover",
            stepCounter: "Step",
            close: "Close",
            loadingProduct: "Adding Product.....",
            successTitle: "Congratulations! 🎉",
            successDesc: "Your product has been added successfully. You can continue adding more products.",
            goHome: "Home",
            viewProduct: "View Product",
          },
    [lang]
  );
  const imageValidationText = useMemo(
    () =>
      lang === "tr"
        ? {
            invalidType: "Sadece PNG, JPG veya GIF dosyalari yuklenebilir.",
            invalidSize: `Her dosya en fazla ${IMAGE_MAX_SIZE_MB}MB olabilir.`,
            limitExceeded: `En fazla ${IMAGE_MAX_COUNT} gorsel yukleyebilirsiniz.`,
          }
        : {
            invalidType: "Only PNG, JPG or GIF files are allowed.",
            invalidSize: `Each file can be up to ${IMAGE_MAX_SIZE_MB}MB.`,
            limitExceeded: `You can upload up to ${IMAGE_MAX_COUNT} images.`,
          },
    [lang]
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [images, setImages] = useState<UploadImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageValidationMessage, setImageValidationMessage] = useState<string | null>(null);

  const countryMenuRef = useRef<HTMLDivElement | null>(null);
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
        setCountriesLoading(true);
        setCountriesError(null);
        const data = await api.get<CountriesResponse>(`/api/countries?dil=${dil}`);
        if (cancelled) return;
        const list = normalizeCountries(data);
        setCountries(list);
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
  const previewImage = useMemo(
    () => images.find((item) => item.id === previewImageId) ?? null,
    [images, previewImageId]
  );

  const canSubmitStepOne =
    productName.trim() !== "" &&
    description.trim() !== "" &&
    countryId != null &&
    hashtags.length > 0;

  const canContinueStepTwo = images.length > 0;
  const stepProgress = step === 1 ? 50 : 100;

  const inputClass =
    "w-full rounded-xl border border-[#ccd1da] bg-[#f6f7f8] px-4 py-3 text-[15px] text-[#2a313d] outline-none placeholder:text-[#9ca3af] focus-visible:ring-2 focus-visible:ring-[var(--gtg-orange)]";

  function addHashtag() {
    const normalized = hashtagInput.trim().replace(/^#/, "");
    if (!normalized) return;
    if (hashtags.length >= HASHTAG_COUNT_MAX) {
      setHashtagInput("");
      return;
    }
    if (hashtags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setHashtagInput("");
      return;
    }
    setHashtags((prev) => [...prev, normalized]);
    setHashtagInput("");
  }

  function removeHashtag(tag: string) {
    setHashtags((prev) => prev.filter((item) => item !== tag));
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
    if (!canContinueStepTwo || isSubmittingProduct) return;

    setPreviewImageId(null);
    setShowSuccessModal(false);
    setIsSubmittingProduct(true);

    if (submitTimerRef.current != null) {
      window.clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = window.setTimeout(() => {
      setIsSubmittingProduct(false);
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
              {step === 1 ? <Package size={22} /> : <ImagePlus size={22} />}
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
                onClick={() => router.push(`/${lang}/home/products`)}
                className="grid h-10 w-10 place-items-center rounded-full text-[#6b7280] transition hover:bg-[#eceff4]"
                aria-label="Close"
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
              </div>

              <div ref={countryMenuRef}>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.country}*</label>
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
                      {countries.map((item) => {
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
                      })}
                    </div>
                  ) : null}
                </div>
                {countriesError ? <p className="mt-1 text-xs text-red-600">{countriesError}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#2f3442]">{text.hashtag}*</label>
                <div className="relative">
                  <input
                    value={hashtagInput}
                    onChange={(event) => setHashtagInput(event.target.value.slice(0, HASHTAG_MAX))}
                    disabled={hashtags.length >= HASHTAG_COUNT_MAX}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addHashtag();
                      }
                    }}
                    placeholder={text.hashtagPlaceholder}
                    className={`${inputClass} ${hashtags.length >= HASHTAG_COUNT_MAX ? "cursor-not-allowed opacity-70" : ""}`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs font-medium text-[#4b5563]">
                    {hashtagInput.length}/{HASHTAG_MAX}
                  </span>
                </div>
                {hashtags.length === 0 ? (
                  <p className="mt-1 text-xs text-red-600">{text.hashtagRequired}</p>
                ) : null}

                {hashtags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#eceff3] px-3 py-1.5 text-[14px] font-medium text-[#2f3442]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeHashtag(tag)}
                          className="grid h-4 w-4 place-items-center rounded-full bg-black text-[10px] font-bold text-white"
                          aria-label={`Remove ${tag}`}
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
                  onClick={() => router.push(`/${lang}/home/products`)}
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
                  disabled={!canContinueStepTwo || isSubmittingProduct}
                  onClick={handleCompleteStepTwo}
                  className={`rounded-xl px-5 py-3 text-[16px] font-semibold text-white transition ${
                    canContinueStepTwo && !isSubmittingProduct
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

      {isSubmittingProduct ? (
        <>
          <GtgLoading isLoading={true} />
          <div className="pointer-events-none fixed inset-0 z-[125]">
            <div className="absolute left-1/2 top-1/2 mt-20 -translate-x-1/2 rounded-full bg-[#101828]/80 px-5 py-2 text-sm font-semibold text-white">
              {text.loadingProduct}
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
                onClick={() => router.push(`/${lang}/home/products`)}
                className="rounded-xl border border-[#ccd1da] bg-[#f5f5f6] px-5 py-3 text-[16px] font-semibold text-[#2f3442] transition hover:bg-[#eef1f5]"
              >
                {text.goHome}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${lang}/home/products`)}
                className="rounded-xl bg-[var(--gtg-orange)] px-5 py-3 text-[16px] font-semibold text-white transition hover:brightness-95"
              >
                {text.viewProduct}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
