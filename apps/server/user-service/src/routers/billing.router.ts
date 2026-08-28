import { protectedProcedure, router } from "@orra/config/trpc";
import { TRPCError } from "@trpc/server";
import { BillingService } from "../services/billing.service";

function toTRError(result: { error: string; code?: string }): TRPCError {
  return new TRPCError({
    code: result.code === "BAD_REQUEST" ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
    message: result.error,
  });
}

export const billingRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const result = await BillingService.status(ctx.session.user.id);
    if (!result.success) {
      throw toTRError(result);
    }
    return result.data;
  }),

  plans: protectedProcedure.query(async () => {
    const result = await BillingService.plans();
    if (!result.success) {
      throw toTRError(result);
    }
    return result.data;
  }),
});