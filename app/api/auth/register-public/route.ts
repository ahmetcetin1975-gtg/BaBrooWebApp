import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function resolveMessage(data: any): string {
  return String(data?.Message ?? data?.message ?? "Register failed");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const ad = String(body?.ad ?? "").trim();
  const soyad = String(body?.soyad ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const countryCode = String(body?.countryCode ?? "").trim().replace(/^\+/, "");
  const telefon = String(body?.telefon ?? "").trim();
  const sifre = String(body?.sifre ?? "");
  const ulkeNr = Number(body?.ulkeNr ?? 0);
  const dil = Number(body?.dil ?? 1) === 2 ? 2 : 1;
  const kaynak = Number(body?.kaynak ?? 2);

  if (!ad || !soyad || !email || !countryCode || !telefon || !sifre || !ulkeNr) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const payload = {
    ad,
    soyad,
    email,
    countryCode,
    telefon,
    sifre,
    ulkeNr,
    dil,
    kaynak,
  };

  const path = process.env.PUBLIC_REGISTER_PATH ?? "/api/Auth/register";
  const { res, data } = await proxyJson({ path, method: "POST", body: payload, forwardAuth: false });
  const backendStatus = Number(data?.StatusCode ?? 0);

  if (!res.ok || backendStatus >= 400) {
    return NextResponse.json({ message: resolveMessage(data), ...data }, { status: backendStatus >= 400 ? backendStatus : res.status || 400 });
  }

  return NextResponse.json({ ok: true, message: resolveMessage(data), ...data });
}
