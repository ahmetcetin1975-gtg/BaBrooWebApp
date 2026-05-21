function resolveGeminiErrorMessage(payload: any): string {
  if (typeof payload?.error?.message === "string" && payload.error.message.trim()) {
    return payload.error.message.trim();
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  return "";
}

export function isAiDemoModeEnabled(): boolean {
  const raw = (process.env.AI_DEMO_MODE ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function isGeminiQuotaError(errorMessage: string): boolean {
  const m = (errorMessage ?? "").toLowerCase();
  return m.includes("quota") || m.includes("rate limit") || m.includes("exceeded");
}

export function buildQuotaFallbackReply(dil: number): string {
  if (dil !== 1) {
    return "Demo AI quota is currently full. Your message was saved and will continue through the standard AI flow.";
  }
  return "Demo AI kotası şu anda dolu. Mesajınız kaydedildi ve standart AI akışıyla devam edecek.";
}

export async function generateGeminiDemoReply(mesajMetin: string): Promise<string> {
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = (process.env.GEMINI_MODEL ?? "gemini-2.0-flash").trim();
  const systemPrompt = (process.env.AI_DEMO_SYSTEM_PROMPT ?? "").trim();

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`
  );
  endpoint.searchParams.set("key", apiKey);

  const requestBody: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: mesajMetin }],
      },
    ],
  };
  if (systemPrompt) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  const text = await response.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const backendMessage = resolveGeminiErrorMessage(payload);
    throw new Error(backendMessage || "Gemini API request failed");
  }

  const candidateList = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidateList) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const assembled = parts
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
    if (assembled) return assembled;
  }

  throw new Error("Gemini API returned an empty response");
}
