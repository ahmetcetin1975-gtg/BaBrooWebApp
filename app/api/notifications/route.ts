import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  return value === "2" ? 2 : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function normalizeBildirim(value: string | null): 0 | 1 | null {
  if (value === "1") return 1;
  if (value === "0") return 0;
  return null;
}

async function hasAuthToken(): Promise<boolean> {
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";
  return hasBearerHeader || hasCookieToken;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase =
    process.env.CUSTOMER_NOTIFICATION_STATUS_PATH ?? "/api/Musteri/bildirim-acik-durum";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load notification status", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.CUSTOMER_NOTIFICATION_KAYNAK ?? "2"
  );
  const bildirim = normalizeBildirim(searchParams.get("bildirim"));

  if (bildirim == null) {
    return NextResponse.json(
      { message: "bildirim must be 0 or 1" },
      { status: 400 }
    );
  }
  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase =
    process.env.CUSTOMER_NOTIFICATION_SET_PATH ?? "/api/Musteri/bildirim-acik";
  const qp = new URLSearchParams({
    bildirim: String(bildirim),
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body: {} });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to update notification status", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
