import { createAuthClient } from "better-auth/client";
import { polarClient } from "@polar-sh/better-auth";
import { webEnv } from "@orra/env/web";

function getBaseUrl(): { baseURL?: string; basePath: string } {
  // Server-side: always use the full gateway URL
  if (typeof window === "undefined") {
    return { baseURL: webEnv.NEXT_PUBLIC_SERVER_URL, basePath: "/v1/auth" };
  }
  // Client-side
  if (window.location.hostname === "localhost") {
    return { baseURL: webEnv.NEXT_PUBLIC_SERVER_URL, basePath: "/v1/auth" };
  }
  return { basePath: "/api/auth" };
}

export const authClient = createAuthClient({
  ...getBaseUrl(),
  plugins: [polarClient()],
});