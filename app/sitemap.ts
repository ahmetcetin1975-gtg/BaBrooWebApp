import type { MetadataRoute } from "next";

const LANGS = ["tr", "en"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gotradego.com";
  const now = new Date();

  const paths = [
    "/",
    "/about-us",
    "/contact",
    "/how-does-it-work",
    "/import-export",
    "/packages",
    "/faqs",
    "/team",
    "/kvkk",
    "/user-register-select",
    "/landing/import-export",
    "/landing/expert",
    "/blogs/1",
  ];

  const urls: MetadataRoute.Sitemap = [];

  for (const lang of LANGS) {
    for (const p of paths) {
      urls.push({
        url: `${base}/${lang}${p === "/" ? "" : p}`,
        lastModified: now,
        changeFrequency: p === "/" ? "daily" : "weekly",
        priority: p === "/" ? 1 : 0.7,
      });
    }
  }

  return urls;
}


