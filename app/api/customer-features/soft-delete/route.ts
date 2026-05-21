import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function hasAuthToken(): Promise<boolean> {
  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";
  return hasBearerHeader || hasCookieToken;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = normalizeInt(searchParams.get("id"), 0);
  const dil = normalizeInt(searchParams.get("dil"), 1);
  const kaynak = normalizeInt(searchParams.get("kaynak"), 2);

  if (id <= 0) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  if (!(await hasAuthToken())) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase =
    process.env.CUSTOMER_FEATURES_SOFT_DELETE_PATH ?? "/api/MusteriOzellikleri/softdelete";
  const qp = new URLSearchParams({
    dil: String(dil),
    kaynak: String(kaynak),
  });
  const path = `${pathBase}/${id}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body: {} });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to delete customer feature", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
