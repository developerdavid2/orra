// lib/auth-urls.ts
"use client";

import { webEnv } from "@orra/env/web";

export function authBaseUrl(): string {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return `${webEnv.NEXT_PUBLIC_SERVER_URL}/v1/auth`;
  }
  return "/v1/auth";
}

export async function fetchPortalUrl(): Promise<string> {
  const res = await fetch(`${authBaseUrl()}/customer/portal`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load billing portal");
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new Error("Customer portal did not return a URL");
  }
  return data.url;
}
