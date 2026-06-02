// Use the JS implementation directly to avoid Next.js trying to parse the package's .d.ts
// (Next 15/SWC currently trips over the library's types entrypoint).
// @ts-expect-error - Using require for rate-limiter-flexible to avoid type issues
import RateLimiterPrismaModule from "rate-limiter-flexible/lib/RateLimiterPrisma";
const RateLimiterPrisma = RateLimiterPrismaModule.default || RateLimiterPrismaModule;
import prisma from "./db";
import { auth } from "@clerk/nextjs/server";

const FREE_POINTS = 5;
const PRO_POINTS = 25;
const DURATION = 30 * 24 * 60 * 60;  // 30 days
const GENERATION_COST = 1;

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      console.warn(`[Database Retry] Attempt ${attempt} failed: ${err.message || String(err)}`);
      if (attempt >= retries) {
        throw err;
      }
      // Linear backoff: 1s, 2s, etc.
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error("Retry failed");
}

export async function getUsageTracker(providedUserId?: string) {
  let userId = providedUserId || process.env.MOCK_USER_ID;
  if (!userId) {
    try {
      userId = (await auth()).userId || undefined;
    } catch (err) {
      console.error("[UsageTracker] Failed to retrieve auth() userId:", err);
    }
  }

  let hasPremiumAccess = false;

  if (userId) {
    try {
      const subscription = await withRetry(async () => 
        await prisma.userSubscription.findUnique({
          where: { userId: userId! },
        })
      );
      hasPremiumAccess = subscription?.status === "active";
    } catch (err) {
      console.error("[UsageTracker] Failed to fetch subscription after retries:", err);
    }
  }

  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "usage",
    points: hasPremiumAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });

  return usageTracker;
}

export async function consumeCredits(providedUserId?: string) {
  let userId = providedUserId || process.env.MOCK_USER_ID;
  if (!userId) {
    try {
      userId = (await auth()).userId || undefined;
    } catch (err) {
      console.error("[consumeCredits] Failed to retrieve auth() userId:", err);
    }
  }

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const usageTracker = await getUsageTracker(userId);
  const result = await withRetry(async () => 
    await usageTracker.consume(userId!, GENERATION_COST)
  );
  return result;
}

export async function getUsageStatus(providedUserId?: string) {
  let userId = providedUserId || process.env.MOCK_USER_ID;
  if (!userId) {
    try {
      userId = (await auth()).userId || undefined;
    } catch (err) {
      console.error("[getUsageStatus] Failed to retrieve auth() userId:", err);
    }
  }

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const usageTracker = await getUsageTracker(userId);
  const result = await withRetry(async () => 
    await usageTracker.get(userId!)
  );
  return result;
}