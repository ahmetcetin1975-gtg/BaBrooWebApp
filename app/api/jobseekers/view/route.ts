import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function parsePositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const bakMusteriNr = parsePositiveInt(searchParams.get("bakilanMusteriNr") ?? searchParams.get("bakMusteriNr"));
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(searchParams.get("kaynak") ?? process.env.JOBSEEKERS_VIEW_KAYNAK ?? "2");
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (bakMusteriNr == null) {
    return NextResponse.json({ message: "Invalid bakMusteriNr" }, { status: 400 });
  }
  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase = process.env.JOBSEEKERS_VIEW_ADD_BAK_PATH ?? "/api/musteri-bak-musteri/add-bak";
  const qp = new URLSearchParams({
    bakMusteriNr: String(bakMusteriNr),
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body: {} });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to update job seeker view", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
