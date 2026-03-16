type Json = Record<string, any>;

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function request<T>(
  input: RequestInfo | URL,
  init: RequestInit & { retry?: boolean } = {}
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && init.retry !== false) {
    const rr = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (rr.ok) {
      const res2 = await fetch(input, {
        ...init,
        retry: false,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(init.headers || {}),
        },
      } as any);
      if (!res2.ok) throw await safeJson(res2);
      return (await res2.json()) as T;
    }
  }

  if (!res.ok) {
    const data = await safeJson(res);
    throw {
      message:
        data?.message ??
        data?.error ??
        (res.status ? `HTTP ${res.status} ${res.statusText}` : "Request failed"),
      status: res.status,
      statusText: res.statusText,
      ...data,
    };
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T = any>(url: string, body?: Json) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body ?? {}) }),
};
