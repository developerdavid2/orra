"use client";

import { useProfile } from "@/hooks/queries/use-profile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AlreadyAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace("/dashboard");
    }
  }, [isLoading, profile, router]);

  if (isLoading || profile) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
