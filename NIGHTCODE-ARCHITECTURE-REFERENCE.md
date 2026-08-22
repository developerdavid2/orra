# NightCode Architecture Reference

A comprehensive reference of the NightCode monorepo architecture — Vercel AI SDK integration, Hono backend, OpenTUI + React frontend, shared package structure, Polar billing, Clerk auth, credits system, session management, error handling, and all key patterns.

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Shared Package (`@nightcode/shared`)](#2-shared-package-nightcodeshared)
3. [Database Package (`@nightcode/database`)](#3-database-package-nightcodedatabase)
4. [Server Package (`@nightcode/server`)](#4-server-package-nightcodeserver)
5. [CLI Package (`@nightcode/cli`)](#5-cli-package-nightcodecli)
6. [Key Architectural Patterns](#6-key-architectural-patterns)

---

## 1. Monorepo Structure

```
nightcode-main/
├── packages/
│   ├── shared/     → @nightcode/shared     (Zod schemas, tool contracts, model registry)
│   ├── database/   → @nightcode/database   (Prisma schema, client, types)
│   ├── server/     → @nightcode/server     (Hono API, AI streaming, auth, billing)
│   └── cli/        → @nightcode/cli        (OpenTUI + React terminal client)
├── package.json    (Bun workspaces: ["packages/*"])
├── tsconfig.base.json
└── .env
```

- **Runtime:** Bun
- **Backend:** Hono (lightweight web framework)
- **Frontend:** OpenTUI (React-based terminal UI)
- **AI:** Vercel AI SDK v6
- **ORM:** Prisma 7.x with PostgreSQL adapter
- **Auth:** Clerk (OAuth with PKCE for CLI)
- **Billing:** Polar (credits meter + checkout)
- **Database:** PostgreSQL (Neon)

---

## 2. Shared Package (`@nightcode/shared`)

**3 source files.** Exports raw `.ts` (no build step). Consumers need a TypeScript bundler.

### 2.1 Package Config

```json
{
  "name": "@nightcode/shared",
  "type": "module",
  "private": true,
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "ai": "^6.0.184", "zod": "^4.3.6" }
}
```

### 2.2 Model Registry (`src/models.ts`)

```ts
export type ModelPricing = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
};

export type SupportedProvider = "anthropic" | "openai";

type SupportedChatModelDefinition = {
  id: string;
  provider: SupportedProvider;
  pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    pricing: { inputUsdPerMillionTokens: 3, outputUsdPerMillionTokens: 15 },
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    pricing: { inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 5 },
  },
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
    pricing: { inputUsdPerMillionTokens: 5, outputUsdPerMillionTokens: 25 },
  },
  {
    id: "gpt-5.4",
    provider: "openai",
    pricing: { inputUsdPerMillionTokens: 2.5, outputUsdPerMillionTokens: 15 },
  },
  {
    id: "gpt-5.4-mini",
    provider: "openai",
    pricing: { inputUsdPerMillionTokens: 0.75, outputUsdPerMillionTokens: 4.5 },
  },
  {
    id: "gpt-5.4-nano",
    provider: "openai",
    pricing: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 1.25 },
  },
] as const satisfies readonly SupportedChatModelDefinition[];

// Auto-derived types from the const array:
export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];
// = "claude-sonnet-4-6" | "claude-haiku-4-5" | "claude-opus-4-6" | "gpt-5.4" | "gpt-5.4-mini" | "gpt-5.4-nano"

export function findSupportedChatModel(modelId: string) {
  return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "claude-opus-4-6";
```

**Pattern:** `as const satisfies readonly T[]` gives compile-time validation + literal type inference. Adding a model auto-updates all derived types.

### 2.3 Tool Contracts (`src/schemas.ts`)

```ts
import { z } from "zod";
import { tool } from "ai";

export const Mode = { BUILD: "BUILD", PLAN: "PLAN" } as const;
export const modeSchema = z.enum([Mode.BUILD, Mode.PLAN]);
export type ModeType = (typeof Mode)[keyof typeof Mode];

// Zod schemas for all tool inputs
export const toolInputSchemas = {
  readFile: z.object({
    path: z.string().describe("Relative path to the file to read"),
  }),
  listDirectory: z.object({
    path: z.string().default(".").describe("Relative directory path to list"),
  }),
  glob: z.object({
    pattern: z.string().describe("Glob pattern to match files"),
    path: z.string().default(".").describe("Directory to search from"),
  }),
  grep: z.object({
    pattern: z.string().describe("Regex pattern to search for"),
    path: z.string().default(".").describe("Directory to search from"),
    include: z.string().optional().describe("Optional glob for files to include"),
  }),
  writeFile: z.object({
    path: z.string().describe("Relative path to write"),
    content: z.string().describe("File contents"),
  }),
  editFile: z.object({
    path: z.string().describe("Relative path to edit"),
    oldString: z.string().describe("Exact text to replace; must be unique"),
    newString: z.string().describe("Replacement text"),
  }),
  bash: z.object({
    command: z.string().describe("Shell command to run"),
    description: z.string().optional().describe("Short description of the command"),
    timeout: z.number().optional().describe("Timeout in milliseconds"),
  }),
} as const;

// PLAN mode: read-only tools (safe)
export const readOnlyToolContracts = {
  readFile: tool({ description: "Read a file from the current project directory.", inputSchema: toolInputSchemas.readFile }),
  listDirectory: tool({ description: "List entries in a directory under the current project directory.", inputSchema: toolInputSchemas.listDirectory }),
  glob: tool({ description: "Find files matching a glob pattern under the current project directory.", inputSchema: toolInputSchemas.glob }),
  grep: tool({ description: "Search file contents with a regular expression under the current project directory.", inputSchema: toolInputSchemas.grep }),
} as const;

// BUILD mode: read + write + bash tools
export const buildToolContracts = {
  ...readOnlyToolContracts,
  writeFile: tool({ description: "Create or overwrite a file under the current project directory.", inputSchema: toolInputSchemas.writeFile }),
  editFile: tool({ description: "Replace exact text in a file under the current project directory.", inputSchema: toolInputSchemas.editFile }),
  bash: tool({ description: "Run a shell command in the current project directory.", inputSchema: toolInputSchemas.bash }),
} as const;

export type ToolContracts = typeof buildToolContracts;

export function getToolContracts(mode: ModeType) {
  return mode === Mode.PLAN ? readOnlyToolContracts : buildToolContracts;
}
```

**Pattern:** Schemas and tool contracts are decoupled. Zod schemas live in `toolInputSchemas` (reusable for validation), and tool contracts compose them with descriptions for the AI. Two-tier tool system ensures PLAN mode cannot modify files.

### 2.4 Barrel Export (`src/index.ts`)

```ts
export {
  SUPPORTED_CHAT_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  findSupportedChatModel,
  type ModelPricing,
  type SupportedProvider,
  type SupportedChatModel,
  type SupportedChatModelId,
} from "./models";

export {
  Mode,
  modeSchema,
  toolInputSchemas,
  getToolContracts,
  type ToolContracts,
  type ModeType,
} from "./schemas";
```

---

## 3. Database Package (`@nightcode/database`)

### 3.1 Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Json     @default("[]")

  @@index([userId])
}
```

Single model. `userId` is an opaque Clerk identifier (no FK relation). `messages` stores the full `UIMessage[]` array as JSON. `@@index([userId])` for efficient user-scoped queries.

### 3.2 Two Export Paths

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts"
  }
}
```

- `@nightcode/database` → types only (re-exports all generated Prisma types)
- `@nightcode/database/client` → runtime client (instantiates `PrismaClient` with `PrismaPg` adapter)

### 3.3 Client Instantiation (`src/client.ts`)

```ts
import dotenv from "dotenv";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString: databaseUrl });
export const db = new PrismaClient({ adapter });
```

---

## 4. Server Package (`@nightcode/server`)

### 4.1 Entry Point (`src/index.ts`)

```ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "./middleware/require-auth";
import sessions from "./routes/sessions";
import chat from "./routes/chat";
import auth from "./routes/auth";
import billing from "./routes/billing";

const app = new Hono();

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message || "Request failed" }, error.status);
  }
  console.error("Unhandled server error", error);
  return c.json({ error: "Internal server error" }, 500);
});

app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);
app.use("/billing/checkout", requireAuth);
app.use("/billing/portal", requireAuth);

const routes = app
  .route("/auth", auth)
  .route("/billing", billing)
  .route("/sessions", sessions)
  .route("/chat", chat);

export type AppType = typeof routes;
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 };
```

- `AppType` export enables end-to-end type safety (Hono RPC client on frontend)
- `idleTimeout: 255` prevents premature connection kills during long LLM streaming
- Auth middleware selectively applied (not on `/auth/*` or `/billing/success`)

### 4.2 Auth Middleware (`src/middleware/require-auth.ts`)

```ts
import { createMiddleware } from "hono/factory";
import { authenticateOAuthRequest } from "../lib/auth";

export type AuthenticatedEnv = {
  Variables: { userId: string };
};

export const requireAuth = createMiddleware<AuthenticatedEnv>(async (c, next) => {
  try {
    const auth = await authenticateOAuthRequest(c.req.raw);
    if (!auth) {
      return c.json({ error: "Unauthorized. Run /login to continue." }, 401);
    }
    c.set("userId", auth.userId);
    await next();
  } catch {
    return c.json({ error: "Unauthorized. Run /login to continue." }, 401);
  }
});
```

### 4.3 Auth Library (`src/lib/auth.ts`)

```ts
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
});

export async function authenticateOAuthRequest(request: Request) {
  const requestState = await clerkClient.authenticateRequest(request, {
    acceptsToken: "oauth_token",
  });
  if (!requestState.isAuthenticated) return null;
  const auth = requestState.toAuth();
  if (auth.tokenType !== "oauth_token" || !auth.userId) return null;
  return { userId: auth.userId };
}
```

### 4.4 Credits Middleware (`src/middleware/require-credits-balance.ts`)

```ts
import { createMiddleware } from "hono/factory";
import type { AuthenticatedEnv } from "./require-auth";
import { getAvailableCreditsBalance } from "../lib/polar";

export const requireCreditsBalance = createMiddleware<AuthenticatedEnv>(async (c, next) => {
  try {
    const userId = c.get("userId");
    const creditsBalance = await getAvailableCreditsBalance(userId);
    if (creditsBalance <= 0) {
      return c.json({ error: "No credits remaining. Run /upgrade to buy more credits." }, 402);
    }
    await next();
  } catch {
    return c.json({ error: "Unable to verify credits balance right now." }, 503);
  }
});
```

Launch-time gate only — no credit reservation at request time. Runs AFTER `requireAuth`.

### 4.5 Polar Billing (`src/lib/polar.ts`)

```ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
});

// Create checkout URL for buying credits
export async function createCheckoutUrl({ customerExternalId, requestUrl }) {
  const result = await polar.checkouts.create({
    products: [process.env.POLAR_PRODUCT_ID!],
    successUrl: new URL("/billing/success", requestUrl).toString(),
    externalCustomerId: customerExternalId,
    metadata: { source: "nightcode-cli" },
  });
  return result.url;
}

// Create customer portal URL for managing account
export async function createCustomerPortalUrl({ customerExternalId, requestUrl }) {
  const result = await polar.customerSessions.create({
    externalCustomerId: customerExternalId,
    returnUrl: new URL("/billing/success", requestUrl).toString(),
  });
  return result.customerPortalUrl;
}

// Query available credits balance
export async function getAvailableCreditsBalance(customerExternalId: string) {
  try {
    const customerState = await polar.customers.getStateExternal({
      externalId: customerExternalId,
    });
    const matchingMeters = customerState.activeMeters.filter(
      (meter) => meter.meterId === process.env.POLAR_CREDITS_METER_ID,
    );
    if (matchingMeters.length > 1) throw new Error("Expected exactly one matching meter");
    return matchingMeters[0]?.balance ?? 0;
  } catch (error) {
    if (error?.statusCode === 404) return 0;
    throw error;
  }
}

// Ingest usage event (idempotent via eventId)
export async function ingestAiUsage({ externalCustomerId, eventId, credits }) {
  if (credits <= 0) return;
  await polar.events.ingest({
    events: [{
      name: "nightcode_usage",
      externalId: eventId,
      externalCustomerId,
      metadata: { credits },
    }],
  });
}
```

### 4.6 Credit Calculation (`src/lib/credits.ts`)

```ts
const TOKENS_PER_MILLION = 1_000_000;
const USD_PER_CREDIT = 0.01;

export function calculateCreditsForUsage({ provider, model, usage }) {
  const supportedModel = findSupportedChatModel(model);
  const pricing = supportedModel.pricing;

  const estimatedCostUsd =
    (usage.inputTokens * pricing.inputUsdPerMillionTokens +
      usage.outputTokens * pricing.outputUsdPerMillionTokens) /
    TOKENS_PER_MILLION;

  // Convert USD to credits (1 credit = $0.01), always ceil, min 1
  const credits = estimatedCostUsd <= 0 ? 0 : Math.max(1, Math.ceil(estimatedCostUsd / USD_PER_CREDIT));
  return { credits };
}
```

### 4.7 Model Resolution (`src/lib/models.ts`)

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { findSupportedChatModel } from "@nightcode/shared";

type ResolvedModel = {
  model: LanguageModel;
  provider: SupportedProvider;
  modelId: SupportedChatModelId;
  providerOptions?: ProviderOptions;
};

// Provider-specific options (thinking, reasoning)
const ANTHROPIC_PROVIDER_OPTIONS = {
  "claude-opus-4-6": { anthropic: { thinking: { type: "enabled", budgetTokens: 10000 } } },
  "claude-sonnet-4-6": { anthropic: { thinking: { type: "enabled", budgetTokens: 10000 } } },
};

const OPENAI_PROVIDER_OPTIONS = {
  "gpt-5.4": { openai: { thinking: { reasoningSummary: "detailed" } } },
};

export function resolveChatModel(modelId: string): ResolvedModel {
  const model = findSupportedChatModel(modelId);
  if (!model) throw new Error(`Unsupported model: ${modelId}`);

  switch (model.provider) {
    case "anthropic":
      return { model: anthropic(model.id), provider: "anthropic", modelId: model.id, providerOptions: ANTHROPIC_PROVIDER_OPTIONS[model.id] };
    case "openai":
      return { model: openai(model.id), provider: "openai", modelId: model.id, providerOptions: OPENAI_PROVIDER_OPTIONS[model.id] };
    default:
      return assertUnsupportedProvider(model.provider); // exhaustive check
  }
}

export function isSupportedChatModel(modelId: string): modelId is SupportedChatModelId {
  return findSupportedChatModel(modelId) != null;
}
```

### 4.8 System Prompt (`src/system-prompt.ts`)

```ts
export function buildSystemPrompt({ mode }: { mode: ModeType }): string {
  const parts: string[] = [];

  parts.push(`You are an expert software engineer working as a coding assistant inside a terminal application.
  The application has two modes the user can switch between:
  - **PLAN** -- Read-only analysis and planning. No file modifications.
  - **BUILD** -- Full implementation with read and write tools.`);

  if (mode === "PLAN") {
    parts.push(`## Mode: PLAN
    You are in planning mode. Your job is to analyze, research, and propose solutions -- but NOT make changes.
    - Use your available tools to explore the codebase
    - Present your analysis and a clear plan of action
    - Explain trade-offs and ask for clarification when needed`);

    parts.push(`## Tool Usage
    You have these tools available:
    - **readFile**, **listDirectory**, **glob**, **grep**
    ### Rules
    1. Be decisive. Use glob/grep to find what's relevant, then read only those files.
    2. Never re-read files you already read in this conversation.
    3. Batch your tool calls. Call multiple tools in parallel when possible.`);
  }

  if (mode === "BUILD") {
    parts.push(`## Mode: BUILD
    You are in build mode. Your job is to implement changes directly.
    - Read and understand the relevant code before making changes
    - Use writeFile to create new files, editFile for targeted modifications
    - Use bash to run commands (tests, builds, git operations)
    - After making changes, verify the work when possible`);

    parts.push(`## Tool Usage
    You have these tools available:
    - **readFile**, **writeFile**, **editFile**, **listDirectory**, **glob**, **grep**, **bash**
    ### Rules
    1. Be decisive. Use glob/grep to find what's relevant, then read only those files.
    2. Never re-read files you already read in this conversation.
    3. Batch your tool calls. Call multiple tools in parallel when possible.
    4. Use editFile for small changes to existing files. Only use writeFile when creating new files or rewriting most of a file.`);
  }

  return parts.join("\n");
}
```

### 4.9 Chat Route (`src/routes/chat.ts`) — The Core AI Endpoint

```ts
import {
  convertToModelMessages, streamText, validateUIMessages,
  type InferUITools, type LanguageModelUsage, type UIMessage,
} from "ai";
import { getToolContracts, modeSchema, type ModeType, type ToolContracts } from "@nightcode/shared";

type ChatMessageMetadata = {
  mode?: ModeType;
  model?: string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

type NightcodeUIMessage = UIMessage<ChatMessageMetadata, never, InferUITools<ToolContracts>>;

const submitSchema = z.object({
  id: z.string(),
  messages: z.array(z.custom<NightcodeUIMessage>((value) =>
    value != null && typeof value === "object" && "id" in value && "parts" in value
  )).min(1),
  mode: modeSchema,
  model: z.string().refine(isSupportedChatModel, "Unsupported model"),
});

// Helper: check if message has pending tool calls
function hasPendingToolCalls(message: NightcodeUIMessage) {
  return message.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }
    return false;
  });
}

// Route handler
app.post("/", requireCreditsBalance, submitValidator, async (c) => {
  const userId = c.get("userId");
  const { id, messages, mode, model } = c.req.valid("json");

  // 1. Fetch session (ownership check)
  const session = await db.session.findUnique({ where: { id, userId } });
  if (!session) return c.json({ error: "Session not found" }, 404);

  // 2. Merge incoming messages with existing (upsert by message id)
  const previousMessages = Array.isArray(session.messages) ? session.messages : [];
  const mergedMessages = [...previousMessages];
  for (const message of messages) {
    const incomingMessage = { ...message, metadata: { ...message.metadata, mode, model } };
    const existingIndex = mergedMessages.findIndex((m) => m.id === incomingMessage.id);
    if (existingIndex === -1) mergedMessages.push(incomingMessage);
    else mergedMessages[existingIndex] = incomingMessage;
  }

  // 3. Validate and convert messages
  const nextMessages = await validateUIMessages<NightcodeUIMessage>({ messages: mergedMessages, tools });
  const modelMessages = await convertToModelMessages(nextMessages, { tools });

  // 4. Stream AI response
  let completedUsage: LanguageModelUsage | null = null;
  const result = streamText({
    model: resolvedModel.model,
    system: buildSystemPrompt({ mode }),
    messages: modelMessages,
    tools,
    providerOptions: resolvedModel.providerOptions,
    onFinish(event) { completedUsage = event.totalUsage; },
  });

  // 5. Return streaming response
  return result.toUIMessageStreamResponse<NightcodeUIMessage>({
    originalMessages: nextMessages,
    messageMetadata({ part }) {
      if (part.type === "start") return { mode, model };
      if (part.type !== "finish") return undefined;
      return { mode, model, durationMs: Date.now() - startTime, ...(completedUsage ? { usage: completedUsage } : {}) };
    },
    async onFinish(event) {
      if (event.isAborted) return;
      if (hasPendingToolCalls(event.responseMessage)) return; // Don't save incomplete tool calls

      // 6. Persist messages
      await db.session.update({
        where: { id, userId },
        data: { messages: event.messages as unknown as Prisma.InputJsonValue },
      });

      // 7. Bill usage
      if (!completedUsage) return;
      try {
        const billableUsage = calculateCreditsForUsage({ provider: resolvedModel.provider, model: resolvedModel.modelId, usage: completedUsage });
        await ingestAiUsage({ externalCustomerId: userId, eventId: `chat-message:${event.responseMessage.id}`, credits: billableUsage.credits });
      } catch (error) {
        console.error("Failed to ingest Polar AI usage", { error, sessionId: id, messageId: event.responseMessage.id, userId });
      }
    },
    onError(error) {
      return error instanceof Error ? error.message : String(error); // Returns string, doesn't throw
    },
  });
});
```

### 4.10 Session Routes (`src/routes/sessions.ts`)

```ts
const app = new Hono<AuthenticatedEnv>()
  .get("/", async (c) => {
    // List sessions (lightweight — no messages)
    const sessions = await db.session.findMany({
      where: { userId: c.get("userId") },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    });
    return c.json(sessions);
  })
  .get("/:id", async (c) => {
    // Get full session (including messages)
    const session = await db.session.findUnique({
      where: { id: c.req.param("id"), userId: c.get("userId") },
    });
    if (!session) return c.json({ error: "Session not found" }, 404);
    return c.json(session);
  })
  .post("/", requireCreditsBalance, createSessionValidator, async (c) => {
    // Create session (requires credits)
    const session = await db.session.create({
      data: { title: c.req.valid("json").title, userId: c.get("userId") },
    });
    return c.json(session, 201);
  });
```

### 4.11 OAuth Callback (`src/routes/auth.ts`)

```ts
app.get("/callback", (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) return c.text(c.req.query("error_description") ?? error, 400);
  if (!code || !state) return c.text("Missing authorization code or state", 400);

  // Decode state to find the CLI's local port
  const [encoded] = state.split(".");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
  const port = payload.port;

  // Redirect to CLI's local server
  return c.redirect(`http://localhost:${port}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
});
```

### 4.12 Billing Routes (`src/routes/billing.ts`)

```ts
const app = new Hono<AuthenticatedEnv>()
  .post("/checkout", async (c) => {
    const url = await createCheckoutUrl({ customerExternalId: c.get("userId"), requestUrl: c.req.url });
    return c.json({ url });
  })
  .post("/portal", async (c) => {
    const url = await createCustomerPortalUrl({ customerExternalId: c.get("userId"), requestUrl: c.req.url });
    return c.json({ url });
  })
  .get("/success", (c) => c.text("Done. You can close this tab and return to Nightcode."));
```

---

## 5. CLI Package (`@nightcode/cli`)

### 5.1 App Entry (`src/index.tsx`)

```tsx
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { createMemoryRouter, RouterProvider } from "react-router";

const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "sessions/new", element: <NewSession /> },
      { path: "sessions/:id", element: <Session /> },
    ]
  }
]);

const renderer = await createCliRenderer({ targetFps: 60, exitOnCtrlC: false });
createRoot(renderer).render(<RouterProvider router={router} />);
```

### 5.2 Provider Tree (`src/layouts/root-layout.tsx`)

```tsx
export function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <KeyboardLayerProvider>
          <DialogProvider>
            <PromptConfigProvider>
              <ThemedRoot>
                <Outlet />
              </ThemedRoot>
            </PromptConfigProvider>
          </DialogProvider>
        </KeyboardLayerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
```

Order: Theme → Toast → KeyboardLayer → Dialog → PromptConfig → ThemedRoot → Outlet

### 5.3 useChat Hook (`src/hooks/use-chat.ts`)

```ts
import { useChat as useAiChat } from "@ai-sdk/react";
import { DefaultChatTransport, type InferUITools, lastAssistantMessageIsCompleteWithToolCalls, type LanguageModelUsage, type UIMessage } from "ai";

// Typing chain: ToolContracts → InferUITools → ChatTools → UIMessage → Message
type ChatTools = {
  [Name in keyof InferUITools<ToolContracts>]: {
    input: InferUITools<ToolContracts>[Name]["input"];
    output: unknown;
  };
};

export type ChatMessageMetadata = {
  mode?: ModeType;
  model?: SupportedChatModelId | string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

export type Message = UIMessage<ChatMessageMetadata, never, ChatTools>;

export function useChat(sessionId: string, initialMessages: Message[]) {
  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: apiClient.chat.$url().toString(),
      headers() {
        const auth = getAuth();
        return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers();
      },
      prepareSendMessagesRequest({ messages }) {
        const message = messages[messages.length - 1];
        const metadata = messages.findLast((m) => m.metadata?.mode && m.metadata?.model)?.metadata;
        const previousMessage = messages[messages.length - 2];
        const requestMessages =
          message.role === "assistant" && previousMessage?.role === "user"
            ? [previousMessage, message]  // Resubmit user + assistant for tool output
            : [message];

        return {
          body: {
            id: sessionId,
            messages: requestMessages,
            mode: message.metadata?.mode ?? metadata?.mode,
            model: message.metadata?.model ?? metadata?.model,
          },
        };
      }
    });
  }, [sessionId]);

  const chat = useAiChat<Message>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onToolCall({ toolCall }) {
      const mode = chat.messages.at(-1)?.metadata?.mode ?? "BUILD";
      void executeLocalTool(toolCall.toolName, toolCall.input, mode)
        .then((output) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            output,
          })
        )
        .catch((error) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : String(error),
          })
        );
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    submit: (params: { userText: string; mode: ModeType; model: SupportedChatModelId }) => {
      return chat.sendMessage({
        text: params.userText,
        metadata: { mode: params.mode, model: params.model },
      });
    },
    abort: chat.stop,
    interrupt: chat.stop,
  };
}
```

### 5.4 Session Shell (`src/components/session-shell.tsx`)

```tsx
export function SessionShell({ children, onSubmit, inputDisabled, loading, interruptible }: Props) {
  return (
    <box flexDirection="column" flexGrow={1} width="100%" height="100%" paddingY={1} paddingX={2} gap={1}>
      {/* Auto-scrolling message area */}
      <scrollbox flexGrow={1} width="100%" stickyScroll stickyStart="bottom">
        <box>{children}</box>
      </scrollbox>

      {/* Input area */}
      <box flexShrink={0}>
        <InputBar onSubmit={onSubmit} disabled={inputDisabled} />
      </box>

      {/* Footer: spinner + hints */}
      <box flexShrink={0} flexDirection="row" justifyContent="space-between" width="100%" height={1} gap={2} paddingLeft={1}>
        <box flexDirection="row" alignItems="center" gap={2}>
          {loading ? (<>
            <Spinner mode={mode} />
            {interruptible ? <text>esc to interrupt</text> : null}
          </>) : null}
        </box>
        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>agents</text>
        </box>
      </box>
    </box>
  );
}
```

### 5.5 Optimistic Session Creation Flow

```
Home Screen
  → User types message, presses Enter
  → navigate("/sessions/new", { state: { message, mode, model } })

NewSession Screen (renders immediately — no server call yet)
  → Shows SessionShell with inputDisabled + loading spinner
  → Displays UserMessage with the user's text (optimistic rendering)
  → On mount: POST /sessions creates session in background
  → On success: navigate("/sessions/${id}", { state: { session, initialPrompt } })
  → On error: toast + navigate("/", { replace: true })

Session Screen
  → If location.state.session exists: uses prefetched data (skips fetch)
  → Otherwise: GET /sessions/${id}
  → SessionChat renders messages
  → Auto-submits initialPrompt if present
```

### 5.6 Error Handling Pattern

```ts
// Used in new-session.tsx, session.tsx, and other async screens
let ignore = false;
try {
  const response = await apiClient.sessions.$post({ json: { title } });
  if (!response.ok) throw new Error(await getErrorMessage(response));
  const session = await response.json();
  navigate(`/sessions/${session.id}`, { state: { session, initialPrompt: state } });
} catch (error) {
  if (ignore) return; // Prevents state updates after unmount
  toast.show({
    variant: "error",
    message: error instanceof Error ? error.message : "Failed to create session",
  });
  navigate("/", { replace: true }); // Navigate back on failure
}
return () => { ignore = true; }; // Cleanup: prevent stale updates
```

### 5.7 HTTP Error Extraction (`src/lib/http-errors.ts`)

```ts
export async function getErrorMessage(response: { json: () => Promise<unknown>; status: number; statusText: string }) {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.length > 0) return data.error;
  } catch { /* Ignore invalid error payloads */ }
  return response.statusText || `Request failed with status ${response.status}`;
}
```

### 5.8 API Client (`src/lib/api-client.ts`)

```ts
import { hc } from "hono/client";
import type { AppType } from "@nightcode/server";

export const apiClient = hc<AppType>(
  process.env.API_URL ?? "http://localhost:3000",
  {
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      const auth = getAuth();
      if (auth) headers.set("Authorization", `Bearer ${auth.token}`);
      const response = await fetch(input, { ...init, headers });
      if (response.status === 401) clearAuth(); // Auto-clear on 401
      return response;
    }
  }
);
```

### 5.9 Auth Token Storage (`src/lib/auth.ts`)

```ts
const AUTH_DIR = join(homedir(), ".nightcode");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

export function getAuth(): { token: string } | null {
  try {
    const data = readFileSync(AUTH_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return typeof parsed.token === "string" ? { token: parsed.token } : null;
  } catch { return null; }
}

export function saveAuth(data: { token: string }) {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { mode: 0o700 });
  writeFileSync(AUTH_FILE, JSON.stringify(data), { mode: 0o600 });
}

export function clearAuth() {
  try { unlinkSync(AUTH_FILE); } catch { /* File doesn't exist */ }
}
```

### 5.10 Local Tool Execution (`src/lib/local-tools.ts`)

```ts
export async function executeLocalTool(toolName: string, input: any, mode: string) {
  // Enforce PLAN mode restrictions
  if (mode === "PLAN" && ["writeFile", "editFile", "bash"].includes(toolName)) {
    throw new Error(`Tool "${toolName}" is not available in Plan mode`);
  }

  switch (toolName) {
    case "readFile": {
      const content = readFileSync(resolveInsideCwd(input.path), "utf-8");
      return content.length > 10_000 ? content.slice(0, 10_000) + "\n... (truncated)" : content;
    }
    case "listDirectory": {
      const entries = readdirSync(resolveInsideCwd(input.path), { withFileTypes: true });
      return entries.filter(e => !e.name.startsWith(".") && e.name !== "node_modules")
        .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1))
        .map(e => `${e.isDirectory() ? "d " : "f "}${e.name}`).join("\n");
    }
    case "glob": {
      const glob = new Bun.Glob(input.pattern);
      const matches: string[] = [];
      for await (const match of glob.scan({ cwd: resolveInsideCwd(input.path) })) {
        matches.push(match);
        if (matches.length >= 200) break;
      }
      return matches.join("\n");
    }
    case "grep": {
      const proc = Bun.spawnSync(["grep", "-rn", "--color=never", input.pattern, resolveInsideCwd(input.path), ...(input.include ? ["--include", input.include] : [])]);
      return proc.stdout?.toString().slice(0, 20_000) || "No matches found";
    }
    case "writeFile": {
      const filePath = resolveInsideCwd(input.path);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, input.content);
      return `File written: ${input.path}`;
    }
    case "editFile": {
      const filePath = resolveInsideCwd(input.path);
      const content = readFileSync(filePath, "utf-8");
      const count = content.split(input.oldString).length - 1;
      if (count === 0) throw new Error("oldString not found in file");
      if (count > 1) throw new Error(`Found ${count} matches for oldString — must be unique`);
      writeFileSync(filePath, content.replace(input.oldString, input.newString));
      return `File edited: ${input.path}`;
    }
    case "bash": {
      const proc = Bun.spawnSync(["bash", "-c", input.command], {
        cwd: resolveInsideCwd("."),
        timeout: input.timeout ?? 30_000,
      });
      const output = proc.stdout?.toString().slice(0, 20_000) || "";
      const stderr = proc.stderr?.toString().slice(0, 5_000) || "";
      return [output, stderr ? `STDERR:\n${stderr}` : ""].filter(Boolean).join("\n");
    }
  }
}

// Sandbox enforcement
function resolveInsideCwd(relativePath: string) {
  const resolved = resolve(process.cwd(), relativePath);
  if (!resolved.startsWith(process.cwd())) throw new Error("Path is outside the project directory");
  return resolved;
}
```

### 5.11 OAuth PKCE Flow (`src/lib/oauth.ts`)

```ts
export async function startOAuthFlow(): Promise<{ token: string }> {
  // 1. Generate PKCE params
  const nonce = randomBytes(16).toString("hex");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = base64url.encode(await sha256(codeVerifier));

  // 2. Start local HTTP server on random port
  const server = Bun.serve({ port: 0, fetch(req) { /* handle callback */ } });
  const port = server.port;

  // 3. Encode state with port
  const state = base64url.encode(JSON.stringify({ nonce, port }));

  // 4. Open browser to Clerk authorize URL
  await open(`${CLERK_FRONTEND_API}/oauth/authorize?...&state=${state}`);

  // 5. Wait for callback (5 minute timeout)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { server.stop(); reject(new Error("OAuth timed out")); }, 300_000);
    // ... handle callback, exchange code for tokens, save auth
  });
}
```

### 5.12 Keyboard Layer System (`src/providers/keyboard-layer/index.tsx`)

```ts
// Stack-based focus management
type LayerStack = {
  layers: string[];
  responders: Map<string, () => boolean>;
};

// Example usage:
// - Dialog opens → push("dialog", () => { close(); return true; })
// - Command menu opens → push("command", () => { closeMenu(); return true; })
// - Escape pressed → walk stack top-to-bottom, first responder that returns true wins
// - If no responder handles it → renderer.destroy() (exit app)
```

### 5.13 Message Components

**user-message.tsx:**
```tsx
// Left border (purple=Plan, primary=Build), surface background
<box border={["left"]} borderColor={mode === Mode.PLAN ? colors.planMode : colors.primary}
  customBorderChars={{ ...EmptyBorder, vertical: "┃", bottomLeft: "╹" }}>
  <box backgroundColor={colors.surface} paddingX={2} paddingY={1}>
    <text>{message}</text>
  </box>
</box>
```

**error-message.tsx:**
```tsx
// Same layout as user message, error color border + dim text
<box border={["left"]} borderColor={colors.error}
  customBorderChars={{ ...EmptyBorder, vertical: "┃", bottomLeft: "╹" }}>
  <box backgroundColor={colors.surface} paddingX={2} paddingY={1}>
    <text attributes={TextAttributes.DIM}>{message}</text>
  </box>
</box>
```

**bot-message.tsx:**
```tsx
// Type narrowing:
type ClientMessagePart = Message["parts"][number];
type ToolPart = Extract<ClientMessagePart, { type: `tool-${string}` | "dynamic-tool" }>;

// Part grouping: groupConsecutiveParts() merges consecutive same-type parts
// Renders: reasoning (italic+dim), tool calls (name+args), text, footer (mode/model/duration)
```

### 5.14 Message Typing Chain

```
ToolContracts (from @nightcode/shared)
    ↓ InferUITools<>
ChatTools (mapped type in use-chat.ts)
    ↓ UIMessage<ChatMessageMetadata, never, ChatTools>
Message (exported type in use-chat.ts)
    ↓ Message["parts"][number]
ClientMessagePart (in bot-message.tsx)
    ↓ Extract<ClientMessagePart, { type: `tool-${string}` | "dynamic-tool" }>
ToolPart (in bot-message.tsx)
```

Server-to-client message casting:
```ts
type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;
const [initialMessages] = useState(() => session.messages as unknown as Message[]);
// Double-cast: server JSON → client UIMessage type
```

---

## 6. Key Architectural Patterns

| Pattern | Where Used | Why |
|---------|-----------|-----|
| `as const satisfies readonly T[]` | Model registry | Auto-derives literal types, compile-time validation |
| Zod schemas + `tool()` wrapper | Tool contracts | Shared validation + LLM context |
| Two-tier tools (PLAN/BUILD) | Safety by design | AI physically cannot write in PLAN mode |
| Barrel export (`index.ts`) | All packages | Single import surface |
| Raw `.ts` export (no build) | Shared package | No build duplication, full type info |
| `export type AppType` | Server index | End-to-end type safety via Hono RPC |
| Middleware chaining | requireAuth → requireCreditsBalance | Composable auth + billing gates |
| Optimistic rendering | NewSession screen | No blank loading screens |
| Sticky scroll bottom | SessionShell | Chat UX auto-scrolls |
| Keyboard layer stack | All interactive components | Modal focus management |
| `let ignore = false` pattern | All async screens | Prevents stale state updates |
| `onError` returning string | Chat streaming | Keeps stream alive, surfaces error |
| `hasPendingToolCalls` check | Chat onFinish | Prevents saving incomplete messages |
| `chat-message:${id}` as eventId | Polar ingestion | Idempotent billing |
| `resolveInsideCwd()` | Local tools | Path traversal prevention |
| `assertUnsupportedProvider(never)` | Model resolver | Exhaustive switch at compile-time |
| `as unknown as` double-cast | Session messages | Bridge server→client types |
| `select` for list queries | Session listing | Avoids loading messages JSON blob |
| ` stickyScroll stickyStart="bottom"` | SessionShell | Auto-scroll to latest messages |
| `sendAutomaticallyWhen` | useChat | Auto-send after tool completion |
| `setTimeout().unref()` | Toast timer | Timer doesn't keep process alive |
| File permissions `0o600/0o700` | Auth storage | OS-level security |

---

## Architecture Diagram

```
CLI Client (OpenTUI + React)
    │
    │ OAuth login (Clerk PKCE)
    v
POST /auth/callback  (receives OAuth code, redirects to CLI localhost)
    │
    │ Authenticated requests carry Bearer token
    v
┌── require-auth middleware (Clerk JWT verification) ──┐
│                                                       │
│   POST /sessions (create)  [requireCreditsBalance]    │
│   GET  /sessions           (list)                     │
│   GET  /sessions/:id       (get)                      │
│                                                       │
│   POST /chat              [requireCreditsBalance]     │
│     │                                                 │
│     ├→ resolveChatModel (Anthropic/OpenAI)            │
│     ├→ buildSystemPrompt (PLAN/BUILD)                 │
│     ├→ streamText (Vercel AI SDK)                     │
│     ├→ toUIMessageStreamResponse (SSE)                │
│     ├→ onFinish: save messages + ingest Polar usage   │
│     └→ onError: return string (keeps stream alive)    │
│                                                       │
│   POST /billing/checkout   (Polar checkout URL)       │
│   POST /billing/portal     (Polar portal URL)         │
│   GET  /billing/success    (static "done" page)       │
└───────────────────────────────────────────────────────┘
    │
    │ Credit deduction
    v
Polar (billing/usage metering)
```
