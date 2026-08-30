import { createAuthClient } from "better-auth/client";
import { polarClient } from "@polar-sh/better-auth";
import { webEnv } from "@orra/env/web";

function validateOriginOnly(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      throw new Error(
        `NEXT_PUBLIC_SERVER_URL must be an origin only (scheme + host), got path: ${parsed.pathname}`,
      );
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    throw new Error(`NEXT_PUBLIC_SERVER_URL is not a valid URL: ${url}`);
  }
}

function getBaseUrl(): { baseURL?: string; basePath: string } {
  // Server-side: always use the full gateway URL
  if (typeof window === "undefined") {
    const origin = validateOriginOnly(webEnv.NEXT_PUBLIC_SERVER_URL);
    return { baseURL: origin, basePath: "/v1/auth" };
  }
  // Client-side
  if (window.location.hostname === "localhost") {
    const origin = validateOriginOnly(webEnv.NEXT_PUBLIC_SERVER_URL);
    return { baseURL: origin, basePath: "/v1/auth" };
  }
  return { basePath: "/api/auth" };
}

export const authClient = createAuthClient({
  ...getBaseUrl(),
  plugins: [polarClient()],
});