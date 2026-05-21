import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { normalizeDil } from "@/lib/i18n/languages";

function sanitizeDigits(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

export async function POST(req: Request) {
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const countryCode = sanitizeDigits(body?.countryCode);
  const telefon = sanitizeDigits(body?.telefon);
  const dil = normalizeDil(body?.dil);

  if (!countryCode) {
    return NextResponse.json({ message: "countryCode is required" }, { status: 400 });
  }

  if (!telefon) {
    return NextResponse.json({ message: "telefon is required" }, { status: 400 });
  }

  const pathBase = process.env.CUSTOMER_NEW_PHONE_NUMBER_PATH ?? "/api/Musteri/new-phone-number";
  const { res, data } = await proxyJson({
    path: pathBase,
    method: "POST",
    body: { countryCode, telefon, dil },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to send new phone verification code", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
