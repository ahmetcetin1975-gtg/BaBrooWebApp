import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogByLink } from "@/lib/gtg/api";
import { BaseAppConfig, normalizeLang } from "@/lib/gtg/config";
import { RecentPosts } from "@/components/gtg/RecentPosts";

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  const blog = await getBlogByLink(resolvedParams.id);
  if (!blog?.blog?.Id) {
    notFound();
  }

  const content = (blog.blog.Yazi ?? "").replace(/\r\n/g, "<br>");
  const dateValue = blog.blog.Tarih ? new Date(blog.blog.Tarih) : null;
  const formattedDate = dateValue
    ? new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(dateValue)
    : "";

  return (
    <>
      <section className="relative table w-full py-32 lg:py-36 bg-[url('/assets/images/gotradego/blog-detail.png')] bg-center bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">{blog.blog.MenuAdi}</h3>
          </div>
        </div>
        <div className="absolute text-center z-10 bottom-5 start-0 end-0 mx-3">
          <ul className="tracking-[0.5px] mb-0 inline-block">
            <li className="inline-block text-[13px] font-bold duration-500 ease-in-out text-white/50 hover:text-white">
              <Link href={`/${lang}/`}>{BaseAppConfig.appName}</Link>
            </li>
            <li className="inline-block text-base text-white/50 mx-0.5 ltr:rotate-0 rtl:rotate-180"><i className="uil uil-angle-right-b"></i></li>
            <li className="inline-block uppercase text-[13px] font-bold duration-500 ease-in-out text-white" aria-current="page">Blog</li>
          </ul>
        </div>
      </section>
      <div className="relative">
        <div className="shape absolute sm:-bottom-px -bottom-[2px] start-0 end-0 overflow-hidden z-1 text-white dark:text-slate-900">
          <svg className="w-full h-auto scale-[2.0] origin-top" viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>

      <section className="relative md:pb-24 md:pt-40 pb-16 pt-36">
        <div className="container relative">
          <div className="grid md:grid-cols-12 grid-cols-1 gap-[30px]">
            <div className="lg:col-span-8 md:col-span-6">
              <div className="p-6 rounded-md shadow dark:shadow-gray-800">
                <img src={`${BaseAppConfig.oldAppImagePath}${blog.images?.ResimAdi ?? ""}`} className="rounded-md" alt="" />
                <div className="text-center mt-12">
                  <span className="inline-block text-white text-xs font-semibold px-2.5 py-0.5 rounded-full h-5">{blog.blog.MenuAdi}</span>
                  <ul className="list-none mt-6">
                    <li className="inline-block font-semibold text-slate-400 mx-4">
                      <span className="text-slate-900 dark:text-white block">Date :</span>
                      <span className="block">{formattedDate}</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6" dangerouslySetInnerHTML={{ __html: content }}></div>
              </div>
            </div>
            <div className="lg:col-span-4 md:col-span-6">
              <RecentPosts lang={lang} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}




