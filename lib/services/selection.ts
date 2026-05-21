export const SELECTED_SERVICE_NR_COOKIE = "gtg_selected_service_nr";
export const SERVICE_SELECTION_COOKIE_MAX_AGE = 60 * 60 * 24;

export function toPositiveServiceNr(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function readSelectedServiceNrCookie(): number | null {
  if (typeof document === "undefined") return null;

  const cookieValue = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${SELECTED_SERVICE_NR_COOKIE}=`))
    ?.split("=")[1];

  return toPositiveServiceNr(cookieValue ? decodeURIComponent(cookieValue) : null);
}

export function setSelectedServiceNrCookie(serviceNr: number) {
  const normalized = toPositiveServiceNr(serviceNr);
  if (typeof document === "undefined" || normalized == null) return;

  document.cookie = `${SELECTED_SERVICE_NR_COOKIE}=${encodeURIComponent(String(normalized))}; Path=/; Max-Age=${SERVICE_SELECTION_COOKIE_MAX_AGE}; SameSite=Lax`;
}
