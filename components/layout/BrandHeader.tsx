import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

type BrandHeaderProps = {
  height?: number;
  label?: string;
  className?: string;
  priority?: boolean;
  href?: string;
};

const LOGO_SIZE = { width: 44, height: 43 };
const WORDMARK_SIZE = { width: 139, height: 21 };

function scaleWidth(targetHeight: number, original: { width: number; height: number }) {
  return Math.round((original.width / original.height) * targetHeight);
}

type BrandHeaderImageProps = {
  src: string;
  width: number;
  height: number;
  priority?: boolean;
  sizes: string;
};

function BrandHeaderImage({ src, width, height, priority, sizes }: BrandHeaderImageProps) {
  return (
    <span className="relative block shrink-0" style={{ width, height }}>
      <Image src={src} alt="" aria-hidden="true" fill sizes={sizes} className="object-contain" priority={priority} />
    </span>
  );
}

export function BrandHeader({ height = 20, label = "Babroo", className, priority, href }: BrandHeaderProps) {
  const logoWidth = scaleWidth(height, LOGO_SIZE);
  const wordmarkWidth = scaleWidth(height, WORDMARK_SIZE);
  const content = (
    <>
      <BrandHeaderImage
        src="/assets/images/babroo/logo-mark.png"
        width={logoWidth}
        height={height}
        priority={priority}
        sizes={`${logoWidth}px`}
      />
      <BrandHeaderImage
        src="/assets/images/babroo/logo-wordmark.png"
        width={wordmarkWidth}
        height={height}
        priority={priority}
        sizes={`${wordmarkWidth}px`}
      />
    </>
  );
  const classes = clsx("inline-flex items-center gap-2", href && "transition-opacity hover:opacity-85", className);

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <span role="img" aria-label={label} className={classes}>
      {content}
    </span>
  );
}
