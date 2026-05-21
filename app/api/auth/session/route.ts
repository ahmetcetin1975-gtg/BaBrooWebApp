import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { proxyJson } from "@/lib/server/proxy";

const CLAIM_KEYS = {
  id: [
    "sub",
    "userId",
    "UserId",
    "MusteriNr",
    "musteriNr",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  ],
  name: [
    "name",
    "Name",
    "FullName",
    "fullName",
    "given_name",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  ],
  email: [
    "email",
    "Email",
    "mail",
    "emailaddress",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  ],
  phone: [
    "phone",
    "Phone",
    "mobilephone",
    "MobilePhone",
    "telefon",
    "Telefon",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone",
  ],
  musteriNr: [
    "MusteriNr",
    "musteriNr",
    "CustomerNo",
    "customerNo",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  ],
} as const;

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

function readClaim(claims: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = claims[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function parseOptionalNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
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

  const id = readClaim(claims, CLAIM_KEYS.id);
  const name = readClaim(claims, CLAIM_KEYS.name);
  const email = readClaim(claims, CLAIM_KEYS.email);
  const phone = readClaim(claims, CLAIM_KEYS.phone);
  const musteriNr = parseOptionalNumber(readClaim(claims, CLAIM_KEYS.musteriNr));

  const user = {
    id,
    name,
    email,
    phone,
    musteriNr,
    claims,
  };
  return NextResponse.json({ user });
}


