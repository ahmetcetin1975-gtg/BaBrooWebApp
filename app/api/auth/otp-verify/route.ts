import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { countryCode, phone, otp } = body;

  if (!countryCode || !phone || !otp) {
    return NextResponse.json({ message: "Phone + otp required" }, { status: 400 });
  }

  const path = process.env.OTP_VERIFY_PATH ?? "/api/auth/otpVerify";
  const { res: r, data } = await proxyJson({ path, method: "POST", body, forwardAuth: false });
  const backendStatus = Number(data?.StatusCode ?? 0);

  if (!r.ok || backendStatus >= 400) {
    return NextResponse.json(
      { message: data?.Message ?? data?.message ?? "OTP verify failed", ...data },
      { status: backendStatus >= 400 ? backendStatus : r.status }
    );
  }

  return NextResponse.json({ ok: true, message: data?.Message ?? data?.message ?? "", ...data });
}


