import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  findSupportedChatModel,
  type SupportedChatModel,
  type SupportedChatModelId,
  type SupportedProvider,
} from "@orra/types";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type { LanguageModel } from "ai";

type GroqModelId = Extract<SupportedChatModel, { provider: "groq" }>["id"];
type OpenRouterModelId = Extract<
  SupportedChatModel,
  { provider: "openrouter" }
>["id"];
type AiGatewayModelId = Extract<
  SupportedChatModel,
  { provider: "ai-gateway" }
>["id"];

export type ResolvedModel = {
  model: LanguageModel;
  provider: SupportedProvider;
  modelId: SupportedChatModelId;
  providerOptions?: ProviderOptions;
};

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" });
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});
const aiGateway = createOpenAICompatible({
  name: "ai-gateway",
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  baseURL: process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1",
});

function assertUnsupportedProvider(provider: never): never {
  throw new Error(`Unsupported provider: ${provider}`);
}

function resolveGroqModel(modelId: GroqModelId): ResolvedModel {
  return { model: groq.languageModel(modelId), provider: "groq", modelId };
}

function resolveOpenRouterModel(modelId: OpenRouterModelId): ResolvedModel {
  return { model: openrouter(modelId), provider: "openrouter", modelId };
}

function resolveAiGatewayModel(modelId: AiGatewayModelId): ResolvedModel {
  return {
    model: aiGateway(modelId) as any,
    provider: "ai-gateway",
    modelId,
  };
}

function resolveSupportedChatModel(model: SupportedChatModel): ResolvedModel {
  const provider = model.provider;
  switch (model.provider) {
    case "groq":
      return resolveGroqModel(model.id);
    case "openrouter":
      return resolveOpenRouterModel(model.id);
    case "ai-gateway":
      return resolveAiGatewayModel(model.id);
    default:
      return assertUnsupportedProvider(provider as never);
  }
}

export function isSupportedChatModel(
  modelId: string,
): modelId is SupportedChatModelId {
  return findSupportedChatModel(modelId) != null;
}

export function getModelById(modelId: string): ResolvedModel {
  const model = findSupportedChatModel(modelId);
  if (!model) throw new Error(`Unsupported model: ${modelId}`);
  return resolveSupportedChatModel(model);
}
