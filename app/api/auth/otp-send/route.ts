import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { langToDil, normalizeDil } from "@/lib/i18n/languages";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const countryCodeRaw = body?.countryCode ?? "";
  const phoneNumber = body?.phoneNumber ?? body?.phone ?? "";
  const lang = body?.lang ?? "";
  const dil = typeof body?.dil === "number" ? normalizeDil(body.dil) : langToDil(lang);

  if (!countryCodeRaw || !phoneNumber) {
    return NextResponse.json({ message: "Phone required" }, { status: 400 });
  }

  const path = process.env.OTP_SEND_PATH ?? "/api/sms/send-otp";
  const normalizedCountryCode = String(countryCodeRaw).replace(/^\+/, "");
  const payload = {
    countryCode: normalizedCountryCode,
    phoneNumber,
    dil,
  };
  const { res: r, data } = await proxyJson({ path, method: "POST", body: payload, forwardAuth: false });
  console.log("[otp-send] payload", payload);
  console.log("[otp-send] response", data);

  if (!r.ok) {
    return NextResponse.json({ message: data?.message ?? "OTP send failed", ...data }, { status: r.status });
  }

  return NextResponse.json({ ok: true, ...data });
}


