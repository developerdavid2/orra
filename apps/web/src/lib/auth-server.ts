// lib/auth-server.ts
import { cookies } from "next/headers";
import { cache } from "react";
import { authClient } from "./auth-client-server";

export interface Session {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
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
    const cookieHeader = cookieStore.getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const { data: session, error } = await authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: cookieHeader,
        },
      },
    });
    if (error || !session?.user) {
      return null;
    }
    return session as unknown as Session;
  } catch (error) {
    console.error("[getServerSession] threw:", error);
    return null;
  }
});
