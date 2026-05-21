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

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(searchParams.get("kaynak") ?? "2");

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

  const pathBase =
    process.env.CUSTOMER_SAVE_CINSIYET_PATH ??
    "/api/Musteri/save-cinsiyet-meddurum-dogtar-uyruk-tc";
  const qp = new URLSearchParams({ kaynak: String(kaynak), dil: String(dil) });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: {
      CinsiyetNr: body?.Cinsiyet != null && body.Cinsiyet !== "" ? Number(body.Cinsiyet) : null,
      MedeniDurumuNr: body?.MedeniDurumu != null && body.MedeniDurumu !== "" ? Number(body.MedeniDurumu) : null,
      Tc: typeof body?.Tc === "string" ? body.Tc.trim() : "",
      DogumTarihi: body?.DogumTarihi ?? null,
      Uyruklar: typeof body?.Uyruklar === "string" ? body.Uyruklar.trim() : "",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Failed to save personal information", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
