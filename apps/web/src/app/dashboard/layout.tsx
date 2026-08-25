import { requireAuth } from "@/lib/auth-server";
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";
import { DashboardLayout } from "@/modules/dashboard/ui/layouts/dashboard-layout";


const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth();

  return (
    <DashboardLayout>
      <AuthGuard>{children}</AuthGuard>
    </DashboardLayout>
  );
};

export default Layout;
