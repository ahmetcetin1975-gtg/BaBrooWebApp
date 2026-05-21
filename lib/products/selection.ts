export const SELECTED_PRODUCT_NR_COOKIE = "gtg_selected_product_nr";
export const PRODUCT_SELECTION_COOKIE_MAX_AGE = 60 * 60 * 24;

export function toPositiveProductNr(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function readSelectedProductNrCookie(): number | null {
  if (typeof document === "undefined") return null;

  const cookieValue = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${SELECTED_PRODUCT_NR_COOKIE}=`))
    ?.split("=")[1];

  return toPositiveProductNr(cookieValue ? decodeURIComponent(cookieValue) : null);
}

export function setSelectedProductNrCookie(productNr: number) {
  const normalized = toPositiveProductNr(productNr);
  if (typeof document === "undefined" || normalized == null) return;

  document.cookie = `${SELECTED_PRODUCT_NR_COOKIE}=${encodeURIComponent(String(normalized))}; Path=/; Max-Age=${PRODUCT_SELECTION_COOKIE_MAX_AGE}; SameSite=Lax`;
}
