"use client";

import { useEffect, useState } from "react";
import { BaseAppConfig } from "@/lib/gtg/config";
import { GtgLoading } from "@/components/gtg/GtgLoading";

export function VideoPlayer({ videoData }: { videoData: string[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [iframeWidth, setIframeWidth] = useState<number>(800);
  const [iframeHeight, setIframeHeight] = useState<number>(450);
  const [showBackgroundImage, setShowBackgroundImage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isWide, setIsWide] = useState(true);

  useEffect(() => {
    const updateSize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setIsWide(windowWidth > 1299);
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
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const swipeNext = () => {
    setShowBackgroundImage(false);
    setIsLoading(true);
    setCurrentSlide((prev) => (prev + 1) % videoData.length);
  };

  const swipePrev = () => {
    setShowBackgroundImage(false);
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
                    <iframe
                      className="iframe-video"
                      src={videoData[currentSlide]}
                      title="GoTradeGo"
                      frameBorder={0}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      width={iframeWidth}
                      height={iframeHeight}
                      onLoad={() => setIsLoading(false)}
                    ></iframe>
                    {showBackgroundImage && (
                      <img
                        src={`${BaseAppConfig.imagePath}video-background.png`}
                        className="absolute inset-0 rounded-md shadow-lg cursor-pointer"
                        alt="Background"
                        onClick={() => setShowBackgroundImage(false)}
                      />
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


