import { gatewayEnv } from "@orra/env/gateway";
import type { NextFunction, Request, Response } from "express";
import { getCachedSession, setCachedSession } from "../lib/session-cache";
import { resolvePlanTier } from "../lib/polar-tier";

interface SessionResponse {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
}

export async function authMiddleware(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  if (req.path.startsWith("/v1/auth") || req.path.startsWith("/auth")) {
    return next();
  }

  const cookie = req.headers.cookie;
  if (!cookie) {
    return next();
  }

  try {
    const cached = await getCachedSession(cookie);
    if (cached) {
      await attachUserHeaders(req, cached);
      return next();
    }

    const sessionRes = await fetch(
      `${gatewayEnv.USER_SERVICE_URL}/api/auth/get-session`,
      {
        headers: {
          cookie,
          "x-forwarded-host":
            req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "",
          "x-forwarded-proto":
            (req.headers["x-forwarded-proto"] as string) ?? "https",
        },
      },
    );

    if (!sessionRes.ok) {
      return next();
    }

    const session = (await sessionRes.json()) as SessionResponse | null;

    if (session?.user) {
      await attachUserHeaders(req, session);
      await setCachedSession(cookie, session);
    }
  } catch (error) {}

  next();
}

async function attachUserHeaders(req: Request, session: SessionResponse) {
  req.headers["x-user-id"] = session.user.id;
  req.headers["x-user-email"] = session.user.email ?? "";
  req.headers["x-user-name"] = session.user.name ?? "";
  req.headers["x-user-plan-tier"] = await resolvePlanTier(session.user.id);
}
