"use client";

import { useEffect, useState } from "react";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { getFTS, getServiceProviders } from "@/lib/gtg/api";

const colors = [
  "bg-indigo-600/10 dark:bg-indigo-600/30",
  "bg-emerald-600/10 dark:bg-emerald-600/30",
  "bg-red-600/10 dark:bg-red-600/30",
  "bg-sky-600/10 dark:bg-sky-600/30",
];

function randomColor(index: number) {
  return colors[index % colors.length];
}

export function TeamServiceProviders() {
  const t = useTranslate();
  const [teamData, setTeamData] = useState<any[]>([]);
  const [spData, setSpData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    getFTS()
      .then((data) => {
        if (!mounted) return;
        setTeamData(
          (data ?? []).map((item: any, index: number) => ({
            ...item,
            color: randomColor(index),
            blog: item?.IsMenuler ?? item?.blog ?? {},
            images: item?.IsIcerikResimlers?.[0] ?? item?.images ?? {},
          }))
        );
      })
      .catch(() => undefined);
    getServiceProviders()
      .then((data) => {
        if (!mounted) return;
        setSpData(
          (data ?? []).map((item: any, index: number) => ({
            ...item,
            color: randomColor(index + 2),
            blog: item?.IsMenuler ?? item?.blog ?? {},
            images: item?.IsIcerikResimlers?.[0] ?? item?.images ?? {},
          }))
        );
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {teamData.length > 0 && (
        <div className="container relative" id="team-members">
          <div className="grid grid-cols-1 pb-8 text-center">
            <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">{t("Foreign Trade Specialist")}</h3>
          </div>
          <div className="grid md:grid-cols-12 grid-cols-1 items-center mt-8 gap-[30px]">
            {teamData.map((item, idx) => (
              <div key={`${item.blog?.MenuAdi ?? "team"}-${idx}`} className="lg:col-span-3 md:col-span-6">
                <div className="team justify-items-center p-6 rounded-md shadow-md dark:shadow-gray-800 dark:border-gray-700 bg-white dark:bg-slate-900 relative" style={{ minHeight: "23rem" }}>
                  <div className={`absolute inset-0 rounded-md -mt-[10px] -ms-[10px] size-[98%] -z-1 ${item.color}`}></div>
                  {item.images?.ResimAdi && item.images.ResimAdi.length > 3 ? (
                    <img src={`${BaseAppConfig.oldAppImagePath}${item.images.ResimAdi}`} className="size-24 rounded-full shadow-md dark:shadow-gray-800" alt="" />
                  ) : (
                    <i className="mdi mdi-account text-blue-700 text-7xl"></i>
                  )}
                  <div className="content mt-4 justify-items-center">
                    <span className="text-lg font-medium block hover:text-blue-700">{item.blog?.MenuAdi}</span>
                    <span className="text-slate-400 block">{item.blog?.KisaYazi}</span>
                    <span className="text-slate-400 block text-sm mt-2">{item.blog?.KisaLink}</span>
                    <div className="mt-4 flex flex-wrap gap-2 justify-items-center content-center items-center place-content-center">
                      {(item.blog?.Yazi ?? "")
                        .split(",")
                        .filter(Boolean)
                        .map((tag: string, tagIndex: number) => (
                          <div key={`${tag}-${tagIndex}`}>
                            <span className="bg-transparent border border-blue-700 text-blue-700 text-[12px] font-semibold px-2.5 py-0.5 rounded-full h-5">{tag}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {spData.length > 0 && (
        <div className="container relative md:my-24 my-16">
          <div className="grid grid-cols-1 pb-8 text-center">
            <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">{t("Service Providers")}</h3>
          </div>
          <div className="grid md:grid-cols-12 grid-cols-1 items-center mt-8 gap-[30px]">
            {spData.map((item, idx) => (
              <div key={`${item.blog?.MenuAdi ?? "sp"}-${idx}`} className="lg:col-span-3 md:col-span-6">
                <div className="team justify-items-center p-6 rounded-md shadow-md dark:shadow-gray-800 dark:border-gray-700 bg-white dark:bg-slate-900 relative" style={{ minHeight: "23rem" }}>
                  <div className={`absolute inset-0 rounded-md -mt-[10px] -ms-[10px] size-[98%] -z-1 ${item.color}`}></div>
                  {item.images?.ResimAdi && item.images.ResimAdi.length > 3 ? (
                    <img src={`${BaseAppConfig.oldAppImagePath}${item.images.ResimAdi}`} className="size-24 rounded-full shadow-md dark:shadow-gray-800" alt="" />
                  ) : (
                    <i className="mdi mdi-account text-blue-700 text-7xl"></i>
                  )}
                  <div className="content mt-4 justify-items-center">
                    <span className="text-lg font-medium block hover:text-blue-700">{item.blog?.MenuAdi}</span>
                    <span className="text-slate-400 block">{item.blog?.KisaYazi}</span>
                    <span className="text-slate-400 block text-sm mt-2">{item.blog?.KisaLink}</span>
                    <div className="mt-4 flex flex-wrap gap-2 justify-items-center content-center items-center place-content-center">
                      {(item.blog?.Yazi ?? "")
                        .split(",")
                        .filter(Boolean)
                        .map((tag: string, tagIndex: number) => (
                          <div key={`${tag}-${tagIndex}`}>
                            <span className="bg-transparent border border-blue-700 text-blue-700 text-[12px] font-semibold px-2.5 py-0.5 rounded-full h-5">{tag}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}


