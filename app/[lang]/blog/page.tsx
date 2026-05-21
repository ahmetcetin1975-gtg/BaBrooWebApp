import { BlogLandingPage, type PublicBlogItem } from "@/components/gtg/pages/BlogLandingPage";
import { langToDil, normalizeLang } from "@/lib/gtg/config";
import { proxyJson } from "@/lib/server/proxy";

type PageProps = {
  params: Promise<{ lang: string }>;
};

type BlogListResponse = {
  Data?: PublicBlogItem[] | null;
};

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  const normalizedLang = normalizeLang(lang);
  const dil = langToDil(normalizedLang);
  const path = `${process.env.BLOG_GET_ALL_PATH ?? "/api/Blog/getall"}?${new URLSearchParams({ dil: String(dil) }).toString()}`;
  const data = await proxyJson({ path, method: "GET", forwardAuth: false })
    .then((result) => result.data)
    .catch(() => undefined);
  const blogs = Array.isArray((data as BlogListResponse | undefined)?.Data)
    ? ((data as BlogListResponse).Data as PublicBlogItem[])
    : [];

  return <BlogLandingPage lang={normalizedLang} blogs={blogs} />;
}
