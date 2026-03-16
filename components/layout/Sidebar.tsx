"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  MessageCircle,
  ClipboardList,
  User,
  Bell,
  Package,
  Briefcase,
  PlusCircle,
  Bot,
  Star,
  Settings,
  LogOut,
  Coins,
  Plus,
  CircleHelp,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api/client";
import { CUSTOMER_UPDATED_EVENT, type CustomerUpdatedDetail } from "@/lib/customer/events";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";

type SidebarItemKey = keyof Messages["sidebar"]["items"];

const navItems: Array<{
  key: SidebarItemKey;
  labelKey: SidebarItemKey;
  icon: LucideIcon;
  href: string;
}> = [
  { key: "home", labelKey: "home", icon: Home, href: "/home/products" },
  { key: "chat", labelKey: "chat", icon: MessageCircle, href: "/home/chat" },
  { key: "missions", labelKey: "missions", icon: ClipboardList, href: "/home/missions" },
  { key: "profile", labelKey: "profile", icon: User, href: "/home/settings?tab=profile" },
  { key: "notifications", labelKey: "notifications", icon: Bell, href: "/home/notifications" },
  { key: "myProducts", labelKey: "myProducts", icon: Package, href: "/home/products" },
  { key: "myServices", labelKey: "myServices", icon: Briefcase, href: "/home/services" },
  { key: "addProduct", labelKey: "addProduct", icon: PlusCircle, href: "/home/add-product" },
  { key: "addService", labelKey: "addService", icon: PlusCircle, href: "/home/add-service" },
  { key: "ai", labelKey: "ai", icon: Bot, href: "/home/ai" },
  { key: "fav", labelKey: "fav", icon: Star, href: "/home/favorites" },
];

type SidebarProps = {
  lang: string;
  mobile?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
};

type CustomerData = {
  Nr?: number;
  MusteriAdi?: string;
  MusteriSoyadi?: string;
  MusteriEmail?: string;
  MusteriResimUrl?: string;
  MusteriCoin?: number;
};

type CustomerGetResponse = {
  StatusCode?: number;
  Message?: string;
  Data?: CustomerData | null;
};

function toPathWithoutQuery(href: string): string {
  return href.split("?")[0] ?? href;
}

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const target = toPathWithoutQuery(href);
  return pathname === target || pathname.startsWith(`${target}/`);
}

function isHomeContextPath(pathname: string | null, lang: string): boolean {
  return (
    isPathActive(pathname, `/${lang}/home/products`) ||
    isPathActive(pathname, `/${lang}/home/services`)
  );
}

export function Sidebar({ lang, mobile = false, mobileOpen = false, onClose, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const currentLang = normalizeLang(lang);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const t = getMessages(currentLang);
  const coin = customer?.MusteriCoin;
  const balance = typeof coin === "number" && Number.isFinite(coin) ? coin : 0;
  const footerLinks = [
    { key: "support", label: t.sidebar.support, icon: CircleHelp, href: "/home/support" },
    { key: "settings", label: t.sidebar.settings, icon: Settings, href: "/home/settings" },
  ];
  const customerFullName =
    `${customer?.MusteriAdi ?? ""} ${customer?.MusteriSoyadi ?? ""}`.trim() || user?.name || "";
  const customerImageUrl = (customer?.MusteriResimUrl ?? "").trim();
  const activeNavKey = (() => {
    if (isHomeContextPath(pathname, currentLang)) return "home";

    const settingsPath = `/${currentLang}/home/settings`;
    if (pathname === settingsPath || pathname?.startsWith(`${settingsPath}/`)) {
      const tab = (searchParams.get("tab") ?? "").trim();
      if (tab === "profile") return "profile";
      return undefined;
    }

    return navItems.find((it) => isPathActive(pathname, `/${currentLang}${it.href}`))?.key;
  })();

  const fetchCustomer = useCallback(async () => {
    if (loading) return;
    if (!user) {
      setCustomer(null);
      return;
    }

    const dil = currentLang === "tr" ? 1 : 2;

    try {
      const data = await api.get<CustomerGetResponse>(`/api/customer?dil=${dil}`);
      setCustomer(data?.Data ?? null);
    } catch {
      setCustomer(null);
    }
  }, [currentLang, loading, user]);

  useEffect(() => {
    void fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    const onCustomerUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CustomerUpdatedDetail>;
      const ad = typeof customEvent.detail?.ad === "string" ? customEvent.detail.ad : "";
      const soyad = typeof customEvent.detail?.soyad === "string" ? customEvent.detail.soyad : "";
      const coin =
        typeof customEvent.detail?.coin === "number" && Number.isFinite(customEvent.detail.coin)
          ? customEvent.detail.coin
          : null;

      if (ad || soyad || coin != null) {
        setCustomer((prev) => ({
          ...(prev ?? {}),
          MusteriAdi: ad || prev?.MusteriAdi,
          MusteriSoyadi: soyad || prev?.MusteriSoyadi,
          MusteriCoin: coin != null ? coin : prev?.MusteriCoin,
        }));
      }

      void fetchCustomer();
    };

    window.addEventListener(CUSTOMER_UPDATED_EVENT, onCustomerUpdated);
    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, onCustomerUpdated);
    };
  }, [fetchCustomer]);

  return (
    <aside
      className={clsx(
        "w-[280px] shrink-0 border-r border-gtg-border bg-gtg-surface",
        mobile
          ? "fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-out lg:hidden"
          : "hidden lg:flex lg:flex-col",
        mobile && (mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")
      )}
    >
      <div className="border-b border-gtg-border px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/assets/images/_gtg_new/GTG_blue_logo.svg" alt={t.common.appName} width={30} height={30} />
            <span className="text-base font-semibold text-gtg-blue">{t.common.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch
              lang={currentLang}
              showLabel={false}
              className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
              pillClassName="border-transparent bg-transparent px-0 py-0 text-xs font-semibold text-neutral-700"
            />
            {mobile ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="px-4 py-4">
        <div className="space-y-1">
          {navItems.map((it) => {
            const href = `/${currentLang}${it.href}`;
            const active = it.key === activeNavKey;
            const Icon = it.icon;
            return (
              <Link
                key={it.key}
                href={href}
                onClick={onNavigate}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-gtg-muted hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Icon size={18} />
                {t.sidebar.items[it.labelKey]}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2 text-amber-700">
            <Coins size={18} className="text-amber-500" />
            <span className="text-sm font-semibold">{balance}</span>
          </div>
          <button
            type="button"
            aria-label={t.sidebar.addCredits}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm transition hover:bg-amber-500"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <div className="space-y-1 px-4 pb-4">
          {footerLinks.map((link) => {
            const href = `/${currentLang}${link.href}`;
            const active = isPathActive(pathname, href);
            const Icon = link.icon;
            return (
              <Link
                key={link.key}
                href={href}
                onClick={onNavigate}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-gtg-muted hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={async () => {
              onNavigate?.();
              await logout();
              window.location.href = `/${currentLang}/login`;
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gtg-muted transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut size={18} />
            {t.sidebar.logout}
          </button>
        </div>

        <div className="border-t border-gtg-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
              {customerImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customerImageUrl} alt={customerFullName || "Customer"} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{customerFullName || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
