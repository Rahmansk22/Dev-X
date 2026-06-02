// Use the JS implementation directly to avoid Next.js trying to parse the package's .d.ts
// (Next 15/SWC currently trips over the library's types entrypoint).
// @ts-expect-error - Using require for rate-limiter-flexible to avoid type issues
import RateLimiterPrismaModule from "rate-limiter-flexible/lib/RateLimiterPrisma";
const RateLimiterPrisma = RateLimiterPrismaModule.default || RateLimiterPrismaModule;
import prisma from "./db";
import { auth } from "@clerk/nextjs/server";

const FREE_POINTS = 1000;
const PRO_POINTS = 5000;
const DURATION = 30 * 24 * 60 *60;  //30 days
const GENERATION_COST = 1;

export async function getUsageTracker() {

  const { userId } = await auth();
  let hasPremiumAccess = false;

  if (userId) {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });
    hasPremiumAccess = subscription?.status === "active";
  }

  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: hasPremiumAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });

  return usageTracker;
};

export async function consumeCredits () {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.consume(userId, GENERATION_COST);
  return result;
};

export async function getUsageStatus() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);        //getPoints(userId)
  return result;
}