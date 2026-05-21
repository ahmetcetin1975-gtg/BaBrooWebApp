import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import { normalizeDil } from "@/lib/i18n/languages";

function resolveLocaleText(dil: number) {
  if (dil !== 1) {
    return {
      emailRequired: "Email address is required.",
      emailTooLong: "Email address can be at most 100 characters.",
      subscribeFailed: "Subscription failed",
      subscribeSuccess: "Subscription successful",
    };
  }

  return {
    emailRequired: "E-posta adresi zorunludur.",
    emailTooLong: "E-posta adresi en fazla 100 karakter olabilir.",
    subscribeFailed: "Abonelik başarısız",
    subscribeSuccess: "Abonelik başarılı",
  };
}

function resolveMessage(data: any, fallback: string) {
  return String(data?.Message ?? data?.message ?? fallback);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const rawKaynak = Number(searchParams.get("kaynak") ?? 2);
  const kaynak = Number.isFinite(rawKaynak) && rawKaynak > 0 ? rawKaynak : 2;
  const text = resolveLocaleText(dil);
  const body = await req.json().catch(() => ({}));

  const abonelikEmail = String(body?.abonelikEmail ?? "").trim();

  if (!abonelikEmail) {
    return NextResponse.json(
      {
        StatusCode: 400,
        Message: text.emailRequired,
        Meta: null,
        Data: null,
      },
      { status: 400 }
    );
  }

  if (abonelikEmail.length > 100) {
    return NextResponse.json(
      {
        StatusCode: 400,
        Message: text.emailTooLong,
        Meta: null,
        Data: null,
      },
      { status: 400 }
    );
  }

  const path = `/api/Main/abone-ol?dil=${dil}&kaynak=${kaynak}`;
  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { abonelikEmail },
    forwardAuth: false,
  });
  const backendStatus = Number(data?.StatusCode ?? 0);

  if (!res.ok || backendStatus >= 400) {
    return NextResponse.json(
      {
        StatusCode: backendStatus >= 400 ? backendStatus : res.status || 400,
        Message: resolveMessage(data, text.subscribeFailed),
        Meta: data?.Meta ?? null,
        Data: data?.Data ?? null,
        ...data,
      },
      { status: backendStatus >= 400 ? backendStatus : res.status || 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: resolveMessage(data, text.subscribeSuccess),
    ...data,
  });
}
