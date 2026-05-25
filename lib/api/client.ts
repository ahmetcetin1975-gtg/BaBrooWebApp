type Json = Record<string, any>;

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function readApiMessage(data: any, res: Response): string {
  return String(
    data?.Message ??
      data?.message ??
      data?.error ??
      data?.raw ??
      (res.status ? `HTTP ${res.status} ${res.statusText}` : "Request failed")
  );
}

async function request<T>(
  input: RequestInfo | URL,
  init: RequestInit & { retry?: boolean } = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
      const retryIsFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
      const res2 = await fetch(input, {
        ...init,
        retry: false,
        credentials: "include",
        headers: {
          ...(retryIsFormData ? {} : { "Content-Type": "application/json" }),
          ...(init.headers || {}),
        },
      } as any);
      if (!res2.ok) {
        const data = await safeJson(res2);
        throw {
          message: readApiMessage(data, res2),
          status: res2.status,
          statusText: res2.statusText,
          ...data,
        };
      }
      return (await res2.json()) as T;
    }

    const refreshError = await safeJson(rr);
    throw {
      message: readApiMessage(refreshError, rr),
      status: rr.status,
      statusText: rr.statusText,
      authExpired: true,
      ...refreshError,
    };
  }

  if (!res.ok) {
    const data = await safeJson(res);
    throw {
      message: readApiMessage(data, res),
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
  postForm: <T = any>(url: string, body: FormData) =>
    request<T>(url, { method: "POST", body }),
};
