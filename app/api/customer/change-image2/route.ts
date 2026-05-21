import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { resolveApiRoot } from "@/lib/server/proxy";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.CUSTOMER_CHANGE_IMAGE2_KAYNAK ?? "2"
  );
  const formData = await req.formData();
  const file = formData.get("File");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  const h = await headers();
  const jar = await cookies();
  const inboundAuth = h.get("authorization");
  const cookieAccess = jar.get("gtg_access")?.value;
  const authorization =
    inboundAuth && inboundAuth.trim() !== ""
      ? inboundAuth
      : cookieAccess
      ? `Bearer ${cookieAccess}`
      : undefined;

  if (!authorization) {
    return NextResponse.json({ message: "Bearer token is required" }, { status: 401 });
  }

  const outbound = new FormData();
  outbound.append("File", file, file.name);

  const pathBase = process.env.CUSTOMER_CHANGE_IMAGE2_PATH ?? "/api/Musteri/change-image2";
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const url = `${resolveApiRoot(h.get("host"))}${pathBase.startsWith("/") ? "" : "/"}${pathBase}?${qp.toString()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorization,
      ...(h.get("accept-language") ? { "Accept-Language": h.get("accept-language")! } : {}),
    },
    body: outbound,
  });

  const data = await safeJson(res);
  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? data?.Message ?? "Failed to change customer image", ...data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
