import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { proxyJson } from "@/lib/server/proxy";

function decodeJwt(token: string): any | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((part.length + 2) % 4);
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET() {
  const jar = await cookies();
  const access = jar.get("gtg_access")?.value;

  if (!access) return NextResponse.json({ user: null });

  const path = process.env.SESSION_PATH;

  if (path) {
    const { res: r, data } = await proxyJson({ path, method: "GET" });
    if (!r.ok) return NextResponse.json({ user: null });
    return NextResponse.json({ user: data?.user ?? data });
  }

  // Fallback: JWT claim decode (signature doÄŸrulama yok; sadece UI iÃ§in)
  const claims = decodeJwt(access);
  if (!claims) return NextResponse.json({ user: null });

  const user = {
    id: String(claims.sub ?? claims.userId ?? claims.UserId ?? ""),
    name: String(claims.name ?? claims.FullName ?? claims.fullName ?? claims.given_name ?? ""),
    email: String(claims.email ?? claims.Email ?? ""),
    musteriNr: claims.MusteriNr ?? claims.musteriNr ?? claims.CustomerNo ?? null,
    claims,
  };
  return NextResponse.json({ user });
}


