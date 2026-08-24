"use client";

import { ChevronUp, CreditCard, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Show } from "@/components/show";
import { useProfile } from "@/hooks/queries/use-profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@orra/ui/components/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@orra/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orra/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@orra/ui/components/sidebar";
import { Skeleton } from "@orra/ui/components/skeleton";
import { Spinner } from "@orra/ui/components/spinner";
import { cn } from "@orra/ui/lib/utils";
import { useSignOut } from "@/modules/auth/hooks/mutations/use-sign-out";

/**
 * Mirrors the real trigger's geometry (SidebarMenuButton size="lg" ->
 * h-14 px-3; collapsed -> size-8 p-0) so nothing shifts when the profile
 * query resolves.
 */
function DashboardUserButtonSkeleton() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          aria-hidden
          className={cn(
            "flex w-full items-center gap-2 rounded-lg bg-secondary/50",
            collapsed ? "size-8 justify-center p-0" : "h-14 px-3 py-2",
          )}
        >
          <Skeleton className="size-8 shrink-0 rounded-full" />
          {!collapsed && (
            <>
              <div className="grid flex-1 gap-1.5 text-left">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
              <Skeleton className="ml-auto size-4 shrink-0 rounded-sm" />
            </>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function DashboardUserButton() {
  const signOut = useSignOut();
  const { state } = useSidebar();
  const router = useRouter();
  const [logoutState, setLogoutState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return <DashboardUserButtonSkeleton />;
  }

  const { name, email, image } = profile ?? {};

  const handleLogout = async () => {
    setLogoutState("loading");
    setShowLogoutDialog(false);

    signOut.mutate(undefined, {
      onSuccess: () => {
        setLogoutState("idle");
        router.push("/auth/signin");
      },
      onError: () => {
        setLogoutState("error");
        toast.error("Failed to sign out. Please try again.");
      },
    });
  };

  const AvatarTrigger = (
    <>
      <Show
        when={logoutState === "loading"}
        fallback={
          <Avatar className="size-8 rounded-full items-center justify-center shrink-0 flex">
            <AvatarImage src={image ?? undefined} alt={name} />
            <AvatarFallback className="text-md bg-primary text-white">
              {name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        }
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-chart-3">
          <Spinner className="h-4 w-4  text-white" />
        </div>
      </Show>
    </>
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                disabled={logoutState === "loading"}
                className={cn(
                  "h-auto gap-2 rounded-lg bg-secondary/50",
                  "hover:bg-secondary/30",
                  "cursor-pointer",
                  state === "collapsed" && "justify-center px-0",
                )}
              >
                {AvatarTrigger}
                {state === "expanded" && (
                  <>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium text-foreground">
                        {name}
                      </span>
                      <span className="truncate text-xs text-[#8B88A0]">
                        {email}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4 text-[#8B88A0]" />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 ml-2 font-sans"
              side="right"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {name}
                </p>
                <p className="truncate text-xs text-[#8B88A0]">{email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-secondary" />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/dashboard/settings")}
              >
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/dashboard/settings/billing")}
              >
                <CreditCard className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                disabled={logoutState === "loading"}
                variant="destructive"
                className="cursor-pointer"
              >
                <LogOut className="mr-2 size-4" />
                {logoutState === "loading" ? "Signing out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent size="sm" className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account? You will need
              to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              disabled={logoutState === "loading"}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={logoutState === "loading"}
              variant="destructive"
            >
              {logoutState === "loading" ? (
                <Spinner className="mr-2 h-4 w-4 " />
              ) : null}
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
