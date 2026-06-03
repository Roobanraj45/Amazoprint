'use server';

import { db } from '@/db';
import { printerSubscriptionPlans, printerSubscriptions, printPressUsers } from '@/db/schema';
import { and, eq, desc, count, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to verify Admin session
async function verifyAdminSession() {
  const session = await getSession();
  const adminRoles = ['admin', 'super_admin', 'company_admin'];
  if (!session?.sub || !adminRoles.includes(session.role)) {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

// Helper to verify Printer session
async function verifyPrinterSession() {
  const session = await getSession();
  if (!session?.sub || session.role !== 'printer') {
    throw new Error('Unauthorized: Printer access required');
  }
  return session;
}

/**
 * Creates a subscription plan (Admin only)
 */
export async function createSubscriptionPlan(data: {
  name: string;
  price: string;
  durationType: 'monthly' | 'yearly' | 'lifetime';
  description?: string;
  features?: string[];
}) {
  await verifyAdminSession();

  const [newPlan] = await db.insert(printerSubscriptionPlans)
    .values({
      name: data.name,
      price: data.price,
      durationType: data.durationType,
      description: data.description || null,
      features: data.features || [],
      isActive: true,
    })
    .returning();

  revalidatePath('/admin/printers/subscriptions');
  revalidatePath('/printer/subscriptions');
  return newPlan;
}

/**
 * Toggles subscription plan active status (Admin only)
 */
export async function toggleSubscriptionPlan(planId: number, isActive: boolean) {
  await verifyAdminSession();

  const [updatedPlan] = await db.update(printerSubscriptionPlans)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(printerSubscriptionPlans.id, planId))
    .returning();

  revalidatePath('/admin/printers/subscriptions');
  revalidatePath('/printer/subscriptions');
  return updatedPlan;
}

/**
 * Updates a subscription plan (Admin only)
 */
export async function updateSubscriptionPlan(
  planId: number,
  data: {
    name: string;
    price: string;
    durationType: 'monthly' | 'yearly' | 'lifetime';
    description?: string;
    features?: string[];
  }
) {
  await verifyAdminSession();

  const [updatedPlan] = await db.update(printerSubscriptionPlans)
    .set({
      name: data.name,
      price: data.price,
      durationType: data.durationType,
      description: data.description || null,
      features: data.features || [],
      updatedAt: new Date(),
    })
    .where(eq(printerSubscriptionPlans.id, planId))
    .returning();

  revalidatePath('/admin/printers/subscriptions');
  revalidatePath('/printer/subscriptions');
  return updatedPlan;
}

/**
 * Deletes a subscription plan (Admin only)
 */
export async function deleteSubscriptionPlan(planId: number) {
  await verifyAdminSession();

  // First delete associated subscriptions to avoid foreign key violations
  await db.delete(printerSubscriptions).where(eq(printerSubscriptions.planId, planId));

  const [deletedPlan] = await db.delete(printerSubscriptionPlans)
    .where(eq(printerSubscriptionPlans.id, planId))
    .returning();

  revalidatePath('/admin/printers/subscriptions');
  revalidatePath('/printer/subscriptions');
  return deletedPlan;
}

/**
 * Retrieves all active subscription plans
 */
export async function getSubscriptionPlans(includeInactive = false) {
  if (includeInactive) {
    return await db.query.printerSubscriptionPlans.findMany({
      orderBy: [desc(printerSubscriptionPlans.createdAt)],
    });
  }

  return await db.query.printerSubscriptionPlans.findMany({
    where: eq(printerSubscriptionPlans.isActive, true),
    orderBy: [desc(printerSubscriptionPlans.createdAt)],
  });
}

/**
 * Enrolls a printer into a plan (mock checkout simulator)
 */
export async function subscribePrinter(planId: number, paymentId: string) {
  const session = await verifyPrinterSession();
  const printerId = session.sub;

  // Retrieve plan
  const plan = await db.query.printerSubscriptionPlans.findFirst({
    where: eq(printerSubscriptionPlans.id, planId),
  });

  if (!plan || !plan.isActive) {
    throw new Error('Plan not found or inactive');
  }

  // Check if they already have an active subscription
  const existingActive = await db.query.printerSubscriptions.findFirst({
    where: and(
      eq(printerSubscriptions.printerId, printerId),
      eq(printerSubscriptions.status, 'active')
    )
  });

  if (existingActive) {
    throw new Error('You already have an active premium subscription');
  }

  // Calculate start & end dates
  const startDate = new Date();
  let endDate: Date | null = null;

  if (plan.durationType === 'monthly') {
    endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan.durationType === 'yearly') {
    endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
  } // 'lifetime' stays null

  // Insert new subscription
  const [newSubscription] = await db.insert(printerSubscriptions)
    .values({
      printerId,
      planId,
      status: 'active',
      startDate,
      endDate,
      paymentStatus: 'paid',
      paymentId: paymentId || `MOCK-PAY-${Date.now()}`,
    })
    .returning();

  revalidatePath('/printer/subscriptions');
  revalidatePath('/admin/printers/subscriptions');
  return newSubscription;
}

/**
 * Retrieves the currently active subscription for the logged-in printer
 */
export async function getActivePrinterSubscription() {
  const session = await verifyPrinterSession();
  const printerId = session.sub;

  const activeSubscription = await db.query.printerSubscriptions.findFirst({
    where: and(
      eq(printerSubscriptions.printerId, printerId),
      eq(printerSubscriptions.status, 'active')
    ),
    with: {
      plan: true,
    },
  });

  // Double check if subscription has expired due to time passing
  if (activeSubscription && activeSubscription.endDate) {
    const now = new Date();
    if (now > new Date(activeSubscription.endDate)) {
      // Mark it as expired in the database
      await db.update(printerSubscriptions)
        .set({
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(printerSubscriptions.id, activeSubscription.id));

      revalidatePath('/printer/subscriptions');
      return null;
    }
  }

  return activeSubscription;
}

/**
 * Retrieves the subscription history for the logged-in printer
 */
export async function getPrinterSubscriptionHistory() {
  const session = await verifyPrinterSession();
  const printerId = session.sub;

  return await db.query.printerSubscriptions.findMany({
    where: eq(printerSubscriptions.printerId, printerId),
    with: {
      plan: true,
    },
    orderBy: [desc(printerSubscriptions.createdAt)],
  });
}

/**
 * Retrieves all subscriptions with plan and printer details (Admin only)
 */
export async function getAdminSubscriptions() {
  await verifyAdminSession();

  return await db.query.printerSubscriptions.findMany({
    with: {
      plan: true,
      printer: true,
    },
    orderBy: [desc(printerSubscriptions.createdAt)],
  });
}

/**
 * Retrieves aggregated report statistics for Admin (Admin only)
 */
export async function getAdminSubscriptionsReport() {
  await verifyAdminSession();

  const totalActiveResult = await db
    .select({ count: count() })
    .from(printerSubscriptions)
    .where(eq(printerSubscriptions.status, 'active'));

  const planBreakdown = await db
    .select({
      planName: printerSubscriptionPlans.name,
      durationType: printerSubscriptionPlans.durationType,
      count: count(printerSubscriptions.id),
      totalRevenue: sql<string>`COALESCE(SUM(CAST(${printerSubscriptionPlans.price} AS NUMERIC)), 0)::TEXT`,
    })
    .from(printerSubscriptions)
    .innerJoin(printerSubscriptionPlans, eq(printerSubscriptions.planId, printerSubscriptionPlans.id))
    .where(eq(printerSubscriptions.status, 'active'))
    .groupBy(printerSubscriptionPlans.name, printerSubscriptionPlans.durationType);

  return {
    activeSubscribersCount: totalActiveResult[0]?.count || 0,
    planBreakdown,
  };
}

/**
 * Cancels the currently active subscription for the printer
 */
export async function cancelActiveSubscription() {
  const session = await verifyPrinterSession();
  const printerId = session.sub;

  const activeSub = await db.query.printerSubscriptions.findFirst({
    where: and(
      eq(printerSubscriptions.printerId, printerId),
      eq(printerSubscriptions.status, 'active')
    )
  });

  if (!activeSub) {
    throw new Error('No active subscription found');
  }

  const [updatedSub] = await db.update(printerSubscriptions)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(printerSubscriptions.id, activeSub.id))
    .returning();

  revalidatePath('/printer/subscriptions');
  revalidatePath('/admin/printers/subscriptions');
  return updatedSub;
}
