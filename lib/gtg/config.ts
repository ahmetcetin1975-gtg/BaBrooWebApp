export const environment = {
  systemUrl: "http://localhost:8081/api/",
  recaptcha: {
    siteKey: "6LfazGcqAAAAADPWWFlOldiYJyqg0xnqdSFSNJML",
  },
  demoEndDate: "2028-01-01 00:00:00",
};

export const BaseAppConfig = {
  appName: "Babroo",
  oldAppImagePath: "https://test1.babroo.com/GTG_IMAGES/icerikResimler/",
  companyLogoDark: "/assets/images/babroo/logo-white.png",
  companyLogoLight: "/assets/images/babroo/logo-black.png",
  splash: "/assets/images/babroo/splash.png",
  mainAppUrl: "https://test1.babroo.com",
  imagePath: "/assets/images/babroo/",
  imagePathFromSrc: "/src/assets/images/babroo/",
  locale: "tr-TR",
  lang: "en",
};

export {
  DIL_BY_LANG,
  LANGS,
  LANG_SEGMENT,
  LANGUAGE_LABELS,
  LOCALE_BY_LANG,
  dilToLang,
  langToDil,
  localeForLang,
  normalizeDil,
  normalizeLang,
  type Dil,
  type Lang,
} from "@/lib/i18n/languages";

