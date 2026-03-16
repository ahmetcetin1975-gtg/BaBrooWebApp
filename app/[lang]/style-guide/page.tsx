import type { Metadata } from "next";
import { getMessages } from "@/lib/i18n/messages";
import { normalizeLang } from "@/lib/i18n/languages";

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> }
): Promise<Metadata> {
  const { lang } = await params;
  const t = getMessages(normalizeLang(lang));
  return {
    title: t.styleGuide.title,
    description: t.styleGuide.description,
  };
}

export default async function StyleGuidePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getMessages(normalizeLang(lang));
  const colors = [
    { name: t.styleGuide.colors.orange, hex: "#FFA500", className: "bg-[color:var(--gtg-orange)]" },
    { name: t.styleGuide.colors.blue, hex: "#1A62C2", className: "bg-[color:var(--gtg-blue)]" },
    { name: t.styleGuide.colors.navy, hex: "#1B3D91", className: "bg-[color:var(--gtg-navy)]" },
    { name: t.styleGuide.colors.text, hex: "#2C2C2C", className: "bg-[color:var(--gtg-text)]" },
    { name: t.styleGuide.colors.black, hex: "#191919", className: "bg-[color:var(--gtg-black)]" },
    { name: t.styleGuide.colors.background, hex: "#F7F7F9", className: "bg-[color:var(--gtg-bg)] border border-[color:var(--gtg-border)]" },
    { name: t.styleGuide.colors.surface, hex: "#FFFFFF", className: "bg-white border border-[color:var(--gtg-border)]" },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--gtg-bg)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="gtg-h1">{t.styleGuide.title}</h1>
        <p className="gtg-p mt-4 text-[color:var(--gtg-muted)]">{t.styleGuide.description}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map((c) => (
            <div key={c.hex} className="rounded-2xl bg-white/60 p-4 shadow-soft">
              <div className={`h-28 rounded-2xl ${c.className}`} />
              <div className="mt-4 flex items-baseline justify-between">
                <div className="font-mont text-lg font-semibold text-[color:var(--gtg-text)]">{c.name}</div>
                <div className="font-mono text-sm text-[color:var(--gtg-muted)]">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-white p-8 shadow-soft">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gtg-muted)]">
                {t.styleGuide.headings}
              </div>
              <div className="mt-4 space-y-3">
                <div className="gtg-h1">{t.styleGuide.h1}</div>
                <div className="gtg-h2">{t.styleGuide.h2}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[color:var(--gtg-muted)]">
                {t.styleGuide.paragraph}
              </div>
              <p className="gtg-p mt-4">{t.styleGuide.paragraphSample}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-gtg8 bg-[color:var(--gtg-orange)] px-4 py-2 font-semibold text-white">
                  {t.styleGuide.primary}
                </button>
                <button className="rounded-gtg8 border border-[color:var(--gtg-border)] bg-white px-4 py-2 font-semibold text-[color:var(--gtg-text)]">
                  {t.styleGuide.secondary}
                </button>
                <button className="rounded-gtg8 bg-[color:var(--gtg-blue)] px-4 py-2 font-semibold text-white">
                  {t.styleGuide.accent}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

