"use client";

import { useProfile } from "@/hooks/queries/use-profile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { profile, isLoading, isError } = useProfile();

  useEffect(() => {
    if (!isLoading && (isError || !profile)) {
      router.replace("/auth/signin");
    }
  }, [isLoading, isError, profile, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
