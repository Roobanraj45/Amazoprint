

'use server';

import { z } from 'zod';
import { db } from '@/db';
import { orders, designs, designUploads, products, subProducts, printPressUsers, orderLogs, users, payments, printerPayments, shipments, printerSubscriptions } from '@/db/schema';
import { and, eq, desc, count, ilike, sql, gte, lte, or, inArray, isNotNull, isNull, notInArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import type { Address } from '@/lib/types';
import { getPricingRulesForSubProduct } from './pricing-actions';
import { createShiprocketShipment, trackShipment, cancelShipment, generateLabel, generateManifest, schedulePickup, printShiprocketInvoice } from '@/lib/shiprocket';

const addressSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone is required'),
});

const createOrderSchema = z.object({
    designId: z.coerce.number().optional(),
    uploadId: z.coerce.number().optional(),
    quantity: z.coerce.number().min(1),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    useShippingForBilling: z.boolean(),
    paymentId: z.coerce.number().optional(),
});

type CreateOrderData = z.infer<typeof createOrderSchema>;

export async function createOrder(data: CreateOrderData) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to create an order.');
    }

    const validated = createOrderSchema.parse(data);
    const { designId, uploadId, quantity, shippingAddress, paymentId } = validated;
    const billingAddress = validated.useShippingForBilling ? shippingAddress : validated.billingAddress;

    if (!designId && !uploadId) {
        throw new Error('An order must have a design or an uploaded file.');
    }
    if (!billingAddress) {
        throw new Error('Billing address is required.');
    }

    let sourceDetails;
    if (designId) {
        sourceDetails = await db.query.designs.findFirst({
            where: eq(designs.id, designId),
            with: { user: true }
        });
        if (sourceDetails?.user.id !== session.sub) throw new Error('You can only order your own designs.');
    } else if (uploadId) {
        sourceDetails = await db.query.designUploads.findFirst({
            where: eq(designUploads.id, uploadId),
            with: { user: true, product: true, subProduct: true }
        });
        if (sourceDetails?.user.id !== session.sub) throw new Error('You can only order your own uploads.');
    }

    if (!sourceDetails) throw new Error('The selected design or upload could not be found.');

    const productId = designId ? (await getProductBySlug(sourceDetails.productSlug))?.id : sourceDetails.product?.id;
    const subProductId = designId ? (await getSubProductFromDesign(sourceDetails)) : sourceDetails.subProduct?.id;

    if (!productId || !subProductId) {
        throw new Error('Could not determine product information for this order.');
    }

    const subProductInfo = await db.query.subProducts.findFirst({ where: eq(subProducts.id, subProductId) });
    if (!subProductInfo || !subProductInfo.price) throw new Error('Could not get pricing information.');

    let totalAmount = 0;
    let unitPrice = 0;

    const customisation = (sourceDetails as any).customisation || {};
    if (customisation.priceBreakup || customisation.pricing) {
        const breakup = customisation.priceBreakup || customisation.pricing;
        totalAmount = breakup.final;
        unitPrice = totalAmount / quantity;
    } else {
        unitPrice = parseFloat(subProductInfo.price);
        totalAmount = unitPrice * quantity;
    }

    const result = await db.insert(orders).values({
        userId: session.sub,
        productId,
        subProductId,
        designId,
        designUploadId: uploadId,
        quantity,
        unitPrice: String(unitPrice.toFixed(2)),
        totalAmount: String(totalAmount.toFixed(2)),
        shippingAddress: shippingAddress as any,
        billingAddress: billingAddress as any,
        paymentMethod: 'Card', // Placeholder
        paymentStatus: 'paid', // Placeholder
        orderStatus: 'confirmed',
        paymentId,
        customisation,
    }).returning();

    const newOrder = result[0];

    // Log order creation
    try {
        await recordOrderLog({
            orderId: newOrder.id,
            actionType: 'order_created',
            newValue: { status: 'confirmed', total: newOrder.totalAmount },
            message: `Order created by ${session.name || 'customer'}`
        });
    } catch (e) {
        console.error('Failed to log order creation:', e);
    }

    revalidatePath('/client/orders');
    return newOrder;
}

async function getProductBySlug(slug: string) {
    return await db.query.products.findFirst({ where: eq(products.slug, slug) });
}

async function getSubProductFromDesign(design: { width: number, height: number, productSlug: string }) {
    const productInfo = await getProductBySlug(design.productSlug);
    if (!productInfo) return null;

    const matchingSubProduct = await db.query.subProducts.findFirst({
        where: and(
            eq(subProducts.productId, productInfo.id),
            eq(subProducts.width, String(design.width)),
            eq(subProducts.height, String(design.height))
        )
    });
    return matchingSubProduct?.id;
}

export async function getCheckoutDetails(params: { designId?: string, uploadId?: string, quantity: string }) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const { designId, uploadId, quantity: quantityStr } = params;

    if (!designId && !uploadId) {
        throw new Error('No design or upload specified for checkout.');
    }
    const quantity = parseInt(quantityStr);
    if (isNaN(quantity)) {
        throw new Error('Invalid quantity provided.');
    }

    let details;
    if (designId) {
        const design = await db.query.designs.findFirst({
            where: and(eq(designs.id, parseInt(designId)), eq(designs.userId, session.sub)),
        });
        if (!design) throw new Error('Design not found or you do not own it.');

        const product = await getProductBySlug(design.productSlug);
        const subProductId = await getSubProductFromDesign(design);
        const subProduct = subProductId ? await db.query.subProducts.findFirst({ where: eq(subProducts.id, subProductId) }) : null;
        if (!product || !subProduct) throw new Error("Could not find product details for this design.");

        details = { product, subProduct, design, quantity };

    } else if (uploadId) {
        const upload = await db.query.designUploads.findFirst({
            where: and(eq(designUploads.id, parseInt(uploadId)), eq(designUploads.userId, session.sub)),
            with: { product: true, subProduct: true }
        });
        if (!upload || !upload.product || !upload.subProduct) throw new Error('Upload not found or product info is missing.');

        details = { product: upload.product, subProduct: upload.subProduct, upload, quantity };
    }

    if (!details) throw new Error("Could not retrieve details for checkout.");

    // --- Pricing Logic ---
    const pricingRules = await getPricingRulesForSubProduct(details.subProduct.id);
    let baseUnitPrice = parseFloat(details.subProduct.price || '0');
    let finalUnitPrice = baseUnitPrice;
    let discountDescription: string | null = null;
    let totalDiscount = 0;
    let customisation = (details as any).design?.customisation || (details as any).upload?.customisation || {};

    // If we have a saved price breakup in customisation, use it as a reference or primary source
    if (customisation.priceBreakup || customisation.pricing) {
        const breakup = customisation.priceBreakup || customisation.pricing;
        customisation.priceBreakup = breakup; // Normalize so checkout UI works seamlessly
        // The breakup.final is the total for the quantity
        // We can use it to derive the unit price
        finalUnitPrice = breakup.final / quantity;
        baseUnitPrice = breakup.original / quantity;
        totalDiscount = breakup.discount;
        discountDescription = breakup.description;
    } else {
        // 1. Find the most specific base price for the quantity
        const standardRule = pricingRules.find(r => !r.isDiscount && !r.isContest && !r.isVerification && quantity >= (r.minQuantity || 1) && (!r.maxQuantity || quantity <= r.maxQuantity));
        if (standardRule && standardRule.unitPrice) {
            baseUnitPrice = Number(standardRule.unitPrice);
            finalUnitPrice = baseUnitPrice;
        }

        // 2. Find a discount rule that applies
        const discountRule = pricingRules.find(r => r.isDiscount && quantity >= (r.minQuantity || 1) && (!r.maxQuantity || quantity <= r.maxQuantity));
        if (discountRule && discountRule.discountValue) {
            let perItemDiscount = 0;
            if (discountRule.discountType === 'percentage') {
                perItemDiscount = finalUnitPrice * (Number(discountRule.discountValue) / 100);
                discountDescription = `${discountRule.discountValue}% off`;
            } else if (discountRule.discountType === 'fixed') {
                perItemDiscount = Number(discountRule.discountValue);
                discountDescription = `₹${discountRule.discountValue} off per item`;
            }
            finalUnitPrice -= perItemDiscount;
            totalDiscount = perItemDiscount * quantity;
        }
    }

    const originalTotal = baseUnitPrice * quantity;
    const total = finalUnitPrice * quantity;

    return { ...details, unitPrice: finalUnitPrice, total, originalTotal, discountDescription, totalDiscount, customisation };
}

export async function getMyOrders(page: number = 1, limit: number = 10) {
    const session = await getSession();
    if (!session?.sub) {
        return { orders: [], totalCount: 0, totalPages: 0, currentPage: 1 };
    }

    const offset = (page - 1) * limit;

    const [totalCountResult] = await db.select({ count: count() }).from(orders).where(eq(orders.userId, session.sub));
    const totalCount = totalCountResult.count;
    const totalPages = Math.ceil(totalCount / limit);

    const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, session.sub),
        with: {
            product: true,
            subProduct: true,
            design: true,
            designUpload: true,
            directSellingProduct: true,
            contest: {
                with: {
                    payments: true
                }
            }
        },
        orderBy: [desc(orders.createdAt)],
        limit,
        offset
    });

    return { orders: userOrders, totalCount, totalPages, currentPage: page };
}

export async function getAdminAllOrders({
    page = 1,
    limit = 10,
    searchQuery = '',
    statusFilter = 'all',
    assignmentFilter = 'all',
    startDate = '',
    endDate = ''
}: {
    page?: number;
    limit?: number;
    searchQuery?: string;
    statusFilter?: string;
    assignmentFilter?: string;
    startDate?: string;
    endDate?: string;
} = {}) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const conditions = [];

    if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(orders.orderStatus, statusFilter));
    }

    if (assignmentFilter === 'assigned') {
        conditions.push(isNotNull(orders.printerAssigned));
    } else if (assignmentFilter === 'unassigned') {
        conditions.push(isNull(orders.printerAssigned));
    } else if (assignmentFilter === 'unresponsive') {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        conditions.push(and(
            eq(orders.orderStatus, 'pending'),
            isNotNull(orders.printerAssigned),
            lte(orders.printerAssignedAt, sixHoursAgo)
        ));
    }

    if (startDate && endDate) {
        // Assume ISO strings or date strings YYYY-MM-DD
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

    if (searchQuery) {
        const isNumeric = !isNaN(Number(searchQuery)) && searchQuery.trim() !== '';
        const searchConditions = [];

        if (isNumeric) {
            searchConditions.push(eq(orders.id, Number(searchQuery)));
        }

        // Subquery to find users matching name or email
        const userMatches = db.select({ id: users.id }).from(users).where(
            or(ilike(users.name, `%${searchQuery}%`), ilike(users.email, `%${searchQuery}%`))
        );

        searchConditions.push(inArray(orders.userId, userMatches));
        conditions.push(or(...searchConditions));
    }

    const finalCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalCountResult] = await db.select({ count: count() }).from(orders).where(finalCondition);
    const totalCount = totalCountResult.count;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

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
            printer: {
                columns: {
                    fullName: true,
                    companyName: true,
                }
            },
            contest: {
                with: {
                    payments: true
                }
            }
        },
        orderBy: [desc(orders.createdAt)],
        limit,
        offset
    });

    return { orders: fetchedOrders, totalCount, totalPages, currentPage: page };
}

export async function getAdminOrderStats({
    searchQuery = '',
    statusFilter = 'all',
    startDate = '',
    endDate = ''
}: {
    searchQuery?: string;
    statusFilter?: string;
    startDate?: string;
    endDate?: string;
} = {}) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Overall Revenue & Count
    const [totalStats] = await db.select({
        totalAmount: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0) + COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count()
    })
        .from(orders)
        .leftJoin(payments, and(
            eq(payments.contestId, orders.contestId),
            eq(payments.status, 'captured')
        ));

    // 2. Today's Revenue & Count
    const [todayStats] = await db.select({
        totalAmount: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0) + COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count()
    })
        .from(orders)
        .leftJoin(payments, and(
            eq(payments.contestId, orders.contestId),
            eq(payments.status, 'captured')
        ))
        .where(gte(orders.createdAt, startOfToday));

    // 2.5 This Month's Revenue & Count
    const [thisMonthStats] = await db.select({
        totalAmount: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0) + COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count()
    })
        .from(orders)
        .leftJoin(payments, and(
            eq(payments.contestId, orders.contestId),
            eq(payments.status, 'captured')
        ))
        .where(gte(orders.createdAt, startOfThisMonth));

    // 3. Filtered Revenue & Count
    const conditions = [];

    if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(orders.orderStatus, statusFilter));
    }

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

    const [filteredStats] = await db.select({
        totalAmount: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0) + COALESCE(SUM(${payments.amount}::numeric), 0)`,
        count: count()
    })
        .from(orders)
        .leftJoin(payments, and(
            eq(payments.contestId, orders.contestId),
            eq(payments.status, 'captured')
        ))
        .where(finalCondition);

    // 4. Printer Assignment Stats
    const [assignedStats] = await db.select({ count: count() })
        .from(orders)
        .where(isNotNull(orders.printerAssigned));

    const [unassignedStats] = await db.select({ count: count() })
        .from(orders)
        .where(isNull(orders.printerAssigned));

    // 5. Unresponsive Printers (pending status, assigned, and > 6 hours old since assignment)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const [unresponsiveStats] = await db.select({ count: count() })
        .from(orders)
        .where(and(
            eq(orders.orderStatus, 'pending'),
            isNotNull(orders.printerAssigned),
            lte(orders.printerAssignedAt, sixHoursAgo)
        ));

    return {
        total: { amount: Number(totalStats.totalAmount), count: totalStats.count },
        today: { amount: Number(todayStats.amount || todayStats.totalAmount), count: todayStats.count },
        thisMonth: { amount: Number(thisMonthStats.totalAmount), count: thisMonthStats.count },
        filtered: { amount: Number(filteredStats.totalAmount), count: filteredStats.count },
        printers: {
            assigned: assignedStats.count,
            unassigned: unassignedStats.count,
            unresponsive: unresponsiveStats.count,
        }
    };
}

export async function getAdminOrderDetails(orderId: number) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            user: {
                columns: {
                    name: true,
                    email: true,
                    phone: true
                }
            },
            product: true,
            subProduct: true,
            design: true,
            designUpload: true,
            directSellingProduct: true,
            payment: true,
            logs: {
                orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            },
            printerPayments: {
                orderBy: (p, { desc }) => [desc(p.createdAt)],
            },
        },
    });

    if (!order) {
        return null;
    }

    // Resolve contest payment via contestId if order.payment is not set
    if (order.contestId && !order.payment) {
        const contestPayment = await db.select()
            .from(payments)
            .where(eq(payments.contestId, order.contestId))
            .orderBy(desc(payments.createdAt))
            .limit(1)
            .then(res => res[0]);

        if (contestPayment) {
            (order as any).payment = contestPayment;
        }
    }

    return order;
}

export async function getMyOrderDetails(orderId: number) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.userId, session.sub)),
        with: {
            product: true,
            subProduct: true,
            design: true,
            designUpload: true,
            directSellingProduct: true,
            payment: true,
            logs: {
                where: eq(orderLogs.isCustomerVisible, true),
                orderBy: [desc(orderLogs.createdAt)]
            }
        },
    });

    if (!order) {
        return null;
    }

    // Resolve contest payment via contestId if order.payment is not set
    if (order.contestId && !order.payment) {
        const contestPayment = await db.select()
            .from(payments)
            .where(eq(payments.contestId, order.contestId))
            .orderBy(desc(payments.createdAt))
            .limit(1)
            .then(res => res[0]);

        if (contestPayment) {
            (order as any).payment = contestPayment;
        }
    }

    return order;
}

export async function assignPrinterToOrder(
    orderId: number,
    printerId: string | null,
    printingAmount?: string,
    printerPaidAmount?: string,
    paymentMethod = 'bank_transfer',
    referenceNumber?: string,
    notes?: string
) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    // Automatically update order status when printer is assigned
    const newStatus = printerId ? 'pending' : 'confirmed';

    // Get current order state for logging
    const currentOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { printerAssigned: true, orderStatus: true, printingAmount: true }
    });

    const updateFields: any = {
        printerAssigned: printerId,
        orderStatus: newStatus,
        printerAssignedAt: printerId ? new Date() : null,
        updatedAt: new Date()
    };

    if (printingAmount !== undefined) {
        updateFields.printingAmount = printingAmount;
    }

    await db.update(orders)
        .set(updateFields)
        .where(eq(orders.id, orderId));

    // If a printer is being assigned and there is an advance payment, insert it
    if (printerId && printerPaidAmount && parseFloat(printerPaidAmount) > 0) {
        await db.insert(printerPayments).values({
            orderId,
            printerId,
            amount: printerPaidAmount,
            paymentMethod,
            referenceNumber: referenceNumber || 'Advance Payment',
            notes: notes || 'Initial advance payment',
            paymentDate: new Date(),
        });
    }

    // Log printer assignment
    try {
        await recordOrderLog({
            orderId,
            actionType: 'printer_assigned',
            oldValue: { printer: currentOrder?.printerAssigned, status: currentOrder?.orderStatus, printingAmount: currentOrder?.printingAmount },
            newValue: { printer: printerId, status: newStatus, printingAmount: printingAmount || currentOrder?.printingAmount, advancePayment: printerPaidAmount },
            message: printerId ? `Order assigned to printer (Amount: ₹${printingAmount || '0.00'}, Advance: ₹${printerPaidAmount || '0.00'}) and moved to pending approval` : `Order unassigned and returned to confirmed status`
        });
    } catch (e) {
        console.error('Failed to log printer assignment:', e);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
}

export async function recordPrinterPayment({
    orderId,
    printerId,
    amount,
    paymentMethod = 'bank_transfer',
    referenceNumber,
    notes,
}: {
    orderId: number;
    printerId: string;
    amount: string;
    paymentMethod?: string;
    referenceNumber?: string;
    notes?: string;
}) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
        throw new Error('Payment amount must be a positive number.');
    }

    // Fetch order details to verify limits
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { printingAmount: true }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Sum existing payments
    const existingPayments = await db.query.printerPayments.findMany({
        where: eq(printerPayments.orderId, orderId)
    });
    const totalPaid = existingPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    const limit = parseFloat(order.printingAmount);

    if (totalPaid + amt > limit) {
        throw new Error(`Total payments (₹${(totalPaid + amt).toFixed(2)}) cannot exceed the printing cost of ₹${limit.toFixed(2)}.`);
    }

    await db.insert(printerPayments).values({
        orderId,
        printerId,
        amount,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        paymentDate: new Date(),
    });

    // Record order log
    try {
        await recordOrderLog({
            orderId,
            actionType: 'printer_payment',
            newValue: { amount, paymentMethod, referenceNumber },
            message: `Printer payout payment of ₹${amount} recorded (Ref: ${referenceNumber || 'N/A'})`
        });
    } catch (e) {
        console.error('Failed to log printer payment:', e);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
}

export async function updateOrderStatus(
    orderId: number,
    newStatus: string,
    message: string,
    trackingNumber?: string | null,
    estimatedDeliveryDate?: string | null,
    actualDeliveryDate?: string | null
) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const currentOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: {
            orderStatus: true,
            trackingNumber: true,
            estimatedDeliveryDate: true,
            actualDeliveryDate: true
        }
    });

    if (!currentOrder) {
        throw new Error('Order not found');
    }

    const updateFields: any = {
        orderStatus: newStatus,
        updatedAt: new Date()
    };

    if (trackingNumber !== undefined) {
        updateFields.trackingNumber = trackingNumber || null;
    }
    if (estimatedDeliveryDate !== undefined) {
        updateFields.estimatedDeliveryDate = estimatedDeliveryDate || null;
    }
    if (actualDeliveryDate !== undefined) {
        updateFields.actualDeliveryDate = actualDeliveryDate || null;
    } else if (newStatus === 'delivered' && !currentOrder.actualDeliveryDate) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        updateFields.actualDeliveryDate = `${yyyy}-${mm}-${dd}`;
    }

    await db.update(orders)
        .set(updateFields)
        .where(eq(orders.id, orderId));

    try {
        await recordOrderLog({
            orderId,
            actionType: 'status_changed',
            oldValue: {
                status: currentOrder.orderStatus,
                trackingNumber: currentOrder.trackingNumber,
                estimatedDeliveryDate: currentOrder.estimatedDeliveryDate,
                actualDeliveryDate: currentOrder.actualDeliveryDate
            },
            newValue: {
                status: newStatus,
                trackingNumber: trackingNumber !== undefined ? trackingNumber : currentOrder.trackingNumber,
                estimatedDeliveryDate: estimatedDeliveryDate !== undefined ? estimatedDeliveryDate : currentOrder.estimatedDeliveryDate,
                actualDeliveryDate: updateFields.actualDeliveryDate !== undefined ? updateFields.actualDeliveryDate : currentOrder.actualDeliveryDate
            },
            message: message || `Order status updated to ${newStatus.replace(/_/g, ' ')}`,
            isCustomerVisible: true
        });
    } catch (e) {
        console.error('Failed to log order status update:', e);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/client/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
}

export async function getApprovedPrinters() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const printersList = await db.query.printPressUsers.findMany({
        where: eq(printPressUsers.isApproved, true),
        columns: {
            id: true,
            fullName: true,
            companyName: true,
            city: true
        }
    });

    const activeSubs = await db.query.printerSubscriptions.findMany({
        where: eq(printerSubscriptions.status, 'active'),
        with: {
            plan: true
        }
    });

    const printersWithPlans = printersList.map(printer => {
        const activeSub = activeSubs.find(sub => sub.printerId === printer.id);
        return {
            ...printer,
            planName: activeSub?.plan?.name || null
        };
    });

    printersWithPlans.sort((a, b) => {
        if (a.planName && !b.planName) return -1;
        if (!a.planName && b.planName) return 1;
        return 0;
    });

    return printersWithPlans;
}

export async function recordOrderLog({
    orderId,
    actionType,
    oldValue = null,
    newValue = null,
    message = '',
    metadata = {},
    isCustomerVisible = true
}: {
    orderId: number;
    actionType: string;
    oldValue?: any;
    newValue?: any;
    message?: string;
    metadata?: any;
    isCustomerVisible?: boolean;
}) {
    const session = await getSession();

    await db.insert(orderLogs).values({
        orderId,
        actionType,
        oldValue,
        newValue,
        message,
        metadata,
        performedBy: session?.sub,
        performedByRole: session?.role || 'system',
        isCustomerVisible,
    });
}

export async function getPrinterAssignedOrders() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const assignedOrders = await db.query.orders.findMany({
        where: eq(orders.printerAssigned, session.sub),
        with: {
            user: {
                columns: {
                    name: true,
                    email: true,
                    phone: true
                }
            },
            product: true,
            subProduct: true,
            design: true,
            designUpload: true,
            directSellingProduct: true,
            printerPayments: {
                orderBy: (p, { desc }) => [desc(p.createdAt)],
            },
        },
        orderBy: [desc(orders.updatedAt)]
    });

    return assignedOrders;
}

export async function getPrinterOrderDetails(orderId: number) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        with: {
            user: {
                columns: {
                    name: true,
                    email: true,
                    phone: true
                }
            },
            product: true,
            subProduct: true,
            design: true,
            designUpload: true,
            directSellingProduct: true,
            payment: true,
            logs: {
                orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            },
            printerPayments: {
                orderBy: (p, { desc }) => [desc(p.createdAt)],
            },
        },
    });

    return order;
}

export async function updatePrinterOrderStatus(
    orderId: number,
    newStatus: string,
    dimensions?: { length?: number; breadth?: number; height?: number; weight?: number },
    attachmentsUrl?: string,
    customShipping?: { courierName: string; awbCode: string }
) {
    // Self-healing migration to ensure shipments table exists in the active DB
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS shipments (
              id SERIAL PRIMARY KEY,
              order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
              shipment_id VARCHAR(100),
              shiprocket_order_id VARCHAR(100),
              awb_code VARCHAR(100),
              courier_name VARCHAR(100),
              status VARCHAR(100),
              label_url TEXT,
              manifest_url TEXT,
              tracking_url TEXT,
              pickup_scheduled_date TIMESTAMP,
              delivered_date TIMESTAMP,
              cancelled_at TIMESTAMP,
              cancel_reason TEXT,
              estimated_delivery VARCHAR(100),
              current_status VARCHAR(100),
              last_tracking_update TIMESTAMP,
              tracking_data JSONB,
              attachments_url TEXT,
              created_at TIMESTAMP DEFAULT NOW() NOT NULL,
              updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_shipments_shipment_id ON shipments(shipment_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_shipments_awb_code ON shipments(awb_code);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);`);
        // Add new columns if they don't exist (for existing tables)
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_url TEXT;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pickup_scheduled_date TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS cancel_reason TEXT;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS estimated_delivery VARCHAR(100);`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_status VARCHAR(100);`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS last_tracking_update TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_data JSONB;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS attachments_url TEXT;`);
        // Shipping request workflow columns
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_request_status VARCHAR(30) DEFAULT 'requested';`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_requested_at TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_approved_at TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_rejected_at TIMESTAMP;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_rejection_reason TEXT;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS requested_dimensions JSONB;`);
        await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(30) DEFAULT 'shiprocket';`);

        // Print verification columns on orders table
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_file_url TEXT;`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_file_status VARCHAR(50) DEFAULT 'pending';`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_rejected_reason TEXT;`);

        // Drop old check constraint and re-add it with new enum values
        await db.execute(sql`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;`);
        await db.execute(sql`
            ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (
                order_status IN ('pending', 'confirmed', 'quality_check', 'processing', 'under_verification', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded')
            );
        `);
    } catch (dbErr) {
        console.error("Self-healing table creation failed:", dbErr);
    }

    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const currentOrder = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: {
            orderStatus: true,
        }
    });

    if (!currentOrder) {
        throw new Error('Order not found or not assigned to you');
    }

    const allowedStatuses = ['pending', 'confirmed', 'quality_check', 'processing', 'under_verification', 'ready_to_ship', 'shipped'];
    if (!allowedStatuses.includes(newStatus)) {
        throw new Error('Invalid status for printer update');
    }

    // Enforce that shipping can only happen after verification approval
    if (newStatus === 'shipped' && currentOrder.orderStatus !== 'ready_to_ship') {
        throw new Error('Order must be verified by admin before shipping.');
    }

    if (newStatus === 'shipped') {
        const isCustom = !!customShipping;
        try {
            // Check if a shipping request already exists for this order
            const existingShipment = await db.query.shipments.findFirst({
                where: eq(shipments.orderId, orderId),
            });

            if (isCustom) {
                // Custom Shipping: Approve immediately without admin permission
                if (!existingShipment) {
                    await db.insert(shipments).values({
                        orderId,
                        status: 'shipped',
                        currentStatus: 'shipped',
                        shippingRequestStatus: 'approved',
                        shippingMethod: 'custom',
                        courierName: customShipping!.courierName,
                        awbCode: customShipping!.awbCode,
                        shippingRequestedAt: new Date(),
                        shippingApprovedAt: new Date(),
                        attachmentsUrl: attachmentsUrl || null,
                    });
                } else {
                    await db.update(shipments)
                        .set({
                            status: 'shipped',
                            currentStatus: 'shipped',
                            shippingRequestStatus: 'approved',
                            shippingMethod: 'custom',
                            courierName: customShipping!.courierName,
                            awbCode: customShipping!.awbCode,
                            shippingRequestedAt: new Date(),
                            shippingApprovedAt: new Date(),
                            shippingRejectedAt: null,
                            shippingRejectionReason: null,
                            attachmentsUrl: attachmentsUrl || existingShipment.attachmentsUrl,
                            updatedAt: new Date(),
                        })
                        .where(eq(shipments.orderId, orderId));
                }
            } else {
                // Shiprocket Shipping: Create a pending approval request
                if (!existingShipment) {
                    await db.insert(shipments).values({
                        orderId,
                        status: 'shipping_requested',
                        currentStatus: 'shipping_requested',
                        shippingRequestStatus: 'requested',
                        shippingMethod: 'shiprocket',
                        shippingRequestedAt: new Date(),
                        attachmentsUrl: attachmentsUrl || null,
                        requestedDimensions: dimensions || null,
                    });
                } else {
                    await db.update(shipments)
                        .set({
                            status: 'shipping_requested',
                            currentStatus: 'shipping_requested',
                            shippingRequestStatus: 'requested',
                            shippingMethod: 'shiprocket',
                            shippingRequestedAt: new Date(),
                            shippingRejectedAt: null,
                            shippingRejectionReason: null,
                            attachmentsUrl: attachmentsUrl || existingShipment.attachmentsUrl,
                            requestedDimensions: dimensions || existingShipment.requestedDimensions,
                            updatedAt: new Date(),
                        })
                        .where(eq(shipments.orderId, orderId));
                }
            }
        } catch (reqErr) {
            console.error("Failed to process shipping record:", reqErr);
            throw new Error(`Failed to process shipping: ${reqErr instanceof Error ? reqErr.message : String(reqErr)}`);
        }
    }

    const updateFields: any = {
        orderStatus: newStatus,
        updatedAt: new Date()
    };

    if (newStatus === 'under_verification') {
        if (!attachmentsUrl) {
            throw new Error('Verification file is required.');
        }
        updateFields.verificationFileUrl = attachmentsUrl;
        updateFields.verificationFileStatus = 'submitted';
        updateFields.verificationRejectedReason = null;
    }

    await db.update(orders)
        .set(updateFields)
        .where(eq(orders.id, orderId));

    try {
        let logAction = 'status_changed';
        let logMessage = `Printer updated status to ${newStatus.replace(/_/g, ' ')}`;

        if (newStatus === 'shipped') {
            logAction = customShipping ? 'custom_shipped' : 'shipping_requested';
            logMessage = customShipping
                ? `Printer marked order as shipped via Custom Shipping: ${customShipping.courierName} (AWB/Tracking: ${customShipping.awbCode}).`
                : `Printer sent a shipping request for this order. Awaiting admin approval.`;
        } else if (newStatus === 'under_verification') {
            logAction = 'print_verification_submitted';
            logMessage = `Printer submitted printed order proof image/video for verification.`;
        }

        await recordOrderLog({
            orderId,
            actionType: logAction,
            oldValue: { status: currentOrder.orderStatus },
            newValue: { status: newStatus },
            message: logMessage,
            isCustomerVisible: true
        });
    } catch (e) {
        console.error('Failed to log order status update:', e);
    }

    revalidatePath(`/printer/orders/${orderId}`);
    revalidatePath('/printer/orders');
    revalidatePath('/printer/shipments');
    revalidatePath('/admin/printers/shipments');
    return { success: true };
}

export async function reviewPrintVerification(
    orderId: number,
    approve: boolean,
    rejectionReason?: string
) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const currentOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { orderStatus: true, verificationFileUrl: true }
    });

    if (!currentOrder) {
        throw new Error('Order not found');
    }

    const newStatus = approve ? 'ready_to_ship' : 'processing';
    const verificationStatus = approve ? 'approved' : 'rejected';

    await db.update(orders)
        .set({
            orderStatus: newStatus,
            verificationFileStatus: verificationStatus,
            verificationRejectedReason: approve ? null : (rejectionReason || null),
            updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

    try {
        const logAction = approve ? 'print_verification_approved' : 'print_verification_rejected';
        const logMessage = approve
            ? `Admin approved the print verification file. The order is now ready to be shipped.`
            : `Admin rejected the print verification. Reason: ${rejectionReason || 'No reason provided'}`;

        await recordOrderLog({
            orderId,
            actionType: logAction,
            oldValue: { status: currentOrder.orderStatus, verificationStatus: 'submitted' },
            newValue: { status: newStatus, verificationStatus },
            message: logMessage,
            isCustomerVisible: true
        });
    } catch (e) {
        console.error('Failed to log print verification review:', e);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/printer/orders`);
    revalidatePath(`/client/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
}


// ── Shiprocket Shipping Report Server Actions ──────────────────────────────────

export async function getPrinterShipments() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    // Get all orders assigned to this printer that have shipment records
    const printerOrders = await db.query.orders.findMany({
        where: eq(orders.printerAssigned, session.sub),
        columns: { id: true },
    });

    const orderIds = printerOrders.map(o => o.id);
    if (orderIds.length === 0) return [];

    const allShipments = await db.query.shipments.findMany({
        where: inArray(shipments.orderId, orderIds),
        with: {
            order: {
                columns: {
                    id: true,
                    orderStatus: true,
                    totalAmount: true,
                    quantity: true,
                    trackingNumber: true,
                    createdAt: true,
                },
                with: {
                    user: {
                        columns: { name: true, email: true, phone: true },
                    },
                    product: { columns: { name: true } },
                    directSellingProduct: { columns: { name: true } },
                },
            },
        },
        orderBy: [desc(shipments.createdAt)],
    });

    return allShipments;
}

export async function trackPrinterShipment(orderId: number) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    // Verify this order belongs to this printer
    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: { id: true },
    });
    if (!order) throw new Error('Order not found or not assigned to you');

    // Find the shipment record
    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shiprocketOrderId) {
        throw new Error('No shipment record found for this order');
    }

    const trackingResult = await trackShipment(shipment.shiprocketOrderId);
    return trackingResult;
}

export async function cancelPrinterShipment(orderId: number, reason?: string) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: { id: true, orderStatus: true },
    });
    if (!order) throw new Error('Order not found or not assigned to you');

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shiprocketOrderId) {
        throw new Error('No shipment record found for this order');
    }

    // Cancel via Shiprocket API
    await cancelShipment([parseInt(shipment.shiprocketOrderId)], reason);

    // Revert order status back to processing
    await db.update(orders)
        .set({
            orderStatus: 'processing',
            trackingNumber: null,
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

    try {
        await recordOrderLog({
            orderId,
            actionType: 'shipment_cancelled',
            oldValue: { status: order.orderStatus },
            newValue: { status: 'processing', reason },
            message: `Shipment cancelled by printer. Reason: ${reason || 'N/A'}. Order reverted to processing.`,
            isCustomerVisible: true,
        });
    } catch (e) {
        console.error('Failed to log shipment cancellation:', e);
    }

    revalidatePath(`/printer/orders/${orderId}`);
    revalidatePath('/printer/orders');
    revalidatePath('/printer/shipments');
    return { success: true };
}

export async function generateShipmentLabel(orderId: number) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: { id: true },
    });
    if (!order) throw new Error('Order not found or not assigned to you');

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shipmentId) {
        throw new Error('No shipment record found for this order');
    }

    const result = await generateLabel(shipment.shipmentId);
    revalidatePath('/printer/shipments');
    return result;
}

export async function generateShipmentManifest(orderId: number) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: { id: true },
    });
    if (!order) throw new Error('Order not found or not assigned to you');

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shipmentId) {
        throw new Error('No shipment record found for this order');
    }

    const result = await generateManifest(shipment.shipmentId);
    revalidatePath('/printer/shipments');
    return result;
}

export async function schedulePrinterPickup(orderId: number, pickupDateStr?: string) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: { id: true },
    });
    if (!order) throw new Error('Order not found or not assigned to you');

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shipmentId) {
        throw new Error('No shipment record found for this order');
    }

    let shiprocketDate: string | undefined;
    let scheduledTimestamp: Date | undefined;
    if (pickupDateStr) {
        if (pickupDateStr.includes('T')) {
            scheduledTimestamp = new Date(pickupDateStr);
            if (!isNaN(scheduledTimestamp.getTime())) {
                const yyyy = scheduledTimestamp.getFullYear();
                const mm = String(scheduledTimestamp.getMonth() + 1).padStart(2, '0');
                const dd = String(scheduledTimestamp.getDate()).padStart(2, '0');
                shiprocketDate = `${yyyy}-${mm}-${dd}`;
            }
        } else {
            shiprocketDate = pickupDateStr;
            scheduledTimestamp = new Date(pickupDateStr);
        }
    }

    const result = await schedulePickup(shipment.shipmentId, shiprocketDate, scheduledTimestamp);

    // Log the event
    try {
        await recordOrderLog({
            orderId,
            actionType: 'pickup_scheduled',
            message: `Printer scheduled pickup for shipment${pickupDateStr ? ` on ${pickupDateStr.replace('T', ' ')}` : ''}.`,
            isCustomerVisible: true,
        });
    } catch (e) {
        console.error('Failed to log pickup scheduling:', e);
    }

    revalidatePath('/printer/shipments');
    return result;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Admin Shiprocket Shipping Operations & Report Actions ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬



// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Admin Shiprocket Shipping Operations & Report Actions Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function getAdminShipments() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const allShipments = await db.query.shipments.findMany({
        with: {
            order: {
                columns: {
                    id: true,
                    orderStatus: true,
                    totalAmount: true,
                    quantity: true,
                    trackingNumber: true,
                    createdAt: true,
                    printerAssigned: true,
                    shippingAddress: true,
                },
                with: {
                    user: {
                        columns: { name: true, email: true, phone: true },
                    },
                    product: { columns: { name: true } },
                    directSellingProduct: { columns: { name: true } },
                },
            },
        },
        orderBy: [desc(shipments.createdAt)],
    });

    const existingShipmentOrderIds = allShipments.map(s => s.orderId).filter(Boolean) as number[];

    const missingOrders = await db.query.orders.findMany({
        where: and(
            isNotNull(orders.printerAssigned),
            existingShipmentOrderIds.length > 0
                ? notInArray(orders.id, existingShipmentOrderIds)
                : undefined
        ),
        columns: {
            id: true,
            orderStatus: true,
            totalAmount: true,
            quantity: true,
            trackingNumber: true,
            createdAt: true,
            printerAssigned: true,
            shippingAddress: true,
        },
        with: {
            user: {
                columns: { name: true, email: true, phone: true },
            },
            product: { columns: { name: true } },
            directSellingProduct: { columns: { name: true } },
        },
    });

    const virtualShipments = missingOrders.map(order => {
        return {
            id: -order.id,
            orderId: order.id,
            shipmentId: null,
            shiprocketOrderId: null,
            awbCode: null,
            courierName: null,
            status: 'assigned',
            labelUrl: null,
            manifestUrl: null,
            trackingUrl: null,
            pickupScheduledDate: null,
            deliveredDate: null,
            cancelledAt: null,
            cancelReason: null,
            estimatedDelivery: null,
            currentStatus: 'assigned',
            lastTrackingUpdate: null,
            trackingData: null,
            attachmentsUrl: null,
            shippingRequestStatus: 'not_requested' as const,
            shippingRequestedAt: null,
            shippingApprovedAt: null,
            shippingRejectedAt: null,
            shippingRejectionReason: null,
            requestedDimensions: null,
            createdAt: order.createdAt || new Date(),
            updatedAt: order.createdAt || new Date(),
            order: {
                id: order.id,
                orderStatus: order.orderStatus,
                totalAmount: order.totalAmount,
                quantity: order.quantity,
                trackingNumber: order.trackingNumber,
                createdAt: order.createdAt,
                printerAssigned: order.printerAssigned,
                shippingAddress: order.shippingAddress,
                user: order.user,
                product: order.product,
                directSellingProduct: order.directSellingProduct,
            },
        };
    });

    const combinedShipments = [...allShipments, ...virtualShipments];

    const printerIds = [...new Set(combinedShipments.map(s => s.order?.printerAssigned).filter(Boolean))] as string[];
    let printersList: any[] = [];
    if (printerIds.length > 0) {
        printersList = await db.query.printPressUsers.findMany({
            where: inArray(printPressUsers.id, printerIds),
            columns: {
                id: true,
                fullName: true,
                companyName: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
            }
        });
    }

    return combinedShipments.map(s => {
        const printer = s.order?.printerAssigned ? printersList.find(p => p.id === s.order.printerAssigned) : null;
        return {
            ...s,
            printerName: printer ? (printer.companyName || printer.fullName || 'Unknown Printer') : 'Unassigned',
            printerDetails: printer,
        };
    });
}

export async function adminTrackShipment(orderId: number) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shiprocketOrderId) {
        throw new Error('No shipment record found for this order');
    }

    const trackingResult = await trackShipment(shipment.shiprocketOrderId);
    return trackingResult;
}

export async function adminCancelShipment(orderId: number, reason?: string) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { id: true, orderStatus: true },
    });
    if (!order) throw new Error('Order not found');

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shiprocketOrderId) {
        throw new Error('No shipment record found for this order');
    }

    await cancelShipment([parseInt(shipment.shiprocketOrderId)], reason);

    await db.update(shipments)
        .set({
            shipmentId: null,
            shiprocketOrderId: null,
            awbCode: null,
            courierName: null,
            status: 'assigned',
            currentStatus: 'assigned',
            labelUrl: null,
            manifestUrl: null,
            trackingUrl: null,
            pickupScheduledDate: null,
            estimatedDelivery: null,
            lastTrackingUpdate: null,
            trackingData: null,
            attachmentsUrl: null,
            shippingRequestStatus: 'not_requested',
            shippingRequestedAt: null,
            shippingApprovedAt: null,
            shippingRejectedAt: null,
            shippingRejectionReason: null,
            requestedDimensions: null,
            cancelledAt: new Date(),
            cancelReason: reason || null,
            updatedAt: new Date(),
        })
        .where(eq(shipments.orderId, orderId));

    await db.update(orders)
        .set({
            orderStatus: 'processing',
            trackingNumber: null,
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

    try {
        await recordOrderLog({
            orderId,
            actionType: 'shipment_cancelled',
            oldValue: { status: order.orderStatus },
            newValue: { status: 'processing', reason },
            message: `Shipment cancelled by Administrator. Reason: ${reason || 'N/A'}. Order reverted to processing.`,
            isCustomerVisible: true,
        });
    } catch (e) {
        console.error('Failed to log admin shipment cancellation:', e);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/printers/shipments');
    return { success: true };
}

export async function adminGenerateShipmentLabel(orderId: number) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shipmentId) {
        throw new Error('No shipment record found for this order');
    }

    const result = await generateLabel(shipment.shipmentId);
    return result;
}

export async function adminGenerateShipmentManifest(orderId: number) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shipmentId) {
        throw new Error('No shipment record found for this order');
    }

    const result = await generateManifest(shipment.shipmentId);
    return result;
}

export async function adminScheduleShipmentPickup(orderId: number, pickupDateStr?: string) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shipmentId) {
        throw new Error('No shipment record found for this order');
    }

    let shiprocketDate: string | undefined;
    let scheduledTimestamp: Date | undefined;
    if (pickupDateStr) {
        if (pickupDateStr.includes('T')) {
            scheduledTimestamp = new Date(pickupDateStr);
            if (!isNaN(scheduledTimestamp.getTime())) {
                const yyyy = scheduledTimestamp.getFullYear();
                const mm = String(scheduledTimestamp.getMonth() + 1).padStart(2, '0');
                const dd = String(scheduledTimestamp.getDate()).padStart(2, '0');
                shiprocketDate = `${yyyy}-${mm}-${dd}`;
            }
        } else {
            shiprocketDate = pickupDateStr;
            scheduledTimestamp = new Date(pickupDateStr);
        }
    }

    const result = await schedulePickup(shipment.shipmentId, shiprocketDate, scheduledTimestamp);

    try {
        await recordOrderLog({
            orderId,
            actionType: 'pickup_scheduled',
            message: `Administrator scheduled pickup for shipment${pickupDateStr ? ` on ${pickupDateStr.replace('T', ' ')}` : ''}.`,
            isCustomerVisible: true,
        });
    } catch (e) {
        console.error('Failed to log admin pickup scheduling:', e);
    }

    return result;
}

// Admin: Approve Shipping Request
export async function adminApproveShippingRequest(
    orderId: number,
    dimensionOverrides?: { length?: number; breadth?: number; height?: number; weight?: number },
    customerAddressOverride?: {
        name?: string;
        phone?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    },
    printerAddressOverride?: {
        fullName?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    }
) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });

    if (!shipment) {
        throw new Error('No shipping request found for this order');
    }

    if (shipment.shippingRequestStatus !== 'requested') {
        throw new Error('This shipping request has already been processed');
    }

    const fullOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            user: { columns: { name: true, email: true, phone: true } },
            product: true,
            subProduct: true,
            directSellingProduct: true,
            printer: true,
        },
    });

    if (!fullOrder || !fullOrder.printer) {
        throw new Error('Could not find order or assigned printer details');
    }

    if (customerAddressOverride) {
        const existingAddress = (fullOrder.shippingAddress as any) || {};
        const updatedAddress = {
            ...existingAddress,
            ...customerAddressOverride
        };
        await db.update(orders)
            .set({ shippingAddress: updatedAddress })
            .where(eq(orders.id, orderId));
    }

    if (printerAddressOverride && fullOrder.printerAssigned) {
        await db.update(printPressUsers)
            .set({
                fullName: printerAddressOverride.fullName,
                phone: printerAddressOverride.phone,
                address: printerAddressOverride.address,
                city: printerAddressOverride.city,
                state: printerAddressOverride.state,
                postalCode: printerAddressOverride.postalCode,
                country: printerAddressOverride.country,
                updatedAt: new Date()
            })
            .where(eq(printPressUsers.id, fullOrder.printerAssigned));
    }

    const updatedOrder = (customerAddressOverride || printerAddressOverride)
        ? await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                user: { columns: { name: true, email: true, phone: true } },
                product: true,
                subProduct: true,
                directSellingProduct: true,
                printer: true,
            },
        })
        : fullOrder;

    if (!updatedOrder || !updatedOrder.printer) {
        throw new Error('Could not find order or assigned printer details after updating');
    }

    const requestedDims = shipment.requestedDimensions as { length?: number; breadth?: number; height?: number; weight?: number } | null;
    const finalDimensions = {
        length: dimensionOverrides?.length ?? requestedDims?.length,
        breadth: dimensionOverrides?.breadth ?? requestedDims?.breadth,
        height: dimensionOverrides?.height ?? requestedDims?.height,
        weight: dimensionOverrides?.weight ?? requestedDims?.weight,
    };

    const shiprocketResult = await createShiprocketShipment(
        updatedOrder,
        updatedOrder.printer,
        finalDimensions,
        shipment.attachmentsUrl || undefined
    );

    try {
        await recordOrderLog({
            orderId,
            actionType: 'shipping_approved',
            message: `Admin approved shipping request. Shiprocket order created. AWB: ${shiprocketResult.awbCode || 'Pending'}, Courier: ${shiprocketResult.courierName || 'Assigned'}.`,
            isCustomerVisible: true,
        });
    } catch (e) {
        console.error('Failed to log shipping approval:', e);
    }

    revalidatePath('/admin/printers/shipments');
    revalidatePath('/printer/shipments');
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, awbCode: shiprocketResult.awbCode };
}

// Admin: Reject Shipping Request
export async function adminRejectShippingRequest(orderId: number, reason: string) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });

    if (!shipment) {
        throw new Error('No shipping request found for this order');
    }

    await db.update(shipments)
        .set({
            shippingRequestStatus: 'rejected',
            shippingRejectedAt: new Date(),
            shippingRejectionReason: reason || 'No reason provided',
            status: 'shipping_rejected',
            currentStatus: 'shipping_rejected',
            updatedAt: new Date(),
        })
        .where(eq(shipments.orderId, orderId));

    await db.update(orders)
        .set({
            orderStatus: 'processing',
            updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

    try {
        await recordOrderLog({
            orderId,
            actionType: 'shipping_rejected',
            message: `Admin rejected shipping request. Reason: ${reason || 'N/A'}. Order reverted to processing.`,
            isCustomerVisible: true,
        });
    } catch (e) {
        console.error('Failed to log shipping rejection:', e);
    }

    revalidatePath('/admin/printers/shipments');
    revalidatePath('/printer/shipments');
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
}

// Admin: Download Shiprocket Invoice
export async function adminDownloadShiprocketInvoice(orderId: number) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shiprocketOrderId) {
        throw new Error('No Shiprocket order found for this shipment. Invoice is only available for Shiprocket-shipped orders.');
    }

    const result = await printShiprocketInvoice([shipment.shiprocketOrderId]);
    return result;
}

// Printer: Download Shiprocket Invoice
export async function downloadShiprocketInvoice(orderId: number) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.printerAssigned, session.sub)),
        columns: { id: true },
    });
    if (!order) throw new Error('Order not found or not assigned to you');

    const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.orderId, orderId),
    });
    if (!shipment || !shipment.shiprocketOrderId) {
        throw new Error('No Shiprocket order found for this shipment. Invoice is only available for Shiprocket-shipped orders.');
    }

    const result = await printShiprocketInvoice([shipment.shiprocketOrderId]);
    return result;
}
