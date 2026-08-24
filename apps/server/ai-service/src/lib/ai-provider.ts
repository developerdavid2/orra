import { createGateway } from "@ai-sdk/gateway";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  DEFAULT_CHAT_MODEL_ID,
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
const vercelGateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
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
  return { model: vercelGateway(modelId), provider: "ai-gateway", modelId };
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
  if (!model) {
    // Stale ids happen when providers decommission models (e.g. Groq shut
    // down llama-3.3-70b-versatile on 08/16/26) and old clients still send
    // them. Fall back instead of failing the stream.
    console.warn(
      `[ai-provider] Unsupported model "${modelId}", falling back to ${DEFAULT_CHAT_MODEL_ID}`,
    );
    return resolveSupportedChatModel(findSupportedChatModel(DEFAULT_CHAT_MODEL_ID)!);
  }
  return resolveSupportedChatModel(model);
}
