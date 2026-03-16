import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  return value === "2" ? 2 : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function parsePositiveInt(value: string | null): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function appendPath(base: string, segment: string): string {
  return `${base.replace(/\/$/, "")}/${segment.replace(/^\//, "")}`;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const gorevNr = parsePositiveInt(searchParams.get("gorevNr"));
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.MISSIONS_DONE_KAYNAK ?? "2"
  );

  if (gorevNr == null) {
    return NextResponse.json({ message: "Invalid gorevNr" }, { status: 400 });
  }

  const h = await headers();
  const jar = await cookies();
  const hasBearerHeader = (h.get("authorization") ?? "").trim() !== "";
  const hasCookieToken = (jar.get("gtg_access")?.value ?? "").trim() !== "";

  if (!hasBearerHeader && !hasCookieToken) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const pathBase = process.env.MISSIONS_DONE_PATH ?? "/api/Gorev/done";
  const pathWithMission = appendPath(pathBase, String(gorevNr));
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathWithMission}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body: {} });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to complete mission", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
