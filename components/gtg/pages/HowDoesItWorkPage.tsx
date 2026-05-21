"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { getHowDoesItWorkVideoData } from "@/lib/gtg/data";
import { CustomVideoPlayer } from "@/components/gtg/CustomVideoPlayer";
import { Subscription } from "@/components/gtg/Subscription";
import { Clients } from "@/components/gtg/Clients";

export function HowDoesItWorkPage({ lang }: { lang: string }) {
  const t = useTranslate();
  const videoData = getHowDoesItWorkVideoData();
  const coverData = [
    {
      label: "LCOD_LBL_ACTIVE_FTS",
      value: 76,
      icon: "uil uil-globe",
      background: "/assets/images/babroo/join-network.jpg",
    },
    {
      label: "LCOD_LBL_SUCCESS_SPECIALISTS",
      value: 1200,
      icon: "mdi mdi-account-star",
      background: "/assets/images/babroo/join-network.jpg",
    },
    {
      label: "LCOD_LBL_MANAGE_YOUR_FOREIGN_TRADE",
      value: 84,
      icon: "mdi mdi-briefcase",
      background: "/assets/images/babroo/join-network.jpg",
    },
  ];
  const feature = [
    { icon: "mdi mdi-account-plus-outline", title: "LCOD_LBL_FTS_SPEC_TITLE1", desc: "LCOD_LBL_FTS_SPEC_DESC1" },
    { icon: "mdi mdi-magnify-scan", title: "LCOD_LBL_FTS_SPEC_TITLE2", desc: "LCOD_LBL_FTS_SPEC_DESC2" },
    { icon: "mdi mdi-handshake-outline", title: "LCOD_LBL_FTS_SPEC_TITLE3", desc: "LCOD_LBL_FTS_SPEC_DESC3" },
    { icon: "mdi mdi-cash-sync", title: "LCOD_LBL_FTS_SPEC_TITLE4", desc: "LCOD_LBL_FTS_SPEC_DESC4" },
  ];
  const advantages = [
    { icon: "mdi mdi-currency-usd", title: "LCOD_LBL_FTS_ADVANTAGES_TITLE1", desc: "LCOD_LBL_FTS_ADVANTAGES_DESC" },
    { icon: "mdi mdi-camera-timer", title: "LCOD_LBL_FTS_ADVANTAGES_TITLE2", desc: "LCOD_LBL_FTS_ADVANTAGES_DESC2" },
    { icon: "mdi mdi-security-network", title: "LCOD_LBL_FTS_ADVANTAGES_TITLE3", desc: "LCOD_LBL_FTS_ADVANTAGES_DESC3" },
    { icon: "mdi mdi-finance", title: "LCOD_LBL_FTS_ADVANTAGES_TITLE4", desc: "LCOD_LBL_FTS_ADVANTAGES_DESC4" },
    { icon: "mdi mdi-earth-arrow-up", title: "LCOD_LBL_FTS_ADVANTAGES_TITLE5", desc: "LCOD_LBL_FTS_ADVANTAGES_DESC5" },
    { icon: "mdi mdi-bird", title: "LCOD_LBL_FTS_ADVANTAGES_TITLE6", desc: "LCOD_LBL_FTS_ADVANTAGES_DESC6" },
  ];

  return (
    <>
      <section
        className="relative table w-full py-36 lg:py-44 bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${BaseAppConfig.imagePath}table-of-work.png)` }}
      >
        <div className="absolute inset-0 bg-black opacity-75"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h5 className="text-white/50 text-lg font-medium">{t("LCOD_LBL_FTS_TOP_BANNER")}</h5>
            <h3 className="mt-2 md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">{t("LCOD_LBL_FOR_FTS")}</h3>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <span>{t("LCOD_LBL_HOW_TO_WORK")}</span>
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
            {feature.map((item) => (
              <div key={item.title} className="group relative p-6 shadow dark:shadow-gray-800 hover:shadow-md dark:hover:shadow-gray-700 hover:bg-blue-700 dark:hover:bg-blue-700 duration-500 rounded-xl bg-white dark:bg-slate-900 overflow-hidden text-center">
                <div>
                  <i className={`${item.icon} text-blue-700 text-5xl group-hover:text-white`}></i>
                </div>
                <div className="mt-6">
                  <span className="text-lg font-bold group-hover:text-white duration-500">{t(item.title)}</span>
                  <p className="text-slate-400 group-hover:text-white/50 duration-500 mt-3">{t(item.desc)}</p>
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
            <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">{t("LCOD_TEXT_ADVANTAGES_OF_GOTRADEGO")}</h3>
          </div>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[20px] just">
            {advantages.map((item) => (
              <div key={item.title} className="group relative p-6 shadow dark:shadow-gray-800 hover:shadow-md dark:hover:shadow-gray-700 hover:bg-blue-700 dark:hover:bg-blue-700 duration-500 rounded-xl bg-white dark:bg-slate-900 overflow-hidden text-center">
                <div>
                  <i className={`${item.icon} text-blue-700 text-5xl group-hover:text-white`}></i>
                </div>
                <div className="mt-6">
                  <span className="text-lg font-bold group-hover:text-white duration-500">{t(item.title)}</span>
                  <p className="text-slate-400 group-hover:text-white/50 duration-500 mt-3">{t(item.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative md:py-24 py-8">
        <Subscription lang={lang} showRoadMap={false} rotatorMessage={t("LCOD_LBL_DO_YOU_WANT_NEW_JOB")} />
      </section>

      <section className="relative md:py-24 py-8">
        <Clients />
      </section>
    </>
  );
}


