'use server';

import { db } from '@/db';
import { orders, payments, contests, contestParticipants, contestWinners, designVerifications, users } from '@/db/schema';
import { and, eq, gte, lte, count, sum, avg, countDistinct, sql, isNull, isNotNull } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const adminRoles = ['admin', 'super_admin', 'company_admin'];

async function verifyAdmin() {
    const session = await getSession();
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }
}

function buildDateConditions(table: any, startDate?: string, endDate?: string) {
    const conditions = [];
    if (startDate) {
        const s = new Date(startDate); s.setHours(0, 0, 0, 0);
        conditions.push(gte(table.createdAt, s));
    }
    if (endDate) {
        const e = new Date(endDate); e.setHours(23, 59, 59, 999);
        conditions.push(lte(table.createdAt, e));
    }
    return conditions;
}

// ─────────────────────────────────────────────────────────────
// 1. REVENUE REPORT
// ─────────────────────────────────────────────────────────────
export async function getRevenueReport({
    startDate = '',
    endDate = '',
    orderStatus = 'all',
    paymentMethod = 'all',
}: {
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
    paymentMethod?: string;
} = {}) {
    await verifyAdmin();

    const orderConds = [...buildDateConditions(orders, startDate, endDate)];
    if (orderStatus !== 'all') orderConds.push(eq(orders.orderStatus, orderStatus));
    if (paymentMethod !== 'all') orderConds.push(eq(orders.paymentMethod, paymentMethod));

    const paymentConds = [...buildDateConditions(payments, startDate, endDate)];

    const [totalOrderRevenue] = await db.select({
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
        count: count(),
    }).from(orders).where(and(...orderConds, eq(orders.paymentStatus, 'paid')));

    const [contestOrderRevenue] = await db.select({
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
        count: count(),
    }).from(orders).where(and(...orderConds, isNotNull(orders.contestId), eq(orders.paymentStatus, 'paid')));

    const [regularOrderRevenue] = await db.select({
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
        count: count(),
    }).from(orders).where(and(...orderConds, isNull(orders.contestId), eq(orders.paymentStatus, 'paid')));

    const [capturedPayments] = await db.select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count(),
    }).from(payments).where(and(...paymentConds, eq(payments.status, 'captured')));

    const [contestPayments] = await db.select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count(),
    }).from(payments).where(and(...paymentConds, eq(payments.status, 'captured'), isNotNull(payments.contestId)));

    const [failedPayments] = await db.select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count(),
    }).from(payments).where(and(...paymentConds, eq(payments.status, 'failed')));

    const [refundedPayments] = await db.select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count(),
    }).from(payments).where(and(...paymentConds, eq(payments.status, 'refunded')));

    const orderStatusBreakdown = await db.select({
        status: orders.orderStatus,
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds)).groupBy(orders.orderStatus);

    const paymentMethodBreakdown = await db.select({
        method: orders.paymentMethod,
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds, eq(orders.paymentStatus, 'paid'))).groupBy(orders.paymentMethod);

    return {
        totalOrderRevenue: { total: Number(totalOrderRevenue.total), count: totalOrderRevenue.count },
        contestOrderRevenue: { total: Number(contestOrderRevenue.total), count: contestOrderRevenue.count },
        regularOrderRevenue: { total: Number(regularOrderRevenue.total), count: regularOrderRevenue.count },
        capturedPayments: { total: Number(capturedPayments.total), count: capturedPayments.count },
        contestPayments: { total: Number(contestPayments.total), count: contestPayments.count },
        failedPayments: { total: Number(failedPayments.total), count: failedPayments.count },
        refundedPayments: { total: Number(refundedPayments.total), count: refundedPayments.count },
        orderStatusBreakdown,
        paymentMethodBreakdown,
        // Reconciliation: captured payments should equal total order revenue
        reconciliation: {
            orderRevenue: Number(totalOrderRevenue.total),
            paymentsCollected: Number(capturedPayments.total),
            // diff: positive = uncollected, negative = over-collected
            diff: Number(capturedPayments.total) - Number(totalOrderRevenue.total),
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 2. CONTEST REPORT
// ─────────────────────────────────────────────────────────────
export async function getContestReport({
    startDate = '',
    endDate = '',
    status = 'all',
}: {
    startDate?: string;
    endDate?: string;
    status?: string;
} = {}) {
    await verifyAdmin();

    const contestConds = [...buildDateConditions(contests, startDate, endDate)];
    if (status !== 'all') contestConds.push(eq(contests.status, status));

    const paymentConds = [...buildDateConditions(payments, startDate, endDate)];

    const [totalContests] = await db.select({ count: count() }).from(contests).where(and(...contestConds));

    const statusBreakdown = await db.select({
        status: contests.status,
        count: count(),
        totalPrize: sql<string>`COALESCE(SUM(${contests.prizeAmount}::numeric), 0)`,
    }).from(contests).where(and(...contestConds)).groupBy(contests.status);

    const [totalParticipants] = await db.select({
        count: count(),
        uniqueFreelancers: countDistinct(contestParticipants.freelancerId),
    }).from(contestParticipants);

    const [prizeAwarded] = await db.select({
        total: sql<string>`COALESCE(SUM(${contestWinners.prizeAmount}::numeric), 0)`,
        count: count(),
    }).from(contestWinners);

    const [paymentsCollected] = await db.select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count(),
    }).from(payments).where(and(...paymentConds, eq(payments.status, 'captured'), isNotNull(payments.contestId)));

    const [totalPrizeOffered] = await db.select({
        total: sql<string>`COALESCE(SUM(${contests.prizeAmount}::numeric), 0)`,
    }).from(contests).where(and(...contestConds));

    // Top contests by participants
    const topContests = await db.select({
        contestId: contestParticipants.contestId,
        participantCount: count(),
    }).from(contestParticipants).groupBy(contestParticipants.contestId)
      .orderBy(sql`count(*) DESC`).limit(5);

    return {
        totalContests: totalContests.count,
        statusBreakdown,
        totalParticipants: totalParticipants.count,
        uniqueFreelancers: totalParticipants.uniqueFreelancers,
        prizeAwarded: { total: Number(prizeAwarded.total), count: prizeAwarded.count },
        paymentsCollected: { total: Number(paymentsCollected.total), count: paymentsCollected.count },
        totalPrizeOffered: Number(totalPrizeOffered.total),
        topContests,
        reconciliation: {
            paymentsCollected: Number(paymentsCollected.total),
            prizeAwarded: Number(prizeAwarded.total),
            // Net (platform keeps the difference after prize payout)
            platformNet: Number(paymentsCollected.total) - Number(prizeAwarded.total),
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 3. ORDERS REPORT
// ─────────────────────────────────────────────────────────────
export async function getOrdersReport({
    startDate = '',
    endDate = '',
    orderStatus = 'all',
}: {
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
} = {}) {
    await verifyAdmin();

    const orderConds = [...buildDateConditions(orders, startDate, endDate)];
    if (orderStatus !== 'all') orderConds.push(eq(orders.orderStatus, orderStatus));

    const [totals] = await db.select({
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
        avg: sql<string>`COALESCE(AVG(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds));

    const [regularOrders] = await db.select({
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds, isNull(orders.contestId)));

    const [contestOrders] = await db.select({
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds, isNotNull(orders.contestId)));

    const statusBreakdown = await db.select({
        status: orders.orderStatus,
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds)).groupBy(orders.orderStatus);

    const paymentStatusBreakdown = await db.select({
        status: orders.paymentStatus,
        count: count(),
        total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(and(...orderConds)).groupBy(orders.paymentStatus);

    const totalFromStatusBreakdown = statusBreakdown.reduce((acc, s) => acc + Number(s.count), 0);

    return {
        totals: {
            count: totals.count,
            total: Number(totals.total),
            avg: Number(totals.avg),
        },
        regularOrders: { count: regularOrders.count, total: Number(regularOrders.total) },
        contestOrders: { count: contestOrders.count, total: Number(contestOrders.total) },
        statusBreakdown,
        paymentStatusBreakdown,
        reconciliation: {
            totalOrders: totals.count,
            statusSum: totalFromStatusBreakdown,
            isBalanced: totals.count === totalFromStatusBreakdown,
            regularPlusContest: regularOrders.count + contestOrders.count,
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 4. VERIFICATION REPORT
// ─────────────────────────────────────────────────────────────
export async function getVerificationReport({
    startDate = '',
    endDate = '',
    status = 'all',
}: {
    startDate?: string;
    endDate?: string;
    status?: string;
} = {}) {
    await verifyAdmin();

    const dvConds = [...buildDateConditions(designVerifications, startDate, endDate)];
    if (status !== 'all') dvConds.push(eq(designVerifications.status, status));

    const [totals] = await db.select({
        count: count(),
        totalFees: sql<string>`COALESCE(SUM(${designVerifications.verificationFee}::numeric), 0)`,
    }).from(designVerifications).where(and(...dvConds));

    const [completedStats] = await db.select({
        count: count(),
        totalFees: sql<string>`COALESCE(SUM(${designVerifications.verificationFee}::numeric), 0)`,
    }).from(designVerifications).where(and(...dvConds, eq(designVerifications.status, 'completed')));

    const [pendingCount] = await db.select({ count: count() })
        .from(designVerifications).where(and(...dvConds, eq(designVerifications.status, 'pending')));

    const [assignedCount] = await db.select({ count: count() })
        .from(designVerifications).where(and(...dvConds, eq(designVerifications.status, 'assigned')));

    const [cancelledCount] = await db.select({ count: count() })
        .from(designVerifications).where(and(...dvConds, eq(designVerifications.status, 'cancelled')));

    const statusBreakdown = await db.select({
        status: designVerifications.status,
        count: count(),
        totalFees: sql<string>`COALESCE(SUM(${designVerifications.verificationFee}::numeric), 0)`,
    }).from(designVerifications).where(and(...dvConds)).groupBy(designVerifications.status);

    const topFreelancers = await db.select({
        freelancerId: designVerifications.freelancerId,
        completions: count(),
        earned: sql<string>`COALESCE(SUM(${designVerifications.verificationFee}::numeric), 0)`,
    }).from(designVerifications)
      .where(and(...dvConds, eq(designVerifications.status, 'completed'), isNotNull(designVerifications.freelancerId)))
      .groupBy(designVerifications.freelancerId)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const totalFromStatus = pendingCount.count + assignedCount.count + completedStats.count + cancelledCount.count;

    return {
        totals: { count: totals.count, totalFees: Number(totals.totalFees) },
        completed: { count: completedStats.count, totalFees: Number(completedStats.totalFees) },
        pending: pendingCount.count,
        assigned: assignedCount.count,
        cancelled: cancelledCount.count,
        statusBreakdown,
        topFreelancers,
        reconciliation: {
            totalCount: totals.count,
            statusSum: totalFromStatus,
            isBalanced: totals.count === totalFromStatus,
            feesFromCompleted: Number(completedStats.totalFees),
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 5. USER REPORT
// ─────────────────────────────────────────────────────────────
export async function getUserReport({
    startDate = '',
    endDate = '',
}: {
    startDate?: string;
    endDate?: string;
} = {}) {
    await verifyAdmin();

    const userConds = [...buildDateConditions(users, startDate, endDate)];

    const [totalClients] = await db.select({ count: count() })
        .from(users).where(and(...userConds, eq(users.role, 'user')));

    const [totalFreelancers] = await db.select({ count: count() })
        .from(users).where(and(...userConds, eq(users.role, 'freelancer')));

    const [activeClients] = await db.select({ count: count() })
        .from(users).where(and(...userConds, eq(users.role, 'user'), eq(users.isActive, true)));

    const [activeFreelancers] = await db.select({ count: count() })
        .from(users).where(and(...userConds, eq(users.role, 'freelancer'), eq(users.isActive, true)));

    // This month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newClientsThisMonth] = await db.select({ count: count() })
        .from(users).where(and(eq(users.role, 'user'), gte(users.createdAt, startOfMonth)));

    const [newFreelancersThisMonth] = await db.select({ count: count() })
        .from(users).where(and(eq(users.role, 'freelancer'), gte(users.createdAt, startOfMonth)));

    const [participatingFreelancers] = await db.select({
        unique: countDistinct(contestParticipants.freelancerId),
    }).from(contestParticipants);

    const [winningFreelancers] = await db.select({
        unique: countDistinct(contestWinners.freelancerId),
    }).from(contestWinners);

    return {
        totalClients: totalClients.count,
        totalFreelancers: totalFreelancers.count,
        activeClients: activeClients.count,
        activeFreelancers: activeFreelancers.count,
        newClientsThisMonth: newClientsThisMonth.count,
        newFreelancersThisMonth: newFreelancersThisMonth.count,
        participatingFreelancers: participatingFreelancers.unique,
        winningFreelancers: winningFreelancers.unique,
        reconciliation: {
            totalUsers: totalClients.count + totalFreelancers.count,
            activeUsers: activeClients.count + activeFreelancers.count,
            inactiveUsers: (totalClients.count + totalFreelancers.count) - (activeClients.count + activeFreelancers.count),
        }
    };
}
