"use client";

import Link from "next/link";
import { BaseAppConfig } from "@/lib/gtg/config";
import { useTranslate } from "@/components/gtg/TranslationProvider";

export function FooterMain({ lang }: { lang: "tr" | "en" }) {
  const t = useTranslate();
  const year = new Date().getFullYear();

  return (
    <footer className="footer bg-dark-footer relative text-gray-200 dark:text-gray-200">
      <div className="container relative">
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div className="py-[60px] px-0">
              <div className="grid md:grid-cols-12 grid-cols-1 gap-[30px]">
                <div className="lg:col-span-4 md:col-span-12">
                  <Link href={`/${lang}/`} className="text-[22px] focus:outline-none">
                    <img src={BaseAppConfig.companyLogoDark} alt="" />
                  </Link>
                  <p className="mt-6 text-gray-300">{t("LCOD_TEXT_COMPANY_DESC")}</p>
                  <ul className="list-none mt-6">
                    <li className="inline">
                      <a
                        href="https://www.linkedin.com/company/gotradego/"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-linkedin" title="Linkedin"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://www.facebook.com/gotradegocom?locale=tr_TR"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-facebook-f align-middle" title="facebook"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://www.instagram.com/gotradego/"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-instagram align-middle" title="instagram"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://x.com/gotradego"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-twitter align-middle" title="twitter"></i>
                      </a>
                    </li>
                    <li className="inline">
                      <a
                        href="https://www.youtube.com/@gotradego602"
                        target="_blank"
                        className="size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center border border-gray-800 rounded-md hover:border-indigo-600 dark:hover:border-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-600"
                        rel="noreferrer"
                      >
                        <i className="uil uil-youtube align-middle" title="youtube"></i>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-2 md:col-span-4">
                  <h5 className="tracking-[1px] text-gray-100 font-semibold">{t("LCOD_LBL_BUSINESS")}</h5>
                  <ul className="list-none footer-list mt-6">
                    <li>
                      <Link href={`/${lang}/about-us`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_ABOUT_US")}
                      </Link>
                    </li>
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/team`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_TEAM")}
                      </Link>
                    </li>
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/packages`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_PACKAGES")}
                      </Link>
                    </li>
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/blogs/1`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_BLOG")}
                      </Link>
                    </li>
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/contact`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_CONTACT")}
                      </Link>
                    </li>
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/faqs`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_FAQS_SHORT")}
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-3 md:col-span-4">
                  <h5 className="tracking-[1px] text-gray-100 font-semibold">{t("LCOD_LBL_USEFUL_LINKS")}</h5>
                  <ul className="list-none footer-list mt-6">
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/import-export`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_HOW_TO_WORK")}-{t("LCOD_LBL_FOR_BUSINESS")}
                      </Link>
                    </li>
                    <li className="mt-[10px] ms-0">
                      <Link href={`/${lang}/how-does-it-work`} className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-angle-right-b"></i>{t("LCOD_LBL_HOW_TO_WORK")}-{t("LCOD_LBL_FOR_FTS")}
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-3 md:col-span-4">
                  <h5 className="tracking-[1px] text-gray-100 font-semibold text-center">{t("LCOD_LBL_CONTACT")}</h5>
                  <ul className="list-none footer-list mt-6">
                    <li className="mt-[10px] ms-0 text-center">
                      <span className="text-gray-300 duration-500 ease-in-out">
                        <i className="uil uil-location-pin-alt text-4xl"></i>
                        <br />Maslak Mah. AOS 55. Sok.
                        <br />B Blok Apt. No:4/452
                        <br />Sariyer/ISTANBUL
                      </span>
                    </li>
                    <li className="mt-[10px] ms-0 text-center">
                      <a href="mailto:info@gotradego.com" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
                        <i className="uil uil-fast-mail text-4xl"></i>
                        <br />info@gotradego.com
                      </a>
                    </li>
                    <li className="mt-[10px] ms-0 text-center">
                      <a href="tel:+905326866222" className="text-gray-300 hover:text-gray-400 duration-500 ease-in-out">
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

      <div className="py-[30px] px-0 border-t border-slate-800">
        <div className="container relative text-center">
          <div className="grid md:grid-cols-2 items-center">
            <div className="md:text-start text-center">
              <p className="mb-0">© {year} {t("LCOD_LBL_ALL_RIGTHS_RESERVED")}.</p>
            </div>
            <div className="md:text-end text-center">
              <a href="https://gotradego.com/" target="_blank" className="text-reset" rel="noreferrer">
                {t("LCOD_LBL_DESIGNED_BY_NOYA")}
              </a> <i className="mdi mdi-heart text-red-600"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


