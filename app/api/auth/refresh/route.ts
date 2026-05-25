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
  if (!refreshToken || String(refreshToken).trim() === "") {
    const out = NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
    out.cookies.set("gtg_access", "", { httpOnly: true, expires: new Date(0), path: "/" });
    out.cookies.set("gtg_refresh", "", { httpOnly: true, expires: new Date(0), path: "/" });
    return out;
  }
  const path = process.env.REFRESH_PATH ?? "/api/auth/refresh";

  const { res: r, data } = await proxyJson({
    path,
    method: "POST",
    body: { ...body, refreshToken, RefreshToken: refreshToken },
    forwardAuth: false,
  });

  if (!r.ok) {
    const out = NextResponse.json({ message: data?.message ?? "Refresh failed", ...data }, { status: r.status });
    out.cookies.set("gtg_access", "", { httpOnly: true, expires: new Date(0), path: "/" });
    out.cookies.set("gtg_refresh", "", { httpOnly: true, expires: new Date(0), path: "/" });
    return out;
  }

  const { access, refresh } = extractTokens(data);
  if (!access) {
    const out = NextResponse.json({ message: "Refresh failed: access token missing" }, { status: 401 });
    out.cookies.set("gtg_access", "", { httpOnly: true, expires: new Date(0), path: "/" });
    out.cookies.set("gtg_refresh", "", { httpOnly: true, expires: new Date(0), path: "/" });
    return out;
  }
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


