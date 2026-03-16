"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { BaseAppConfig } from "@/lib/gtg/config";
import { getRecentBlogs } from "@/lib/gtg/api";

export function RecentPosts({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();
  const [blogData, setBlogData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    getRecentBlogs()
      .then((res) => {
        if (!mounted) return;
        setBlogData(res ?? []);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <div className="sticky top-20">
      <h5 className="text-lg font-semibold bg-gray-50 dark:bg-slate-800 shadow dark:shadow-gray-800 rounded-md p-2 text-center my-8">{t("LCOD_LBL_RECENT_POST")}</h5>
      {blogData.map((item, idx) => {
        const blog = item.blog ?? {};
        const image = item.images ?? {};
        const slug = lang === "en" ? blog.KisaLinkEng || blog.KisaLink : blog.KisaLink;
        return (
          <div key={`${blog.MenuAdi}-${idx}`} className="flex items-center mt-4">
            <img src={`${BaseAppConfig.oldAppImagePath}${image.ResimAdi}`} className="h-16 rounded-md shadow dark:shadow-gray-800" alt="" />
            <div className="ms-3">
              <Link href={`/${lang}/blog-detail/${slug}`} className="font-semibold hover:text-indigo-600">
                {blog.MenuAdi}
              </Link>
              <p className="text-sm text-slate-400">{formatDate(blog.Tarih)}</p>
            </div>
          </div>
        );
      })}

      <h5 className="text-lg font-semibold bg-gray-50 dark:bg-slate-800 shadow dark:shadow-gray-800 rounded-md p-2 text-center mt-8">{t("LCOD_LBL_SOCIAL_MEDIA")}</h5>
      <ul className="list-none text-center mt-8">
        <li className="inline">
          <a href="https://www.linkedin.com/company/gotradego/" target="_blank" className="size-8 text-blue-500 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600" rel="noreferrer">
            <i className="uil uil-linkedin" title="Linkedin"></i>
          </a>
        </li>
        <li className="inline">
          <a href="https://www.facebook.com/gotradegocom?locale=tr_TR" target="_blank" className="size-8 text-blue-600 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600" rel="noreferrer">
            <i className="uil uil-facebook-f align-middle" title="facebook"></i>
          </a>
        </li>
        <li className="inline">
          <a href="https://www.instagram.com/gotradego/" target="_blank" className="size-8 inline-flex text-pink-600 items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600" rel="noreferrer">
            <i className="uil uil-instagram align-middle" title="instagram"></i>
          </a>
        </li>
        <li className="inline">
          <a href="https://x.com/gotradego" target="_blank" className="size-8 inline-flex items-center text-blue-500 justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600" rel="noreferrer">
            <i className="uil uil-twitter align-middle" title="twitter"></i>
          </a>
        </li>
        <li className="inline">
          <a href="https://www.youtube.com/@gotradego602" target="_blank" className="size-8 inline-flex text-red-500 items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600" rel="noreferrer">
            <i className="uil uil-youtube align-middle" title="youtube"></i>
          </a>
        </li>
      </ul>
    </div>
  );
}


