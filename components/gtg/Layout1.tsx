"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import feather from "feather-icons";
import clsx from "clsx";
import { BaseAppConfig, type Lang } from "@/lib/gtg/config";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { api } from "@/lib/api/client";

type Layout1Props = {
  lang: Lang;
};

const NAVIGATION_LABELS: Record<Lang, {
  home: string;
  services: string;
  blog: string;
  howItWorks: string;
  faq: string;
  contact: string;
}> = {
  tr: {
    home: "Anasayfa",
    services: "Hizmetler",
    blog: "Blog",
    howItWorks: "Nasıl Çalışır",
    faq: "SSS",
    contact: "İletişim",
  },
  en: {
    home: "Home",
    services: "Services",
    blog: "Blog",
    howItWorks: "How It Works",
    faq: "FAQ",
    contact: "Contact",
  },
  ru: {
    home: "Главная",
    services: "Услуги",
    blog: "Блог",
    howItWorks: "Как это работает",
    faq: "FAQ",
    contact: "Контакты",
  },
  es: {
    home: "Inicio",
    services: "Servicios",
    blog: "Blog",
    howItWorks: "Cómo funciona",
    faq: "FAQ",
    contact: "Contacto",
  },
  fr: {
    home: "Accueil",
    services: "Services",
    blog: "Blog",
    howItWorks: "Fonctionnement",
    faq: "FAQ",
    contact: "Contact",
  },
};

export function Layout1({ lang }: Layout1Props) {
  const t = useTranslate();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loginChecking, setLoginChecking] = useState(false);
  const navLabels = NAVIGATION_LABELS[lang];

  const activePath = useMemo(() => {
    if (!pathname) {
      return "/";
    }
    const normalized = pathname.replace(/^\/(tr|en|ru|es|fr)/, "") || "/";
    return normalized === "" ? "/" : normalized;
  }, [pathname]);

  const shouldUseNavyNavbar = useMemo(() => {
    const currentPath = pathname ?? "";
    return (
      /^\/(tr|en|ru|es|fr)\/?$/.test(currentPath) ||
      /^\/(tr|en|ru|es|fr)\/bakici-bul$/.test(currentPath) ||
      /^\/(tr|en|ru|es|fr)\/blog(?:\/.*)?$/.test(currentPath) ||
      /^\/(tr|en|ru|es|fr)\/blog-detail(?:\/.*)?$/.test(currentPath)
    );
  }, [pathname]);

  const navigationItems = useMemo(
    () => [
      {
        label: navLabels.home,
        href: `/${lang}/`,
        active: activePath === "/",
      },
      {
        label: navLabels.services,
        href: `/${lang}/bakici-bul`,
        active: activePath === "/bakici-bul",
      },
      {
        label: navLabels.blog,
        href: `/${lang}/blog`,
        active: activePath === "/blog" || activePath.startsWith("/blog/"),
      },
      {
        label: navLabels.howItWorks,
        href: `/${lang}/#process`,
        active: false,
      },
      {
        label: navLabels.faq,
        href: `/${lang}/#faq`,
        active: activePath === "/faqs",
      },
      {
        label: navLabels.contact,
        href: `/${lang}/contact`,
        active: activePath === "/contact",
      },
    ],
    [activePath, lang, navLabels]
  );

  useEffect(() => {
    feather.replace();
  }, []);

  useEffect(() => {
    closeMenus();
  }, [pathname]);

  useEffect(() => {
    const navbar = document.getElementById("topnav");
    if (!navbar) {
      return;
    }
    if (shouldUseNavyNavbar) {
      navbar.classList.remove("dark");
      navbar.classList.add("navy-surface");
      return;
    }

    navbar.classList.remove("navy-surface");
    navbar.classList.add("dark");
  }, [shouldUseNavyNavbar]);

  useEffect(() => {
    const onScroll = () => {
      const navbar = document.getElementById("topnav");
      if (!navbar) {
        return;
      }
      if (document.body.scrollTop >= 50 || document.documentElement.scrollTop > 50) {
        navbar.classList.add("nav-sticky");
        if (shouldUseNavyNavbar) {
          navbar.classList.remove("dark");
          navbar.classList.add("navy-surface");
        } else if (!document.documentElement.className.includes("dark") && (pathname?.length ?? 0) > 5 && window.innerWidth > 1300) {
          navbar.classList.remove("dark");
        }
      } else {
        const errorImage = document.querySelector('img[src="assets/images/error.png"]');
        navbar.classList.remove("nav-sticky");
        if (shouldUseNavyNavbar) {
          navbar.classList.remove("dark");
          navbar.classList.add("navy-surface");
        } else if (!document.documentElement.className.includes("dark") && (pathname?.length ?? 0) > 5 && window.innerWidth > 1300 && !(pathname ?? "").includes("landing") && !errorImage) {
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
  }, [pathname, shouldUseNavyNavbar]);

  const closeMenus = () => {
    setIsOpen(false);
  };

  const toggleNavigation = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLoginClick = async () => {
    if (loginChecking) return;

    setLoginChecking(true);

    try {
      const session = await api.get<{ user: unknown | null }>("/api/auth/session");
      if (session?.user) {
        router.push(`/${lang}/home`);
        return;
      }

      try {
        await api.post("/api/auth/refresh", {});
      } catch {
        router.push(`/${lang}/login`);
        return;
      }

      const refreshedSession = await api.get<{ user: unknown | null }>("/api/auth/session");
      router.push(refreshedSession?.user ? `/${lang}/home` : `/${lang}/login`);
    } catch {
      router.push(`/${lang}/login`);
    } finally {
      setLoginChecking(false);
    }
  };

  return (
    <nav id="topnav" className={clsx("defaultscroll is-sticky", shouldUseNavyNavbar ? "navy-surface" : "dark")} onScrollCapture={() => undefined}>
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
              type="button"
              aria-expanded={isOpen}
              aria-controls="navigation"
              onClick={toggleNavigation}
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
                title={t("LCOD_LBL_REGISTER")}
                onClick={closeMenus}
                className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-orange-500 hover:bg-blue-700 text-white"
              >
                <i data-feather="user-plus" className="size-4"></i>
            </Link>
          </li>
          <li className="inline mb-0">
            <button
              type="button"
              onClick={() => void handleLoginClick()}
              title={t("LCOD_LBL_LOGIN")}
              className="size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center rounded-full bg-blue-700 hover:bg-orange-500 text-white"
              aria-busy={loginChecking}
              disabled={loginChecking}
            >
              <i data-feather="log-in" className="size-4"></i>
            </button>
          </li>
          <li className="inline ps-1 mb-0">
            <LanguageSwitch
              lang={lang}
              showLabel={false}
              className="align-middle"
              pillClassName="h-9 border-neutral-200 bg-white px-2.5 text-neutral-900 shadow-sm hover:border-neutral-300 hover:bg-neutral-50"
            />
          </li>
        </ul>

        <div id="navigation" className={clsx(isOpen && "open")}>
          <ul className="navigation-menu">
            {navigationItems.map((item) => (
              <li key={item.href} className={clsx(item.active && "active")}>
                <Link href={item.href} onClick={closeMenus} className="sub-menu-item">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
