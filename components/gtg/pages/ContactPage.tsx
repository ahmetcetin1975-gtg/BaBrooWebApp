"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { Subscription } from "@/components/gtg/Subscription";

export function ContactPage({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();
  const aboutData = [
    {
      type: "phone",
      icon: "uil uil-phone",
      title: "LCOD_LBL_PHONE",
      link1: "tel:+905326866222",
      name1: "+90 532 686 62 22",
      name2: "+90 532 686 62 22",
    },
    {
      type: "mail",
      icon: "uil uil-envelope",
      title: "LCOD_LBL_EMAIL",
      link1: "mailto:info@gotradego.com",
      name1: "info@gotradego.com",
      name2: "info@gotradego.com",
    },
    {
      type: "map",
      icon: "uil uil-map-marker",
      title: "LCOD_LBL_ADDRESS",
      link1: "",
      name1: "Sariyer/ISTANBUL",
      name2: "Merkezefendi/DENIZLI",
    },
  ];

  return (
    <>
      <section
        className="relative table w-full py-36 lg:py-44 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${BaseAppConfig.imagePath}comminication.png)` }}
      >
        <div className="absolute inset-0 bg-black opacity-75"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal tracking-wide leading-normal font-medium text-white">{t("LCOD_LBL_CONTACT_US")}</h3>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180">
              <i className="uil uil-angle-right-b"></i>
            </li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white" aria-current="page">
              {t("LCOD_LBL_CONTACT_US")}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-[30px]">
            {aboutData.map((item) => (
              <div key={item.title} className="text-center px-6 mt-6">
                <div className="size-20 bg-blue-700/5 text-blue-700 rounded-xl text-3xl flex align-middle justify-center items-center shadow-sm dark:shadow-gray-800 mx-auto">
                  <i className={item.icon}></i>
                </div>
                <div className="content mt-7">
                  <h5 className="title h5 text-xl font-medium notranslate">{t(item.title)}</h5>
                  <div className="mt-2">
                    <ul>
                      <li>
                        {item.type === "map" ? (
                          <span className="notranslate relative inline-block font-semibold tracking-wide align-middle text-base text-center border-none after:content-[''] after:absolute after:h-px after:w-0 after:end-0 text-blue-700 hover:text-blue-700 after:bg-blue-700 duration-500 ease-in-out">
                            {item.name1}
                          </span>
                        ) : (
                          <a
                            href={item.link1}
                            target="_blank"
                            className="notranslate relative inline-block font-semibold tracking-wide align-middle text-base text-center border-none after:content-[''] after:absolute after:h-px after:w-0 hover:after:w-full after:end-0 hover:after:end-auto after:bottom-0 after:start-0 after:duration-500 text-blue-700 hover:text-blue-700 after:bg-blue-700 duration-500 ease-in-out"
                            rel="noreferrer"
                          >
                            {item.name1}
                          </a>
                        )}
                      </li>
                      {item.type === "map" && (
                        <li>
                          <span className="notranslate relative inline-block font-semibold tracking-wide align-middle text-base text-center border-none after:content-[''] after:absolute after:h-px after:w-0 after:end-0 text-blue-700 hover:text-blue-700 after:bg-blue-700 duration-500 ease-in-out">
                            {item.name2}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="container-fluid relative">
          <Subscription lang={lang} />
        </div>
      </section>
    </>
  );
}


