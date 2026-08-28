export * from "./accounts";
export * from "./ai-tools";
export * from "./auth";
export * from "./billing";
export * from "./budgets";
export * from "./chats";
export * from "./insights";
export * from "./location";
export * from "./notifications";
export * from "./pagination";
export * from "./plaid";
export * from "./security";
export * from "./transactions";
export * from "./users";
export * from "./models";
export {};

type ServiceErrorCode =
  | "DB_ERROR"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR"
  | "RATE_LIMITED"
  | "AI_ERROR"
  | "VALIDATION_ERROR"
  | "PARSE_ERROR"
  | "UNAUTHORIZED"
  | "CONFLICT";

export type ServiceResult<T> =
  | { success: true; data: T; error?: never; code?: never }
  | {
      success: false;
      data?: never;
      error: string;
      code?: ServiceErrorCode;
    };
