import AuthenticationLayout from "@/modules/auth/layouts/authentication-layout";
import { AlreadyAuthGuard } from "@/modules/auth/ui/components/already-auth-guard";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthenticationLayout>
      <AlreadyAuthGuard>{children}</AlreadyAuthGuard>
    </AuthenticationLayout>
  );
};

export default Layout;
