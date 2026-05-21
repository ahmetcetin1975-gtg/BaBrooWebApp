import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { normalizeDil } from "@/lib/i18n/languages";

function asObject(data: any): Record<string, any> {
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function resolveErrorMessage(data: any): string {
  if (typeof data === "string") return data;
  return String(data?.Message ?? data?.message ?? data?.raw ?? "OTP resend failed");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const countryCode = String(body?.CountryCode ?? body?.countryCode ?? "").trim().replace(/^\+/, "");
  const phoneNumber = String(body?.PhoneNumber ?? body?.phoneNumber ?? "").trim();
  const dil = normalizeDil(body?.Dil ?? body?.dil);

  if (!countryCode || !phoneNumber) {
    return NextResponse.json({ message: "countryCode and phoneNumber are required" }, { status: 400 });
  }

  const path = process.env.REGISTER_RESEND_OTP_PATH ?? "/api/Auth/register-resend-otp";
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { CountryCode: countryCode, PhoneNumber: phoneNumber, Dil: dil },
    forwardAuth: false,
  });
  const dataObject = asObject(data);
  const backendStatus = Number(dataObject?.StatusCode ?? dataObject?.statusCode ?? 0);

  if (!res.ok || backendStatus >= 400 || dataObject?.success === false) {
    const status = backendStatus >= 400 ? backendStatus : !res.ok ? res.status || 400 : 400;
    return NextResponse.json(
      { message: resolveErrorMessage(data), ...dataObject },
      { status }
    );
  }

  return NextResponse.json({ ok: true, ...dataObject });
}
