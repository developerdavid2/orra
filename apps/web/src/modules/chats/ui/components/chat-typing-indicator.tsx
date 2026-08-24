import { Avatar, AvatarFallback } from "@orra/ui/components/avatar";
import { Bot } from "lucide-react";

export function ChatTypingIndicator() {
  return (
    <div className="flex gap-3 flex-row">
      <Avatar className="size-8 shrink-0 bg-muted">
        <AvatarFallback>
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1">
        <span className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
        <span className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
        <span className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
