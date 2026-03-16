import Image from "next/image";
import clsx from "clsx";

type BrandHeaderProps = {
  height?: number;
  label?: string;
  className?: string;
  priority?: boolean;
};

const LOGO_SIZE = { width: 44, height: 43 };
const WORDMARK_SIZE = { width: 139, height: 21 };

function scaleWidth(targetHeight: number, original: { width: number; height: number }) {
  return Math.round((original.width / original.height) * targetHeight);
}

export function BrandHeader({ height = 20, label = "GoTradeGo", className, priority }: BrandHeaderProps) {
  const logoWidth = scaleWidth(height, LOGO_SIZE);
  const wordmarkWidth = scaleWidth(height, WORDMARK_SIZE);

  return (
    <span role="img" aria-label={label} className={clsx("inline-flex items-center gap-2", className)}>
      <Image
        src="/assets/images/_gtg_new/GTG_navy_logo.svg"
        alt=""
        aria-hidden="true"
        width={logoWidth}
        height={height}
        priority={priority}
      />
      <Image
        src="/assets/images/_gtg_new/GTG_navy_yazi.svg"
        alt=""
        aria-hidden="true"
        width={wordmarkWidth}
        height={height}
        priority={priority}
      />
    </span>
  );
}
