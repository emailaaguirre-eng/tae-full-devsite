"use client";

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "AdminUnauthorizedError";
  }
}

export async function adminFetchJson(
  input: RequestInfo | URL,
  init?: RequestInit,
  onUnauthorized?: () => void
): Promise<{ res: Response; data: any }> {
  const res = await fetch(input, { cache: "no-store", ...init });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new AdminUnauthorizedError();
  }

  return { res, data };
}
