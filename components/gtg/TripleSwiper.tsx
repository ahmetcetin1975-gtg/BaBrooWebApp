"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";

export function TripleSwiper({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();

  return (
    <section className="swiper-container overflow-x-hidden mobile-container sm:py-0 md:py-8 py-8">
      <div className="swiper-wrapper relative h-screen inset-0">
        <div className="swiper-slide flex items-center justify-center duration-700 ease-in-out overflow-hidden sm:mt-20 md:mt-0" id="slider1" tabIndex={-1}>
          <section className="relative table w-full overflow-hidden">
            <div className="container relative">
              <div className="relative grid md:grid-cols-12 grid-cols-1 items-center mt-10 gap-[30px]">
                <div className="md:col-span-6">
                  <div className="md:me-8">
                    <h4 className="font-extrabold lg:leading-normal leading-normal text-lg sm:text-2xl lg:text-4xl mb-5 text-black dark:text-white relative">
                      {t("LCOD_TEXT_SLIDER_INDEX_TEXT1")}
                    </h4>
                    <p className="text-slate-400 text-md sm:text-lg lg:text-xl max-w-xl">{t("LCOD_TEXT_SLIDER_INDEX_DESC1")}</p>
                    <span className="text-slate-400 font-medium">
                      {t("LCOD_LBL_LOOKING_FOR_HELP")} <Link href={`/${lang}/contact`} className="text-blue-700">{t("LCOD_LBL_GET_IN_TOUCH")}</Link>
                    </span>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="relative">
                    <div className="relative rounded-xl overflow-hidden shadow-md dark:shadow-gray-800 bg-no-repeat">
                      <div className="w-full py-72 bg-slate-400 bg-[url('/assets/images/gotradego/fts.png')] bg-cover bg-no-repeat bg-top jarallax mobile-image-container" data-jarallax data-speed="0.5"></div>
                    </div>
                    <div className="absolute flex justify-between items-center md:bottom-10 bottom-5 md:-start-16 p-4 rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 w-60 m-3">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-[65px] min-w-[65px] bg-blue-700/5 text-blue-700 text-center rounded-full me-3 text-4xl">
                          <i className="uil uil-user-circle align-middle"></i>
                        </div>
                        <div className="flex-1">
                          <h6 className="text-slate-400">{t("LCOD_TEXT_SLIDER_INDEX_COUNTER_TEXT1")}</h6>
                          <p className="text-xl font-bold">3000+</p>
                        </div>
                      </div>
                      <span className="text-green-600"><i className="uil uil-arrow-growth"></i> 10.32%</span>
                    </div>
                    <div className="absolute xl:top-20 top-40 xl:-end-20 lg:-end-10 -end-1 p-4 rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 w-60 m-3">
                      <h5 className="text-xl font-semibold mb-3">{t("LCOD_LBL_MANAGE_YOUR_FOREIGN_TRADE")}</h5>
                      <div className="flex justify-between mt-3 mb-2">
                        <span className="text-slate-400">{t("LCOD_LBL_SUCCESSFUL_TRANSACTIONS")}</span>
                        <span className="text-slate-400">84%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-[6px]">
                        <div className="bg-blue-700 h-[6px] rounded-full" style={{ width: "84%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="swiper-slide flex items-center justify-center duration-700 ease-in-out overflow-hidden sm:mt-20 md:mt-0">
          <section className="relative table w-full overflow-hidden">
            <div className="container relative">
              <div className="relative grid md:grid-cols-12 grid-cols-1 items-center mt-10 gap-[30px]">
                <div className="md:col-span-6">
                  <div className="md:me-8">
                    <h4 className="font-extrabold lg:leading-normal leading-normal text-lg sm:text-2xl lg:text-4xl mb-5 text-black dark:text-white relative">
                      {t("LCOD_TEXT_SLIDER_INDEX_TEXT2")}
                    </h4>
                    <p className="text-slate-400 text-md sm:text-lg lg:text-xl max-w-xl">{t("LCOD_TEXT_SLIDER_INDEX_DESC2")}</p>
                    <span className="text-slate-400 font-medium">
                      {t("LCOD_LBL_LOOKING_FOR_HELP")} <Link href={`/${lang}/contact`} className="text-blue-700">{t("LCOD_LBL_GET_IN_TOUCH")}</Link>
                    </span>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="relative">
                    <div className="relative rounded-xl overflow-hidden shadow-md dark:shadow-gray-800">
                      <div className="w-full py-72 bg-slate-400 bg-[url('/assets/images/gotradego/logistic-depot-small.png')] bg-cover bg-no-repeat bg-top jarallax mobile-image-container" data-jarallax data-speed="0.5"></div>
                    </div>
                    <div className="absolute flex justify-between items-center md:bottom-10 bottom-5 md:-start-16 p-4 rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 w-60 m-3">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-[65px] min-w-[65px] bg-blue-700/5 text-blue-700 text-center rounded-full me-3 text-3xl">
                          <i className="uil uil-sitemap align-middle"></i>
                        </div>
                        <div className="flex-1">
                          <h6 className="text-slate-400">{t("LCOD_LBL_PRODUCT")}</h6>
                          <p className="text-xl font-bold">50000+</p>
                        </div>
                      </div>
                      <span className="text-green-600"><i className="uil uil-arrow-growth"></i> 24%</span>
                    </div>
                    <div className="absolute xl:top-20 top-40 xl:-end-20 lg:-end-10 -end-1 p-4 rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 w-60 m-3">
                      <h5 className="text-xl font-semibold mb-3">{t("LCOD_LBL_MANAGE_YOUR_FOREIGN_TRADE")}</h5>
                      <div className="flex justify-between mt-3 mb-2">
                        <span className="text-slate-400">{t("LCOD_LBL_SOLD_PRODUCT")}</span>
                        <span className="text-slate-400">52%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-[6px]">
                        <div className="bg-blue-700 h-[6px] rounded-full" style={{ width: "52%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="swiper-slide flex items-center justify-center duration-700 ease-in-out overflow-hidden sm:mt-20 md:mt-0">
          <section className="relative table w-full overflow-hidden">
            <div className="container relative">
              <div className="relative grid md:grid-cols-12 grid-cols-1 items-center mt-10 gap-[30px]">
                <div className="md:col-span-6">
                  <div className="md:me-8">
                    <h4 className="font-extrabold lg:leading-normal leading-normal text-lg sm:text-2xl lg:text-4xl mb-5 text-black dark:text-white relative">
                      {t("LCOD_TEXT_SLIDER_INDEX_TEXT3")}
                    </h4>
                    <p className="text-slate-400 text-md sm:text-lg lg:text-xl max-w-xl">{t("LCOD_TEXT_SLIDER_INDEX_DESC3")}</p>
                    <span className="text-slate-400 font-medium">
                      {t("LCOD_LBL_LOOKING_FOR_HELP")} <Link href={`/${lang}/contact`} className="text-blue-700">{t("LCOD_LBL_GET_IN_TOUCH")}</Link>
                    </span>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="relative">
                    <div className="relative rounded-xl overflow-hidden shadow-md dark:shadow-gray-800">
                      <div className="w-full py-72 bg-slate-400 bg-[url('/assets/images/gotradego/global-network-2.jpg')] bg-cover bg-no-repeat bg-top jarallax mobile-image-container" data-jarallax data-speed="0.5"></div>
                    </div>
                    <div className="absolute flex justify-between items-center md:bottom-10 bottom-5 md:-start-16 p-4 rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 w-60 m-3">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-[65px] min-w-[65px] bg-blue-700/5 text-blue-700 text-center rounded-full me-3 text-4xl">
                          <i className="uil uil-user-square"></i>
                        </div>
                        <div className="flex-1">
                          <h6 className="text-slate-400">{t("LCOD_TEXT_SLIDER_INDEX_COUNTER_TEXT3")}</h6>
                          <p className="text-xl font-bold">4000+</p>
                        </div>
                      </div>
                      <span className="text-green-600"><i className="uil uil-arrow-growth"></i> 10%</span>
                    </div>
                    <div className="absolute xl:top-20 top-40 xl:-end-20 lg:-end-10 -end-1 p-4 rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 w-60 m-3">
                      <h5 className="text-xl font-semibold mb-3">{t("LCOD_LBL_MANAGE_YOUR_FOREIGN_TRADE")}</h5>
                      <div className="flex justify-between mt-3 mb-2">
                        <span className="text-slate-400">{t("LCOD_TEXT_SLIDER_INDEX_PROGRESS_TEXT3")}</span>
                        <span className="text-slate-400">91%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-[6px]">
                        <div className="bg-blue-700 h-[6px] rounded-full" style={{ width: "91%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="swiper-button-next hidden min-[1300px]:block"></div>
      <div className="swiper-button-prev hidden min-[1300px]:block"></div>
    </section>
  );
}


