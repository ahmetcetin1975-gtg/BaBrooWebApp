import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.CUSTOMER_CHANGE_PASSWORD_KAYNAK ?? "2"
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

  const newPassword = sanitizeText(body?.newPassword);

  if (!newPassword) {
    return NextResponse.json({ message: "newPassword is required" }, { status: 400 });
  }

  const pathBase = process.env.CUSTOMER_CHANGE_PASSWORD_PATH ?? "/api/Musteri/change-password";
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { newPassword },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to change password", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
