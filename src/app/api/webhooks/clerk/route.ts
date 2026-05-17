import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

const BILLING_EVENTS = [
  "billing.subscription.created",
  "billing.subscription.updated",
  "billing.subscription.active",
  "billing.subscription.past_due",
  "billing.subscription.canceled",
  "billing.payment.succeeded",
  "billing.payment.failed",
] as const;

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (BILLING_EVENTS.includes(evt.type as (typeof BILLING_EVENTS)[number])) {
      // TODO: Persist event details to DB/analytics once billing audit tables are added.
      console.log("[clerk-webhook] Billing event", {
        id: evt.data?.id,
        type: evt.type,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[clerk-webhook] Signature verification failed", error);
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 400 });
  }
}
