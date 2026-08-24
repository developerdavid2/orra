import type { ChatMode } from "@/modules/chats/hooks/use-ai-chat";
import { NewChatContent } from "@/modules/chats/ui/components/new-chat-content";

interface PageProps {
  searchParams: Promise<{
    initialMessage?: string;
    mode?: string;
    model?: string;
  }>;
}

export default async function NewChatPage({ searchParams }: PageProps) {
  const { initialMessage = "", mode: rawMode, model = "" } = await searchParams;
  const mode: ChatMode = rawMode === "act" ? "act" : "plan";

  return (
    <NewChatContent initialMessage={initialMessage} mode={mode} model={model} />
  );
}
