import type { SVGProps } from "react";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

type FooterSocialLinksProps = {
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
};

function BrandXIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.901 2H21.98l-6.726 7.687L23.167 22h-6.193l-4.85-7.476L5.58 22H2.5l7.195-8.225L1.833 2h6.35l4.384 6.817L18.9 2Zm-1.086 18.028h1.707L7.26 3.866H5.428l12.387 16.162Z" />
    </svg>
  );
}

const footerSocialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/babroo/", Icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/babroocom?locale=tr_TR", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/babroo/", Icon: Instagram },
  { label: "X", href: "https://x.com/babroo", Icon: BrandXIcon },
  { label: "YouTube", href: "https://www.youtube.com/@babroo602", Icon: Youtube },
];

export function FooterSocialLinks({
  className = "mt-5 flex max-w-[360px] flex-wrap gap-2",
  itemClassName = "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#D9E1EC] bg-white text-[#4B5565] transition-all duration-200 hover:-translate-y-px hover:border-[#FAA500] hover:text-[#090914]",
  iconClassName = "h-[15px] w-[15px]",
}: FooterSocialLinksProps) {
  return (
    <div className={className}>
      {footerSocialLinks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={itemClassName}
        >
          <Icon className={iconClassName} strokeWidth={1.8} />
          <span className="sr-only">{label}</span>
        </a>
      ))}
    </div>
  );
}
