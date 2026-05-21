import Link from "next/link";
import { normalizeLang, type Lang } from "@/lib/i18n/languages";

type FooterUsefulLinksProps = {
  lang: string;
  titleClassName?: string;
  listClassName?: string;
  itemClassName?: string;
};

const USEFUL_LINKS_COPY: Record<Lang, {
  title: string;
  companies: string;
  experts: string;
}> = {
  tr: {
    title: "Faydalı Bağlantılar",
    companies: "Nasıl Çalışır ?-Firmalar",
    experts: "Nasıl Çalışır ?-Dış Ticaret Uzmanları",
  },
  en: {
    title: "Useful Links",
    companies: "How Does It Work?-Companies",
    experts: "How Does It Work?-Foreign Trade Experts",
  },
  ru: {
    title: "Полезные ссылки",
    companies: "Как это работает?-Компании",
    experts: "Как это работает?-Эксперты внешней торговли",
  },
  es: {
    title: "Enlaces útiles",
    companies: "¿Cómo funciona?-Empresas",
    experts: "¿Cómo funciona?-Expertos en comercio exterior",
  },
  fr: {
    title: "Liens utiles",
    companies: "Comment ça marche ?-Entreprises",
    experts: "Comment ça marche ?-Experts en commerce international",
  },
};

export function FooterUsefulLinks({
  lang,
  titleClassName = "text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]",
  listClassName = "mt-6 space-y-5 text-[16px] font-medium text-[#090914]",
  itemClassName = "transition-colors duration-200 hover:text-[#FAA500]",
}: FooterUsefulLinksProps) {
  const currentLang = normalizeLang(lang);
  const copy = USEFUL_LINKS_COPY[currentLang];
  const items = [
    {
      label: copy.companies,
      href: `/${currentLang}/import-export`,
    },
    {
      label: copy.experts,
      href: `/${currentLang}/how-does-it-work`,
    },
  ];

  return (
    <div>
      <div className={titleClassName}>{copy.title}</div>
      <ul className={listClassName}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={itemClassName}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
