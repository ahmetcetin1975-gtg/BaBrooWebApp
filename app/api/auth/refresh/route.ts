import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { proxyJson } from "@/lib/server/proxy";
import { extractTokens } from "@/lib/server/tokenMap";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const logout = !!body.logout;
  const jar = await cookies();

  if (logout) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("gtg_access", "", { httpOnly: true, expires: new Date(0), path: "/" });
    res.cookies.set("gtg_refresh", "", { httpOnly: true, expires: new Date(0), path: "/" });
    return res;
  }

  const refreshToken =
    jar.get("gtg_refresh")?.value ??
    body?.refreshToken ??
    body?.RefreshToken;
  const path = process.env.REFRESH_PATH ?? "/api/auth/refresh";

  const { res: r, data } = await proxyJson({
    path,
    method: "POST",
    body: { ...body, refreshToken, RefreshToken: refreshToken },
    forwardAuth: false,
  });

  if (!r.ok) {
    return NextResponse.json({ message: data?.message ?? "Refresh failed", ...data }, { status: r.status });
  }

  const { access, refresh } = extractTokens(data);
  const out = NextResponse.json({ ok: true });
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


