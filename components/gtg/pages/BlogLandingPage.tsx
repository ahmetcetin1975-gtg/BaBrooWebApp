import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Tag } from "lucide-react";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { resolveBlogImageUrl } from "@/lib/blog/images";
import { localeForLang, type Lang } from "@/lib/gtg/config";

export type PublicBlogItem = {
  Nr: number;
  BlogResim?: string | null;
  BlogResimUrl?: string | null;
  Baslik: string;
  Aciklama: string;
  Kategori: string;
  Etiketler: string;
  BlogYayinTarihi: string | null;
  Aktif: boolean;
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

function parseTags(tags: string | null | undefined): string[] {
  return String(tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function stripHtml(value: string | null | undefined): string {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(value: string | null | undefined, maxLength: number): string {
  const clean = stripHtml(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

function resolveImageSrc(blog: PublicBlogItem): string | null {
  return resolveBlogImageUrl(blog.BlogResimUrl, blog.BlogResim, { thumbnail: true });
}

type BlogLandingCopy = {
  badge: string;
  title: string;
  description: string;
  browse: string;
  detail: string;
  latest: string;
  more: string;
  all: string;
  latestArticles: string;
  noData: string;
  readMore: string;
};

const BLOG_LANDING_COPY: Record<Lang, BlogLandingCopy> = {
  tr: {
    badge: "Babroo Blog",
    title: "Bakım, aile yaşamı ve güvenli başlangıçlar için güncel rehberler.",
    description:
      "İlk girişte, blog odaklı bir deneyim sunuyoruz. Bakım planlamasından çocuk güvenliğine kadar merak edilen başlıkları sade ve okunabilir bir düzen içinde keşfedin.",
    browse: "Yazıları İncele",
    detail: "Yazıya Git",
    latest: "Öne Çıkan Yazı",
    more: "Son Eklenenler",
    all: "Tüm Yazılar",
    latestArticles: "Son Yazılar",
    noData: "Henüz yayınlanmış blog yazısı bulunmuyor.",
    readMore: "Devamını Oku",
  },
  en: {
    badge: "Babroo Blog",
    title: "Fresh guides for care, family life, and safer daily routines.",
    description:
      "At first entry, we now offer a blog-led experience. Explore care planning, child safety, and family support topics in a clearer, easier-to-read layout.",
    browse: "Browse Articles",
    detail: "Open Article",
    latest: "Featured Article",
    more: "Latest Posts",
    all: "All Articles",
    latestArticles: "Latest Articles",
    noData: "There are no published blog posts yet.",
    readMore: "Read More",
  },
  ru: {
    badge: "Блог Babroo",
    title: "Актуальные материалы об уходе, семейной жизни и безопасном старте.",
    description:
      "При первом входе мы предлагаем опыт, построенный вокруг блога. Изучайте темы планирования ухода, детской безопасности и семейной поддержки в более ясной и удобной структуре.",
    browse: "Смотреть статьи",
    detail: "Открыть статью",
    latest: "Избранная статья",
    more: "Новые публикации",
    all: "Все статьи",
    latestArticles: "Последние статьи",
    noData: "Пока нет опубликованных записей блога.",
    readMore: "Читать далее",
  },
  es: {
    badge: "Blog de Babroo",
    title: "Guías actuales para cuidados, vida familiar y rutinas diarias más seguras.",
    description:
      "En el primer acceso ofrecemos una experiencia centrada en el blog. Explora temas de planificación de cuidados, seguridad infantil y apoyo familiar en un diseño más claro y fácil de leer.",
    browse: "Ver artículos",
    detail: "Abrir artículo",
    latest: "Artículo destacado",
    more: "Últimas publicaciones",
    all: "Todos los artículos",
    latestArticles: "Artículos recientes",
    noData: "Aún no hay publicaciones de blog.",
    readMore: "Leer más",
  },
  fr: {
    badge: "Blog Babroo",
    title: "Guides récents pour les soins, la vie de famille et des routines plus sûres.",
    description:
      "Dès l'arrivée, nous proposons une expérience centrée sur le blog. Découvrez la planification des soins, la sécurité des enfants et le soutien familial dans une mise en page plus claire et plus lisible.",
    browse: "Voir les articles",
    detail: "Ouvrir l'article",
    latest: "Article à la une",
    more: "Dernières publications",
    all: "Tous les articles",
    latestArticles: "Articles récents",
    noData: "Aucun article de blog n'est encore publié.",
    readMore: "Lire la suite",
  },
};

export function BlogLandingPage({
  lang,
  blogs,
}: {
  lang: Lang;
  blogs: PublicBlogItem[];
}) {
  const featured = blogs[0] ?? null;
  const secondary = blogs.slice(1, 4);
  const gridItems = blogs.slice(0, 10);
  const text = BLOG_LANDING_COPY[lang];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#f0e4d5] bg-[radial-gradient(circle_at_top_left,_rgba(255,118,1,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(3,8,194,0.10),_transparent_32%),linear-gradient(180deg,#fffaf4_0%,#ffffff_100%)]">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#ff7601]/12 blur-3xl" />
        <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-[#0308c2]/10 blur-3xl" />
        <div className="container relative pb-16 pt-28 sm:pt-32 lg:pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-[#ffd9bb] bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b85b00]">
                <BrandHeader height={18} href={`/${lang}/`} />
                <span>{text.badge}</span>
              </div>
              <h1 className="mt-6 max-w-[13ch] text-[42px] font-semibold leading-[0.96] tracking-[-0.04em] text-[#111827] sm:text-[54px] lg:text-[68px]">
                {text.title}
              </h1>
              <p className="mt-5 max-w-[62ch] text-base leading-8 text-slate-600 sm:text-lg">
                {text.description}
              </p>
              <div className="mt-8">
                <Link
                  href={featured ? `/${lang}/blog-detail/${featured.Nr}` : `/${lang}/blog`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#111827] px-6 text-sm font-semibold text-white transition hover:bg-[#1f2937]"
                >
                  {text.browse}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {secondary.map((blog) => (
                <Link
                  key={blog.Nr}
                  href={`/${lang}/blog-detail/${blog.Nr}`}
                  className="group rounded-[28px] border border-[#eadfce] bg-white/90 p-5 shadow-[0_20px_50px_rgba(17,24,39,0.05)] transition hover:-translate-y-0.5 hover:border-[#ffcfad]"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff7601]">
                    <Clock3 className="h-4 w-4" />
                    {blog.Kategori || text.more}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#16202b] transition group-hover:text-[#ff7601]">
                    {blog.Baslik}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{excerpt(blog.Aciklama, 140)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf9] py-16 md:py-20">
        <div className="container">
          {featured ? (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <article className="overflow-hidden rounded-[34px] border border-[#efe1cf] bg-white shadow-[0_30px_90px_rgba(17,24,39,0.06)]">
                <div className="bg-[linear-gradient(135deg,#16202b_0%,#2e4f66_55%,#ff7601_100%)] px-6 py-7 text-white md:px-8 md:py-9">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffe2c8]">
                    <CalendarDays className="h-4 w-4" />
                    {text.latest}
                  </div>
                  <h2 className="mt-4 max-w-[16ch] text-3xl font-semibold leading-tight md:text-4xl">
                    {featured.Baslik}
                  </h2>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/80">
                    {featured.BlogYayinTarihi ? <span>{formatDate(featured.BlogYayinTarihi, lang)}</span> : null}
                    {featured.Kategori ? <span>{featured.Kategori}</span> : null}
                  </div>
                </div>
                {resolveImageSrc(featured) ? (
                  <div className="border-b border-[#efe1cf] bg-[#f6f1ea]">
                    <img
                      src={resolveImageSrc(featured)!}
                      alt={featured.Baslik}
                      className="h-64 w-full object-cover md:h-80"
                    />
                  </div>
                ) : null}
                <div className="px-6 py-7 md:px-8 md:py-8">
                  <p className="text-base leading-8 text-slate-600">{excerpt(featured.Aciklama, 380)}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {parseTags(featured.Etiketler).map((tag) => (
                      <span key={`${featured.Nr}-${tag}`} className="rounded-full border border-[#ece2d5] bg-[#fff9f3] px-3 py-1 text-xs font-medium text-[#6b7280]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8">
                    <Link
                      href={`/${lang}/blog-detail/${featured.Nr}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#111827] transition hover:text-[#ff7601]"
                    >
                      {text.detail}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>

              <aside className="rounded-[34px] border border-[#eee2d1] bg-white p-6 shadow-[0_25px_70px_rgba(17,24,39,0.04)] md:p-7">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9a6a33]">{text.more}</h3>
                <div className="mt-5 space-y-5">
                  {blogs.slice(0, 6).map((blog) => (
                    <Link key={blog.Nr} href={`/${lang}/blog-detail/${blog.Nr}`} className="block rounded-[24px] border border-[#f2e8da] px-4 py-4 transition hover:border-[#ffcfad] hover:bg-[#fffaf4]">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff7601]">
                        <Tag className="h-4 w-4" />
                        {blog.Kategori || text.all}
                      </div>
                      <div className="mt-2 text-lg font-semibold leading-snug text-[#16202b]">{blog.Baslik}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{excerpt(blog.Aciklama, 90)}</p>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          ) : (
            <div className="rounded-[32px] border border-dashed border-[#e4d5c3] bg-white px-6 py-16 text-center text-slate-600">
              {text.noData}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9a6a33]">{text.all}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#16202b]">
                {text.latestArticles}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {gridItems.map((blog) => (
              <article key={blog.Nr} className="rounded-[28px] border border-[#ece1d3] bg-[#fffdf9] p-6 shadow-[0_20px_60px_rgba(17,24,39,0.04)]">
                {resolveImageSrc(blog) ? (
                  <div className="-mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[28px] border-b border-[#ece1d3] bg-[#f6f1ea]">
                    <img
                      src={resolveImageSrc(blog)!}
                      alt={blog.Baslik}
                      className="h-52 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#edf8ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#368ab0]">
                    {blog.Kategori || text.all}
                  </span>
                  {blog.BlogYayinTarihi ? (
                    <span className="text-xs font-medium text-slate-400">{formatDate(blog.BlogYayinTarihi, lang)}</span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-2xl font-semibold leading-tight text-[#16202b]">{blog.Baslik}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{excerpt(blog.Aciklama, 160)}</p>
                <div className="mt-6">
                  <Link href={`/${lang}/blog-detail/${blog.Nr}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#111827] transition hover:text-[#ff7601]">
                    {text.readMore}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
