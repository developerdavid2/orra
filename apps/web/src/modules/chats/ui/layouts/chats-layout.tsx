import { ChatsSidebarPanel } from "../components/chats-sidebar/chats-sidebar-panel";
import { ChatsSidebarResizable } from "../components/chats-sidebar/chats-sidebar-resizeable";

export const ChatsLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <ChatsSidebarResizable sidebar={<ChatsSidebarPanel/>}>
        {children}
      </ChatsSidebarResizable>
    </div>
  );
};
