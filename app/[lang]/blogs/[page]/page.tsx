import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizeLang } from "@/lib/gtg/config";
import { getBlogs } from "@/lib/gtg/api";
import { getDictionary, t } from "@/lib/gtg/i18n";
import { BaseAppConfig } from "@/lib/gtg/config";
import { Paginator } from "@/components/gtg/Paginator";

export default async function Page({ params }: { params: Promise<{ lang: string; page: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  const pageNumber = Number(resolvedParams.page) || 1;
  const tableSize = 9;
  const skip = (pageNumber - 1) * tableSize;
  const dict = await getDictionary(lang);
  const blogData = await getBlogs(skip, tableSize);
  if (!blogData || blogData.length === 0) {
    notFound();
  }
  const totalItems = blogData[0]?.totalCount ?? 0;

  return (
    <>
      <section className="relative table w-full py-32 lg:py-36 bg-[url('/assets/images/gotradego/bloglist.png')] bg-center bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-black opacity-80"></div>
        <div className="container relative">
          <div className="grid grid-cols-1 pb-8 text-center mt-10">
            <h3 className="md:text-4xl text-3xl md:leading-normal leading-normal font-medium text-white">BLOG</h3>
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

      <section className="relative md:py-24 py-16">
        <div className="container relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-[30px]">
            {blogData.map((item) => {
              const blog = item.blog ?? {};
              const image = item.images ?? {};
              const slug = lang === "en" ? blog.KisaLinkEng || blog.KisaLink : blog.KisaLink;
              return (
                <div key={blog.Id} className="blog relative rounded-md shadow dark:shadow-gray-800 overflow-hidden">
                  <img src={`${BaseAppConfig.oldAppImagePath}/${image.ResimAdi}`} alt="" />
                  <div className="content p-6">
                    <Link href={`/${lang}/blog-detail/${slug}`} className="title h5 text-lg font-medium hover:text-indigo-600 duration-500 ease-in-out">
                      {blog.MenuAdi}
                    </Link>
                    <p className="text-slate-400 mt-3">{blog.KisaYazi}</p>
                    <div className="mt-4">
                      <Link href={`/${lang}/blog-detail/${slug}`} className="relative inline-block tracking-wide align-middle text-base text-center border-none after:content-[''] after:absolute after:h-px after:w-0 hover:after:w-full after:end-0 hover:after:end-auto after:bottom-0 after:start-0 after:duration-500 font-normal hover:text-indigo-600 after:bg-indigo-600 duration-500 ease-in-out">
                        {t(dict, "LCOD_LBL_READ_MORE")} <i className="mdi mdi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalItems !== 0 && (
            <Paginator lang={lang} baseRoute="blogs" currentPage={pageNumber} totalItems={totalItems} tableSize={tableSize} />
          )}
        </div>
      </section>
    </>
  );
}




