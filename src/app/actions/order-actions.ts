

'use server';

import { z } from 'zod';
import { db } from '@/db';
import { orders, designs, designUploads, products, subProducts, printPressUsers, orderLogs, users, payments } from '@/db/schema';
import { and, eq, desc, count, ilike, sql, gte, lte, or, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import type { Address } from '@/lib/types';
import { getPricingRulesForSubProduct } from './pricing-actions';

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
        const subProduct = subProductId ? await db.query.subProducts.findFirst({ where: eq(subProducts.id, subProductId)}) : null;
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
    startDate = '',
    endDate = ''
}: {
    page?: number;
    limit?: number;
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

    const conditions = [];

    if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(orders.orderStatus, statusFilter));
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

    return {
        total: { amount: Number(totalStats.totalAmount), count: totalStats.count },
        today: { amount: Number(todayStats.totalAmount), count: todayStats.count },
        filtered: { amount: Number(filteredStats.totalAmount), count: filteredStats.count }
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

export async function assignPrinterToOrder(orderId: number, printerId: string | null) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    // Automatically update order status when printer is assigned
    const newStatus = printerId ? 'processing' : 'confirmed';

    // Get current order state for logging
    const currentOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { printerAssigned: true, orderStatus: true }
    });

    await db.update(orders)
        .set({ 
            printerAssigned: printerId, 
            orderStatus: newStatus,
            updatedAt: new Date() 
        })
        .where(eq(orders.id, orderId));

    // Log printer assignment
    try {
        await recordOrderLog({
            orderId,
            actionType: 'printer_assigned',
            oldValue: { printer: currentOrder?.printerAssigned, status: currentOrder?.orderStatus },
            newValue: { printer: printerId, status: newStatus },
            message: printerId ? `Order assigned to printer and moved to production` : `Order unassigned and returned to confirmed status`
        });
    } catch (e) {
        console.error('Failed to log printer assignment:', e);
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

    return await db.query.printPressUsers.findMany({
        where: eq(printPressUsers.isApproved, true),
        columns: {
            id: true,
            fullName: true,
            companyName: true,
            city: true
        }
    });
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
        },
    });

    return order;
}

export async function updatePrinterOrderStatus(orderId: number, newStatus: string) {
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

    const allowedStatuses = ['pending', 'confirmed', 'quality_check', 'processing', 'shipped'];
    if (!allowedStatuses.includes(newStatus)) {
        throw new Error('Invalid status for printer update');
    }

    await db.update(orders)
        .set({
            orderStatus: newStatus,
            updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

    try {
        await recordOrderLog({
            orderId,
            actionType: 'status_changed',
            oldValue: { status: currentOrder.orderStatus },
            newValue: { status: newStatus },
            message: `Printer updated status to ${newStatus.replace(/_/g, ' ')}`,
            isCustomerVisible: true
        });
    } catch (e) {
        console.error('Failed to log order status update:', e);
    }

    revalidatePath(`/printer/orders/${orderId}`);
    revalidatePath('/printer/orders');
    return { success: true };
}
