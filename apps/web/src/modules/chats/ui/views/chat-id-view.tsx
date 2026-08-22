import { ChatConversationArea } from "../components/chat-conversation-area";
import type { SupportedChatModelId, ToolMode } from "@orra/types";

interface Props {
  sessionId: string;
  initialMessage?: string;
  initialMode?: ToolMode;
  initialModel?: string;
}

export const ChatIdView = ({
  sessionId,
  initialMessage,
  initialMode,
  initialModel,
}: Props) => {
  return (
    <div className="flex w-full flex-col h-full">
      <ChatConversationArea
        sessionId={sessionId}
        initialMessage={initialMessage}
        initialMode={initialMode}
        initialModel={initialModel as SupportedChatModelId | undefined}
      />
    </div>
  );
};
