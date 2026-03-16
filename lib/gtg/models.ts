export type ApiResponse<T = unknown> = {
  StatusCode: number;
  Data: T;
};

export type BlogModel = {
  Id: number;
  MenuAdi?: string;
  KisaYazi?: string;
  Yazi?: string;
  Mode?: string;
  MenuId?: string;
  Sira?: number | null;
  Tarih?: string | null;
  KisaLink?: string;
  KisaLinkEng?: string;
};

export type BlogImage = {
  Id?: number;
  MenuId?: string;
  ResimAdi?: string;
  Aciklama?: string;
};

export type BlogDto = {
  blog: BlogModel;
  images: BlogImage;
  totalCount: number;
};

export type PageInformation = {
  Id: number;
  Url: string;
  TitleTR: string;
  TitleEN: string;
  DescriptionTR: string;
  DescriptionEN: string;
  CanonicalTR: string;
  CanonicalEN: string;
  AlternateEN: string;
  AlternateTR: string;
  AlternateDefault: string;
};

export type PricesModel = {
  Id: number;
  PriceName?: string;
  Prices1?: number;
  Prices2?: number;
  Prices3?: number;
};

export type InvoiceInformationModel = {
  Id: number;
  CompanyName: string;
  TaxOffice: string;
  TaxNumber: string;
  MersisNumber: string;
  TradeRegisterNumber: string;
};

export type BankAccountModel = {
  Id: number;
  BankName: string;
  IbanTL: string;
  IbanUSD: string;
  IbanEUR: string;
};


