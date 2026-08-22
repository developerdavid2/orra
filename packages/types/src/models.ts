export interface ModelPricing {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
}

export type SupportedProvider = "groq" | "openrouter" | "ai-gateway";

export interface SupportedChatModelDefinition {
  id: string;
  provider: SupportedProvider;
  pricing: ModelPricing;
}

export const SUPPORTED_CHAT_MODELS = [
  // Groq (default, cheapest)
  {
    id: "qwen/qwen3.6-27b",
    provider: "groq",
    pricing: {
      inputUsdPerMillionTokens: 0.15,
      outputUsdPerMillionTokens: 0.15,
    },
  },
  {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    pricing: {
      inputUsdPerMillionTokens: 0.59,
      outputUsdPerMillionTokens: 0.79,
    },
  },
  {
    id: "mixtral-8x7b-32768",
    provider: "groq",
    pricing: {
      inputUsdPerMillionTokens: 0.24,
      outputUsdPerMillionTokens: 0.24,
    },
  },

  // OpenRouter
  {
    id: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 3.0,
      outputUsdPerMillionTokens: 15.0,
    },
  },
  {
    id: "openai/gpt-4o",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 2.5,
      outputUsdPerMillionTokens: 10.0,
    },
  },
  {
    id: "google/gemini-2.0-flash-001",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 0.1,
      outputUsdPerMillionTokens: 0.4,
    },
  },
  {
    id: "meta-llama/llama-3.1-405b-instruct",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 3.0,
      outputUsdPerMillionTokens: 3.0,
    },
  },

  // Vercel AI Gateway
  {
    id: "google/gemini-2.5-flash-lite",
    provider: "ai-gateway",
    pricing: {
      inputUsdPerMillionTokens: 0.075,
      outputUsdPerMillionTokens: 0.3,
    },
  },
  {
    id: "openai/gpt-4o-mini",
    provider: "ai-gateway",
    pricing: {
      inputUsdPerMillionTokens: 0.15,
      outputUsdPerMillionTokens: 0.6,
    },
  },
  {
    id: "anthropic/claude-3.5-haiku",
    provider: "ai-gateway",
    pricing: {
      inputUsdPerMillionTokens: 0.8,
      outputUsdPerMillionTokens: 4.0,
    },
  },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];

export type SupportedChatModelId = SupportedChatModel["id"];

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "qwen/qwen3.6-27b";

export function findSupportedChatModel(
  modelId: string,
): SupportedChatModel | undefined {
  return SUPPORTED_CHAT_MODELS.find((m) => m.id === modelId);
}
