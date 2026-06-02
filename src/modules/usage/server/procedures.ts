import { getUsageStatus } from "@/lib/usage";
import { createTRPCRouter, protectedProcedure, Context } from "@/trpc/init";

export const usageRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }: { ctx: Context }) => {
    try {
      const result = await getUsageStatus(ctx.auth.userId || undefined);
      return result;
    } catch {
      return null;
    }
  })
});

