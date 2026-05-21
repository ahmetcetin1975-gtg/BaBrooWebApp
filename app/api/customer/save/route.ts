import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidName(value: string): boolean {
  return value.length >= NAME_MIN_LENGTH && value.length <= NAME_MAX_LENGTH;
}

function normalizePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.CUSTOMER_SAVE_KAYNAK ?? "2"
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

  const ad = sanitizeText(body?.ad);
  const soyad = sanitizeText(body?.soyad);
  const ilNr = normalizePositiveInt(body?.ilNr);

  if (!ad || !soyad || ilNr == null) {
    return NextResponse.json(
      { message: "ad, soyad and ilNr are required" },
      { status: 400 }
    );
  }
  if (!isValidName(ad)) {
    return NextResponse.json(
      { message: "ad must be between 2 and 100 characters" },
      { status: 400 }
    );
  }
  if (!isValidName(soyad)) {
    return NextResponse.json(
      { message: "soyad must be between 2 and 100 characters" },
      { status: 400 }
    );
  }

  const pathBase = process.env.CUSTOMER_SAVE_PATH ?? "/api/Musteri/save";
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { ad, soyad, ilNr },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to save customer profile", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
