import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizePositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const ulkeId = normalizePositiveInt(searchParams.get("ulkeId"));

  const pathBase = process.env.CITIES_PUBLIC_PATH ?? "/api/Main/GetIllerUlkeli";
  const qp = new URLSearchParams({ dil: String(dil) });
  if (ulkeId) {
    qp.set("ulkeId", String(ulkeId));
  }

  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "GET", forwardAuth: false });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to load cities", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
