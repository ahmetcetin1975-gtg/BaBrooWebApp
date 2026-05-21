"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslate } from "@/components/gtg/TranslationProvider";
import { sendHelpMail } from "@/lib/gtg/api";
import { BaseAppConfig, environment } from "@/lib/gtg/config";
import { GtgLoading } from "@/components/gtg/GtgLoading";
import { ContactPageRotator } from "@/components/gtg/ContactPageRotator";

export function Subscription({
  lang,
  showRoadMap = true,
  showAdImage = false,
  adImagePath = "",
  rotatorMessage,
}: {
  lang: string;
  showRoadMap?: boolean;
  showAdImage?: boolean;
  adImagePath?: string;
  rotatorMessage?: string | null;
}) {
  const t = useTranslate();
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaResponse, setRecaptchaResponse] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    comments: "",
  });

  const updateField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.subject || !form.comments || !recaptchaResponse) {
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
        subject: form.subject,
        message: form.comments,
      });
      if (status === 200) {
        setForm({ name: "", email: "", phone: "", subject: "", comments: "" });
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

  return (
    <div className="container relative">
      {showRoadMap && <ContactPageRotator lang={lang} />}
      <div className="grid md:grid-cols-12 grid-cols-1 items-center gap-[30px]">
        <div className="lg:col-span-7 md:col-span-6">
          <div className="bg-white dark:bg-slate-900 rounded-md shadow dark:shadow-gray-800 p-6">
            <form onSubmit={onSubmit}>
              <div className="grid lg:grid-cols-12 lg:gap-6">
                <div className="lg:col-span-6 mb-5">
                  <div className="text-start">
                    <label className="font-semibold">{t("LCOD_LBL_YOUR_NAME")}</label>
                    <div className="form-icon relative mt-2">
                      <i className="text-2xl absolute top-2 start-2 uil uil-user-circle"></i>
                      <input
                        name="name"
                        type="text"
                        className="form-input ps-11 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                        placeholder={t("LCOD_LBL_NAME")}
                        value={form.name}
                        onChange={updateField("name")}
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 mb-5">
                  <div className="text-start">
                    <label className="font-semibold">{t("LCOD_LBL_YOUR_EMAIL")}</label>
                    <div className="form-icon relative mt-2">
                      <i className="text-2xl absolute top-2 start-2 uil uil-fast-mail"></i>
                      <input
                        name="email"
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
              <div className="grid lg:grid-cols-12 lg:gap-6">
                <div className="lg:col-span-6 mb-5">
                  <div className="text-start">
                    <label className="font-semibold">{t("LCOD_LBL_YOUR_PHONE_NUMBER")}</label>
                    <div className="form-icon relative mt-2">
                      <i className="text-2xl absolute top-2 start-2 uil uil-phone-volume"></i>
                      <input
                        name="phone"
                        type="text"
                        className="form-input ps-11 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                        placeholder={t("LCOD_LBL_YOUR_PHONE_NUMBER")}
                        value={form.phone}
                        onChange={updateField("phone")}
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 mb-5">
                  <div className="text-start">
                    <label className="font-semibold">{t("LCOD_LBL_SUBJECT")}</label>
                    <div className="form-icon relative mt-2">
                      <i className="text-2xl absolute top-2 start-2 uil uil-book-open"></i>
                      <input
                        name="subject"
                        type="text"
                        className="form-input ps-11 w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                        placeholder={t("LCOD_LBL_SUBJECT")}
                        value={form.subject}
                        onChange={updateField("subject")}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1">
                <div className="mb-5">
                  <div className="text-start">
                    <label className="font-semibold">{t("LCOD_LBL_MESSAGE")}</label>
                    <div className="form-icon relative mt-2">
                      <i className="text-2xl absolute top-2 start-2 uil uil-comment-message"></i>
                      <textarea
                        name="comments"
                        rows={5}
                        className="form-input ps-11 w-full py-2 px-3 h-28 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border border-gray-200 focus:border-indigo-600 dark:border-gray-800 dark:focus:border-indigo-600 focus:ring-0"
                        placeholder={t("LCOD_LBL_YOUR_COMMENT")}
                        value={form.comments}
                        onChange={updateField("comments")}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-5">
                <ReCAPTCHA
                  sitekey={environment.recaptcha.siteKey}
                  onChange={(value: string | null) => setRecaptchaResponse(value ?? "")}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-700 hover:bg-blue-800 border-blue-700 hover:border-blue-800 text-white rounded-md"
              >
                {t("LCOD_LBL_SEND_MESSAGE")}
              </button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-5 md:col-span-6">
          {showAdImage && adImagePath ? (
            <img src={`${BaseAppConfig.imagePath}${adImagePath}`} className="mx-auto" alt="" />
          ) : (
            <img src={`${BaseAppConfig.imagePath}contact-us.png`} className="mx-auto" alt="" />
          )}
          {rotatorMessage ? <p className="text-center mt-4 text-slate-400">{rotatorMessage}</p> : null}
        </div>
      </div>
      <GtgLoading isLoading={isLoading} />
    </div>
  );
}


