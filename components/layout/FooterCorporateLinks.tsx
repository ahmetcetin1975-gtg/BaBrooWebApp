import Link from "next/link";
import { normalizeLang, type Lang } from "@/lib/i18n/languages";

type FooterCorporateLinksProps = {
  lang: string;
  titleClassName?: string;
  listClassName?: string;
  itemClassName?: string;
};

const CORPORATE_COPY: Record<Lang, {
  title: string;
  about: string;
  members: string;
  packages: string;
  contact: string;
  faq: string;
}> = {
  tr: {
    title: "KURUMSAL",
    about: "Hakkımızda",
    members: "Üyeler",
    packages: "Paketler",
    contact: "İletişim",
    faq: "SSS",
  },
  en: {
    title: "Corporate",
    about: "About Us",
    members: "Members",
    packages: "Packages",
    contact: "Contact",
    faq: "FAQ",
  },
  ru: {
    title: "Компания",
    about: "О нас",
    members: "Участники",
    packages: "Пакеты",
    contact: "Контакты",
    faq: "FAQ",
  },
  es: {
    title: "Corporativo",
    about: "Sobre nosotros",
    members: "Miembros",
    packages: "Paquetes",
    contact: "Contacto",
    faq: "FAQ",
  },
  fr: {
    title: "Entreprise",
    about: "À propos",
    members: "Membres",
    packages: "Forfaits",
    contact: "Contact",
    faq: "FAQ",
  },
};

export function FooterCorporateLinks({
  lang,
  titleClassName = "text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]",
  listClassName = "mt-6 space-y-5 text-[16px] font-medium text-[#090914]",
  itemClassName = "transition-colors duration-200 hover:text-[#FAA500]",
}: FooterCorporateLinksProps) {
  const currentLang = normalizeLang(lang);
  const copy = CORPORATE_COPY[currentLang];
  const items = [
    {
      label: copy.about,
      href: `/${currentLang}/about-us`,
    },
    {
      label: copy.members,
      href: `/${currentLang}/team`,
    },
    {
      label: copy.packages,
      href: `/${currentLang}/packages`,
    },
    {
      label: "Blog",
      href: `/${currentLang}/blogs/1`,
    },
    {
      label: copy.contact,
      href: `/${currentLang}/contact`,
    },
    {
      label: copy.faq,
      href: `/${currentLang}/faqs`,
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
