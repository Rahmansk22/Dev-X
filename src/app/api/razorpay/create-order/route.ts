import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const { planId } = await req.json();

    // Determine amount based on planId 
    let amount = 0;
    if (planId === 'starter') amount = 1900; 
    if (planId === 'growth') amount = 4900; 
    if (planId === 'scale') amount = 14900; 

    if (amount === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const options = {
      amount: amount, 
      currency: "USD",
      // Razorpay receipt length max is 40 chars. userId is often > 30 chars, so we hash it or shorten it.
      receipt: `rcpt_${userId.substring(0, 10)}_${Date.now()}`.substring(0, 40),
      notes: {
        userId,
        planId
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}