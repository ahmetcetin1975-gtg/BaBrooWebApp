"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NotificationsModal } from "@/components/layout/NotificationsModal";
import { Sidebar } from "@/components/layout/Sidebar";

type HomeShellProps = {
  lang: string;
  children: React.ReactNode;
};

export function HomeShell({ lang, children }: HomeShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f3f3f5]">
      <div className="flex min-h-screen overflow-x-hidden">
        <Sidebar
          lang={lang}
          notificationsOpen={notificationsOpen}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          className="fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-xl border border-[#d18b00] bg-[var(--gtg-orange)] text-white shadow lg:hidden"
        >
          <Menu size={18} />
        </button>

        {mobileOpen ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar backdrop"
            className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          />
        ) : null}

        <Sidebar
          lang={lang}
          mobile
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
          notificationsOpen={notificationsOpen}
          onOpenNotifications={() => {
            setNotificationsOpen(true);
            setMobileOpen(false);
          }}
        />

        <main className="gtg-home-mobile-spacer min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>

      <NotificationsModal lang={lang} open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
