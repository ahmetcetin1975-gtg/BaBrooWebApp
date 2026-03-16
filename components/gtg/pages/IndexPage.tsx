"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import {
  getPersonData,
  getPersonImages,
  getProductData,
  getProductImages,
  getRegisterData,
  getServicesData,
  getVideoData,
} from "@/lib/gtg/data";
import { TripleSwiper } from "@/components/gtg/TripleSwiper";
import { Packages } from "@/components/gtg/Packages";
import { TeamServiceProviders } from "@/components/gtg/TeamServiceProviders";
import { Clients } from "@/components/gtg/Clients";
import { VideoPlayer } from "@/components/gtg/VideoPlayer";
import { Subscription } from "@/components/gtg/Subscription";
import { Modal } from "@/components/gtg/Modal";
import { GtgLoading } from "@/components/gtg/GtgLoading";

export function IndexPage({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();
  const servicesData = useMemo(() => getServicesData(), []);
  const productImages = useMemo(() => getProductImages(), []);
  const personImages = useMemo(() => getPersonImages(), []);
  const productData = useMemo(() => getProductData(), []);
  const personData = useMemo(() => getPersonData(), []);
  const registerData = useMemo(() => getRegisterData(), []);
  const videoData = useMemo(() => getVideoData(), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [intervalTime, setIntervalTime] = useState(3000);
  const [modalOneOpen, setModalOneOpen] = useState(false);
  const [modalTwoOpen, setModalTwoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const ytlink1 = "https://www.youtube.com/embed/t5_dOuUbEm4?rel=0&autoplay=0&loop=0&controls=2";
  const ytlink2 = "https://www.youtube.com/embed/rFiMCYPUcW0?rel=0&autoplay=0&loop=0&controls=2";

  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (productImages.length - 3));
      setCurrentIndex2((prev) => (prev + 1) % (personImages.length - 3));
    }, intervalTime);
    return () => window.clearInterval(id);
  }, [intervalTime, productImages.length, personImages.length]);

  const onHover = () => {
    setIntervalTime(999999);
  };

  const onLeave = () => {
    setIntervalTime(3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900">
      <span className="absolute blur-[200px] md:size-[600px] lg:size-[600px] rounded-full top-1/2 -translate-y-1/2 start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 bg-blue-700/50 sm:w-screen"></span>
      <TripleSwiper lang={lang} />

      <section className="relative md:py-12 py-8 overflow-hidden">
        <div className="container relative">
          <div className="grid md:grid-cols-2 grid-cols-1 items-center gap-[10px]">
            <div className="relative">
              <div className="relative">
                <img src="/assets/images/gotradego/who-us-homepage.png" className="mx-auto md:max-w-xs lg:max-w-xs rounded-lg shadow-md dark:shadow-gray-800" alt="" />
                <li className="mb-1 flex hover:cursor-pointer mt-5" style={{ justifyContent: "center" }} onClick={() => { setIsLoading(true); setModalOneOpen(true); }}>
                  <i className="uil uil-youtube text-[#FF7601] text-3xl me-2"></i>
                  <span className="text-2xl" dangerouslySetInnerHTML={{ __html: t("LCOD_TEXT_WHY_CHOUSE_US_6") }}></span>
                </li>
              </div>
              <div className="overflow-hidden absolute md:size-[500px] size-[400px] bg-gradient-to-tr to-blue-700/20 via-blue-700/70 from-blue-700 bottom-1/2 translate-y-1/2 md:end-0 end-1/2 md:translate-x-0 translate-x-1/2 -z-1 shadow-md shadow-blue-700/10 rounded-full"></div>
            </div>

            <div className="lg:ms-8">
              <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-bold">
                {t("LCOD_LBL_WHY")}<span className="bg-gradient-to-r from-[#FF7601] via-blue-300 to-[#0308C2] bg-clip-text text-transparent"> GoTradeGo ?</span>
              </h3>
              <p className="text-slate-400 max-w-xl">{t("LCOD_TEXT_WHY_CHOOSE_US_2")}</p>
              <ul className="list-none text-slate-400 mt-7">
                {[
                  "LCOD_TEXT_WHY_CHOOSE_US_3",
                  "LCOD_TEXT_WHY_CHOOSE_US_4",
                  "LCOD_TEXT_WHY_CHOOSE_US_5",
                  "LCOD_TEXT_WHY_CHOOSE_US_7",
                  "LCOD_TEXT_WHY_CHOOSE_US_8",
                ].map((key) => (
                  <li key={key} className="mb-1 flex">
                    <i className="uil uil-check-circle text-blue-700 text-xl me-2 ml-1"></i>
                    <span dangerouslySetInnerHTML={{ __html: t(key) }}></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="container relative md:mt-12 mt-30">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 mt-8 gap-[20px] just">
            {servicesData.map((item) => (
              <div key={item.Id} className="group relative p-6 shadow dark:shadow-gray-800 hover:shadow-md dark:hover:shadow-gray-700 hover:bg-blue-700 dark:hover:bg-blue-700 duration-500 rounded-xl bg-white dark:bg-slate-900 overflow-hidden text-center">
                <div>
                  <i className={`${item.Icon} text-blue-700 text-5xl group-hover:text-white`}></i>
                </div>
                <div className="mt-6">
                  <span className="text-lg font-medium text-[#FF7601] duration-500 font-bold ">{t(item.Title)}</span>
                  <p className="text-slate-400 group-hover:text-white/50 duration-500 mt-3">{t(item.Desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative md:py-24 py-16 mb-10">
        <div className="container relative">
          <div className="grid md:grid-cols-12 grid-cols-1 items-start gap-[30px]">
            <div className="lg:col-span-5 md:col-span-6" onMouseOver={onHover} onMouseLeave={onLeave}>
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-6">
                  <div className="grid grid-cols-1 gap-6">
                    <img src={productImages[currentIndex]} className="shadow rounded-md" loading="lazy" alt="" style={{ height: 200, width: 200 }} />
                    <img src={productImages[currentIndex + 1]} loading="lazy" className="shadow rounded-md" alt="" style={{ height: 200, width: 200 }} />
                  </div>
                </div>
                <div className="col-span-6">
                  <div className="grid grid-cols-1 gap-6">
                    <img src={productImages[currentIndex + 2]} loading="lazy" className="shadow rounded-md" alt="" style={{ height: 200, width: 200 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 md:col-span-6 flex flex-col justify-start">
              <div className="lg:ms-5">
                <h3 className="mb-6 text-md lg:text-2xl lg:leading-normal leading-normal font-bold flex items-center justify-start">
                  <div className="mr-2">{t("LCOD_LBL_UPLOAD_PRODUCT_FOR_FREE")}</div>
                  <i className="mdi mdi-youtube text-5xl text-[#FF7601] hover:cursor-pointer" onClick={() => { setIsLoading(true); setModalTwoOpen(true); }}></i>
                </h3>
                <p className="text-slate-400 max-w-xl mb-2">{t("LCOD_LBL_UPLOAD_PRODUCT_FREE_SUBTEXT")}</p>
              </div>
              <div className="lg:ms-5 mt-10 space-y-6">
                {productData.map((item) => (
                  <div key={item.title}>
                    <div className="flex justify-between mt-3 mb-2">
                      <span className="text-blue-700 font-medium">{t(item.title)}</span>
                      <span className="text-blue-700">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-[6px]">
                      <div className="bg-[#FF7601] h-[6px] rounded-full" style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 w-full table relative bg-[#FF7601] bg-center bg-no-repeat bg-cover">
        <div className="container relative">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px] justify-center content-center">
            {registerData.map((item) => (
              <a key={item.title} href={item.href} target="_blank" className="group relative p-6 shadow dark:shadow-gray-800 hover:shadow-md dark:hover:shadow-gray-700 hover:bg-blue-700 dark:hover:bg-blue-700 duration-500 rounded-xl bg-white dark:bg-slate-900 overflow-hidden text-center" rel="noreferrer">
                <div>
                  <i className={`${item.icon} text-blue-700 text-5xl group-hover:text-white`}></i>
                </div>
                <div className="mt-6">
                  <span className="text-lg font-medium group-hover:text-white duration-500">{t(item.title)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="relative md:py-24 py-16 mb-10">
        <div className="container relative">
          <div className="grid md:grid-cols-12 grid-cols-1 items-start gap-[30px]">
            <div className="lg:col-span-5 md:col-span-6" onMouseOver={onHover} onMouseLeave={onLeave}>
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-6">
                  <div className="grid grid-cols-1 gap-6">
                    <img src={personImages[currentIndex2 + 1]} loading="lazy" className="shadow rounded-md" alt="" style={{ height: 200, width: 200 }} />
                    <img src={personImages[currentIndex2]} loading="lazy" className="shadow rounded-md" alt="" style={{ height: 200, width: 200 }} />
                  </div>
                </div>
                <div className="col-span-6">
                  <div className="grid grid-cols-1 gap-6">
                    <img src={personImages[currentIndex2 + 2]} loading="lazy" className="shadow rounded-md" alt="" style={{ height: 200, width: 200 }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 md:col-span-6 flex flex-col justify-start">
              <div className="lg:ms-5">
                <h3 className="mb-6 text-md lg:text-2xl lg:leading-normal leading-normal font-bold flex items-center justify-start">
                  <div className="mr-2" dangerouslySetInnerHTML={{ __html: t("LCOD_LBL_SERVICES_ARE_HERE") }}></div>
                  <i className="mdi mdi-youtube text-5xl text-[#FF7601] hover:cursor-pointer" onClick={() => { setIsLoading(true); setModalOneOpen(true); }}></i>
                </h3>
                <p className="text-slate-400 max-w-xl mb-2">{t("LCOD_LBL_SERVICES_ARE_HERE_SUBTEXT")}</p>
              </div>
              <div className="lg:ms-5 mt-10 space-y-6">
                {personData.map((item) => (
                  <div key={item.title}>
                    <div className="flex justify-between mt-3 mb-2">
                      <span className="text-blue-700 font-medium">{t(item.title)}</span>
                      <span className="text-blue-700">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-[6px]">
                      <div className="bg-[#FF7601] h-[6px] rounded-full" style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative md:py-16 py-8 overflow-hidden mb-10">
        <Packages />
      </section>

      <section className="relative md:py-16 py-8">
        <TeamServiceProviders />
      </section>

      <section className="relative md:py-16 py-8">
        <Clients />
      </section>

      <section className="swiper-container2 relative overflow-x-hidden md:py-16 py-8" style={{ marginTop: "-2rem" }}>
        <VideoPlayer videoData={videoData} />
      </section>

      <section className="relative md:py-16 py-8 overflow-hidden mb-10">
        <Subscription lang={lang} />
      </section>

      <Modal active={modalOneOpen} onClose={() => setModalOneOpen(false)}>
        <iframe
          width="100%"
          height="100%"
          className="z-0"
          src={ytlink1}
          onLoad={() => setIsLoading(false)}
        ></iframe>
        <button onClick={() => setModalOneOpen(false)} className="absolute top-[0.5%] right-[0.5%] bg-white text-gray-500 size-8 rounded-full z-20">
          <span className="mdi mdi-close"></span>
        </button>
      </Modal>

      <Modal active={modalTwoOpen} onClose={() => setModalTwoOpen(false)}>
        <iframe
          width="100%"
          height="100%"
          className="z-0"
          src={ytlink2}
          onLoad={() => setIsLoading(false)}
        ></iframe>
        <button onClick={() => setModalTwoOpen(false)} className="absolute top-[0.5%] right-[0.5%] bg-white text-gray-500 size-8 rounded-full z-20">
          <span className="mdi mdi-close"></span>
        </button>
      </Modal>

      <GtgLoading isLoading={isLoading} />
    </div>
  );
}


