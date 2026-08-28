"use client";

import { useSubscription } from "@trpc/tanstack-react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/trpc-client";
import { useEffect } from "react";

export function useNotificationStream() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const subscription = useSubscription(
    trpc.notifications.appNotifications.onNew.subscriptionOptions(undefined, {
      onData: (envelope) => {
        const notification = envelope.data.notification;
        window.dispatchEvent(
          new CustomEvent("inapp-notification", { detail: notification }),
        );
        queryClient.invalidateQueries(
          trpc.notifications.appNotifications.list.pathFilter(),
        );
        queryClient.invalidateQueries(
          trpc.notifications.appNotifications.unreadCount.pathFilter(),
        );
      },
      onError: (err) => console.error("[notification subscription]", err),
      onStarted: () => console.log("[notification subscription] started"),
    }),
  );

  // useEffect(() => {
  //   console.log("[notification subscription] status:", subscription.status);
  // }, [subscription.status]);

  return subscription;
}
