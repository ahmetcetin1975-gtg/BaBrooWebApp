import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function normalizeBildirim(value: string | null): 0 | 1 | null {
  if (value === "1") return 1;
  if (value === "0") return 0;
  return null;
}

function resolveErrorMessage(data: any): string {
  return String(data?.Message ?? data?.message ?? "Notification preference update failed");
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const musteriNr = Number(searchParams.get("musteriNr") ?? 0);
  const bildirim = normalizeBildirim(searchParams.get("bildirim"));
  const kaynak = normalizeKaynak(searchParams.get("kaynak"));
  const dil = normalizeDil(searchParams.get("dil"));

  if (!Number.isFinite(musteriNr) || musteriNr <= 0) {
    return NextResponse.json({ message: "musteriNr must be a positive number" }, { status: 400 });
  }

  if (bildirim == null) {
    return NextResponse.json({ message: "bildirim must be 0 or 1" }, { status: 400 });
  }

  const pathBase = process.env.REGISTER_NOTIFICATION_PATH ?? "/api/Auth/register-bildirim-on-off";
  const qp = new URLSearchParams({
    musteriNr: String(musteriNr),
    bildirim: String(bildirim),
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;
  const { res, data } = await proxyJson({ path, method: "POST", body: {}, forwardAuth: false });
  const backendStatus = Number(data?.StatusCode ?? 0);

  if (!res.ok || backendStatus >= 400 || data?.success === false) {
    const status = backendStatus >= 400 ? backendStatus : !res.ok ? res.status || 400 : 400;
    return NextResponse.json(
      { message: resolveErrorMessage(data), ...data },
      { status }
    );
  }

  return NextResponse.json({ ok: true, ...data });
}
