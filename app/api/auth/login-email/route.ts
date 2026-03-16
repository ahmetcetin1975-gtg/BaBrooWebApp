import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { extractTokens } from "@/lib/server/tokenMap";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password, lang, dil, playerId, platform } = body;

  if (!email || !password) {
    return NextResponse.json({ message: "Email/password required" }, { status: 400 });
  }

  const resolvedLang = String(lang ?? "").toLowerCase();
  const resolvedDil = typeof dil === "number" ? dil : resolvedLang === "tr" ? 1 : 2;
  const path = process.env.LOGIN_EMAIL_PATH ?? "/api/Auth/loginEmail";

  const { res: r, data } = await proxyJson({
    path,
    method: "POST",
    body: {
      email,
      password,
      dil: resolvedDil,
      playerId: playerId ?? "string",
      platform: platform ?? "Android",
    },
  });

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


