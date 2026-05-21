import { langToDil, type Lang } from "@/lib/gtg/config";
import { CARE_CATEGORY_DEFINITIONS, getFallbackCareCategories } from "@/lib/gtg/care-categories";
import { apiRoot } from "@/lib/api-root";
import type {
  ApiResponse,
  BankAccountModel,
  BlogDto,
  CareCategory,
  InvoiceInformationModel,
  PageInformation,
  PricesModel,
} from "@/lib/gtg/models";

function buildGtgBackendUrl(path: string): string {
  return `${resolveServerGtgApiRoot()}/api/${path.replace(/^\/+/, "")}`;
}

function buildLocalGtgBackendUrl(path: string): string {
  return `http://localhost:8081/api/${path.replace(/^\/+/, "")}`;
}

function resolveServerGtgApiRoot(): string {
  const root = apiRoot();
  const pointsToRemoteTestApi = /^https?:\/\/apitest\.gotradego\.com\/?$/i.test(root);

  if (process.env.NODE_ENV === "development" && pointsToRemoteTestApi) {
    return "http://localhost:8081";
  }

  return root;
}

function buildGtgProxyUrl(path: string): string {
  return `/api/public/gtg/${path.replace(/^\/+/, "")}`;
}

function shouldTryLocalGtgFallback(): boolean {
  return !/^https?:\/\/localhost(?::\d+)?\/?$/i.test(resolveServerGtgApiRoot());
}

async function fetchServerJson<T>(path: string): Promise<T> {
  const primaryResponse = await fetch(buildGtgBackendUrl(path), {
    cache: "no-store",
  }).catch(() => null);

  if (primaryResponse?.ok) {
    return (await primaryResponse.json()) as T;
  }

  if (!shouldTryLocalGtgFallback()) {
    if (primaryResponse) {
      throw new Error(`API request failed for ${path}: ${primaryResponse.status}`);
    }
    throw new Error(`API request failed for ${path}: network error`);
  }

  if (primaryResponse && primaryResponse.status !== 404) {
    throw new Error(`API request failed for ${path}: ${primaryResponse.status}`);
  }

  const fallbackResponse = await fetch(buildLocalGtgBackendUrl(path), {
    cache: "no-store",
  }).catch(() => null);

  if (fallbackResponse?.ok) {
    return (await fallbackResponse.json()) as T;
  }

  if (primaryResponse) {
    throw new Error(`API request failed for ${path}: ${primaryResponse.status}`);
  }

  if (fallbackResponse) {
    throw new Error(`API request failed for ${path}: ${fallbackResponse.status}`);
  }

  throw new Error(`API request failed for ${path}: network error`);
}

async function fetchJson<T>(path: string): Promise<T> {
  if (typeof window === "undefined") {
    return fetchServerJson<T>(path);
  }

  const response = await fetch(buildGtgProxyUrl(path), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchPathJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizePriceItem(item: any): PricesModel {
  const monthlyPrice = toOptionalNumber(item?.Prices2 ?? item?.Fiyat1);
  const totalPrice = toOptionalNumber(item?.Prices1 ?? item?.Fiyat2);

  return {
    Id: toOptionalNumber(item?.Id) ?? 0,
    PriceName:
      typeof item?.PriceName === "string"
        ? item.PriceName
        : typeof item?.PaketAdi === "string"
          ? item.PaketAdi
          : undefined,
    Prices1: totalPrice,
    Prices2: monthlyPrice,
    Prices3: toOptionalNumber(item?.Prices3),
    PaketAdi: typeof item?.PaketAdi === "string" ? item.PaketAdi : undefined,
    Fiyat1: toOptionalNumber(item?.Fiyat1 ?? item?.Prices2),
    Fiyat2: toOptionalNumber(item?.Fiyat2 ?? item?.Prices1),
    DemoPaket: typeof item?.DemoPaket === "string" ? item.DemoPaket : undefined,
  };
}

function normalizeImageUrl(value: unknown): string | undefined {
  const urlValue = toOptionalString(value);
  if (!urlValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(urlValue);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/{2,}/g, "/");
    return parsedUrl.toString();
  } catch {
    return urlValue;
  }
}

function slugifyCategoryTitle(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCareCategoryItem(
  item: any,
  fallback: {
    id: number;
    slug: string;
    fallbackTitleTr: string;
    fallbackTitleEn: string;
    fallbackDetailTr: string;
    fallbackDetailEn: string;
  },
  lang: Lang
): CareCategory {
  const isTr = lang === "tr";

  return {
    id: fallback.id,
    slug: fallback.slug,
    title: toOptionalString(item?.HgAdi) ?? (isTr ? fallback.fallbackTitleTr : fallback.fallbackTitleEn),
    detail:
      toOptionalString(item?.HgDetay) ??
      toOptionalString(item?.Aciklama) ??
      (isTr ? fallback.fallbackDetailTr : fallback.fallbackDetailEn),
    imageUrl: normalizeImageUrl(item?.HgResimUrl),
  };
}

function normalizeUnknownCareCategoryItem(item: any): CareCategory | null {
  const id = toOptionalNumber(item?.Id);
  const title = toOptionalString(item?.HgAdi);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    slug: slugifyCategoryTitle(title) || `kategori-${id}`,
    title,
    detail: toOptionalString(item?.HgDetay) ?? toOptionalString(item?.Aciklama) ?? "",
    imageUrl: normalizeImageUrl(item?.HgResimUrl),
  };
}

export async function getCareCategories(lang: Lang): Promise<CareCategory[]> {
  const dil = langToDil(lang);

  try {
    const response = await fetchJson<ApiResponse<any[]>>(`Main/GetHizmetGruplari?dil=${dil}`);
    const data = Array.isArray(response.Data) ? response.Data : [];
    const itemsById = new Map<number, any>();

    for (const item of data) {
      const id = toOptionalNumber(item?.Id);
      if (id) {
        itemsById.set(id, item);
      }
    }

    const knownCategoryIds = new Set(CARE_CATEGORY_DEFINITIONS.map((definition) => definition.id));
    const orderedCategories = CARE_CATEGORY_DEFINITIONS.map((definition) =>
      normalizeCareCategoryItem(itemsById.get(definition.id), definition, lang)
    );
    const unknownCategories = data
      .filter((item) => {
        const id = toOptionalNumber(item?.Id);
        return !id || !knownCategoryIds.has(id);
      })
      .map((item) => normalizeUnknownCareCategoryItem(item))
      .filter((item): item is CareCategory => Boolean(item));

    return [...orderedCategories, ...unknownCategories];
  } catch (error) {
    console.error("Failed to fetch care categories", error);
    return getFallbackCareCategories(lang);
  }
}

export async function getBlogs(skip = 0, size = 20): Promise<BlogDto[]> {
  const response = await fetchJson<ApiResponse>(`Main/GetBlogs?skip=${skip}&size=${size}`);
  return (response.Data as any[]).map((res) => ({
    blog: res?.IsMenuler ?? {},
    images: res?.IsIcerikResimlers?.[0] ?? {},
    totalCount: res?.TotalCount ?? 0,
  }));
}

export async function getRecentBlogs(): Promise<BlogDto[]> {
  const response = await fetchJson<ApiResponse>("Main/GetRecentBlogs");
  return (response.Data as any[]).map((res) => ({
    blog: res?.IsMenuler ?? {},
    images: res?.IsIcerikResimlers?.[0] ?? {},
    totalCount: res?.TotalCount ?? 0,
  }));
}

export async function getBlogByLink(id: string): Promise<BlogDto | null> {
  try {
    const response = await fetchJson<ApiResponse>(`Main/GetBlog?kisaLink=${id}`);
    const data = response.Data as any;
    return {
      blog: data?.IsMenuler ?? {},
      images: data?.IsIcerikResimlers?.[0] ?? {},
      totalCount: data?.TotalCount ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getTeamMembers(): Promise<any[]> {
  const response = await fetchJson<ApiResponse>("Main/GetTeamMembers");
  return response.Data as any[];
}

export async function getSuccessStories(): Promise<any[]> {
  const response = await fetchJson<ApiResponse>("Main/GetSuccessStories");
  return response.Data as any[];
}

export async function getFTS(): Promise<any[]> {
  const response = await fetchJson<ApiResponse>("Main/GetFTS");
  return response.Data as any[];
}

export async function getServiceProviders(): Promise<any[]> {
  const response = await fetchJson<ApiResponse>("Main/GetServiceProvider");
  return response.Data as any[];
}

export async function getPageInformation(): Promise<PageInformation[]> {
  const response = await fetchJson<ApiResponse>("Main/GetPageInformation");
  return response.Data as PageInformation[];
}

export async function getPrices(): Promise<PricesModel[]> {
  if (typeof window !== "undefined") {
    const data = await fetchPathJson<PricesModel[]>("/api/public/prices");
    return data.map((item) => normalizePriceItem(item));
  }

  const response = await fetchJson<ApiResponse>("Main/GetPrices");
  const data = Array.isArray(response.Data) ? response.Data : [];
  return data.map((item) => normalizePriceItem(item));
}

export async function getCompanyInfo(): Promise<InvoiceInformationModel> {
  return {
    Id: 1,
    CompanyName: "Amazing Teknoloji ve Pazarlama A.S.",
    TaxOffice: "Efeler Vergi Dairesi",
    TaxNumber: "3250486611",
    MersisNumber: "0325048661100017",
    TradeRegisterNumber: "11225",
  };
}

export async function getBankInfo(): Promise<BankAccountModel[]> {
  return [
    {
      Id: 1,
      BankName: "ICBC",
      IbanTL: "TR730010900042006796770001",
      IbanUSD: "TR190010900042006796770003",
      IbanEUR: "TR460010900042006796770002",
    },
  ];
}

export async function sendHelpMail(payload: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<number> {
  const query = new URLSearchParams({
    Name: payload.name,
    Email: payload.email,
    Phone: payload.phone,
    Subject: payload.subject,
    Message: payload.message,
  });
  const requestPath = `Main/SendMailWithGet?${query.toString()}`;
  const response =
    typeof window === "undefined"
      ? await fetch(buildGtgBackendUrl(requestPath), { cache: "no-store" }).catch(() => null)
      : await fetch(buildGtgProxyUrl(requestPath), { cache: "no-store" });

  if (!response && typeof window === "undefined" && shouldTryLocalGtgFallback()) {
    const fallbackResponse = await fetch(buildLocalGtgBackendUrl(requestPath), {
      cache: "no-store",
    }).catch(() => null);
    if (!fallbackResponse) {
      return 500;
    }
    if (!fallbackResponse.ok) {
      return fallbackResponse.status;
    }
    const result = (await fallbackResponse.json()) as ApiResponse;
    return result.StatusCode ?? fallbackResponse.status;
  }

  if (!response) {
    return 500;
  }

  if (!response.ok) {
    if (
      typeof window === "undefined" &&
      response.status === 404 &&
      shouldTryLocalGtgFallback()
    ) {
      const fallbackResponse = await fetch(buildLocalGtgBackendUrl(requestPath), {
        cache: "no-store",
      }).catch(() => null);
      if (!fallbackResponse) {
        return response.status;
      }
      if (!fallbackResponse.ok) {
        return fallbackResponse.status;
      }
      const result = (await fallbackResponse.json()) as ApiResponse;
      return result.StatusCode ?? fallbackResponse.status;
    }
    return response.status;
  }
  const result = (await response.json()) as ApiResponse;
  return result.StatusCode ?? response.status;
}
