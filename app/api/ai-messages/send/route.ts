import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { proxyJson } from "@/lib/server/proxy";
import {
  buildQuotaFallbackReply,
  generateGeminiDemoReply,
  isAiDemoModeEnabled,
  isGeminiQuotaError,
} from "@/lib/server/ai-demo";

function normalizeDil(value: string | null): number {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function normalizeKaynak(value: string | null): number {
  return value === "1" ? 1 : 2;
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const dil = normalizeDil(searchParams.get("dil"));
  const kaynak = normalizeKaynak(
    searchParams.get("kaynak") ?? process.env.AI_SEND_MESSAGE_KAYNAK ?? "2"
  );

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

  const mesajMetin = sanitizeText(body?.mesajMetin);
  if (!mesajMetin) {
    return NextResponse.json({ message: "mesajMetin is required" }, { status: 400 });
  }

  const pathBase = process.env.AI_SEND_MESSAGE_PATH ?? "/api/aimesaj/AIMesajGonder";
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
  });
  const path = `${pathBase}?${qp.toString()}`;

  const { res, data } = await proxyJson({
    path,
    method: "POST",
    body: { mesajMetin },
  });

  if (!res.ok) {
    const backendMessage =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.Message === "string"
        ? data.Message
        : typeof data?.error === "string"
        ? data.error
        : typeof data?.Error === "string"
        ? data.Error
        : "Failed to send AI message";

    return NextResponse.json(
      { message: backendMessage, ...data },
      { status: res.status }
    );
  }
  if (!isAiDemoModeEnabled()) {
    return NextResponse.json(data);
  }

  try {
    const aiCevap = await generateGeminiDemoReply(mesajMetin);
    const enrichedData = {
      ...(data ?? {}),
      Data: {
        ...(data?.Data ?? {}),
        AimesajMetinAiCevap: aiCevap,
        aiCevap,
      },
    };
    return NextResponse.json(enrichedData);
  } catch (err: any) {
    const errorMessage = String(err?.message ?? "Failed to generate demo AI response");
    if (isGeminiQuotaError(errorMessage)) {
      const aiCevap = buildQuotaFallbackReply(dil);
      const fallbackData = {
        ...(data ?? {}),
        Message: buildQuotaFallbackReply(dil),
        Data: {
          ...(data?.Data ?? {}),
          AimesajMetinAiCevap: aiCevap,
          aiCevap,
        },
      };
      return NextResponse.json(fallbackData);
    }

    return NextResponse.json(data);
  }
}
