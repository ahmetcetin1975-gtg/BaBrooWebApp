"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";

export function UserRegisterSelectPage({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();

  return (
    <>
      <section className="relative table w-full py-36 bg-[url('/assets/images/gotradego/payment.png')] bg-center bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-black opacity-75"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal tracking-wide leading-normal font-medium text-white">{t("LCOD_LBL_USER_REGISTER")}</h3>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180">
              <i className="uil uil-angle-right-b"></i>
            </li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white" aria-current="page">
              {t("LCOD_LBL_USER_REGISTER")}
            </li>
          </ul>
        </div>
      </section>

      <div className="relative">
        <div className="shape absolute sm:-bottom-px -bottom-[2px] start-0 end-0 overflow-hidden z-1 text-white dark:text-slate-900">
          <svg className="w-full h-auto scale-[2.0] origin-top" viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>

      <section className="relative md:py-1 py-1 overflow-hidden mb-20">
        <div className="container relative md:mt-24 mt-16">
          <div className="grid grid-cols-1 pb-8 text-center">
            <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">{t("LCOD_LBL_SELECT_USER_TYPE")}</h3>
          </div>

          <div className="grid md:grid-cols-2 grid-cols-1 mt-8 gap-[30px] items-start">
            <div className="shadow rounded-md p-6 bg-gradient-to-t from-blue-500 to-indigo-600">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium text-white">{t("Exporter")}</h3>
                <p className="text-sm text-white mb-4">{t("Become an exporter and expand your global business reach.")}</p>
                <a
                  target="_blank"
                  href="https://app.gotradego.com/app.gotradego/seller/auth-register-seller.asp"
                  className="py-2 px-5 inline-block tracking-wide border align-middle duration-500 text-base text-center bg-white text-indigo-600 hover:bg-gray-200 hover:text-indigo-800 border-white hover:border-gray-300 rounded-md w-full"
                  rel="noreferrer"
                >
                  {t("LCOD_LBL_REGISTER_NOW")}
                </a>
              </div>
            </div>
            <div className="shadow rounded-md p-6 bg-gradient-to-t from-green-500 to-teal-600">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium text-white">{t("Importer")}</h3>
                <p className="text-sm text-white mb-4">{t("Join the network of global importers to source the best products.")}</p>
                <a
                  target="_blank"
                  href="https://app.gotradego.com/app.gotradego/buyer/auth-register-seller.asp"
                  className="py-2 px-5 inline-block tracking-wide border align-middle duration-500 text-base text-center bg-white text-teal-600 hover:bg-gray-200 hover:text-teal-800 border-white hover:border-gray-300 rounded-md w-full"
                  rel="noreferrer"
                >
                  {t("LCOD_LBL_REGISTER_NOW")}
                </a>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 grid-cols-1 mt-8 gap-[30px] items-start">
            <div className="shadow rounded-md p-6 bg-gradient-to-t from-red-500 to-rose-600">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium text-white">{t("Solution Partner")}</h3>
                <p className="text-sm text-white mb-4">{t("Join our network as a trusted partner providing solutions.")}</p>
                <a
                  target="_blank"
                  href="https://app.gotradego.com/app.gotradego/partner/auth-register-seller.asp"
                  className="py-2 px-5 inline-block tracking-wide border align-middle duration-500 text-base text-center bg-white text-rose-600 hover:bg-gray-200 hover:text-rose-800 border-white hover:border-gray-300 rounded-md w-full"
                  rel="noreferrer"
                >
                  {t("LCOD_LBL_REGISTER_NOW")}
                </a>
              </div>
            </div>
            <div className="shadow rounded-md p-6 bg-gradient-to-t from-purple-500 to-violet-600">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium text-white">{t("Foreign Trade Specialist")}</h3>
                <p className="text-sm text-white mb-4">{t("Be an expert in international trade and consulting services.")}</p>
                <a
                  target="_blank"
                  href="https://app.gotradego.com/app.gotradego/expert/auth-register-seller.asp"
                  className="py-2 px-5 inline-block tracking-wide border align-middle duration-500 text-base text-center bg-white text-violet-600 hover:bg-gray-200 hover:text-violet-800 border-white hover:border-gray-300 rounded-md w-full"
                  rel="noreferrer"
                >
                  {t("LCOD_LBL_REGISTER_NOW")}
                </a>
              </div>
            </div>
            <div className="shadow rounded-md p-6 bg-gradient-to-t from-yellow-500 to-amber-600">
              <div className="pb-8">
                <h3 className="mb-6 text-xl font-medium text-white">{t("Regional Representative")}</h3>
                <p className="text-sm text-white mb-4">{t("Represent our brand in your region and grow your network.")}</p>
                <a
                  target="_blank"
                  href="https://app.gotradego.com/app.gotradego/city/auth-register-seller.asp"
                  className="py-2 px-5 inline-block tracking-wide border align-middle duration-500 text-base text-center bg-white text-amber-600 hover:bg-gray-200 hover:text-amber-800 border-white hover:border-gray-300 rounded-md w-full"
                  rel="noreferrer"
                >
                  {t("LCOD_LBL_REGISTER_NOW")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


