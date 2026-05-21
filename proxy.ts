import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SELECTED_PRODUCT_NR_COOKIE = "gtg_selected_product_nr";
const PRODUCT_SELECTION_COOKIE_MAX_AGE = 60 * 60 * 24;
const SELECTED_SERVICE_NR_COOKIE = "gtg_selected_service_nr";
const SERVICE_SELECTION_COOKIE_MAX_AGE = 60 * 60 * 24;

function toPositiveProductNr(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function matchLegacyProductPath(pathname: string) {
  const match = pathname.match(/^\/(tr|en|ru|es|fr)\/home\/(productdetail|edit-product)\/([^/]+)\/?$/);
  if (!match) return null;

  const [, lang, pageName, rawProductNr] = match;
  const productNr = toPositiveProductNr(rawProductNr);
  if (productNr == null) return null;

  return { lang, pageName, productNr };
}

function matchLegacyServicePath(pathname: string) {
  const match = pathname.match(/^\/(tr|en|ru|es|fr)\/home\/(servicedetail|edit-service)\/([^/]+)\/?$/);
  if (!match) return null;

  const [, lang, pageName, rawServiceNr] = match;
  const serviceNr = toPositiveProductNr(rawServiceNr);
  if (serviceNr == null) return null;

  return { lang, pageName, serviceNr };
}

export function proxy(request: NextRequest) {
  const matchedProduct = matchLegacyProductPath(request.nextUrl.pathname);
  if (matchedProduct) {
    const url = request.nextUrl.clone();
    url.pathname = `/${matchedProduct.lang}/home/${matchedProduct.pageName}`;

    const returnTo = url.searchParams.get("returnTo")?.trim() ?? "";
    if (returnTo.startsWith(`/${matchedProduct.lang}/home/productdetail/`)) {
      url.searchParams.set("returnTo", `/${matchedProduct.lang}/home/productdetail`);
    } else if (returnTo.startsWith(`/${matchedProduct.lang}/home/edit-product/`)) {
      url.searchParams.set("returnTo", `/${matchedProduct.lang}/home/edit-product`);
    }

    const response = NextResponse.redirect(url);
    response.cookies.set(SELECTED_PRODUCT_NR_COOKIE, String(matchedProduct.productNr), {
      path: "/",
      sameSite: "lax",
      maxAge: PRODUCT_SELECTION_COOKIE_MAX_AGE,
    });

    return response;
  }

  const matchedService = matchLegacyServicePath(request.nextUrl.pathname);
  if (matchedService) {
    const url = request.nextUrl.clone();
    url.pathname = `/${matchedService.lang}/home/${matchedService.pageName}`;

    const returnTo = url.searchParams.get("returnTo")?.trim() ?? "";
    if (returnTo.startsWith(`/${matchedService.lang}/home/servicedetail/`)) {
      url.searchParams.set("returnTo", `/${matchedService.lang}/home/servicedetail`);
    } else if (returnTo.startsWith(`/${matchedService.lang}/home/edit-service/`)) {
      url.searchParams.set("returnTo", `/${matchedService.lang}/home/edit-service`);
    }

    const response = NextResponse.redirect(url);
    response.cookies.set(SELECTED_SERVICE_NR_COOKIE, String(matchedService.serviceNr), {
      path: "/",
      sameSite: "lax",
      maxAge: SERVICE_SELECTION_COOKIE_MAX_AGE,
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tr/home/productdetail/:path*",
    "/en/home/productdetail/:path*",
    "/ru/home/productdetail/:path*",
    "/es/home/productdetail/:path*",
    "/fr/home/productdetail/:path*",
    "/tr/home/edit-product/:path*",
    "/en/home/edit-product/:path*",
    "/ru/home/edit-product/:path*",
    "/es/home/edit-product/:path*",
    "/fr/home/edit-product/:path*",
    "/tr/home/servicedetail/:path*",
    "/en/home/servicedetail/:path*",
    "/ru/home/servicedetail/:path*",
    "/es/home/servicedetail/:path*",
    "/fr/home/servicedetail/:path*",
    "/tr/home/edit-service/:path*",
    "/en/home/edit-service/:path*",
    "/ru/home/edit-service/:path*",
    "/es/home/edit-service/:path*",
    "/fr/home/edit-service/:path*",
  ],
};
