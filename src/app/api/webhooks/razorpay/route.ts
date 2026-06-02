import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      let notes;
      let orderId;
      
      if (event.event === 'order.paid') {
        notes = event.payload.order.entity.notes;
        orderId = event.payload.order.entity.id;
      } else {
        notes = event.payload.payment.entity.notes;
        orderId = event.payload.payment.entity.order_id;
      }

      if (notes && notes.userId) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        await prisma.userSubscription.upsert({
          where: { userId: notes.userId },
          update: {
            status: 'active',
            planId: notes.planId,
            razorpayOrderId: orderId,
            currentPeriodEnd: thirtyDaysFromNow,
          },
          create: {
            userId: notes.userId,
            status: 'active',
            planId: notes.planId,
            razorpayOrderId: orderId,
            currentPeriodEnd: thirtyDaysFromNow,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}