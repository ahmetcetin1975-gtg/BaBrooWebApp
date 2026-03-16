import { environment } from "@/lib/gtg/config";
import type { ApiResponse, BlogDto, PageInformation, PricesModel, BankAccountModel, InvoiceInformationModel } from "@/lib/gtg/models";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${environment.systemUrl}${path}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return (await response.json()) as T;
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
  const response = await fetchJson<ApiResponse>("Main/GetPrices");
  return response.Data as PricesModel[];
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
  const response = await fetch(`${environment.systemUrl}Main/SendMailWithGet?${query.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return response.status;
  }
  const result = (await response.json()) as ApiResponse;
  return result.StatusCode ?? response.status;
}


