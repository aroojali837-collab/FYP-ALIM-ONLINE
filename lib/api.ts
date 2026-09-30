const DEFAULT_API_BASE_URL = "http://127.0.0.1:5233";

export function getApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(getApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}

export async function getApiError(response: Response, fallback: string) {
  const text = (await response.text()).replace(/\s+/g, " ").trim();

  try {
    const data: unknown = JSON.parse(text);
    if (typeof data === "object" && data !== null && "error" in data) {
      const error = data.error;
      if (typeof error === "string" && error.trim()) {
        return error;
      }
    }
  } catch {
    // Some proxy/server failures return HTML or plain text instead of JSON.
  }

  const details = text.slice(0, 160);
  return `${fallback} (HTTP ${response.status})${details ? `: ${details}` : ""}`;
}
