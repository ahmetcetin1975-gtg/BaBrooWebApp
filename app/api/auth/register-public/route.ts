import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { normalizeDil } from "@/lib/i18n/languages";

function asObject(data: any): Record<string, any> {
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function resolveMessage(data: any): string {
  if (typeof data === "string") return data;
  return String(data?.Message ?? data?.message ?? data?.raw ?? "Register failed");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const ad = String(body?.Ad ?? body?.ad ?? "").trim();
  const soyad = String(body?.Soyad ?? body?.soyad ?? "").trim();
  const email = String(body?.Email ?? body?.email ?? "").trim();
  const countryCode = String(body?.CountryCode ?? body?.countryCode ?? "").trim().replace(/^\+/, "");
  const telefon = String(body?.Telefon ?? body?.telefon ?? "").trim();
  const sifre = String(body?.Sifre ?? body?.sifre ?? "");
  const ulkeNr = Number(body?.UlkeNr ?? body?.ulkeNr ?? 0);
  const ilNr = Number(body?.IlNr ?? body?.ilNr ?? 0);
  const dil = normalizeDil(body?.Dil ?? body?.dil);
  const kaynak = Number(body?.kaynak ?? body?.Kaynak ?? 2);

  if (!ad || !soyad || !email || !countryCode || !telefon || !sifre || !ulkeNr || !ilNr) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const payload = {
    Ad: ad,
    Soyad: soyad,
    Email: email,
    CountryCode: countryCode,
    Telefon: telefon,
    Sifre: sifre,
    UlkeNr: ulkeNr,
    IlNr: ilNr,
    Dil: dil,
    kaynak,
  };

  const path = process.env.PUBLIC_REGISTER_PATH ?? "/api/Auth/register";
  const { res, data } = await proxyJson({ path, method: "POST", body: payload, forwardAuth: false });
  const dataObject = asObject(data);
  const backendStatus = Number(dataObject?.StatusCode ?? dataObject?.statusCode ?? 0);

  if (!res.ok || backendStatus >= 400) {
    return NextResponse.json(
      { message: resolveMessage(data), ...dataObject },
      { status: backendStatus >= 400 ? backendStatus : res.status || 400 }
    );
  }

  return NextResponse.json({ ok: true, message: resolveMessage(data), ...dataObject });
}
