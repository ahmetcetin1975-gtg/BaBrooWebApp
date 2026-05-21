import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));

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

  const aiMesajNr = parsePositiveInt(body?.aiMesajNr);
  const aiCevap = sanitizeText(body?.aiCevap);

  if (aiMesajNr == null) {
    return NextResponse.json({ message: "aiMesajNr must be a positive integer" }, { status: 400 });
  }
  if (!aiCevap) {
    return NextResponse.json({ message: "aiCevap is required" }, { status: 400 });
  }

  const pathBase = process.env.AI_UPDATE_ANSWER_PATH ?? "/api/aimesaj/AIMesajCevapGuncelle";
  const qp = new URLSearchParams({ dil: String(dil) });
  const path = `${pathBase}?${qp.toString()}`;

  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { aiMesajNr, aiCevap },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to update AI response", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
