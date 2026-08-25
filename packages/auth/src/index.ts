import { createDb } from "@orra/db";
import * as schema from "@orra/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { sendEmail } from "./lib/email";
import { otpTemplate, resetPasswordTemplate } from "./lib/email-templates";

export interface AuthConfig {
  secret: string;
  baseURL: string;
  polar?: {
    accessToken: string;
    successUrl: string;
  };
  google?: {
    clientId: string;
    clientSecret: string;
  };
}

const rawOrigins = process.env.TRUSTED_ORIGINS;
const trustedOrigins = rawOrigins
  ? rawOrigins.split(",").map((s) => s.trim())
  : ["http://localhost:3001"];

const isDev = process.env.NODE_ENV !== "production";

export function createAuth(config: AuthConfig) {
  const db = createDb();

  // Determine cookie domain from baseURL for production
  const baseUrl = new URL(config.baseURL);
  const cookieDomain = isDev ? undefined : baseUrl.hostname;

  return betterAuth({
    basePath: "/api/auth",
    database: drizzleAdapter(db, { provider: "pg", schema }),
    trustedOrigins: isDev ? ["*"] : trustedOrigins,
    secret: config.secret,
    baseURL: config.baseURL,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, url }) {
        void sendEmail({
          to: user.email,
          subject: "Reset your password — Orra",
          html: resetPasswordTemplate({ url }),
        });
      },
    },

    user: {
      additionalFields: {
        phone: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        planTier: {
          type: "string",
          required: false,
          defaultValue: "free",
          input: false,
        },
        nickname: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        gender: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        dateOfBirth: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        country: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        state: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        city: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        address: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        language: {
          type: "string",
          required: false,
          defaultValue: "en",
          input: true,
        },
        timezone: {
          type: "string",
          required: false,
          defaultValue: "UTC",
          input: true,
        },
        currency: {
          type: "string",
          required: false,
          defaultValue: "USD",
          input: true,
        },
        dateFormat: {
          type: "string",
          required: false,
          defaultValue: "MM_DD_YYYY",
          input: true,
        },
        twoFactorEnabled: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24,
      updateAge: 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
      cookieDomain,
    },

    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 300,
        sendVerificationOnSignUp: true,
        async sendVerificationOTP({ email, otp, type }) {
          const subjects: Record<string, string> = {
            "sign-in": "Your sign-in code",
            "email-verification": "Verify your email",
            "forget-password": "Reset your password",
            "change-email": "Confirm your email change",
          };
          void sendEmail({
            to: email,
            subject: subjects[type] ?? "Your OTP code",
            html: otpTemplate({ otp, type }),
          });
        },
      }),
      twoFactor({
        issuer: "Orra AI",
        otpOptions: { digits: 6, period: 30 },
      }),
    ],

    socialProviders: config.google
      ? {
          google: {
            clientId: config.google.clientId,
            clientSecret: config.google.clientSecret,
          },
        }
      : undefined,

    advanced: {
      trustedProxyHeaders: true,
      defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        partitioned: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
