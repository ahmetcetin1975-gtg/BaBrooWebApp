"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import feather from "feather-icons";
import clsx from "clsx";
import { BaseAppConfig } from "@/lib/gtg/config";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { persistLanguagePreference } from "@/lib/i18n/client-language";

const LANG_FLAGS = {
  en: "/assets/images/united-states.png",
  tr: "/assets/images/turkey.png",
} as const;

type Layout1Props = {
  lang: "tr" | "en";
};

export function Layout1({ lang }: Layout1Props) {
  const t = useTranslate();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string>("");

  const activePath = useMemo(() => {
    if (!pathname) {
      return "/";
    }
    const normalized = pathname.replace(/^\/(tr|en)/, "") || "/";
    return normalized === "" ? "/" : normalized;
  }, [pathname]);

  useEffect(() => {
    feather.replace();
  }, []);

  useEffect(() => {
    const navbar = document.getElementById("topnav");
    if (!navbar) {
      return;
    }
    const isHome = /^\/(tr|en)\/?$/.test(pathname ?? "");
    if (isHome && !document.documentElement.className.includes("dark")) {
      navbar.classList.remove("dark");
    }
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const navbar = document.getElementById("topnav");
      if (!navbar) {
        return;
      }
      if (document.body.scrollTop >= 50 || document.documentElement.scrollTop > 50) {
        navbar.classList.add("nav-sticky");
        if (!document.documentElement.className.includes("dark") && (pathname?.length ?? 0) > 5 && window.innerWidth > 1300) {
          navbar.classList.remove("dark");
        }
      } else {
        const errorImage = document.querySelector('img[src="assets/images/error.png"]');
        navbar.classList.remove("nav-sticky");
        if (!document.documentElement.className.includes("dark") && (pathname?.length ?? 0) > 5 && window.innerWidth > 1300 && !(pathname ?? "").includes("landing") && !errorImage) {
          navbar.classList.add("dark");
        }
      }

      const backToTop = document.getElementById("back-to-top");
      if (backToTop) {
        if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
          backToTop.classList.add("block");
          backToTop.classList.remove("hidden");
        } else {
          backToTop.classList.add("hidden");
          backToTop.classList.remove("block");
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const handleLanguageChange = (target: "tr" | "en") => {
    persistLanguagePreference(target);
    const newPath = (pathname ?? "/").replace(/^\/(tr|en)/, `/${target}`);
    router.push(newPath);
  };

  return (
    <nav id="topnav" className="defaultscroll is-sticky dark" onScrollCapture={() => undefined}>
      <div className="container relative">
        <Link className="logo logo2" href={`/${lang}/`}>
          <img
            src={BaseAppConfig.companyLogoLight}
            className="inline-block dark:hidden"
            alt="lightLogo"
            style={{ height: "2rem", maxWidth: "11rem" }}
          />
          <img
            src={BaseAppConfig.companyLogoDark}
            className="hidden dark:inline-block"
            id="darkLogo"
            alt=""
            style={{ height: "2rem", maxWidth: "11rem" }}
          />
        </Link>

        <div className="menu-extras">
          <div className="menu-item">
            <button
              className={clsx("navbar-toggle", isOpen && "open")}
              id="isToggle"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <div className="lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        <ul className="buy-button list-none mb-0">
          <li className="inline ps-1 mb-0">
            <Link
              href={`/${lang}/register`}
              //href={`/${lang}/user-register-select`}
              title={t("LCOD_LBL_REGISTER")}
              className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-orange-500 hover:bg-blue-700 text-white"
            >
              <i data-feather="user-plus" className="size-4"></i>
            </Link>
          </li>
          <li className="inline mb-0">
            <a
              href={`/${lang}/login`}
              //target="_blank"
              //href={`${BaseAppConfig.mainAppUrl}/app.gotradego/seller/auth-login.html`}
              //target="_blank"
              title={t("LCOD_LBL_LOGIN")}
              className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-blue-700 hover:bg-orange-500 text-white"
              rel="noreferrer"
            >
              <i data-feather="log-in" className="size-4"></i>
            </a>
          </li>
          {lang === "en" ? (
            <li className="inline ps-1 mb-0">
              <button
                onClick={() => handleLanguageChange("tr")}
                className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-blue-700 hover:bg-orange-700 text-white hover:cursor-pointer"
                type="button"
              >
                <img alt="Turkey" src={LANG_FLAGS.tr} height={512} width={512} />
              </button>
            </li>
          ) : (
            <li className="inline ps-1 mb-0">
              <button
                onClick={() => handleLanguageChange("en")}
                className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full text-white hover:cursor-pointer"
                type="button"
              >
                <img alt="United States" src={LANG_FLAGS.en} height={512} width={512} />
              </button>
            </li>
          )}
        </ul>

        <div id="navigation" className={clsx(isOpen && "open")}>
          <ul className="navigation-menu">
            <li className={clsx(activePath === "/" && "active")}>
              <Link href={`/${lang}/`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                {t("LCOD_LBL_HOMEPAGE")}
              </Link>
            </li>

            <li className={clsx("has-submenu parent-parent-menu-item", ["/about-us", "/kvkk", "/team"].includes(activePath) && "active")}>
              <button onClick={() => setMenuOpen("/business")} className="hover:cursor-pointer">
                {t("LCOD_LBL_BUSINESS")}
              </button>
              <span className="menu-arrow"></span>
              <ul className={clsx("submenu", menuOpen === "/business" && "open")}>
                <li>
                  <ul>
                    <li className={clsx(activePath === "/about-us" && "active")}>
                      <Link href={`/${lang}/about-us`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_ABOUT_US")}
                      </Link>
                    </li>
                    <li className={clsx(activePath === "/kvkk" && "active")}>
                      <Link href={`/${lang}/kvkk`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_KVKK")}
                      </Link>
                    </li>
                    <li className={clsx(activePath === "/team" && "active")}>
                      <Link href={`/${lang}/team`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_TEAM")}
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className={clsx("submenu has-submenu parent-menu-item hover:cursor-pointer", ["/import-export", "/how-does-it-work", "/faqs", "/blogs"].includes(menuOpen) && "active")}>
              <button onClick={() => setMenuOpen("/import-export")}>
                {t("LCOD_LBL_HOW_TO_WORK")}
              </button>
              <span className="menu-arrow"></span>
              <ul className={clsx("submenu", ["/how-does-it-work", "/import-export", "/faqs", "/blogs"].includes(menuOpen) && "open")}>
                <li>
                  <ul>
                    <li className={clsx(activePath === "/import-export" && "active")}>
                      <Link href={`/${lang}/import-export`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_FOR_BUSINESS")}
                      </Link>
                    </li>
                    <li className={clsx(activePath === "/how-does-it-work" && "active")}>
                      <Link href={`/${lang}/how-does-it-work`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_FOR_FTS")}
                      </Link>
                    </li>
                    <li className={clsx(activePath.startsWith("/blogs") && "active")}>
                      <Link href={`/${lang}/blogs/1`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_BLOG")}
                      </Link>
                    </li>
                    <li className={clsx(activePath === "/faqs" && "active")}>
                      <Link href={`/${lang}/faqs`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                        {t("LCOD_LBL_FAQS")} <span className="bg-cyan-500/5 border border-cyan-500/5 text-cyan-500 text-[12px] font-semibold px-2.5 py-0.5 rounded h-5">{t("LCOD_LBL_FAQS_SHORT")}</span>
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className={clsx(activePath === "/packages" && "active")}>
              <Link href={`/${lang}/packages`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                {t("LCOD_LBL_PACKAGES")}
              </Link>
            </li>

            <li className={clsx(activePath === "/contact" && "active")}>
              <Link href={`/${lang}/contact`} onClick={() => setIsOpen(false)} className="sub-menu-item">
                {t("LCOD_LBL_CONTACT_US")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
