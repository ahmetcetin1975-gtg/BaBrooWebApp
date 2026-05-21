"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { getBankInfo, getCompanyInfo, getPrices } from "@/lib/gtg/api";
import { normalizeLang } from "@/lib/gtg/config";
import type { BankAccountModel, InvoiceInformationModel, PricesModel } from "@/lib/gtg/models";
import { Modal } from "@/components/gtg/Modal";
import { GtgLoading } from "@/components/gtg/GtgLoading";

//const REGISTER_URL = "https://app.babroo.co/app.babroo/seller/auth-register-seller.asp";

function getPackageName(item: PricesModel | null): string {
  return (item?.PriceName ?? item?.PaketAdi ?? "").trim().toUpperCase();
}

function findPackage(prices: PricesModel[], keywords: string[], fallbackIndex: number): PricesModel | null {
  const matched = prices.find((item) => {
    const name = getPackageName(item);
    return keywords.some((keyword) => name.includes(keyword));
  });

  return matched ?? prices[fallbackIndex] ?? null;
}

function getMonthlyPrice(item: PricesModel | null): number | string {
  return item?.Prices2 ?? item?.Fiyat1 ?? "-";
}

function getTotalPrice(item: PricesModel | null): number | string {
  return item?.Prices1 ?? item?.Fiyat2 ?? "-";
}

function getRegisterHref(
  lang: string,
  item: PricesModel | null,
  fallbackId: number
): string {
  const priceId = item?.Id && item.Id > 0 ? item.Id : fallbackId;
  return `/${lang}/register`;
}

export function Packages() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang ?? "tr"));

  const t = useTranslate();
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [basicPackage, setBasicPackage] = useState<PricesModel | null>(null);
  const [advPackage, setAdvPackage] = useState<PricesModel | null>(null);
  const [premiumPackage, setPremiumPackage] = useState<PricesModel | null>(null);
  const [companyData, setCompanyData] = useState<InvoiceInformationModel | null>(null);
  const [paymentData, setPaymentData] = useState<BankAccountModel[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPrices(), getCompanyInfo(), getBankInfo()])
      .then(([prices, company, bank]) => {
        if (!mounted) return;
        setCompanyData(company);
        setPaymentData(bank ?? []);
        const orderedPrices = [...prices].sort((left, right) => left.Id - right.Id);
        const basic = findPackage(orderedPrices, ["BASIC"], 0);
        const adv = findPackage(orderedPrices, ["ADVANTAGE", "ADVANTAGES"], 1);
        const premium = findPackage(orderedPrices, ["PREMIUM", "BUSINESS"], 2);
        setBasicPackage(basic ?? null);
        setAdvPackage(adv ?? null);
        setPremiumPackage(premium ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setBasicPackage(null);
        setAdvPackage(null);
        setPremiumPackage(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const copyString = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      await Swal.fire({
        title: t("LCOD_LBL_SUCCESS"),
        text: t("LCOD_LBL_COPIED_TO_CLIPBOARD_SUCCESS"),
        icon: "success",
        confirmButtonText: t("LCOD_LBL_OK"),
      });
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="container relative">
        <div className="grid grid-cols-1 pb-8 text-center">
          <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">{t("LCOD_LBL_PRICING_PLANS")}</h3>
          <p className="text-slate-400 max-w-xl mx-auto">{t("LCOD_LBL_SELECT_PLAN_BANNER")}</p>
          <div className="mt-16" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <a
              href="https://iyzi.link/AJSJ6Q"
              className="py-2 px-5 font-semibold tracking-wide border align-middle duration-500 text-xl text-center bg-transparent hover:bg-blue-600 border-blue-600 text-[#FF7601] hover:text-white rounded-full"
              target="_blank"
              rel="noreferrer"
            >
              <i className="mdi mdi-multicast text-blue-700 hover:text-[#FF7601] text-lg"></i>{t("LCOD_LBL_TAKE_YOUR_ROAD_MAP")}
            </a>
          </div>
        </div>

        {basicPackage && advPackage && premiumPackage && (
          <div className="grid md:grid-cols-3 grid-cols-1 mt-8 gap-[30px] items-start">
            <div className="p-6">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium dark:text-white">BASIC</h3>
                <div className="mb-6 dark:text-white/50">
                  <span className="relative h6 -top-5 text-xl">$</span>
                  <span className="text-5xl h6 font-medium dark:text-white">{getMonthlyPrice(basicPackage)}</span>
                  <span className="inline-block h6 ml-1">/ {t("LCOD_LBL_MONTH")}</span>
                </div>
                <p className="mb-6 text-slate-400">{t("LCOD_LBL_THREE_MONTHS_TOTAL")} : $ {getTotalPrice(basicPackage)}</p>
                <Link href={getRegisterHref(lang, basicPackage, 5)}>
                  <span className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700/5 hover:bg-blue-700 border-blue-700/10 hover:border-blue-700 text-orange-700 hover:text-white rounded-md w-full">
                    {t("LCOD_LBL_REGISTER_NOW")}
                  </span>
                </Link>
                
              </div>
              <div className="border-b border-slate-200 dark:border-slate-200/5"></div>
              <ul className="self-start pt-8">
                <li className="flex items-center mb-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_UNLIMITED_PRODUCT_LISTING")}</span>
                </li>
                <li className="flex items-center my-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_UNLIMITED_VIEW_IN_MARKET")}</span>
                </li>
                <li className="flex items-center my-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_VIEW_SPECIALIST_LIST")}</span>
                </li>
                <li className="flex items-center my-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_EXPERT_MATCHMAKING")}</span>
                </li>
                <li className="flex items-center my-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_ACCESS_TO_SERVICE_PROVIDER")}</span>
                </li>
              </ul>
            </div>

            <div className="shadow rounded-md p-6 bg-gradient-to-t bg-blue-700">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium text-white">ADVANTAGES</h3>
                <div className="mb-6 text-white/50">
                  <span className="relative h6 -top-5 text-xl">$</span>
                  <span className="text-5xl h6 font-bold text-white">{getMonthlyPrice(advPackage)}</span>
                  <span className="inline-block h6 ml-1">/ {t("LCOD_LBL_MONTH")}</span>
                </div>
                <p className="mb-6 text-white">{t("LCOD_LBL_THREE_MONTHS_TOTAL")} : $ {getTotalPrice(advPackage)}</p>
                <Link href={getRegisterHref(lang, basicPackage, 6)}>
                  <span className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700/5 hover:bg-blue-700 border-blue-700/10 hover:border-blue-700 text-orange-700 hover:text-white rounded-md w-full">
                    {t("LCOD_LBL_REGISTER_NOW")}
                  </span>
                </Link>

              </div>
              <div className="border-b border-slate-200/10"></div>
              <ul className="self-start pt-8">
                <li className="flex items-center my-1 text-white/80 ms-0">
                  <i className="uil uil-check-circle text-xl text-orange-500 mr-2"></i>
                  <span>{t("LCOD_LBL_BASIC_PACKET_ADVANTAGES")}</span>
                </li>
                <li className="flex items-center mb-1 text-white/80 ms-0">
                  <i className="uil uil-check-circle text-xl text-orange-500 mr-2"></i>
                  <span>{t("LCOD_LBL_CUSTOMER_REFERRAL_FOR_TWO_COUNTRIES")}</span>
                </li>
                <li className="flex items-center my-1 text-white/80 ms-0">
                  <i className="uil uil-check-circle text-xl text-orange-500 mr-2"></i>
                  <span>{t("LCOD_LBL_MAILING_PROMOTIONS_POTENTIAL_BUYERS")}</span>
                </li>
                <li className="flex items-center my-1 text-white/80 ms-0">
                  <i className="uil uil-check-circle text-xl text-orange-500 mr-2"></i>
                  <span>{t("LCOD_LBL_MARKET_PRICE_ANALYSIS")}</span>
                </li>
                <li className="flex items-center my-1 text-white/80 ms-0">
                  <i className="uil uil-check-circle text-xl text-orange-500 mr-2"></i>
                  <span>{t("LCOD_LBL_PROMOTING_GLOBALLY_ON_SOCIAL_MEDIA")}</span>
                </li>
              </ul>
            </div>

            <div className="p-6">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium dark:text-white">BUSINESS</h3>
                <div className="mb-6 dark:text-white/50">
                  <span className="relative h6 -top-5 text-xl">$</span>
                  <span className="text-5xl h6 font-medium dark:text-white">{getMonthlyPrice(premiumPackage)}</span>
                  <span className="inline-block h6 ml-1">/ {t("LCOD_LBL_MONTH")}</span>
                </div>
                <p className="mb-6 text-slate-400">{t("LCOD_LBL_THREE_MONTHS_TOTAL")} : $ {getTotalPrice(premiumPackage)}</p>
                <Link href={getRegisterHref(lang, basicPackage, 7)}>
                  <span className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700/5 hover:bg-blue-700 border-blue-700/10 hover:border-blue-700 text-orange-700 hover:text-white rounded-md w-full">
                    {t("LCOD_LBL_REGISTER_NOW")}
                  </span>
                </Link>
             </div>
              <div className="border-b border-slate-200 dark:border-slate-200/5"></div>
              <ul className="self-start pt-8">
                <li className="flex items-center mb-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_BASIC_PACKET_ADVANTAGES")}</span>
                </li>
                <li className="flex items-center mb-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_ADVANTAGES_PACKET_ADVANTAGES")}</span>
                </li>
                <li className="flex items-center mb-1 text-slate-400 ms-0">
                  <i className="uil uil-check-circle text-xl text-blue-700 mr-2"></i>
                  <span>{t("LCOD_LBL_MANAGEMENT_OF_FOREIGN_TRADE_PROCESSES")}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="gap-[30px] text-center py-12">
          <span className="text-md text-blue-700 font-bold dark:text-white">* {t("LCOD_LBL_NOT_INCLUDED_TAXED")}</span>
          <br />
          <span className="text-md text-blue-700 font-bold dark:text-white">
            * {t("LCOD_LBL_PACKAGES_BOTTOM_TEXT")} <br />
            <button
              className="font-medium hover:text-amber-600 text-blue-700 dark:text-white"
              onClick={() => setIsActive(true)}
            >
              {t("LCOD_LBL_PACKAGES_BOTTOM_TEXT1")}
            </button>
          </span>
        </div>
      </div>

      <Modal active={isActive} onClose={() => setIsActive(false)}>
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
          <button
            onClick={() => setIsActive(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="mdi mdi-close text-2xl"></span>
          </button>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 header">
              <i className="mdi mdi-information-box-outline text-2xl text-blue-600 dark:text-blue-400"></i> {t("LCOD_LBL_INVOICE_BANK_INFORMATION")}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                <i className="mdi mdi-invoice-text-fast-outline text-2xl text-blue-600 dark:text-blue-400"></i> {t("LCOD_LBL_INVOICE_INFORMATION")}
              </h3>
              <ul className="mt-2 text-gray-600 dark:text-gray-400">
                {companyData && (
                  <>
                    <li onClick={() => copyString(companyData.CompanyName)} className="hover:cursor-pointer">
                      <strong>{t("LCOD_LBL_TITLE")}:</strong> {companyData.CompanyName}
                    </li>
                    <li onClick={() => copyString(companyData.TaxOffice)} className="hover:cursor-pointer">
                      <strong>{t("LCOD_LBL_TAX_OFFICE")}:</strong> {companyData.TaxOffice}
                    </li>
                    <li onClick={() => copyString(companyData.TaxNumber)} className="hover:cursor-pointer">
                      <strong>{t("LCOD_LBL_TAX_NUMBER")}:</strong> {companyData.TaxNumber}
                    </li>
                    <li onClick={() => copyString(companyData.MersisNumber)} className="hover:cursor-pointer">
                      <strong>{t("LCOD_LBL_MERSIS_NO")}:</strong> {companyData.MersisNumber}
                    </li>
                    <li onClick={() => copyString(companyData.TradeRegisterNumber)} className="hover:cursor-pointer">
                      <strong>{t("LCOD_LBL_TRADE_IDENTITY_NUMBER")}:</strong> {companyData.TradeRegisterNumber}
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                <i className="mdi mdi-bank-circle-outline text-2xl text-blue-600 dark:text-blue-400"></i> {t("LCOD_LBL_BANK_ACCOUNT_INFORMATION")}
              </h3>
              {paymentData.map((item) => (
                <ul key={item.Id} className="mt-2 text-gray-600 dark:text-gray-400">
                  <li>
                    <strong>{t("LCOD_LBL_BANK")}:</strong> {item.BankName}
                  </li>
                  <li onClick={() => copyString(item.IbanTL)} className="hover:cursor-pointer">
                    <strong>{t("LCOD_LBL_IBAN_TL")}:</strong> {item.IbanTL}
                  </li>
                  <li onClick={() => copyString(item.IbanUSD)} className="hover:cursor-pointer">
                    <strong>{t("LCOD_LBL_IBAN_USD")}:</strong> {item.IbanUSD}
                  </li>
                  <li onClick={() => copyString(item.IbanEUR)} className="hover:cursor-pointer">
                    <strong>{t("LCOD_LBL_IBAN_EURO")}:</strong> {item.IbanEUR}
                  </li>
                </ul>
              ))}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => setIsActive(false)}
              className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white rounded-full"
            >
              {t("LCOD_LBL_CLOSE")}
            </button>
          </div>
        </div>
      </Modal>
      <GtgLoading isLoading={isLoading} />
    </>
  );
}

