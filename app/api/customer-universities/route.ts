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
  const search = (searchParams.get("search") ?? "").trim();

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase =
    process.env.CUSTOMER_UNIVERSITIES_GET_ALL_PATH ?? "/api/MusteriUniversiteler/getall";
  const qp = new URLSearchParams({ dil: String(dil) });
  if (search) {
    qp.set("search", search);
  }
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load universities", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.CUSTOMER_UNIVERSITIES_SAVE_KAYNAK ?? "2"
  );

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const pathBase =
    process.env.CUSTOMER_UNIVERSITIES_SAVE_PATH ?? "/api/MusteriUniversiteler/save";
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to save university", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
