'use server';

import { db } from '@/db';
import {
    printerInvoices,
    orders,
    printPressUsers,
} from '@/db/schema';
import {
    eq,
    desc,
    and,
    gte,
    lte,
    sql,
    count,
    inArray,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function verifyPrinter() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized: printer access required.');
    }
    return session;
}

async function verifyAdmin() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized: admin access required.');
    }
    return session;
}

/** Generate a sequential invoice number like INV-2026-00042 */
async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [{ total }] = await db
        .select({ total: count() })
        .from(printerInvoices);
    const seq = String(Number(total) + 1).padStart(5, '0');
    return `INV-${year}-${seq}`;
}

// ── Printer Actions ────────────────────────────────────────────────────────────

/** All delivered orders assigned to this printer (for invoice candidate list). */
export async function getPrinterDeliveredOrders() {
    const session = await verifyPrinter();

    return db.query.orders.findMany({
        where: and(
            eq(orders.printerAssigned, session.sub),
            inArray(orders.orderStatus, ['shipped', 'delivered'])
        ),
        with: {
            product: true,
            directSellingProduct: true,
            user: {
                columns: { name: true, email: true },
            },
        },
        orderBy: [desc(orders.updatedAt)],
    });
}

/** All invoices previously sent by this printer. */
export async function getPrinterInvoices() {
    const session = await verifyPrinter();

    return db.query.printerInvoices.findMany({
        where: eq(printerInvoices.printerId, session.sub),
        with: {
            order: {
                with: {
                    product: true,
                    directSellingProduct: true,
                    user: { columns: { name: true, email: true } },
                },
            },
        },
        orderBy: [desc(printerInvoices.createdAt)],
    });
}

/** IDs of orders that already have an invoice sent. */
export async function getPrinterInvoicedOrderIds(): Promise<number[]> {
    const session = await verifyPrinter();

    const rows = await db
        .select({ orderId: printerInvoices.orderId })
        .from(printerInvoices)
        .where(eq(printerInvoices.printerId, session.sub));

    return rows.map(r => r.orderId);
}

/** Send (create) a new invoice for a completed order. One invoice per order. */
export async function sendPrinterInvoice({
    orderId,
    amount,
    invoiceItems,
    notes,
}: {
    orderId: number;
    amount: string;
    invoiceItems?: any[];
    notes?: string;
}) {
    const session = await verifyPrinter();

    // Verify order belongs to this printer and is shipped/delivered
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.printerAssigned, session.sub),
            inArray(orders.orderStatus, ['shipped', 'delivered'])
        ),
    });
    if (!order) {
        throw new Error('Order not found or not eligible for invoicing.');
    }

    // Check no existing invoice
    const existing = await db.query.printerInvoices.findFirst({
        where: and(
            eq(printerInvoices.orderId, orderId),
            eq(printerInvoices.printerId, session.sub)
        ),
    });
    if (existing) {
        throw new Error('An invoice has already been sent for this order.');
    }

    const invoiceNumber = await generateInvoiceNumber();

    const [invoice] = await db.insert(printerInvoices).values({
        printerId: session.sub,
        orderId,
        invoiceNumber,
        amount,
        invoiceItems: invoiceItems || null,
        notes: notes || null,
        status: 'pending',
        sentAt: new Date(),
    }).returning();

    revalidatePath('/printer/invoices');
    revalidatePath('/admin/printer-invoices');
    return invoice;
}

/** Fetch details for a specific invoice. Securely accessible to either the owning printer or any admin. */
export async function getPrinterInvoiceById(invoiceId: number) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Unauthorized');
    }

    const isAdmin = ['admin', 'super_admin', 'company_admin'].includes(session.role);
    const isPrinter = session.role === 'printer';

    if (!isAdmin && !isPrinter) {
        throw new Error('Unauthorized');
    }

    const invoice = await db.query.printerInvoices.findFirst({
        where: eq(printerInvoices.id, invoiceId),
        with: {
            printer: {
                columns: {
                    fullName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                    address: true,
                    city: true,
                    state: true,
                    postalCode: true,
                    country: true,
                    gstNumber: true,
                },
            },
            order: {
                with: {
                    product: true,
                    directSellingProduct: true,
                    user: { columns: { name: true, email: true } },
                    printerPayments: true,
                },
            },
        },
    });

    if (!invoice) {
        return null;
    }

    // Security check: if printer, they must own the invoice
    if (isPrinter && invoice.printerId !== session.sub) {
        throw new Error('Unauthorized: you do not own this invoice.');
    }

    return invoice;
}

// ── Admin Actions ──────────────────────────────────────────────────────────────

export async function getAdminAllInvoices({
    printerId = '',
    status = 'all',
    startDate = '',
    endDate = '',
}: {
    printerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
} = {}) {
    await verifyAdmin();

    const conditions = [];

    if (printerId && printerId !== 'all') {
        conditions.push(eq(printerInvoices.printerId, printerId));
    }
    if (status && status !== 'all') {
        conditions.push(eq(printerInvoices.status, status as any));
    }
    if (startDate && endDate) {
        const s = new Date(startDate); s.setHours(0, 0, 0, 0);
        const e = new Date(endDate);   e.setHours(23, 59, 59, 999);
        conditions.push(and(gte(printerInvoices.createdAt, s), lte(printerInvoices.createdAt, e)));
    } else if (startDate) {
        const s = new Date(startDate); s.setHours(0, 0, 0, 0);
        conditions.push(gte(printerInvoices.createdAt, s));
    } else if (endDate) {
        const e = new Date(endDate); e.setHours(23, 59, 59, 999);
        conditions.push(lte(printerInvoices.createdAt, e));
    }

    const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

    return db.query.printerInvoices.findMany({
        where: finalWhere,
        with: {
            printer: {
                columns: {
                    fullName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                },
            },
            order: {
                with: {
                    product: true,
                    directSellingProduct: true,
                    user: { columns: { name: true, email: true } },
                },
            },
        },
        orderBy: [desc(printerInvoices.createdAt)],
    });
}

/** Approve / reject / mark paid — with optional admin note. */
export async function updateInvoiceStatus({
    invoiceId,
    status,
    adminNote,
}: {
    invoiceId: number;
    status: 'approved' | 'paid' | 'rejected';
    adminNote?: string;
}) {
    await verifyAdmin();

    const updateFields: Record<string, any> = {
        status,
        adminNote: adminNote || null,
        updatedAt: new Date(),
    };

    if (status === 'approved')  updateFields.approvedAt  = new Date();
    if (status === 'paid')      updateFields.paidAt       = new Date();
    if (status === 'rejected')  updateFields.rejectedAt   = new Date();

    const [updated] = await db
        .update(printerInvoices)
        .set(updateFields)
        .where(eq(printerInvoices.id, invoiceId))
        .returning();

    revalidatePath('/admin/printer-invoices');
    revalidatePath('/printer/invoices');
    return updated;
}

/** All printer names for admin dropdown filter. */
export async function getAllPrintersForFilter() {
    await verifyAdmin();
    return db
        .select({
            id: printPressUsers.id,
            name: printPressUsers.fullName,
            company: printPressUsers.companyName,
        })
        .from(printPressUsers)
        .orderBy(printPressUsers.companyName);
}

/** Admin invoice summary stats. */
export async function getAdminInvoiceStats() {
    await verifyAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [all] = await db
        .select({
            total: count(),
            totalAmount: sql<number>`COALESCE(SUM(${printerInvoices.amount}::numeric), 0)`,
        })
        .from(printerInvoices);

    const [pending] = await db
        .select({ count: count() })
        .from(printerInvoices)
        .where(eq(printerInvoices.status, 'pending'));

    const [approved] = await db
        .select({ count: count() })
        .from(printerInvoices)
        .where(eq(printerInvoices.status, 'approved'));

    const [paid] = await db
        .select({
            count: count(),
            totalPaid: sql<number>`COALESCE(SUM(${printerInvoices.amount}::numeric), 0)`,
        })
        .from(printerInvoices)
        .where(eq(printerInvoices.status, 'paid'));

    const [rejected] = await db
        .select({ count: count() })
        .from(printerInvoices)
        .where(eq(printerInvoices.status, 'rejected'));

    const [thisMonth] = await db
        .select({
            count: count(),
            amount: sql<number>`COALESCE(SUM(${printerInvoices.amount}::numeric), 0)`,
        })
        .from(printerInvoices)
        .where(gte(printerInvoices.createdAt, startOfMonth));

    return {
        total: { count: all.total, amount: Number(all.totalAmount) },
        pending: { count: pending.count },
        approved: { count: approved.count },
        paid: { count: paid.count, amount: Number(paid.totalPaid) },
        rejected: { count: rejected.count },
        thisMonth: { count: thisMonth.count, amount: Number(thisMonth.amount) },
    };
}
