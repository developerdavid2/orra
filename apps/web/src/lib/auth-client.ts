"use client";

import { polarClient } from "@polar-sh/better-auth";
import { webEnv } from "@orra/env/web";
import { createAuthClient } from "better-auth/react";

function getBaseUrl(): { baseURL?: string; basePath: string } {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return { baseURL: webEnv.NEXT_PUBLIC_SERVER_URL, basePath: "/v1/auth" };
  }
  return { basePath: "/api/auth" };
}

export const authClient = createAuthClient({
  ...getBaseUrl(),
  plugins: [polarClient()],
});