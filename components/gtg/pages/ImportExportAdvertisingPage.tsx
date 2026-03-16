"use client";

import { useTranslate } from "@/components/gtg/TranslationProvider";
import { getAdvantagesData, getServicesData, getVideoData2 } from "@/lib/gtg/data";
import { SubscriptionForAdvertising } from "@/components/gtg/SubscriptionForAdvertising";
import { CustomVideoPlayer } from "@/components/gtg/CustomVideoPlayer";
import { Clients } from "@/components/gtg/Clients";

export function ImportExportAdvertisingPage({ lang }: { lang: "tr" | "en" }) {
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
      <span className="absolute blur-[200px] md:size-[600px] lg:size-[600px] rounded-full top-1/2 -translate-y-1/2 start-1/3 ltr:-translate-x-1/2 rtl:translate-x-1/2 bg-blue-700/50 sm:w-screen"></span>
      <section className="relative">
        <SubscriptionForAdvertising
          lang={lang}
          adName="Ithalat ve Ihracat Reklamlarindan Gelen Iletisim Formu"
          adImagePathTR="advertising/ie-ad2.png"
          adImagePathEN="advertising/ie-ad2.png"
        />
      </section>

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
        <Clients />
      </section>
    </>
  );
}


