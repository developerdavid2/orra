import { DashboardLayout } from "@/modules/dashboard/ui/layouts/dashboard-layout";
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <AuthGuard>{children}</AuthGuard>
    </DashboardLayout>
  );
}
