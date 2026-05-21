"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";

export function NotFoundPage({ lang }: { lang: string }) {
  const t = useTranslate();
  return (
    <section className="relative bg-indigo-600/5">
      <div className="container-fluid relative">
        <div className="grid grid-cols-1">
          <div className="flex flex-col min-h-screen justify-center md:px-10 py-10 px-4">
            <div className="title-heading text-center my-auto">
              <img src="/assets/images/error.png" className="mx-auto" alt="" />
              <h1 className="mt-3 mb-6 md:text-5xl text-3xl font-bold">{t("LCOD_LBL_404_MESSAGE_1")}</h1>
              <p className="text-slate-400"><br /> {t("LCOD_LBL_404_MESSAGE_2")}</p>
              <div className="mt-4">
                <Link href={`/${lang}/`} className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-indigo-600 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 text-white rounded-md">
                  {t("LCOD_LBL_404_MESSAGE_3")} <span className="mdi mdi-door-open"></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


