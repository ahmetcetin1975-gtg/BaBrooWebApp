"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { getAdvantagesData, getServicesData, getVideoData2 } from "@/lib/gtg/data";
import { CustomVideoPlayer } from "@/components/gtg/CustomVideoPlayer";
import { Subscription } from "@/components/gtg/Subscription";
import { Clients } from "@/components/gtg/Clients";

export function ImportExportPage({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();
  const servicesData = getServicesData();
  const advantagesData = getAdvantagesData();
  const videoData = getVideoData2();
  const coverData = [
    { label: "LCOD_LBL_COMPANY_FOREIGN_TRADE", value: 45, icon: "uil uil-globe", background: "/assets/images/gotradego/success-stairs.jpg" },
    { label: "LCOD_LBL_SUCCESS_EXPORT", value: 150, icon: "mdi mdi-export", background: "/assets/images/gotradego/success-stairs.jpg" },
    { label: "LCOD_LBL_SUCCESS_IMPORT", value: 233, icon: "mdi mdi-import", background: "/assets/images/gotradego/success-stairs.jpg" },
  ];

  return (
    <>
      <section
        className="relative table w-full py-36 lg:py-44 bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${BaseAppConfig.imagePath}logistic-depot.png)` }}
      >
        <div className="absolute inset-0 bg-black opacity-75"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h5 className="text-white/50 text-lg font-medium">{t("LCOD_LBL_HOW_TO_WORK")}</h5>
            <h3 className="mt-2 md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">{t("LCOD_LBL_FOR_IMPORT_EXPORT_PAGE_TOP_BANNER")}</h3>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{t("LCOD_LBL_HOW_TO_WORK")}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white" aria-current="page">{t("LCOD_LBL_IMPORT_EXPORT")}</li>
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

      <section className="relative md:py-24 py-16">
        <div className="container relative md:mt-12 mt-30">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 mt-8 gap-[20px] just">
            {servicesData.map((item) => (
              <div key={item.Id} className="group relative p-6 shadow dark:shadow-gray-800 hover:shadow-md dark:hover:shadow-gray-700 hover:bg-blue-700 dark:hover:bg-indigo-600 duration-500 rounded-xl bg-white dark:bg-slate-900 overflow-hidden text-center">
                <div>
                  <i className={`${item.Icon} text-blue-700 text-5xl group-hover:text-white`}></i>
                </div>
                <div className="mt-6">
                  <span className="text-lg font-bold group-hover:text-white duration-500">{t(item.Title)}</span>
                  <p className="text-slate-400 group-hover:text-white/50 duration-500 mt-3">{t(item.Desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="swiper-container2 relative overflow-x-hidden mt-10 md:block" style={{ marginTop: "-2rem" }}>
        <CustomVideoPlayer videoData={videoData} coverData={coverData} />
      </section>

      <section className="relative md:py-24 py-16">
        <div className="container relative md:mt-12 mt-30">
          <div className="text-center">
            <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">{t("LCOD_TEXT_DO_YOU_WANT_TO_JOIN_GLOBAL_NETWORK")}</h3>
          </div>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[20px] just">
            {advantagesData.map((item) => (
              <div key={item.Id} className="group relative p-6 shadow dark:shadow-gray-800 hover:shadow-md dark:hover:shadow-gray-700 hover:bg-blue-700 dark:hover:bg-blue-700 duration-500 rounded-xl bg-white dark:bg-slate-900 overflow-hidden text-center">
                <div>
                  <i className={`${item.Icon} text-blue-700 text-5xl group-hover:text-white`}></i>
                </div>
                <div className="mt-6">
                  <span className="text-lg font-bold group-hover:text-white duration-500">{t(item.Title)}</span>
                  <p className="text-slate-400 group-hover:text-white/50 duration-500 mt-3">{t(item.Desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative md:py-24 py-8">
        <Subscription lang={lang} />
      </section>
      <section className="relative md:py-24 py-8">
        <Clients />
      </section>
    </>
  );
}


