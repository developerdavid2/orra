import Orb from "@orra/ui/components/react-bits/orb";
import { NewChatConversationArea } from "../components/new-chat-conversation-area";

export const ChatsView = () => {
  return (
    <div className="flex w-full max-w-3xl mx-auto flex-col items-center justify-center gap-6 px-4 h-full">
      <div className="flex items-center justify-between w-full">
        <div className="space-y-2 flex flex-col">
          <h1 className="text-3xl font-semibold">Hi, good to see you!</h1>
          <h1 className="text-3xl font-semibold text-primary">
            What can I help you with?
          </h1>
        </div>

        <div className="top-[40%] z-10 aspect-square w-10 md:w-30">
          <Orb
            hue={0}
            hoverIntensity={0.12}
            rotateOnHover={true}
            forceHoverState={false}
            backgroundColor="#0B0B13"
          />
        </div>
      </div>
      <NewChatConversationArea />
    </div>
  );
};
