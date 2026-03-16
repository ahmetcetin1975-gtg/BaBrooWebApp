"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { getSuccessStories } from "@/lib/gtg/api";

export function Clients() {
  const t = useTranslate();
  const [clientData, setClientData] = useState<any[]>([]);
  const sliderRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;
    getSuccessStories()
      .then((data) => {
        if (!isMounted) return;
        setClientData(
          (data ?? []).map((item: any) => {
            const blog = item?.IsMenuler ?? item?.blog ?? item;
            return {
              image: "mdi mdi-account-star",
              desc: blog?.Yazi ?? "",
              name: blog?.KisaYazi ?? "",
              title: "LCOD_LBL_CLIENT",
            };
          })
        );
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!clientData.length) {
      return;
    }

    let isCancelled = false;
    let retryCount = 0;
    const maxRetries = 20;
    let retryTimeout: number | null = null;

    const initSlider = () => {
      if (isCancelled) {
        return;
      }

      const tns = (window as any).tns;
      if (typeof tns !== "function") {
        if (retryCount < maxRetries) {
          retryCount += 1;
          retryTimeout = window.setTimeout(initSlider, 120);
        }
        return;
      }

      if (sliderRef.current && typeof sliderRef.current.destroy === "function") {
        sliderRef.current.destroy();
      }

      sliderRef.current = tns({
        container: ".tiny-three-item",
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        speed: 400,
        gutter: 12,
        responsive: {
          992: { items: 3 },
          767: { items: 2 },
          320: { items: 1 },
        },
      });
    };

    initSlider();

    return () => {
      isCancelled = true;
      if (retryTimeout !== null) {
        window.clearTimeout(retryTimeout);
      }
      if (sliderRef.current && typeof sliderRef.current.destroy === "function") {
        sliderRef.current.destroy();
      }
      sliderRef.current = null;
    };
  }, [clientData.length]);

  return (
    <div className="container relative">
      <div className="grid grid-cols-1 pb-8 text-center">
        <h4 className="font-cursive-alex text-5xl">{t("LCOD_LBL_TESTIMONIALS")}</h4>
        <p className="text-slate-400 max-w-xl mx-auto">{t("LCOD_LBL_USER_SAYS_BANNER")}</p>
      </div>

      <div className="grid grid-cols-1 mt-8">
        <div className="tiny-three-item">
          {clientData.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="tiny-slide text-center">
              <div className="cursor-e-resize">
                <div className="text-center mt-5">
                  <ul className="list-none mb-0 text-amber-400 mt-3">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <li key={starIdx} className="inline">
                        <i className="mdi mdi-star"></i>
                      </li>
                    ))}
                  </ul>
                  <h6 className="mt-2 font-semibold">{item.name}</h6>
                  <span className="text-slate-400 text-sm">{t(item.title)}</span>
                </div>
                <div className="content relative rounded shadow dark:shadow-gray-800 m-2 p-6 bg-white dark:bg-slate-900 before:content-[''] before:absolute before:start-1/2 before:-bottom-[4px] before:box-border before:border-8 before:rotate-[45deg] before:border-t-transparent before:border-e-white dark:before:border-e-slate-900 before:border-b-white dark:before:border-b-slate-900 before:border-s-transparent before:shadow-test dark:before:shadow-gray-700 before:origin-top-left">
                  <i className="mdi mdi-format-quote-open mdi-48px text-blue-700"></i>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


