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

  const pathBase = process.env.AI_SEND_MESSAGE_PATH ?? "/api/Gemini/ask";
  const qp = new URLSearchParams({
    kaynak: String(kaynak),
    dil: String(dil),
    mesajMetin,
  });
  const path = `${pathBase}?${qp.toString()}`;

  let { res, data } = await proxyJson({
    path,
    method: "POST",
    body: {
      Prompt: mesajMetin,
    },
  });

  // Some Gemini backend implementations accept GET or different body contracts.
  // If POST returns 400, try a lightweight GET fallback with query params.
  if (res.status === 400) {
    const fallback = await proxyJson({
      path,
      method: "GET",
    });
    res = fallback.res;
    data = fallback.data;
  }

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

    console.error("[ai-messages/send] Backend error", {
      httpStatus: res.status,
      backendMessage,
      backendPayload: data,
    });

    return NextResponse.json(
      {
        message: backendMessage,
        debug: {
          source: "backend",
          httpStatus: res.status,
        },
        ...data,
      },
      { status: res.status }
    );
  }
  const backendStatusCode = Number(data?.StatusCode);
  if (Number.isFinite(backendStatusCode) && backendStatusCode !== 201) {
    console.error("[ai-messages/send] Backend business error", {
      httpStatus: res.status,
      backendStatusCode,
      backendMessage:
        typeof data?.Message === "string"
          ? data.Message
          : typeof data?.message === "string"
          ? data.message
          : "",
      backendPayload: data,
    });
  }

  return NextResponse.json(data);
}
