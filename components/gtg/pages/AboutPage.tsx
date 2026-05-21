"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { Modal } from "@/components/gtg/Modal";
import { Subscription } from "@/components/gtg/Subscription";
import { useState } from "react";

export function AboutPage({ lang }: { lang: string }) {
  const t = useTranslate();
  const [isActive, setIsActive] = useState(false);
  const date = new Date().getFullYear() - 2006;
  const videoLink = "https://www.youtube.com/embed/t5_dOuUbEm4?rel=0&autoplay=0&loop=0";

  return (
    <>
      <section
        className="relative table w-full py-36 lg:py-44 bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${BaseAppConfig.imagePath}aboutus.png)` }}
      >
        <div className="absolute inset-0 bg-black opacity-75"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="mb-6 md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">{t("LCOD_LBL_ABOUT_US")}</h3>
            <p className="text-slate-300 text-lg max-w-xl mx-auto">{t("LCOD_TEXT_ABOUT_US_SUB_TEXT")}</p>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{t("LCOD_LBL_BUSINESS")}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white" aria-current="page">
              {t("LCOD_LBL_ABOUT_US")}
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

      <section className="relative md:py-24 py-16">
        <div className="container relative">
          <div className="grid md:grid-cols-12 grid-cols-1 items-center gap-[30px]">
            <div className="lg:col-span-5 md:col-span-6">
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-6">
                  <div className="grid grid-cols-1 gap-6">
                    <img src="/assets/images/about/ab03.jpg" className="shadow rounded-md" alt="" />
                    <img src="/assets/images/about/ab02.jpg" className="shadow rounded-md" alt="" />
                  </div>
                </div>
                <div className="col-span-6">
                  <div className="grid grid-cols-1 gap-6">
                    <img src="/assets/images/about/ab01.jpg" className="shadow rounded-md" alt="" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 md:col-span-6">
              <div className="lg:ms-5">
                <div className="flex mb-4">
                  <span className="text-blue-700 text-2xl font-bold mb-0"><span className="counter-value text-6xl font-bold">{date}</span>+</span>
                  <span className="self-end font-medium ms-2">{t("LCOD_LBL_YEARS")} <br /> {t("LCOD_LBL_EXPERIENCE")}</span>
                </div>

                <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">{t("LCOD_LBL_WHO_ARE_WE")}</h3>
                <p className="text-slate-400 max-w-xl">{t("LCOD_TEXT_ABOUT_US_DESCRIPTION_TEXT1")}</p>
                <div className="mt-6">
                  <Link href={`/${lang}/contact`} className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700 hover:bg-indigo-700 border-blue-700 hover:border-indigo-700 text-white rounded-md me-2 mt-2">
                    <i className="uil uil-envelope"></i> {t("LCOD_LBL_CONTACT_US")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative md:py-24 py-16 bg-gray-50 dark:bg-slate-800">
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center">
            <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">{t("LCOD_LBL_OUR_VISION")}</h3>
          </div>
          <div className="flex flex-col items-start justify-start text-start space-y-4 text-slate-400 text-[18px] text-base">
            <ul className="list-none text-slate-400 mt-7">
              {["LCOD_TEXT_1", "LCOD_TEXT_2", "LCOD_TEXT_3", "LCOD_TEXT_4"].map((key) => (
                <li key={key} className="mb-1 flex">
                  <i className="uil uil-check-circle text-blue-700 text-xl me-2 ml-1"></i> {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative md:py-24 py-16 bg-gray-50 dark:bg-slate-800 md:pt-0 pt-0">
        <div className="container relative">
          <div className="grid grid-cols-1 justify-center">
            <div className="relative z-1">
              <div className="grid lg:grid-cols-12 grid-cols-1 md:text-start text-center justify-center">
                <div className="lg:col-start-2 lg:col-span-10">
                  <div className="relative">
                    <img src={`${BaseAppConfig.imagePath}who-are-we-background.png`} className="rounded-md shadow-lg" alt="" />
                    <div className="absolute bottom-2/4 translate-y-2/4 start-0 end-0 text-center">
                      <button
                        onClick={() => setIsActive(true)}
                        className="lightbox size-20 rounded-full shadow-lg dark:shadow-gray-800 inline-flex items-center justify-center bg-white dark:bg-slate-900 text-blue-700 dark:text-white"
                      >
                        <i className="mdi mdi-play inline-flex items-center justify-center text-2xl"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content md:mt-8">
                <div className="grid lg:grid-cols-12 grid-cols-1 md:text-start text-center justify-center">
                  <div className="lg:col-start-2 lg:col-span-10">
                    <div className="grid md:grid-cols-2 grid-cols-1 items-center">
                      <div className="mt-8">
                        <div className="section-title text-md-start">
                          <h6 className="text-slate-50 text-lg font-semibold">{BaseAppConfig.appName}</h6>
                          <h3 className="md:text-3xl text-2xl md:leading-normal leading-normal font-semibold text-white mt-2" dangerouslySetInnerHTML={{ __html: t("LCOD_LBL_WHO_ARE_WE_INNER") }}></h3>
                        </div>
                      </div>
                      <div className="mt-8">
                        <div className="section-title text-md-start">
                          <p className="text-slate-50 max-w-xl mx-auto mb-2">{t("LCOD_LBL_WAW_UPPER_TEXT1")}</p>
                          <p className="text-slate-50 max-w-xl mx-auto mb-2">{t("LCOD_LBL_WAW_UPPER_TEXT2")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 start-0 end-0 sm:h-2/3 h-4/5 bg-gradient-to-b from-indigo-500 to-blue-700"></div>
      </section>

      <Subscription lang={lang} />

      <Modal active={isActive} onClose={() => setIsActive(false)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            width="100%"
            height="100%"
            src={videoLink}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
          <button onClick={() => setIsActive(false)} className="absolute top-2 right-2 bg-white text-gray-500 size-8 rounded-full z-20">
            <span className="mdi mdi-close"></span>
          </button>
        </div>
      </Modal>
    </>
  );
}


