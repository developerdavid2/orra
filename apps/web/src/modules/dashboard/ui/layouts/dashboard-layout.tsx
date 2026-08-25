import React from "react";
import { SidebarProvider } from "@orra/ui/components/sidebar";
import { DashboardSidebar } from "../components/dashboard-sidebar";
import DashboardNavbar from "../components/dashboard-navbar";
import { NotificationStreamProvider } from "@/components/notification-stream-provider";

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <NotificationStreamProvider />
      <DashboardSidebar />
      <div className="flex w-full flex-1 flex-col">
        <DashboardNavbar />
        <main className="flex flex-1 flex-col pt-14">{children}</main>
      </div>
    </SidebarProvider>
  );
};
