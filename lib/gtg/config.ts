export const environment = {
  systemUrl: "https://apitest.gotradego.com/api/",
  recaptcha: {
    siteKey: "6LfazGcqAAAAADPWWFlOldiYJyqg0xnqdSFSNJML",
  },
  demoEndDate: "2028-01-01 00:00:00",
};

export const BaseAppConfig = {
  appName: "GoTradeGo",
  oldAppImagePath: "https://test1.gotradego.com/GTG_IMAGES/icerikResimler/",
  companyLogoDark: "/assets/images/gotradego/logo-white.png",
  companyLogoLight: "/assets/images/gotradego/logo-black.png",
  splash: "/assets/images/gotradego/splash.png",
  mainAppUrl: "https://test1.gotradego.com",
  imagePath: "/assets/images/gotradego/",
  imagePathFromSrc: "/src/assets/images/gotradego/",
  locale: "tr-TR",
  lang: "en",
};

export const LANGS = ["tr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function normalizeLang(lang: string): Lang {
  return (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "tr";
}


