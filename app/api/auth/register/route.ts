import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { extractTokens } from "@/lib/server/tokenMap";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Minimum validation (backend daha detaylÄ± kontrol edecek)
  const fullName = String(body?.fullName ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const password = String(body?.password ?? "");

  if (!phone || phone.length < 8) {
    return NextResponse.json({ message: "Phone number is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ message: "Full name is required" }, { status: 400 });
  }
  if (!email || email.length < 5) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const path = process.env.REGISTER_PATH ?? "/api/auth/register";
  const { res: r, data } = await proxyJson({ path, method: "POST", body });

  if (!r.ok) {
    return NextResponse.json({ message: data?.message ?? "Register failed", ...data }, { status: r.status });
  }

  const { access, refresh } = extractTokens(data);
  const out = NextResponse.json({ ok: true, user: data?.user ?? null, data });
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


