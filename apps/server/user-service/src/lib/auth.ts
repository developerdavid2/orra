import { buildPolarApi, createAuth } from "@orra/auth";
import type { AuthConfig } from "@orra/auth";
import { userServiceEnv } from "@orra/env/user-service";

export const polarConfig: AuthConfig["polar"] | undefined =
  userServiceEnv.POLAR_ACCESS_TOKEN
    ? {
        accessToken: userServiceEnv.POLAR_ACCESS_TOKEN,
        server: userServiceEnv.POLAR_SERVER,
        successUrl:
          userServiceEnv.POLAR_SUCCESS_URL ??
          `${userServiceEnv.AUTH_PUBLIC_URL.replace(/\/$/, "")}/dashboard/settings/billing`,
        ...(userServiceEnv.POLAR_RETURN_URL
          ? { returnUrl: userServiceEnv.POLAR_RETURN_URL }
          : {}),
      }
    : undefined;

export const polarApi = buildPolarApi(polarConfig);

export const auth = createAuth({
  secret: userServiceEnv.BETTER_AUTH_SECRET,
  baseURL: userServiceEnv.AUTH_PUBLIC_URL,
  polar: polarConfig,
  google:
    userServiceEnv.GOOGLE_CLIENT_ID && userServiceEnv.GOOGLE_CLIENT_SECRET
      ? {
          clientId: userServiceEnv.GOOGLE_CLIENT_ID,
          clientSecret: userServiceEnv.GOOGLE_CLIENT_SECRET,
        }
      : undefined,
});