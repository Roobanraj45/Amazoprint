// Updated to force re-registration of server actions
'use server';

// Server actions for handling payments with Razorpay.

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createOrder } from './order-actions';
import { placeDirectOrder } from './direct-selling-actions';
import { createContest } from './contest-actions';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayOrder(amount: number, orderType: string, orderData: any) {
  const session = await getSession();
  if (!session?.sub) {
    throw new Error('User not authenticated for payment creation.');
  }

  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: 'INR',
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);

    // Create payment record in our DB before sending user to Razorpay
    const [paymentRecord] = await db.insert(payments).values({
      userId: session.sub,
      amount: String(amount),
      currency: 'INR',
      status: 'created',
      provider: 'razorpay',
      providerOrderId: razorpayOrder.id,
      metadata: { orderType, ...orderData }
    }).returning({ id: payments.id });

    if (!paymentRecord) {
        throw new Error("Failed to create a payment record.");
    }

    return { success: true, order: razorpayOrder, paymentRecordId: paymentRecord.id };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return { success: false, error: 'Could not create Razorpay order.' };
  }
}

export async function captureAndVerifyPayment(data: {
    paymentRecordId: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderType: 'design' | 'direct' | 'contest';
    orderData: any;
}) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('User not authenticated for payment verification.');
    }

    const { paymentRecordId, razorpay_order_id, razorpay_payment_id, razorpay_signature, orderType, orderData } = data;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        await db.update(payments)
            .set({ status: 'failed', updatedAt: new Date() })
            .where(eq(payments.id, paymentRecordId));
        throw new Error("Payment verification failed.");
    }

    // Payment is verified, update payment record
    const [updatedPaymentRecord] = await db.update(payments).set({
        status: 'captured',
        providerPaymentId: razorpay_payment_id,
        providerSignature: razorpay_signature,
        updatedAt: new Date(),
    }).where(eq(payments.id, paymentRecordId)).returning();
    
    if (!updatedPaymentRecord) {
        throw new Error('Failed to find and update payment record.');
    }

    try {
        if (orderType === 'design') {
            await createOrder({ ...orderData.orderData, paymentId: paymentRecordId });
        } else if (orderType === 'direct') {
            await placeDirectOrder(orderData.items, orderData.shippingAddress, paymentRecordId);
        } else if (orderType === 'contest') {
            const newContest = await createContest(orderData.contestData);
            await db.update(payments)
                .set({ contestId: newContest.id })
                .where(eq(payments.id, paymentRecordId));
        } else {
            throw new Error("Invalid order type");
        }
        return { success: true };
    } catch (error: any) {
        await db.update(payments)
            .set({ status: 'failed', metadata: { ...updatedPaymentRecord.metadata, error: error.message } })
            .where(eq(payments.id, paymentRecordId));
             console.error("Order creation after payment failed:", error);
             return { success: false, error: error.message || "Failed to save order after payment." };
    }
}
