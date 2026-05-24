"use client";

const base = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(
    /\/$/,
    "",
  );

let accessToken: string | null = null;
let csrfToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function adminFetch<T>(
  path: string,
  init?: RequestInit,
  retried?: { csrf?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (csrfToken && init?.method && init.method !== "GET") {
    headers["X-CSRF-Token"] = csrfToken;
  }
  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${base()}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && path !== "/api/v1/auth/login" && path !== "/api/v1/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) {
      return adminFetch(path, init, retried);
    }
    throw new Error("unauthorized");
  }

  if (
    res.status === 403 &&
    init?.method &&
    init.method !== "GET" &&
    !retried?.csrf
  ) {
    await fetchCsrf();
    return adminFetch(path, init, { ...retried, csrf: true });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `Request failed: ${res.status}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const data = await adminFetch<{
    access_token: string;
    expires_in: number;
    csrf_token: string;
    admin: { id: string; email: string };
  }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.access_token);
  setCsrfToken(data.csrf_token);
  return data;
}

export async function refreshSession() {
  try {
    const data = await adminFetch<{
      access_token: string;
      csrf_token: string;
    }>("/api/v1/auth/refresh", { method: "POST", body: "{}" });
    setAccessToken(data.access_token);
    setCsrfToken(data.csrf_token);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function logout() {
  try {
    await adminFetch("/api/v1/auth/logout", { method: "POST", body: "{}" });
  } finally {
    setAccessToken(null);
    setCsrfToken(null);
  }
}

export async function fetchCsrf() {
  const data = await adminFetch<{ csrf_token: string }>("/api/v1/auth/csrf");
  setCsrfToken(data.csrf_token);
  return data.csrf_token;
}

export type UploadResult = {
  object_key: string;
  thumb_object_key: string;
  url: string;
  thumb_url: string;
};

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  return adminFetch<UploadResult>("/api/v1/admin/uploads", {
    method: "POST",
    body: form,
  });
}

export { adminFetch };
