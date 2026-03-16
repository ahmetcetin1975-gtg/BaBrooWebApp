import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { extractTokens } from "@/lib/server/tokenMap";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { countryCode, phone, password, lang, playerId, platform } = body;

  if (!countryCode || !phone || !password) {
    return NextResponse.json({ message: "Phone/password required" }, { status: 400 });
  }

  const path = process.env.LOGIN_PHONE_PATH ?? "/api/auth/loginTel";
  const dil = lang === "tr" ? 1 : 2;
  const normalizedCountryCode = String(countryCode).replace(/^\+/, "");
  const { res: r, data } = await proxyJson({
    path,
    method: "POST",
    body: {
      countryCode: normalizedCountryCode,
      telefon: phone,
      password,
      dil,
      playerId: playerId ?? "",
      platform: platform ?? "web",
    },
  });
console.log(body);
console.log(r);
  if (!r.ok) {
    return NextResponse.json({ message: data?.message ?? "Login failed", ...data }, { status: r.status });
  }

  const { access, refresh } = extractTokens(data);
  const out = NextResponse.json({ ok: true, user: data?.user ?? null });
  if (access) out.cookies.set("gtg_access", access, cookieOpts());
  if (refresh) out.cookies.set("gtg_refresh", refresh, cookieOpts());
  return out;
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}


