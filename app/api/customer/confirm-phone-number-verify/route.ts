import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { normalizeDil } from "@/lib/i18n/languages";

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

  const otpCode = sanitizeText(body?.otpCode);
  const dil = normalizeDil(body?.dil);

  if (!otpCode) {
    return NextResponse.json({ message: "otpCode is required" }, { status: 400 });
  }

  const pathBase =
    process.env.CUSTOMER_CONFIRM_PHONE_NUMBER_VERIFY_PATH ??
    "/api/Musteri/confirm-phone-number-verify";
  const { res, data } = await proxyJson({
    path: pathBase,
    method: "POST",
    body: { otpCode, dil },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to verify phone code", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
