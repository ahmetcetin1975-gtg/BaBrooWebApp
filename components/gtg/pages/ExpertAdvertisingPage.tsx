"use client";

import { useTranslate } from "@/components/gtg/TranslationProvider";
import { getHowDoesItWorkVideoData } from "@/lib/gtg/data";
import { SubscriptionForAdvertising } from "@/components/gtg/SubscriptionForAdvertising";
import { CustomVideoPlayer } from "@/components/gtg/CustomVideoPlayer";
import { Clients } from "@/components/gtg/Clients";

export function ExpertAdvertisingPage({ lang }: { lang: string }) {
  const t = useTranslate();
  const videoData = getHowDoesItWorkVideoData();
  const coverData = [
    { label: "LCOD_LBL_ACTIVE_FTS", value: 76, icon: "uil uil-globe", background: "/assets/images/babroo/join-network.jpg" },
    { label: "LCOD_LBL_SUCCESS_SPECIALISTS", value: 1200, icon: "mdi mdi-account-star", background: "/assets/images/babroo/join-network.jpg" },
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
      <span className="absolute blur-[200px] md:size-[600px] lg:size-[600px] rounded-full top-1/2 -translate-y-1/2 start-1/3 ltr:-translate-x-1/2 rtl:translate-x-1/2 bg-blue-700/50 sm:w-screen"></span>
      <section className="relative">
        <SubscriptionForAdvertising
          lang={lang}
          adName="Dis Ticaret Uzmanlari Reklamlarindan Gelen Iletisim Formu"
          adImagePathTR="advertising/ex-ad2.png"
          adImagePathEN="advertising/ex-ad2.png"
        />
      </section>
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
        <Clients />
      </section>
    </>
  );
}


