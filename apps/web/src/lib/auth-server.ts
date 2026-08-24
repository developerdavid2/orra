// lib/auth-server.ts
import type { Route } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export interface Session {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    planTier?: string;
  };
  session: {
    id: string;
    expiresAt: string;
    token: string;
  };
}

export const getServerSession = cache(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    if (allCookies.length === 0) {
      console.log("[getServerSession] no cookies found");
      return null;
    }

    // Reconstruct cookie header string
    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    console.log(
      "[getServerSession] cookies found:",
      allCookies.map((c) => c.name),
    );

    const appUrl = new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3001",
    );

    const response = await fetch(
      `${process.env.SERVER_URL}/v1/auth/get-session`,
      {
        headers: {
          cookie: cookieHeader,
          "x-forwarded-host": appUrl.host,
          "x-forwarded-proto": "https",
        },
        cache: "no-store",
      },
    );

    console.log("[getServerSession] status:", response.status);
    if (!response.ok) return null;

    return (await response.json()) ?? null;
  } catch (error) {
    console.error("[getServerSession] threw:", error);
    return null;
  }
});

/**
 * Use in layouts — redirects to sign-in if not authenticated.
 * Optionally redirects to verify-otp if email not verified.
 */
export async function requireAuth({
  redirectTo = "/auth/signin",
  requireEmailVerified = true,
}: {
  redirectTo?: string;
  requireEmailVerified?: boolean;
} = {}): Promise<Session> {
  const session = await getServerSession();

  if (!session?.user) {
    redirect(redirectTo as Route);
  }

  if (requireEmailVerified && !session.user.emailVerified) {
    redirect("/auth/verify-otp");
  }

  return session;
}

/**
 * Use in auth pages (signin, signup) — redirects to dashboard if already logged in.
 */
export async function redirectIfAuthenticated(
  to: string = "/dashboard",
): Promise<void> {
  const session = await getServerSession();
  if (session?.user) {
    redirect(to as Route);
  }
}
