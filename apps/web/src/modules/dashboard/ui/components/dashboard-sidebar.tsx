"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@orra/ui/components/sidebar";
import { cn } from "@orra/ui/lib/utils";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "../../constants";
import { DashboardUserButton } from "./dashboard-user-button";
import { Logo } from "@/components/logo";

function NavItemContent({
  icon: Icon,
  title,
  active,
}: {
  icon: React.ElementType;
  title: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <Icon
        className={cn(
          "size-4 shrink-0 transition-opacity",
          active ? "text-main" : "text-[#8B88A0]",
          pending && "animate-pulse",
        )}
      />
      <span className={cn("transition-opacity", pending && "opacity-60")}>
        {title}
      </span>
    </>
  );
}

export const DashboardSidebar = () => {
  const pathname = usePathname();

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="bg-sidebar font-sans">
      {/* ── Logo ── */}
      <SidebarHeader className="border-b border-border px-2 py-3">
        <Logo
          size={28}
          href="/dashboard"
          lightSrc="https://eqr61bekec.ufs.sh/f/sH4weU3V69zXXnnMPIifkPbws3hnSHtBAq6jeKT2Fr7GvEda"
        />
      </SidebarHeader>

      {/* ── Nav groups ── */}
      <SidebarContent className="px-2 py-3">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-4 p-0">
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#8B88A0]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-y-2">
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={active}
                        className={cn(
                          "rounded-md!",
                          active && [
                            "bg-background! font-bold! text-main!",
                            "border-l-2 border-yellow-500/80 dark:border-yellow-300/80",
                            "pl-1.25", // compensate for the 3px border
                            "hover:bg-[rgba(124,58,237,0.20)]",
                          ],
                        )}
                      >
                        <Link href={item.url}>
                          <NavItemContent
                            icon={item.icon}
                            title={item.title}
                            active={active}
                          />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── User footer ── */}
      <SidebarFooter className="border-t border-border px-2 py-2">
        <DashboardUserButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
