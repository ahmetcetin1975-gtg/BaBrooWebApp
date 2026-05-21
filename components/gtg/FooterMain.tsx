"use client";

import Link from "next/link";
import { BaseAppConfig, normalizeLang, type Lang } from "@/lib/gtg/config";

type FooterCopy = {
  description: string;
  platformTitle: string;
  platform: {
    home: string;
    services: string;
    blog: string;
    howItWorks: string;
    faq: string;
    contact: string;
  };
  servicesTitle: string;
  services: {
    babyCare: string;
    houseHelp: string;
    elderCare: string;
    patientSupport: string;
    cleaning: string;
  };
  contactTitle: string;
  rights: string;
  signature: string;
};

const FOOTER_COPY: Record<Lang, FooterCopy> = {
  tr: {
    description:
      "Babroo, bakım arayanlar ve bakım verenler için daha anlaşılır bir akış sunan modern bir bakım platformu deneyimi sağlar.",
    platformTitle: "Platform",
    platform: {
      home: "Anasayfa",
      services: "Hizmetler",
      blog: "Blog",
      howItWorks: "Nasıl Çalışır",
      faq: "SSS",
      contact: "İletişim",
    },
    servicesTitle: "Popüler Başlıklar",
    services: {
      babyCare: "Bebek Bakıcısı",
      houseHelp: "Ev Yardımcısı",
      elderCare: "Yaşlı Bakımı",
      patientSupport: "Hasta Desteği",
      cleaning: "Temizlik",
    },
    contactTitle: "İletişim",
    rights: "Tüm Hakları Saklıdır",
    signature: "Babroo tarafından tasarlandı",
  },
  en: {
    description:
      "Babroo offers a modern care-platform experience for care seekers and caregivers through a clearer, calmer flow.",
    platformTitle: "Platform",
    platform: {
      home: "Home",
      services: "Services",
      blog: "Blog",
      howItWorks: "How It Works",
      faq: "FAQ",
      contact: "Contact",
    },
    servicesTitle: "Popular Categories",
    services: {
      babyCare: "Baby Care",
      houseHelp: "House Help",
      elderCare: "Elder Care",
      patientSupport: "Patient Support",
      cleaning: "Cleaning",
    },
    contactTitle: "Contact",
    rights: "All Rights Reserved",
    signature: "Designed by Babroo",
  },
  ru: {
    description:
      "Babroo предлагает современный опыт платформы ухода для тех, кто ищет поддержку, и для специалистов через более понятный и спокойный сценарий.",
    platformTitle: "Платформа",
    platform: {
      home: "Главная",
      services: "Услуги",
      blog: "Блог",
      howItWorks: "Как это работает",
      faq: "FAQ",
      contact: "Контакты",
    },
    servicesTitle: "Популярные категории",
    services: {
      babyCare: "Уход за детьми",
      houseHelp: "Помощь по дому",
      elderCare: "Уход за пожилыми",
      patientSupport: "Поддержка пациентов",
      cleaning: "Уборка",
    },
    contactTitle: "Контакты",
    rights: "Все права защищены",
    signature: "Разработано Babroo",
  },
  es: {
    description:
      "Babroo ofrece una experiencia moderna de plataforma de cuidados para quienes buscan apoyo y para cuidadores mediante un flujo más claro y tranquilo.",
    platformTitle: "Plataforma",
    platform: {
      home: "Inicio",
      services: "Servicios",
      blog: "Blog",
      howItWorks: "Cómo funciona",
      faq: "FAQ",
      contact: "Contacto",
    },
    servicesTitle: "Categorías populares",
    services: {
      babyCare: "Cuidado infantil",
      houseHelp: "Ayuda en el hogar",
      elderCare: "Cuidado de mayores",
      patientSupport: "Apoyo a pacientes",
      cleaning: "Limpieza",
    },
    contactTitle: "Contacto",
    rights: "Todos los derechos reservados",
    signature: "Diseñado por Babroo",
  },
  fr: {
    description:
      "Babroo propose une expérience moderne de plateforme de soins pour les familles et les aidants grâce à un parcours plus clair et plus serein.",
    platformTitle: "Plateforme",
    platform: {
      home: "Accueil",
      services: "Services",
      blog: "Blog",
      howItWorks: "Fonctionnement",
      faq: "FAQ",
      contact: "Contact",
    },
    servicesTitle: "Catégories populaires",
    services: {
      babyCare: "Garde d'enfants",
      houseHelp: "Aide à domicile",
      elderCare: "Aide aux personnes âgées",
      patientSupport: "Soutien aux patients",
      cleaning: "Ménage",
    },
    contactTitle: "Contact",
    rights: "Tous droits réservés",
    signature: "Conçu par Babroo",
  },
};

export function FooterMain({ lang }: { lang: string }) {
  const year = new Date().getFullYear();
  const currentLang = normalizeLang(lang);
  const copy = FOOTER_COPY[currentLang];
  const platformLinks = [
    { label: copy.platform.home, href: `/${currentLang}/` },
    { label: copy.platform.services, href: `/${currentLang}/bakici-bul` },
    { label: copy.platform.blog, href: `/${currentLang}/blog` },
    { label: copy.platform.howItWorks, href: `/${currentLang}/#process` },
    { label: copy.platform.faq, href: `/${currentLang}/#faq` },
    { label: copy.platform.contact, href: `/${currentLang}/contact` },
  ];
  const servicesLinks = [
    { label: copy.services.babyCare, href: `/${currentLang}/bakici-bul?f=bebek-cocuk-bakicisi` },
    { label: copy.services.houseHelp, href: `/${currentLang}/bakici-bul?f=ev-yardimcisi` },
    { label: copy.services.elderCare, href: `/${currentLang}/bakici-bul?f=yasli-bakicisi` },
    { label: copy.services.patientSupport, href: `/${currentLang}/bakici-bul?f=refakatci-ve-hasta-bakicisi` },
    { label: copy.services.cleaning, href: `/${currentLang}/bakici-bul?f=temizlikci` },
  ];

  return (
    <footer className="footer bg-dark-footer relative text-gray-200 dark:text-gray-200">
      <div className="container relative">
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div className="px-0 py-[60px]">
              <div className="grid grid-cols-1 gap-[30px] md:grid-cols-12">
                <div className="md:col-span-12 lg:col-span-4">
                  <Link href={`/${currentLang}/`} className="text-[22px] focus:outline-none">
                    <img src={BaseAppConfig.companyLogoDark} alt="" />
                  </Link>
                  <p className="mt-6 text-gray-300">{copy.description}</p>
                  <ul className="mt-6 list-none">
                    <li className="inline">
                      <a
                        href="https://www.linkedin.com/company/babroo/"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-md border border-gray-800 text-center align-middle text-base tracking-wide duration-500 hover:border-indigo-600 hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-linkedin" title="Linkedin"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://www.facebook.com/babroocom?locale=tr_TR"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-md border border-gray-800 text-center align-middle text-base tracking-wide duration-500 hover:border-indigo-600 hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-facebook-f align-middle" title="facebook"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://www.instagram.com/babroo/"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-md border border-gray-800 text-center align-middle text-base tracking-wide duration-500 hover:border-indigo-600 hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-instagram align-middle" title="instagram"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://x.com/babroo"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-md border border-gray-800 text-center align-middle text-base tracking-wide duration-500 hover:border-indigo-600 hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-twitter align-middle" title="twitter"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://www.youtube.com/@babroo602"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-md border border-gray-800 text-center align-middle text-base tracking-wide duration-500 hover:border-indigo-600 hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-youtube align-middle" title="youtube"></i>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="md:col-span-4 lg:col-span-2">
                  <h5 className="font-semibold tracking-[1px] text-gray-100">{copy.platformTitle}</h5>
                  <ul className="footer-list mt-6 list-none">
                    {platformLinks.map((item, index) => (
                      <li key={item.label} className={index === 0 ? "" : "ms-0 mt-[10px]"}>
                        <Link href={item.href} className="text-gray-300 duration-500 ease-in-out hover:text-gray-400">
                          <i className="uil uil-angle-right-b"></i>{item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-4 lg:col-span-3">
                  <h5 className="font-semibold tracking-[1px] text-gray-100">{copy.servicesTitle}</h5>
                  <ul className="footer-list mt-6 list-none">
                    {servicesLinks.map((item) => (
                      <li key={item.label} className="ms-0 mt-[10px]">
                        <Link href={item.href} className="text-gray-300 duration-500 ease-in-out hover:text-gray-400">
                          <i className="uil uil-angle-right-b"></i>{item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-4 lg:col-span-3">
                  <h5 className="text-center font-semibold tracking-[1px] text-gray-100">{copy.contactTitle}</h5>
                  <ul className="footer-list mt-6 list-none">
                    <li className="ms-0 mt-[10px] text-center">
                      <span className="text-gray-300 duration-500 ease-in-out">
                        <i className="uil uil-location-pin-alt text-4xl"></i>
                        <br />Maslak Mah. AOS 55. Sok.
                        <br />B Blok Apt. No:4/452
                        <br />Sarıyer/İSTANBUL
                      </span>
                    </li>
                    <li className="ms-0 mt-[10px] text-center">
                      <a href="mailto:info@babroo.com" className="text-gray-300 duration-500 ease-in-out hover:text-gray-400">
                        <i className="uil uil-fast-mail text-4xl"></i>
                        <br />info@babroo.com
                      </a>
                    </li>
                    <li className="ms-0 mt-[10px] text-center">
                      <a href="tel:+905326866222" className="text-gray-300 duration-500 ease-in-out hover:text-gray-400">
                        <i className="uil uil-phone-alt text-4xl"></i>
                        <br />+90 532 686 62 22
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-0 py-[30px]">
        <div className="container relative text-center">
          <div className="grid items-center md:grid-cols-2">
            <div className="text-center md:text-start">
              <p className="mb-0">© {year} {copy.rights}.</p>
            </div>
            <div className="text-center md:text-end">
              <a href="https://babroo.com/" target="_blank" className="text-reset" rel="noreferrer">
                {copy.signature}
              </a>{" "}
              <i className="mdi mdi-heart text-red-600"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
