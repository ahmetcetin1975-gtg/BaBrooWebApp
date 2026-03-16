import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

const SUPPORT_MESSAGE_MIN_LENGTH = 3;
const SUPPORT_MESSAGE_MAX_LENGTH = 255;

function normalizeDil(value: string | null): number {
  return value === "2" ? 2 : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidSupportMessage(value: string): boolean {
  return (
    value.length >= SUPPORT_MESSAGE_MIN_LENGTH &&
    value.length <= SUPPORT_MESSAGE_MAX_LENGTH
  );
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.SUPPORT_CREATE_KAYNAK ?? "2"
  );

  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const destekEmail = sanitizeText(body?.destekEmail);
  const destekMetin = sanitizeText(body?.destekMetin);

  if (!destekEmail) {
    return NextResponse.json({ message: "destekEmail is required" }, { status: 400 });
  }
  if (!destekMetin) {
    return NextResponse.json({ message: "destekMetin is required" }, { status: 400 });
  }
  if (!isValidSupportMessage(destekMetin)) {
    return NextResponse.json(
      { message: "destekMetin must be between 3 and 255 characters" },
      { status: 400 }
    );
  }

  const pathBase = process.env.SUPPORT_CREATE_PATH ?? "/api/Destek/create";
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;

  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { destekEmail, destekMetin },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to send support message", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
