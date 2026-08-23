"use client";

import { formatDate } from "@/lib/utils";
import { useArchiveSession } from "@/modules/chats/hooks/mutations/use-archive-session";
import { useUnarchiveSession } from "@/modules/chats/hooks/mutations/use-unarchive-session";
import { useDeleteSession } from "@/modules/chats/hooks/mutations/use-delete-session";
import { useUpdateTitle } from "@/modules/chats/hooks/mutations/use-update-title";
import { useConfirm } from "@/hooks/ui/use-confirm";
import { ChatRenameDialog } from "./chat-rename-dialog";
import type { ChatSession } from "@orra/types";
import { Button } from "@orra/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orra/ui/components/dropdown-menu";
import { Skeleton } from "@orra/ui/components/skeleton";
import { cn } from "@orra/ui/lib/utils";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import type { Route } from "next";
import { Spinner } from "@orra/ui/components/spinner";

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
}

export function ChatSessionItem({
  session,
  isActive,
  onSelect,
}: ChatSessionItemProps) {
  const router = useRouter();
  const params = useParams();
  const activeSessionId = params.sessionId as string | undefined;

  const [renameOpen, setRenameOpen] = useState(false);

  const [ConfirmDialog, confirm] = useConfirm();
  const archiveSession = useArchiveSession();
  const unarchiveSession = useUnarchiveSession();
  const deleteSession = useDeleteSession();
  const updateTitle = useUpdateTitle();

  const isArchived = session.archivedAt !== null;
  const isProcessing =
    archiveSession.isPending ||
    unarchiveSession.isPending ||
    deleteSession.isPending;

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isArchived) {
      unarchiveSession.mutate(
        { sessionId: session.id },
        {
          onSuccess: () => toast.success("Conversation unarchived"),
          onError: () => toast.error("Failed to unarchive"),
        },
      );
      return;
    }

    const confirmed = await confirm({
      title: "Archive conversation",
      message: `Are you sure you want to archive "${session.title}"?`,
      variant: "default",
      confirmLabel: "Archive",
      cancelLabel: "Cancel",
    });

    if (confirmed) {
      archiveSession.mutate(
        { sessionId: session.id },
        {
          onSuccess: () => toast.success("Conversation archived"),
          onError: () => toast.error("Failed to archive"),
        },
      );
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete conversation",
      message: `Are you sure you want to delete "${session.title}"? This action cannot be undone.`,
      variant: "destructive",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });

    if (!confirmed) return;

    deleteSession.mutate(
      { sessionId: session.id },
      {
        onSuccess: () => {
          toast.success("Conversation deleted");
          if (activeSessionId === session.id) {
            router.push("/dashboard/ai-chat" as Route);
          }
        },
        onError: () => toast.error("Failed to delete"),
      },
    );
  };

  const handleRename = (sessionId: string, title: string) => {
    updateTitle.mutate({ sessionId, title });
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 cursor-pointer transition-all duration-200",
          isActive
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium shadow-sm"
            : "hover:bg-muted/60 text-foreground",
          isProcessing && "opacity-50 pointer-events-none",
        )}
        onClick={() => !isProcessing && onSelect(session.id)}
      >
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-medium">{session.title}</p>
          <p
            className={cn(
              "truncate text-[10px]",
              isActive
                ? "text-violet-600/70 dark:text-violet-300/70"
                : "text-muted-foreground",
            )}
          >
            {session.contextType !== "general" && (
              <span className="capitalize">{session.contextType} &bull; </span>
            )}
            {formatDate(session.updatedAt)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-6 opacity-0 group-hover:opacity-100 transition-opacity",
                isActive && "opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Spinner className="size-3 " />
              ) : (
                <MoreVertical className="size-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 z-150">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setRenameOpen(true);
              }}
            >
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleArchiveToggle}
              disabled={archiveSession.isPending || unarchiveSession.isPending}
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 size-3.5" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="mr-2 size-3.5" />
                  Archive
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDeleteClick}
              disabled={deleteSession.isPending}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog />

      <ChatRenameDialog
        session={session}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onRename={handleRename}
        isPending={updateTitle.isPending}
      />
    </>
  );
}

export function ChatSessionItemSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5">
      <Skeleton className="size-3 rounded shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="size-6 rounded" />
    </div>
  );
}
