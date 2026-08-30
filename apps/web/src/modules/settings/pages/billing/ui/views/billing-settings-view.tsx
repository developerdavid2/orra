import { DashboardHeader } from "@/components/dashboard-header";
import { SectionBoundary } from "@/components/section-boundary";
import { BillingSettingsContent } from "../components/billing-settings-content";
import { BillingSettingsSkeleton } from "../components/billing-settings-skeleton";

export function BillingSettingsView() {
  return (
    <div className="flex flex-col gap-6 p-10">
      <DashboardHeader
        title="Billing"
        description="Manage your plan, AI query usage, and invoices"
      />

      <SectionBoundary
        fallback={<BillingSettingsSkeleton />}
        errorMessage="Could not load billing settings"
      >
        <BillingSettingsContent />
      </SectionBoundary>
    </div>
  );
}