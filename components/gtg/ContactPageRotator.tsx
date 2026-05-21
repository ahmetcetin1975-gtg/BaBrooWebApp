"use client";

import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";

export function ContactPageRotator({ lang }: { lang: string }) {
  const t = useTranslate();
  return (
    <div className="container relative">
      <div className="grid grid-cols-1 text-center">
        <h3 className="mb-4 md:text-3xl md:leading-normal text-2xl leading-normal font-semibold">
          {t("LCOD_TEXT_DO_YOU_WANT_TO_JOIN_GLOBAL_NETWORK")}
          <br /> {t("LCOD_TEXT_LETS_DO_IT")}
        </h3>
        <div className="mt-6">
          <Link
            href={`/${lang}/register`}
            className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700 hover:bg-indigo-900 border-blue-700 hover:border-indigo-900 text-white rounded-md mt-4"
          >
            <i className="uil uil-phone"></i> {t("LCOD_TEXT_SLIDER_INDEX_BUTTON1")}
          </Link>
        </div>
      </div>
    </div>
  );
}


