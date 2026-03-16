"use client";

import { useEffect, useState } from "react";
import { useTranslate } from "@/components/gtg/TranslationProvider";

export function Cookies() {
  const t = useTranslate();
  const [accepted, setAccepted] = useState<boolean>(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("acceptCookies");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.expiry && parsed.expiry < Date.now()) {
          localStorage.removeItem("acceptCookies");
          setAccepted(false);
        } else {
          setAccepted(Boolean(parsed?.value ?? parsed));
        }
      } else {
        setAccepted(false);
      }
    } catch {
      setAccepted(false);
    }
  }, []);

  const closeCookies = () => {
    try {
      const cacheData = {
        value: true,
        expiry: Date.now() + 262974 * 60 * 1000,
      };
      localStorage.setItem("acceptCookies", JSON.stringify(cacheData));
    } catch {
      // ignore
    }
    setAccepted(true);
  };

  if (accepted) {
    return null;
  }

  return (
    <div className="cookie-popup fixed max-w-lg bottom-3 end-3 start-3 sm:start-0 mx-auto bg-white dark:bg-slate-900 shadow dark:shadow-gray-800 rounded-md py-5 px-6 z-50">
      <p className="text-slate-400">{t("LCOD_TEXT_ACCEPT_COOKIES")}</p>
      <div className="cookie-popup-actions text-end">
        <button className="absolute border-none bg-none p-0 cursor-pointer font-semibold top-2 end-2" onClick={closeCookies}>
          <i className="uil uil-times text-dark dark:text-slate-200 text-2xl"></i>
        </button>
      </div>
    </div>
  );
}


