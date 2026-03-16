"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { sendHelpMail } from "@/lib/gtg/api";
import { BaseAppConfig, environment } from "@/lib/gtg/config";
import { GtgLoading } from "@/components/gtg/GtgLoading";

export function SubscriptionForAdvertising({
  lang,
  adName,
  adImagePathTR,
  adImagePathEN,
}: {
  lang: "tr" | "en";
  adName: string;
  adImagePathTR: string;
  adImagePathEN: string;
}) {
  const t = useTranslate();
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaResponse, setRecaptchaResponse] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    comments: "",
  });

  const updateField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.comments || !recaptchaResponse) {
      await Swal.fire({
        title: `${t("LCOD_LBL_FAILED")} ?`,
        text: t("LCOD_LBL_CHECK_FROM_REQUIRED_AREAS"),
        icon: "error",
        confirmButtonText: t("LCOD_LBL_OK"),
      });
      return;
    }

    setIsLoading(true);
    try {
      const status = await sendHelpMail({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: adName,
        message: form.comments,
      });
      if (status === 200) {
        setForm({ name: "", email: "", phone: "", comments: "" });
        setRecaptchaResponse("");
        await Swal.fire({
          title: `${t("LCOD_LBL_SUCCESS")} ?`,
          text: t("LCOD_LBL_FORM_SENT_SUCCESS"),
          icon: "success",
          confirmButtonText: t("LCOD_LBL_OK"),
        });
      } else {
        await Swal.fire({
          title: `${t("LCOD_LBL_FAILED")} ?`,
          text: t("LCOD_LBL_CHECK_FROM_REQUIRED_AREAS"),
          icon: "error",
          confirmButtonText: t("LCOD_LBL_OK"),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const imagePath = lang === "tr" ? adImagePathTR : adImagePathEN;

  return (
    <>
      <section className="swiper-container overflow-x-hidden mobile-container sm:py-0">
        <div className="swiper-wrapper relative h-full inset-0">
          <div className="swiper-slide flex items-center justify-center duration-700 ease-in-out overflow-hidden mt-20" id="slider1" tabIndex={-1}>
            <section className="relative table w-full overflow-hidden">
              <div className="container relative">
                <div className="relative grid md:grid-cols-12 grid-cols-1 items-center mt-10 gap-[30px]">
                  <div className="md:col-span-6">
                    <div className="relative">
                      <div className="relative rounded-xl overflow-hidden shadow-md dark:shadow-gray-800 bg-no-repeat">
                        <div
                          className="w-full lg:py-72 bg-slate-400 bg-cover bg-no-repeat bg-top jarallax mobile-image-container"
                          style={{ backgroundImage: `url(${BaseAppConfig.imagePath}${imagePath})` }}
                          data-jarallax
                          data-speed="0.5"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <div className="md:me-8">
                      <form onSubmit={onSubmit}>
                        <div className="grid lg:grid-cols-12 lg:gap-6">
                          <div className="lg:col-span-6 mb-3">
                            <div className="text-start">
                              <label className="font-semibold">{t("LCOD_LBL_YOUR_NAME")}</label>
                              <div className="form-icon relative mt-2">
                                <i className="text-2xl absolute top-2 start-2 uil uil-user-circle"></i>
                                <input
                                  name="name"
                                  required
                                  type="text"
                                  className="form-input ps-11 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                                  placeholder={t("LCOD_LBL_NAME")}
                                  value={form.name}
                                  onChange={updateField("name")}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="lg:col-span-6 mb-3">
                            <div className="text-start">
                              <label className="font-semibold">{t("LCOD_LBL_YOUR_EMAIL")}</label>
                              <div className="form-icon relative mt-2">
                                <i className="text-2xl absolute top-2 start-2 uil uil-fast-mail"></i>
                                <input
                                  name="email"
                                  required
                                  type="email"
                                  className="form-input ps-11 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                                  placeholder={t("LCOD_LBL_EMAIL")}
                                  value={form.email}
                                  onChange={updateField("email")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1">
                          <div className="lg:col-span-12 mb-3">
                            <div className="text-start">
                              <label className="font-semibold">{t("LCOD_LBL_YOUR_PHONE_NUMBER")}</label>
                              <div className="form-icon relative mt-2">
                                <i className="text-2xl absolute top-2 start-2 uil uil-phone-volume"></i>
                                <input
                                  name="phone"
                                  required
                                  type="text"
                                  className="form-input ps-11 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                                  placeholder="+XX XXX XXX XX XX"
                                  value={form.phone}
                                  onChange={updateField("phone")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1">
                          <div className="mb-3">
                            <div className="text-start">
                              <label className="font-semibold">{t("LCOD_LBL_YOUR_COMMENT")}</label>
                              <div className="form-icon relative mt-2">
                                <i className="text-2xl absolute top-2 start-2 uil uil-comment-message"></i>
                                <textarea
                                  name="comments"
                                  required
                                  className="form-input ps-11 w-full py-2 px-3 h-28 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                                  placeholder={t("LCOD_LBL_MESSAGE")}
                                  value={form.comments}
                                  onChange={updateField("comments")}
                                ></textarea>
                              </div>
                            </div>
                          </div>
                          <div className="mb-5">
                            <ReCAPTCHA
                              sitekey={environment.recaptcha.siteKey}
                              onChange={(value: string | null) => setRecaptchaResponse(value ?? "")}
                            />
                          </div>
                        </div>
                        <div className="mb-5 items-center">
                          <div className="items-center" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button
                              disabled={isLoading}
                              type="submit"
                              className="py-2 px-5 font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 text-white rounded-md justify-center flex items-center"
                            >
                              {t("LCOD_LBL_SEND_MESSAGE")}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
      <GtgLoading isLoading={isLoading} />
    </>
  );
}


