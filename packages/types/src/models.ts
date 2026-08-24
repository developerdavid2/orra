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
  // Groq — live lineup as of Aug 2026 (llama-3.3-70b-versatile shut down
  // 08/16/26, mixtral-8x7b back in 03/25; see console.groq.com/docs/deprecations)
  {
    id: "qwen/qwen3.6-27b",
    provider: "groq",
    pricing: {
      inputUsdPerMillionTokens: 0.6,
      outputUsdPerMillionTokens: 3.0,
    },
  },
  {
    id: "openai/gpt-oss-120b",
    provider: "groq",
    pricing: {
      inputUsdPerMillionTokens: 0.15,
      outputUsdPerMillionTokens: 0.6,
    },
  },
  {
    id: "openai/gpt-oss-20b",
    provider: "groq",
    pricing: {
      inputUsdPerMillionTokens: 0.075,
      outputUsdPerMillionTokens: 0.3,
    },
  },

  // OpenRouter — evergreen family aliases that always resolve to the
  // current version, so individual models can't go stale/decommissioned.
  {
    id: "~anthropic/claude-sonnet-latest",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 3.0,
      outputUsdPerMillionTokens: 15.0,
    },
  },
  {
    id: "google/gemini-2.5-flash",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 0.375,
      outputUsdPerMillionTokens: 1.875,
    },
  },

  // OpenRouter :free tier (verified Aug 2026, tool-capable per OpenRouter API)
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },
  {
    id: "z-ai/glm-5.2:free",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },
  {
    id: "thinkingmachines/inkling:free",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },
  {
    id: "google/gemma-4-31b-it:free",
    provider: "openrouter",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },

  // Vercel AI Gateway free tier (verified Aug 2026, tool-capable per
  // ai-gateway.vercel.sh/v1/models, pricing.input/output === "0")
  {
    id: "nvidia/nemotron-3.5-lightning-free",
    provider: "ai-gateway",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },
  {
    id: "poolside/laguna-s-2.1-free",
    provider: "ai-gateway",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
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
