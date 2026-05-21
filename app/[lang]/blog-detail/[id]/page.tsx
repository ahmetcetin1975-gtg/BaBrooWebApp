import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { resolveBlogImageUrl } from "@/lib/blog/images";
import { langToDil, localeForLang, normalizeLang, type Lang } from "@/lib/gtg/config";
import { proxyJson } from "@/lib/server/proxy";

type BlogDetailItem = {
  Nr?: number;
  BlogResim?: string | null;
  BlogResimUrl?: string | null;
  Baslik?: string | null;
  Kategori?: string | null;
  Etiketler?: string | null;
  BlogBaslik?: string | null;
  BlogAciklama?: string | null;
  BlogKategori?: string | null;
  BlogEtiketler?: string | null;
  Aciklama?: string | null;
  BlogYayinTarihi?: string | null;
  Aktif?: boolean | null;
};

type BlogDetailResponse = {
  Data?: BlogDetailItem | null;
};

function formatDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeForLang(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const BLOG_DETAIL_COPY: Record<Lang, { backToBlogHome: string }> = {
  tr: { backToBlogHome: "Blog ana sayfasına dön" },
  en: { backToBlogHome: "Back to blog home" },
  ru: { backToBlogHome: "Вернуться к блогу" },
  es: { backToBlogHome: "Volver al blog" },
  fr: { backToBlogHome: "Retour au blog" },
};

function parseTags(tags: string | null | undefined): string[] {
  return String(tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = await params;
  const lang = normalizeLang(resolvedParams.lang);
  const id = Number(resolvedParams.id);
  const dil = langToDil(lang);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const path = `${process.env.BLOG_GET_ID_PATH ?? "/api/Blog/getid"}/${id}?${new URLSearchParams({ dil: String(dil) }).toString()}`;
  const result = await proxyJson({ path, method: "GET", forwardAuth: false }).catch(() => null);

  if (!result?.res.ok) {
    notFound();
  }

  const blog = (result.data as BlogDetailResponse | undefined)?.Data;
  if (!blog?.Nr) {
    notFound();
  }

  const copy = BLOG_DETAIL_COPY[lang];
  const title = String(blog.Baslik ?? blog.BlogBaslik ?? "").trim();
  const description = String(blog.Aciklama ?? blog.BlogAciklama ?? "").trim();
  const category = String(blog.Kategori ?? blog.BlogKategori ?? "").trim();
  const tags = blog.Etiketler ?? blog.BlogEtiketler;
  const content = description.replace(/\r\n|\n/g, "<br>");
  const imageSrc = resolveBlogImageUrl(blog.BlogResimUrl, blog.BlogResim);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#f0e4d5] bg-[radial-gradient(circle_at_top_left,_rgba(255,118,1,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(3,8,194,0.10),_transparent_32%),linear-gradient(180deg,#fffaf4_0%,#ffffff_100%)]">
        <div className="container relative pb-14 pt-28 sm:pt-32">
          <BrandHeader height={28} href={`/${lang}/`} />
          <div className="mt-8 max-w-4xl">
            <Link href={`/${lang}/blog`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#607080] transition hover:text-[#111827]">
              <ArrowLeft className="h-4 w-4" />
              {copy.backToBlogHome}
            </Link>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#16202b] md:text-6xl">
              {title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
              {blog.BlogYayinTarihi ? (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(blog.BlogYayinTarihi, lang)}
                </span>
              ) : null}
              {category ? (
                <span className="inline-flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {category}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[32px] border border-[#ece1d3] bg-[#fffdf9] px-6 py-8 shadow-[0_30px_90px_rgba(17,24,39,0.05)] md:px-10 md:py-12">
              {imageSrc ? (
                <div className="mb-8 overflow-hidden rounded-[24px] border border-[#ece1d3] bg-[#f6f1ea]">
                  <img src={imageSrc} alt={title} className="h-64 w-full object-contain md:h-80 lg:h-96" />
                </div>
              ) : null}
              {content ? (
                <div className="prose prose-slate max-w-none prose-headings:text-[#16202b] prose-p:leading-8" dangerouslySetInnerHTML={{ __html: content }} />
              ) : null}
              <div className="mt-8 flex flex-wrap gap-2">
                {parseTags(tags).map((tag) => (
                  <span key={tag} className="rounded-full border border-[#ece2d5] bg-[#fff9f3] px-3 py-1 text-xs font-medium text-[#6b7280]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
