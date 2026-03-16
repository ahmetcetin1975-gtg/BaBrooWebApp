"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type SwiperInstance = {
  destroy?: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
};

type PluginInitResult = {
  missingLibrary: boolean;
};

const LIBRARY_SOURCES = [
  "/assets/libs/wow.js/wow.min.js",
  "/assets/libs/tiny-slider/min/tiny-slider.js",
  "/assets/libs/swiper/js/swiper.min.js",
  "/assets/libs/jarallax/jarallax.min.js",
] as const;

const scriptLoadCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptLoadCache.get(src);
  if (cached) {
    return cached;
  }

  const existingScript = Array.from(document.getElementsByTagName("script")).find((script) => {
    const scriptSrc = script.getAttribute("src");
    return scriptSrc === src || script.src.endsWith(src);
  });

  if (
    existingScript &&
    (existingScript.dataset.gtgLoaded === "1" ||
      existingScript.hasAttribute("data-nscript") ||
      (existingScript as any).readyState === "complete" ||
      (existingScript as any).readyState === "loaded")
  ) {
    existingScript.dataset.gtgLoaded = "1";
    return Promise.resolve();
  }

  const promise = new Promise<void>((resolve, reject) => {
    const onLoad = () => {
      if (targetScript) {
        targetScript.dataset.gtgLoaded = "1";
      }
      resolve();
    };

    const onError = () => reject(new Error(`Failed to load script: ${src}`));

    const targetScript = existingScript ?? document.createElement("script");
    targetScript.addEventListener("load", onLoad, { once: true });
    targetScript.addEventListener("error", onError, { once: true });

    if (!existingScript) {
      targetScript.src = src;
      targetScript.async = true;
      targetScript.defer = true;
      targetScript.dataset.gtgPlugin = src;
      document.head.appendChild(targetScript);
    }
  });

  scriptLoadCache.set(src, promise);
  return promise;
}

async function ensureLibrariesLoaded() {
  await Promise.all(LIBRARY_SOURCES.map((src) => loadScript(src)));
}

function destroySwipers() {
  document.querySelectorAll<HTMLElement>(".swiper-container").forEach((container) => {
    const typedContainer = container as HTMLElement & { __gtgSwiper?: SwiperInstance };
    if (typedContainer.__gtgSwiper && typeof typedContainer.__gtgSwiper.destroy === "function") {
      typedContainer.__gtgSwiper.destroy(true, true);
    }
    delete typedContainer.__gtgSwiper;
    delete container.dataset.gtgSwiperReady;
  });
}

function initSwipers(): PluginInitResult {
  const swiperContainers = Array.from(document.querySelectorAll<HTMLElement>(".swiper-container")).filter((container) => {
    return container.querySelectorAll(".swiper-slide").length > 1;
  });

  if (!swiperContainers.length) {
    return { missingLibrary: false };
  }

  const SwiperCtor = (window as any).Swiper;
  if (typeof SwiperCtor !== "function") {
    return { missingLibrary: true };
  }

  swiperContainers.forEach((container) => {
    if (container.dataset.gtgSwiperReady === "1") {
      return;
    }

    const nextEl = container.querySelector<HTMLElement>(".swiper-button-next");
    const prevEl = container.querySelector<HTMLElement>(".swiper-button-prev");
    const paginationEl = container.querySelector<HTMLElement>(".swiper-pagination");

    const options: Record<string, unknown> = {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      autoplay: true,
      speed: 4000,
      observer: true,
      observeParents: true,
    };

    if (nextEl && prevEl) {
      options.navigation = {
        nextEl,
        prevEl,
        enabled: true,
      };
    }

    if (paginationEl) {
      options.pagination = {
        el: paginationEl,
        clickable: true,
      };
    }

    const instance = new SwiperCtor(container, options) as SwiperInstance;
    const typedContainer = container as HTMLElement & { __gtgSwiper?: SwiperInstance };
    typedContainer.__gtgSwiper = instance;
    container.dataset.gtgSwiperReady = "1";
  });

  return { missingLibrary: false };
}

function initJarallax(): PluginInitResult {
  const elements = document.querySelectorAll<HTMLElement>("[data-jarallax]");
  if (!elements.length) {
    return { missingLibrary: false };
  }

  const jarallaxFn = (window as any).jarallax;
  if (typeof jarallaxFn !== "function") {
    return { missingLibrary: true };
  }

  jarallaxFn(elements, "destroy");
  jarallaxFn(elements);

  return { missingLibrary: false };
}

function initWow(): PluginInitResult {
  if (!document.querySelector(".wow")) {
    return { missingLibrary: false };
  }

  const WOWCtor = (window as any).WOW;
  if (typeof WOWCtor !== "function") {
    return { missingLibrary: true };
  }

  const typedWindow = window as any;
  if (!typedWindow.__gtgWow) {
    typedWindow.__gtgWow = new WOWCtor();
    typedWindow.__gtgWow.init();
    return { missingLibrary: false };
  }

  if (typeof typedWindow.__gtgWow.sync === "function") {
    typedWindow.__gtgWow.sync();
  }

  return { missingLibrary: false };
}

export function ClientPlugins() {
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: number | null = null;
    let rafId: number | null = null;
    let retryCount = 0;
    const maxRetries = 20;
    let isCancelled = false;

    const bootPlugins = () => {
      if (isCancelled) {
        return;
      }

      const swiperState = initSwipers();
      const jarallaxState = initJarallax();
      const wowState = initWow();

      const missingAnyLibrary = swiperState.missingLibrary || jarallaxState.missingLibrary || wowState.missingLibrary;
      if (missingAnyLibrary && retryCount < maxRetries) {
        retryCount += 1;
        timeoutId = window.setTimeout(bootPlugins, 120);
      }
    };

    rafId = window.requestAnimationFrame(() => {
      void ensureLibrariesLoaded()
        .catch(() => {
          // Plugin init retry logic below handles delayed/missing globals.
        })
        .finally(() => {
          bootPlugins();
        });
    });

    return () => {
      isCancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      destroySwipers();
    };
  }, [pathname]);

  return null;
}
