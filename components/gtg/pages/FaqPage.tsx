"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { Subscription } from "@/components/gtg/Subscription";

export function FaqPage({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();
  const faqTab1 = [
    { id: 1, title: "LCOD_LBL_TAB1_QUEST_1", desc: "LCOD_LBL_TAB1_ANSWER_1" },
    { id: 2, title: "LCOD_LBL_TAB1_QUEST_2", desc: "LCOD_LBL_TAB1_ANSWER_2" },
    { id: 3, title: "LCOD_LBL_TAB1_QUEST_3", desc: "LCOD_LBL_TAB1_ANSWER_3" },
    { id: 4, title: "LCOD_LBL_TAB1_QUEST_4", desc: "LCOD_LBL_TAB1_ANSWER_4" },
    { id: 5, title: "LCOD_LBL_TAB1_QUEST_5", desc: "LCOD_LBL_TAB1_ANSWER_5" },
    { id: 6, title: "LCOD_LBL_TAB1_QUEST_6", desc: "LCOD_LBL_TAB1_ANSWER_6" },
    { id: 7, title: "LCOD_LBL_TAB1_QUEST_7", desc: "LCOD_LBL_TAB1_ANSWER_7" },
  ];
  const faqTab2 = [
    { id: 8, title: "LCOD_LBL_TAB2_QUEST_1", desc: "LCOD_LBL_TAB2_ANSWER_1" },
    { id: 9, title: "LCOD_LBL_TAB2_QUEST_2", desc: "LCOD_LBL_TAB2_ANSWER_2" },
    { id: 10, title: "LCOD_LBL_TAB2_QUEST_3", desc: "LCOD_LBL_TAB2_ANSWER_3" },
    { id: 11, title: "LCOD_LBL_TAB2_QUEST_4", desc: "LCOD_LBL_TAB2_ANSWER_4" },
    { id: 12, title: "LCOD_LBL_TAB2_QUEST_5", desc: "LCOD_LBL_TAB2_ANSWER_5" },
    { id: 13, title: "LCOD_LBL_TAB2_QUEST_6", desc: "LCOD_LBL_TAB2_ANSWER_6" },
    { id: 14, title: "LCOD_LBL_TAB2_QUEST_7", desc: "LCOD_LBL_TAB2_ANSWER_7" },
    { id: 15, title: "LCOD_LBL_TAB2_QUEST_8", desc: "LCOD_LBL_TAB2_ANSWER_8" },
  ];
  const faqTab3 = [
    { id: 16, title: "LCOD_LBL_TAB3_QUEST_1", desc: "LCOD_LBL_TAB3_ANSWER_1" },
    { id: 17, title: "LCOD_LBL_TAB3_QUEST_2", desc: "LCOD_LBL_TAB3_ANSWER_2" },
    { id: 18, title: "LCOD_LBL_TAB3_QUEST_3", desc: "LCOD_LBL_TAB3_ANSWER_3" },
    { id: 19, title: "LCOD_LBL_TAB3_QUEST_4", desc: "LCOD_LBL_TAB3_ANSWER_4" },
    { id: 20, title: "LCOD_LBL_TAB3_QUEST_5", desc: "LCOD_LBL_TAB3_ANSWER_5" },
    { id: 21, title: "LCOD_LBL_TAB3_QUEST_6", desc: "LCOD_LBL_TAB3_ANSWER_6" },
    { id: 22, title: "LCOD_LBL_TAB3_QUEST_7", desc: "LCOD_LBL_TAB3_ANSWER_7" },
    { id: 23, title: "LCOD_LBL_TAB3_QUEST_8", desc: "LCOD_LBL_TAB3_ANSWER_8" },
  ];
  const [activeTab, setActiveTab] = useState(1);
  const [activeTab2, setActiveTab2] = useState(8);
  const [activeTab3, setActiveTab3] = useState(16);

  return (
    <div>
      <section className="relative table w-full py-36 bg-[url('/assets/images/helpcenter.jpg')] bg-center bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal tracking-wide leading-normal font-medium text-white">{t("LCOD_LBL_FAQS")}</h3>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{t("LCOD_LBL_HOW_TO_WORK")}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white" aria-current="page">{t("LCOD_LBL_FAQS")}</li>
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
        <div className="container">
          <div className="flex justify-center md:pb-24 pb-16">
            <div className="lg:w-3/4">
              <div id="tech">
                <h5 className="text-2xl font-semibold">{t("LCOD_LBL_GENERAL_QUESTIONS")}</h5>
                <div className="mt-6">
                  {faqTab1.map((item) => (
                    <div key={item.id} className="relative shadow dark:shadow-gray-800 rounded-md overflow-hidden mt-4">
                      <h2 className="text-base font-semibold">
                        <button
                          type="button"
                          className={`flex justify-between items-center p-5 w-full font-medium text-start ${activeTab === item.id ? "bg-gray-50 dark:bg-slate-800 text-blue-700" : ""}`}
                          onClick={() => setActiveTab(item.id)}
                        >
                          <strong>{t(item.title)}</strong>
                          <svg
                            data-accordion-icon
                            className={`size-4 shrink-0 ${activeTab === item.id ? "rotate-180" : ""}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </h2>
                      {activeTab === item.id && (
                        <div>
                          <div className="p-5">
                            <p className="text-slate-400 dark:text-gray-400">{t(item.desc)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div id="general" className="mt-20">
                <h5 className="text-2xl font-semibold">{t("LCOD_LBL_IMPORT_EXPORT_QUESTIONS")}</h5>
                <div className="mt-6">
                  {faqTab2.map((item) => (
                    <div key={item.id} className="relative shadow dark:shadow-gray-800 rounded-md overflow-hidden mt-4">
                      <h2 className="text-base font-semibold">
                        <button
                          type="button"
                          className={`flex justify-between items-center p-5 w-full font-medium text-start ${activeTab2 === item.id ? "bg-gray-50 dark:bg-slate-800 text-blue-700" : ""}`}
                          onClick={() => setActiveTab2(item.id)}
                        >
                          <strong>{t(item.title)}</strong>
                          <svg
                            data-accordion-icon
                            className={`size-4 shrink-0 ${activeTab2 === item.id ? "rotate-180" : ""}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </h2>
                      {activeTab2 === item.id && (
                        <div>
                          <div className="p-5">
                            <p className="text-slate-400 dark:text-gray-400">{t(item.desc)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div id="payment" className="mt-20">
                <h5 className="text-2xl font-semibold">{t("LCOD_LBL_DTU_QUESTIONS")}</h5>
                <div className="mt-6">
                  {faqTab3.map((item) => (
                    <div key={item.id} className="relative shadow dark:shadow-gray-800 rounded-md overflow-hidden mt-4">
                      <h2 className="text-base font-semibold">
                        <button
                          type="button"
                          className={`flex justify-between items-center p-5 w-full font-medium text-start ${activeTab3 === item.id ? "bg-gray-50 dark:bg-slate-800 text-blue-700" : ""}`}
                          onClick={() => setActiveTab3(item.id)}
                        >
                          <strong>{t(item.title)}</strong>
                          <svg
                            data-accordion-icon
                            className={`size-4 shrink-0 ${activeTab3 === item.id ? "rotate-180" : ""}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </h2>
                      {activeTab3 === item.id && (
                        <div>
                          <div className="p-5">
                            <p className="text-slate-400 dark:text-gray-400">{t(item.desc)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Subscription lang={lang} />
      </section>
    </div>
  );
}


