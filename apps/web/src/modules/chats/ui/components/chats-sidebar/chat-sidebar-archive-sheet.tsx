"use client";

import { SectionBoundary } from "@/components/section-boundary";
import { CHAT_SESSIONS_LIMIT } from "@/modules/chats/constants";
import { useUnarchiveSession } from "@/modules/chats/hooks/mutations/use-unarchive-session";
import { useSessions } from "@/modules/chats/hooks/queries/use-sessions";
import { Button } from "@orra/ui/components/button";
import { Sheet, SheetContent, SheetTitle } from "@orra/ui/components/sheet";
import { Archive, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ChatSessionList, ChatSessionListSkeleton } from "../chat-session-list";
import { useChatSidebarActions } from "@/modules/chats/hooks/use-chat-sidebar-actions";

interface ChatSidebarArchiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatSidebarArchiveSheet({
  open,
  onOpenChange,
}: ChatSidebarArchiveSheetProps) {
  const { handleSelectSession } = useChatSidebarActions();

  const {
    sessions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useSessions({
    includeArchived: true,
    limit: CHAT_SESSIONS_LIMIT,
  });

  const archivedSessions = sessions.filter((s) => s.archivedAt !== null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[320px] md:max-w-100 p-0 flex flex-col h-full border-l bg-sidebar"
      >
        <SheetTitle className="sr-only">Archived chats</SheetTitle>
        {/* Header with back button */}
        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 -ml-2"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Archived chats</h2>
          </div>
          {archivedSessions.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {archivedSessions.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          <SectionBoundary
            fallback={<ChatSessionListSkeleton />}
            errorMessage="Could not load archived conversations"
          >
            {isRefetching && archivedSessions.length === 0 ? (
              <ChatSessionListSkeleton />
            ) : archivedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <Archive className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No archived conversations
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Archived chats will appear here
                </p>
              </div>
            ) : (
              <ChatSessionList
                sessions={archivedSessions}
                onSelect={handleSelectSession}
                hasNextPage={hasNextPage ?? false}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            )}
          </SectionBoundary>
        </div>
      </SheetContent>
    </Sheet>
  );
}
