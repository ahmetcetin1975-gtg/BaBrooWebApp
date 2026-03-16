"use client";

import { useEffect, useState } from "react";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { GtgLoading } from "@/components/gtg/GtgLoading";

export type CoverData = {
  background: string;
  label: string;
  value: number;
  icon?: string;
};

export function CustomVideoPlayer({ videoData, coverData }: { videoData: string[]; coverData: CoverData[] }) {
  const t = useTranslate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [iframeWidth, setIframeWidth] = useState<number>(800);
  const [iframeHeight, setIframeHeight] = useState<number>(450);
  const [isLoading, setIsLoading] = useState(false);
  const [isWide, setIsWide] = useState(true);
  const [isCoverWide, setIsCoverWide] = useState(true);

  useEffect(() => {
    const updateSize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setIsWide(windowWidth > 1299);
      setIsCoverWide(windowWidth > 580);
      const aspectRatio = 16 / 9;
      let width = windowWidth * 0.8;
      let height = width / aspectRatio;
      const maxHeight = windowHeight * 0.6;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      setIframeWidth(Math.round(width));
      setIframeHeight(Math.round(height));
      if (windowWidth < 586) {
        setCurrentSlide(1);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const swipeNext = () => {
    setIsLoading(true);
    setCurrentSlide((prev) => (prev + 1) % videoData.length);
  };

  const swipePrev = () => {
    setIsLoading(true);
    setCurrentSlide((prev) => (prev - 1 + videoData.length) % videoData.length);
  };

  if (!videoData.length) {
    return null;
  }

  return (
    <div>
      <div className="swiper-wrapper relative inset-0" style={{ justifyContent: "center" }}>
        <div className="swiper-slide2 flex items-center justify-center duration-700 ease-in-out overflow-hidden">
          <section className="relative overflow-hidden">
            <div className="container relative" style={{ maxWidth: 1440 }}>
              <div className="grid mt-8 grid-cols-1 items-center">
                {isWide && <div className="swiper-button-prev" onClick={swipePrev}></div>}
                <div className="relative overflow-hidden rounded-lg shadow-md dark:shadow-gray-800 col-span-1 w-full max-w-screen-xl mx-auto">
                  <div className="w-full h-auto relative">
                    {currentSlide !== 0 && (
                      <iframe
                        className="iframe-video"
                        src={videoData[currentSlide]}
                        title="GoTradeGo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        width={iframeWidth}
                        height={iframeHeight}
                        onLoad={() => setIsLoading(false)}
                      ></iframe>
                    )}
                    {currentSlide === 0 && isCoverWide && coverData.length > 0 && (
                      <div className="relative" style={{ width: iframeWidth, height: iframeHeight }}>
                        <div className="relative rounded-xl overflow-hidden shadow-md dark:shadow-gray-800 bg-no-repeat">
                          <div
                            className="w-full py-72 bg-slate-400 bg-cover bg-no-repeat bg-top jarallax mobile-image-container"
                            style={{ backgroundImage: `url(${coverData[0].background})` }}
                            data-jarallax
                            data-speed="0.5"
                          ></div>
                        </div>
                        {coverData[2] && isWide && (
                          <div className="absolute flex items-center top-5 left-0 p-4 m-3 w-full max-w-md rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 md:top-10">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center h-16 w-16 bg-blue-700/5 text-blue-700 rounded-full mr-3 text-4xl">
                                <i className={coverData[2].icon ?? "uil uil-user-circle"}></i>
                              </div>
                              <div className="flex-1">
                                <h6 className="text-slate-400">{t(coverData[2].label)}</h6>
                                <p className="text-xl font-bold">{coverData[2].value}+</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {coverData[1] && (
                          <div className="absolute flex items-center bottom-5 left-0 p-4 m-3 w-full max-w-md rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 md:bottom-10">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center h-16 w-16 bg-blue-700/5 text-blue-700 rounded-full mr-3 text-4xl">
                                <i className={coverData[1].icon ?? "uil uil-sitemap"}></i>
                              </div>
                              <div className="flex-1">
                                <h6 className="text-slate-400">{t(coverData[1].label)}</h6>
                                <p className="text-xl font-bold">{coverData[1].value}+</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {coverData[0] && (
                          <div className="absolute right-0 top-72 p-4 m-3 w-full max-w-md rounded-lg shadow-md dark:shadow-gray-800 bg-white dark:bg-slate-900 lg:top-40">
                            <h5 className="text-xl font-semibold mb-3">{t("LCOD_LBL_MANAGE_YOUR_FOREIGN_TRADE")}</h5>
                            <div className="flex justify-between mt-3 mb-2">
                              <span className="text-slate-400">{t(coverData[0].label)}</span>
                              <span className="text-slate-400">{coverData[0].value}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                              <div className="bg-blue-700 h-1.5 rounded-full" style={{ width: `${coverData[0].value}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isWide && <div className="swiper-button-next" onClick={swipeNext}></div>}
              </div>
            </div>
          </section>
        </div>
      </div>
      {!isWide && (
        <>
          <div className="swiper-button-next" onClick={swipeNext}></div>
          <div className="swiper-button-prev" onClick={swipePrev}></div>
        </>
      )}
      <GtgLoading isLoading={isLoading} />
    </div>
  );
}


