import { DashboardHeader } from "@/components/dashboard-header";
import { SettingsSidebar } from "../components/settings-sidebar";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col p-10 pb-5">
      <div className="shrink-0">
        <DashboardHeader
          title="Settings"
          description="Manage preferences and configurations"
        />
      </div>

      <div
        className="sticky top-0 flex flex-row rounded-md overflow-hidden mt-5 bg-card"
        style={{ height: "calc(100vh - 6rem)" }}
      >
        <SettingsSidebar />

        <main className="flex-1 overflow-y-auto no-scrollbar px-5">
          {children}
        </main>
      </div>
    </div>
  );
}
