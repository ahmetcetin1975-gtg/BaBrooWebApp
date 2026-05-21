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

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase = process.env.WORK_EXPERIENCES_GET_ALL_PATH ?? "/api/MusteriIsler/getall";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET" });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load work experiences", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.WORK_EXPERIENCES_SAVE_KAYNAK ?? "2"
  );

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });

  const pathBase = process.env.WORK_EXPERIENCES_SAVE_PATH ?? "/api/MusteriIsler/save";
  const path = `${pathBase}?${query.toString()}`;
  const payload = body && typeof body === "object" ? body : {};

  const { res, data } = await proxyJson({ path, method: "POST", body: payload });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to save work experience", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
