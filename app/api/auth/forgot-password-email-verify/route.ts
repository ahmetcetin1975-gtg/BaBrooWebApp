import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { normalizeDil } from "@/lib/i18n/languages";

function resolveErrorMessage(data: any): string {
  return String(data?.Message ?? data?.message ?? "Forgot password email verify failed");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const code = String(body?.code ?? "").trim();
  const dil = normalizeDil(body?.dil);

  if (!code) {
    return NextResponse.json({ message: "code is required" }, { status: 400 });
  }

  const path = process.env.FORGOT_PASSWORD_EMAIL_VERIFY_PATH ?? "/api/Auth/forgot-password-email-verify";
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { code, dil },
    forwardAuth: false,
  });
  const backendStatus = Number(data?.StatusCode ?? 0);

  if (!res.ok || backendStatus >= 400) {
    return NextResponse.json(
      { message: resolveErrorMessage(data), ...data },
      { status: backendStatus >= 400 ? backendStatus : res.status || 400 }
    );
  }

  return NextResponse.json({ ok: true, ...data });
}
