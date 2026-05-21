import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function toBackendDil(value: number): string {
  return ({ 1: "TR", 2: "EN", 3: "RU", 4: "ES", 5: "FR" } as Record<number, string>)[value] ?? "TR";
}

function parseRequiredPositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const ilanId = parseRequiredPositiveInt(searchParams.get("ilanId"));
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (ilanId == null) {
    return NextResponse.json({ message: "Invalid ilanId" }, { status: 400 });
  }

  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase = process.env.ILAN_GET_OZELLIKLER_PATH ?? "/api/ilan/get-ozellikler";
  const path = `${pathBase}/${ilanId}?${new URLSearchParams({ dil: toBackendDil(dil) }).toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load job post features", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
