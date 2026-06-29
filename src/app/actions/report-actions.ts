'use server';

import { db } from '@/db';
import { orders, payments, contests, contestParticipants, contestWinners, designVerifications, users, printPressUsers, printerPayments, directSellingProducts } from '@/db/schema';
import { and, eq, gte, lte, count, sum, avg, countDistinct, sql, isNull, isNotNull, or, ilike, inArray, desc } from 'drizzle-orm';
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

    // Fetch mismatched orders (marked paid, but no successful payment transaction)
    const mismatchedOrders = await db.select({
        id: orders.id,
        createdAt: orders.createdAt,
        totalAmount: orders.totalAmount,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        paymentId: orders.paymentId,
    }).from(orders)
      .leftJoin(payments, eq(orders.paymentId, payments.id))
      .where(and(
          ...orderConds,
          eq(orders.paymentStatus, 'paid'),
          sql`(${payments.id} IS NULL OR ${payments.status} != 'captured')`
      ))
      .limit(10);

    // Fetch mismatched payments (captured transaction, but order is not paid or missing, excluding contest payments)
    const capturedPaymentsList = await db.query.payments.findMany({
        where: and(...paymentConds, eq(payments.status, 'captured')),
        with: {
            orders: true,
            user: {
                columns: {
                    name: true,
                    email: true,
                }
            },
            contest: true,
        },
        orderBy: [sql`${payments.createdAt} DESC`],
    });

    const mismatchedPayments = capturedPaymentsList.filter(pay => {
        const orderList = pay.orders || [];
        // Mismatch if there are no linked orders and no contestId (orphaned)
        if (orderList.length === 0 && !pay.contestId) return true;
        // Mismatch if any linked order is not paid
        if (orderList.length > 0 && orderList.some(o => o.paymentStatus !== 'paid')) return true;
        return false;
    }).slice(0, 10).map(pay => ({
        id: pay.id,
        createdAt: pay.createdAt,
        amount: parseFloat(pay.amount || '0'),
        provider: pay.provider,
        providerPaymentId: pay.providerPaymentId,
        userName: pay.user?.name || 'Unknown User',
        userEmail: pay.user?.email || 'N/A',
        contestId: pay.contestId,
        orders: pay.orders.map(o => ({
            id: o.id,
            totalAmount: parseFloat(o.totalAmount || '0'),
            paymentStatus: o.paymentStatus,
        }))
    }));

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
            mismatchedOrders,
            mismatchedPayments,
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

// ─────────────────────────────────────────────────────────────
// 6. PRINTER PAYOUT REPORT (ADMIN VIEW)
// ─────────────────────────────────────────────────────────────
export async function getAdminPayoutReport({
    startDate = '',
    endDate = '',
    printerId = 'all',
    payoutStatus = 'all',
}: {
    startDate?: string;
    endDate?: string;
    printerId?: string;
    payoutStatus?: string;
} = {}) {
    await verifyAdmin();

    const printersList = await db.select({
        id: printPressUsers.id,
        fullName: printPressUsers.fullName,
        companyName: printPressUsers.companyName,
    }).from(printPressUsers).orderBy(printPressUsers.companyName);

    const orderConds = [
        isNotNull(orders.printerAssigned),
        sql`${orders.printingAmount}::numeric > 0`
    ];

    if (printerId !== 'all') {
        orderConds.push(eq(orders.printerAssigned, printerId));
    }

    const allAssignedOrders = await db.query.orders.findMany({
        where: and(...orderConds),
        with: {
            product: true,
            directSellingProduct: true,
            printer: {
                columns: {
                    fullName: true,
                    companyName: true,
                }
            },
            printerPayments: true,
        },
        orderBy: [sql`${orders.createdAt} DESC`],
    });

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const processed = allAssignedOrders.map(order => {
        const cost = parseFloat(order.printingAmount || '0');
        const rawPayments = order.printerPayments || [];
        const filteredPayments = rawPayments.filter(p => {
            const pDate = new Date(p.paymentDate);
            if (start && pDate < start) return false;
            if (end && pDate > end) return false;
            return true;
        });

        const totalPaid = rawPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
        const remaining = Math.max(0, cost - totalPaid);

        let status = 'unpaid';
        if (totalPaid >= cost) {
            status = 'fully_paid';
        } else if (totalPaid > 0) {
            status = 'partially_paid';
        }

        return {
            id: order.id,
            createdAt: order.createdAt,
            orderStatus: order.orderStatus,
            productName: order.directSellingProduct?.name || order.product?.name || 'Custom Product',
            printerName: order.printer?.companyName || order.printer?.fullName || 'Print Partner',
            printerId: order.printerAssigned,
            printingAmount: cost,
            totalPaid,
            remaining,
            status,
            payments: filteredPayments,
        };
    });

    const filtered = processed.filter(item => {
        if (payoutStatus !== 'all' && item.status !== payoutStatus) return false;
        
        if (start || end) {
            const itemDate = new Date(item.createdAt);
            const matchesOrderDate = (!start || itemDate >= start) && (!end || itemDate <= end);
            const matchesPaymentDate = item.payments.length > 0;
            return matchesOrderDate || matchesPaymentDate;
        }

        return true;
    });

    const totals = filtered.reduce((acc, item) => {
        acc.committed += item.printingAmount;
        acc.cleared += item.totalPaid;
        acc.pending += item.remaining;
        return acc;
    }, { committed: 0, cleared: 0, pending: 0 });

    return {
        printers: printersList,
        orders: filtered,
        summary: {
            totalCommitted: totals.committed,
            totalCleared: totals.cleared,
            totalPending: totals.pending,
            count: filtered.length,
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 7. PRINTER PAYOUT REPORT (PRINTER SELF VIEW)
// ─────────────────────────────────────────────────────────────
export async function getPrinterPayoutReport({
    startDate = '',
    endDate = '',
    payoutStatus = 'all',
}: {
    startDate?: string;
    endDate?: string;
    payoutStatus?: string;
} = {}) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const printerId = session.sub;

    const orderConds = [
        eq(orders.printerAssigned, printerId),
        sql`${orders.printingAmount}::numeric > 0`
    ];

    const assignedOrders = await db.query.orders.findMany({
        where: and(...orderConds),
        with: {
            product: true,
            directSellingProduct: true,
            printerPayments: true,
        },
        orderBy: [sql`${orders.createdAt} DESC`],
    });

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const processed = assignedOrders.map(order => {
        const cost = parseFloat(order.printingAmount || '0');
        const rawPayments = order.printerPayments || [];
        const filteredPayments = rawPayments.filter(p => {
            const pDate = new Date(p.paymentDate);
            if (start && pDate < start) return false;
            if (end && pDate > end) return false;
            return true;
        });

        const totalPaid = rawPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
        const remaining = Math.max(0, cost - totalPaid);

        let status = 'unpaid';
        if (totalPaid >= cost) {
            status = 'fully_paid';
        } else if (totalPaid > 0) {
            status = 'partially_paid';
        }

        return {
            id: order.id,
            createdAt: order.createdAt,
            orderStatus: order.orderStatus,
            productName: order.directSellingProduct?.name || order.product?.name || 'Custom Product',
            printingAmount: cost,
            totalPaid,
            remaining,
            status,
            payments: filteredPayments,
        };
    });

    const filtered = processed.filter(item => {
        if (payoutStatus !== 'all' && item.status !== payoutStatus) return false;
        
        if (start || end) {
            const itemDate = new Date(item.createdAt);
            const matchesOrderDate = (!start || itemDate >= start) && (!end || itemDate <= end);
            const matchesPaymentDate = item.payments.length > 0;
            return matchesOrderDate || matchesPaymentDate;
        }

        return true;
    });

    const totals = filtered.reduce((acc, item) => {
        acc.committed += item.printingAmount;
        acc.cleared += item.totalPaid;
        acc.pending += item.remaining;
        return acc;
    }, { committed: 0, cleared: 0, pending: 0 });

    return {
        orders: filtered,
        summary: {
            totalCommitted: totals.committed,
            totalCleared: totals.cleared,
            totalPending: totals.pending,
            count: filtered.length,
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 8. PAYMENT GATEWAY RECONCILIATION REPORT
// ─────────────────────────────────────────────────────────────
export async function getPaymentGatewayReport({
    startDate = '',
    endDate = '',
    provider = 'all',
    status = 'all',
    onlyDiscrepancies = false,
}: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    status?: string;
    onlyDiscrepancies?: boolean;
} = {}) {
    await verifyAdmin();

    const conditions = [];

    if (provider !== 'all') {
        conditions.push(eq(payments.provider, provider as any));
    }
    if (status !== 'all') {
        conditions.push(eq(payments.status, status as any));
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) {
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(payments.createdAt, start));
    }
    if (end) {
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(payments.createdAt, end));
    }

    const gatewayPayments = await db.query.payments.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
            user: {
                columns: {
                    name: true,
                    email: true,
                }
            },
            orders: true,
            contest: true,
        },
        orderBy: [sql`${payments.createdAt} DESC`],
    });

    const processed = gatewayPayments.map(pay => {
        const payAmount = parseFloat(pay.amount || '0');
        const orderList = pay.orders || [];
        
        let statusMismatch = false;
        let amountMismatch = false;
        let isOrphan = orderList.length === 0 && !pay.contestId;

        // If payment is captured, the linked orders should be marked as 'paid'
        if (pay.status === 'captured') {
            const hasUnpaidOrder = orderList.some(o => o.paymentStatus !== 'paid');
            if (hasUnpaidOrder) {
                statusMismatch = true;
            }
        } else if (pay.status === 'failed') {
            const hasPaidOrder = orderList.some(o => o.paymentStatus === 'paid');
            if (hasPaidOrder) {
                statusMismatch = true;
            }
        }

        // Amount matching check
        if (orderList.length > 0) {
            const totalOrdersAmount = orderList.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
            if (Math.abs(payAmount - totalOrdersAmount) > 0.01) {
                amountMismatch = true;
            }
        }

        const hasDiscrepancy = statusMismatch || amountMismatch || isOrphan;

        return {
            id: pay.id,
            createdAt: pay.createdAt,
            amount: payAmount,
            currency: pay.currency,
            status: pay.status,
            provider: pay.provider,
            providerOrderId: pay.providerOrderId,
            providerPaymentId: pay.providerPaymentId,
            userName: pay.user?.name || 'Unknown User',
            userEmail: pay.user?.email || 'N/A',
            contestId: pay.contestId,
            contestTitle: pay.contest?.title || null,
            orders: orderList.map(o => ({
                id: o.id,
                totalAmount: parseFloat(o.totalAmount || '0'),
                paymentStatus: o.paymentStatus,
                orderStatus: o.orderStatus,
            })),
            discrepancy: {
                hasDiscrepancy,
                statusMismatch,
                amountMismatch,
                isOrphan,
            }
        };
    });

    const filtered = onlyDiscrepancies 
        ? processed.filter(p => p.discrepancy.hasDiscrepancy) 
        : processed;

    // Calculate metrics
    const metrics = filtered.reduce((acc, pay) => {
        acc.totalCount += 1;
        if (pay.status === 'captured') {
            acc.capturedCount += 1;
            acc.capturedVolume += pay.amount;
        } else if (pay.status === 'failed') {
            acc.failedCount += 1;
            acc.failedVolume += pay.amount;
        } else if (pay.status === 'refunded') {
            acc.refundedCount += 1;
            acc.refundedVolume += pay.amount;
        } else {
            acc.otherCount += 1;
            acc.otherVolume += pay.amount;
        }

        if (pay.discrepancy.hasDiscrepancy) {
            acc.discrepancyCount += 1;
        }

        return acc;
    }, {
        totalCount: 0,
        capturedCount: 0,
        capturedVolume: 0,
        failedCount: 0,
        failedVolume: 0,
        refundedCount: 0,
        refundedVolume: 0,
        otherCount: 0,
        otherVolume: 0,
        discrepancyCount: 0,
    });

    const successRate = metrics.totalCount > 0 
        ? Math.round((metrics.capturedCount / metrics.totalCount) * 100) 
        : 0;

    return {
        payments: filtered,
        summary: {
            ...metrics,
            successRate,
        }
    };
}

// ─────────────────────────────────────────────────────────────
// 8. PROFIT REPORT
// ─────────────────────────────────────────────────────────────
export async function getProfitReport({
    startDate = '',
    endDate = '',
    orderStatus = 'all',
    paymentStatus = 'all',
    searchQuery = '',
    page = 1,
    limit = 20,
}: {
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
    paymentStatus?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
} = {}) {
    await verifyAdmin();

    const conditions = [];

    // Date filters
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(and(gte(orders.createdAt, start), lte(orders.createdAt, end)));
    } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(orders.createdAt, start));
    } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(orders.createdAt, end));
    }

    // Status filters
    if (orderStatus !== 'all') {
        conditions.push(eq(orders.orderStatus, orderStatus));
    }
    if (paymentStatus !== 'all') {
        conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    // Search query
    if (searchQuery) {
        const isNumeric = !isNaN(Number(searchQuery)) && searchQuery.trim() !== '';
        const searchConditions = [];

        if (isNumeric) {
            searchConditions.push(eq(orders.id, Number(searchQuery)));
        }

        const userMatches = db.select({ id: users.id }).from(users).where(
            or(ilike(users.name, `%${searchQuery}%`), ilike(users.email, `%${searchQuery}%`))
        );

        searchConditions.push(inArray(orders.userId, userMatches));
        conditions.push(or(...searchConditions));
    }

    const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total orders matching criteria
    const [totalCountResult] = await db.select({ count: count() }).from(orders).where(finalCondition);
    const totalCount = totalCountResult.count;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // Fetch matching orders with relations
    const fetchedOrders = await db.query.orders.findMany({
        where: finalCondition,
        with: {
            user: {
                columns: {
                    name: true,
                    email: true,
                }
            },
            product: true,
            subProduct: true,
            directSellingProduct: true,
            designVerifications: true,
            contest: true,
        },
        orderBy: [desc(orders.createdAt)],
        limit,
        offset,
    });

    // Summary of all orders matching the criteria (regardless of page limit)
    const summaryQuery = await db.select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
        totalPrintingCost: sql<string>`COALESCE(SUM(${orders.printingAmount}::numeric), 0)`,
    }).from(orders).where(finalCondition);

    // Total Verification Fee (for matched orders)
    const verificationTotal = await db.select({
        total: sql<string>`COALESCE(SUM(${designVerifications.verificationFee}::numeric), 0)`
    }).from(designVerifications)
      .innerJoin(orders, eq(designVerifications.orderId, orders.id))
      .where(and(
          finalCondition ? finalCondition : undefined
      ));

    // Total Contest Prize (for matched orders)
    const contestTotal = await db.select({
        total: sql<string>`COALESCE(SUM(${contests.prizeAmount}::numeric), 0)`
    }).from(contests)
      .innerJoin(orders, eq(orders.contestId, contests.id))
      .where(and(
          finalCondition ? finalCondition : undefined
      ));

    // Total Direct Selling Cost
    const directSellingTotal = await db.select({
        total: sql<string>`COALESCE(SUM(${directSellingProducts.costPrice}::numeric * ${orders.quantity}), 0)`
    }).from(directSellingProducts)
      .innerJoin(orders, eq(orders.directSellingProductId, directSellingProducts.id))
      .where(and(
          finalCondition ? finalCondition : undefined
      ));

    const totalRevenue = parseFloat(summaryQuery[0]?.totalRevenue || '0');
    const totalPrintingCost = parseFloat(summaryQuery[0]?.totalPrintingCost || '0');
    const totalVerificationCost = parseFloat(verificationTotal[0]?.total || '0');
    const totalContestCost = parseFloat(contestTotal[0]?.total || '0');
    const totalDirectSellingCost = parseFloat(directSellingTotal[0]?.total || '0');

    const totalSpendings = totalPrintingCost + totalVerificationCost + totalContestCost + totalDirectSellingCost;
    const totalProfit = totalRevenue - totalSpendings;

    // Map the paginated orders
    const ordersWithProfit = fetchedOrders.map(order => {
        const orderRevenue = parseFloat(order.totalAmount || '0');
        const printingCost = parseFloat(order.printingAmount || '0');
        
        const verificationCost = order.designVerifications?.reduce(
            (sum, v) => sum + parseFloat(v.verificationFee || '0'), 0
        ) || 0;

        const directSellingCost = order.directSellingProduct 
            ? parseFloat(order.directSellingProduct.costPrice || '0') * order.quantity 
            : 0;

        const contestCost = order.contest 
            ? parseFloat(order.contest.prizeAmount || '0') 
            : 0;

        const spendings = printingCost + verificationCost + directSellingCost + contestCost;
        const profit = orderRevenue - spendings;
        const margin = orderRevenue > 0 ? (profit / orderRevenue) * 100 : 0;

        return {
            id: order.id,
            createdAt: order.createdAt,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            customerName: order.user?.name || 'Unknown',
            customerEmail: order.user?.email || 'N/A',
            productName: order.directSellingProduct?.name || order.product?.name || 'Custom Product',
            quantity: order.quantity,
            revenue: orderRevenue,
            printingCost,
            verificationCost,
            directSellingCost,
            contestCost,
            totalSpendings: spendings,
            profit,
            margin,
        };
    });

    return {
        orders: ordersWithProfit,
        pagination: {
            totalCount,
            totalPages,
            currentPage: page,
        },
        summary: {
            totalRevenue,
            totalPrintingCost,
            totalVerificationCost,
            totalContestCost,
            totalDirectSellingCost,
            totalSpendings,
            totalProfit,
            profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        }
    };
}

