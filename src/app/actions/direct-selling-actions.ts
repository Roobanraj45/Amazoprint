'use server';

import { z } from 'zod';
import { db } from '@/db';
import { orders, directSellingProducts, printPressUsers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { recordOrderLog } from './order-actions';

// Helper to verify admin
async function verifyAdmin() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized: Admin access required');
    }
    return session;
}

// Helper to verify printer
async function verifyPrinter() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized: Printer access required');
    }
    return session;
}

const jsonFromString = z.string().transform((val, ctx) => {
    if (!val || val.trim() === '') return undefined;
    try {
        return JSON.parse(val);
    } catch (e) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON format',
        });
        return z.NEVER;
    }
});

const sizesField = z.preprocess((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
        if (!val.trim()) return undefined;
        try {
            return JSON.parse(val);
        } catch {
            return val.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return val;
}, z.any().optional());

const taxSlabSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tax name is required'),
  rate: z.coerce.number().min(0, 'Tax rate must be non-negative'),
  type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  isInclusive: z.boolean().optional().default(false),
  isActive: z.boolean().default(true),
});

const priceSlabSchema = z.object({
  id: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true),
});

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  sku: z.string().optional(),
  hsnCode: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().optional().default(0),
  minStockLevel: z.coerce.number().int().optional().default(5),
  weight: z.coerce.number().optional(),
  dimensions: jsonFromString.optional(),
  sizes: sizesField,
  taxSlabs: z.preprocess((val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return val;
  }, z.array(taxSlabSchema).optional().default([])),
  priceSlabs: z.preprocess((val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return val;
  }, z.array(priceSlabSchema).optional().default([])),
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: jsonFromString.optional(),
  shippingInfo: jsonFromString.optional(),
  textAllowed: z.boolean().default(false),
});

// Admin: Get all direct selling products with printer info
export async function getDirectSellingProducts() {
    await verifyAdmin();
    return await db.query.directSellingProducts.findMany({
        orderBy: [desc(directSellingProducts.createdAt)],
        with: {
            printer: {
                columns: {
                    id: true,
                    fullName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                    city: true,
                }
            },
            approvedByAdmin: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });
}

// Printer: Get only this printer's products
export async function getPrinterDirectSellingProducts() {
    const session = await verifyPrinter();
    return await db.query.directSellingProducts.findMany({
        where: eq(directSellingProducts.printerId, session.sub),
        orderBy: [desc(directSellingProducts.createdAt)],
    });
}

// Admin: Create product (automatically approved)
export async function createDirectSellingProduct(data: z.infer<typeof formSchema>) {
    const session = await verifyAdmin();
    const validatedData = formSchema.parse(data);
    const result = await db.insert(directSellingProducts).values({
      ...validatedData,
      sizes: validatedData.sizes || [],
      taxSlabs: validatedData.taxSlabs || [],
      priceSlabs: validatedData.priceSlabs || [],
      hsnCode: validatedData.hsnCode || null,
      addedBy: 'admin',
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedBy: session.sub,
      imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).returning();

    revalidatePath('/admin/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
    return result[0];
}

// Printer: Create product (starts in pending approval status)
export async function createPrinterDirectSellingProduct(data: z.infer<typeof formSchema>) {
    const session = await verifyPrinter();
    const validatedData = formSchema.parse(data);
    const result = await db.insert(directSellingProducts).values({
      ...validatedData,
      sizes: validatedData.sizes || [],
      taxSlabs: validatedData.taxSlabs || [],
      priceSlabs: validatedData.priceSlabs || [],
      hsnCode: validatedData.hsnCode || null,
      addedBy: 'printer',
      printerId: session.sub,
      approvalStatus: 'pending',
      rejectionReason: null,
      imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).returning();

    revalidatePath('/printer/direct-selling');
    revalidatePath('/admin/direct-selling');
    return result[0];
}

// Admin: Update any direct selling product
export async function updateDirectSellingProduct(id: number, data: z.infer<typeof formSchema>) {
    await verifyAdmin();
    const validatedData = formSchema.parse(data);
    const result = await db.update(directSellingProducts)
        .set({ 
          ...validatedData, 
          sizes: validatedData.sizes || [],
          taxSlabs: validatedData.taxSlabs || [],
          priceSlabs: validatedData.priceSlabs || [],
          hsnCode: validatedData.hsnCode || null,
          imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
          tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
          updatedAt: new Date() 
        })
        .where(eq(directSellingProducts.id, id))
        .returning();

    revalidatePath('/admin/direct-selling');
    revalidatePath('/printer/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
    return result[0];
}

// Printer: Update printer's own product (resets to pending for review)
export async function updatePrinterDirectSellingProduct(id: number, data: z.infer<typeof formSchema>) {
    const session = await verifyPrinter();
    
    // Verify ownership
    const existing = await db.query.directSellingProducts.findFirst({
        where: and(
            eq(directSellingProducts.id, id),
            eq(directSellingProducts.printerId, session.sub)
        ),
    });

    if (!existing) {
        throw new Error('Product not found or you do not have permission to edit it.');
    }

    const validatedData = formSchema.parse(data);
    const result = await db.update(directSellingProducts)
        .set({ 
          ...validatedData, 
          sizes: validatedData.sizes || [],
          taxSlabs: validatedData.taxSlabs || [],
          priceSlabs: validatedData.priceSlabs || [],
          hsnCode: validatedData.hsnCode || null,
          approvalStatus: 'pending',
          rejectionReason: null,
          imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
          tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
          updatedAt: new Date() 
        })
        .where(and(
            eq(directSellingProducts.id, id),
            eq(directSellingProducts.printerId, session.sub)
        ))
        .returning();

    revalidatePath('/printer/direct-selling');
    revalidatePath('/admin/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
    return result[0];
}

// Admin: Delete any direct selling product
export async function deleteDirectSellingProduct(id: number) {
    await verifyAdmin();
    await db.delete(directSellingProducts).where(eq(directSellingProducts.id, id));
    revalidatePath('/admin/direct-selling');
    revalidatePath('/printer/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
}

// Printer: Delete own direct selling product
export async function deletePrinterDirectSellingProduct(id: number) {
    const session = await verifyPrinter();
    await db.delete(directSellingProducts).where(and(
        eq(directSellingProducts.id, id),
        eq(directSellingProducts.printerId, session.sub)
    ));
    revalidatePath('/printer/direct-selling');
    revalidatePath('/admin/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
}

// Admin: Approve a pending product
export async function approveDirectSellingProduct(id: number) {
    const session = await verifyAdmin();
    const result = await db.update(directSellingProducts)
        .set({
            approvalStatus: 'approved',
            approvedAt: new Date(),
            approvedBy: session.sub,
            rejectionReason: null,
            isActive: true,
            updatedAt: new Date(),
        })
        .where(eq(directSellingProducts.id, id))
        .returning();

    revalidatePath('/admin/direct-selling');
    revalidatePath('/printer/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
    return { success: true, product: result[0] };
}

// Admin: Reject a direct product with reason
export async function rejectDirectSellingProduct(id: number, reason: string) {
    await verifyAdmin();
    if (!reason || !reason.trim()) {
        throw new Error('Please provide a reason for rejecting this product.');
    }

    const result = await db.update(directSellingProducts)
        .set({
            approvalStatus: 'rejected',
            rejectionReason: reason.trim(),
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(directSellingProducts.id, id))
        .returning();

    revalidatePath('/admin/direct-selling');
    revalidatePath('/printer/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
    return { success: true, product: result[0] };
}

// Public catalog: Only show approved & active products
export async function getPublicDirectSellingProducts() {
    return await db.query.directSellingProducts.findMany({
        where: and(
            eq(directSellingProducts.isActive, true),
            eq(directSellingProducts.approvalStatus, 'approved')
        ),
        orderBy: [desc(directSellingProducts.isFeatured), desc(directSellingProducts.createdAt)],
    });
}

// Public catalog: Get single approved & active direct selling product by ID
export async function getPublicDirectSellingProductById(id: number) {
    if (!id || isNaN(id)) return null;
    return await db.query.directSellingProducts.findFirst({
        where: and(
            eq(directSellingProducts.id, id),
            eq(directSellingProducts.isActive, true),
            eq(directSellingProducts.approvalStatus, 'approved')
        ),
    });
}

export async function placeDirectOrder(items: any[], shippingAddress: any, paymentId: number) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to place an order.');
    }

    if (!items || items.length === 0) {
        throw new Error('Your cart is empty.');
    }

    const orderValues = items.map(item => {
        const sellingPrice = parseFloat(item.sellingPrice);
        if (isNaN(sellingPrice)) {
            throw new Error(`Invalid selling price for product: ${item.name}`);
        }
        const calculatedTotal = item.totalAmount ? parseFloat(item.totalAmount) : (sellingPrice * item.quantity);
        const totalAmount = isNaN(calculatedTotal) ? (sellingPrice * item.quantity) : calculatedTotal;

        return {
            userId: session.sub,
            directSellingProductId: item.id,
            printerAssigned: null,
            printerAssignedAt: null,
            quantity: item.quantity,
            unitPrice: String(sellingPrice),
            totalAmount: String(totalAmount.toFixed(2)),
            shippingAddress: shippingAddress,
            billingAddress: shippingAddress, // Using shipping for billing for simplicity
            paymentMethod: 'Card', // Placeholder
            paymentStatus: 'paid', // Placeholder
            orderStatus: 'confirmed',
            selectedSize: item.selectedSize || undefined,
            customisation: {
                ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
                ...(item.customText ? { customText: item.customText } : {}),
            },
            specialInstructions: item.customText || undefined,
            paymentId: paymentId,
        };
    });

    // 1. Verify stock availability and reduce stock
    for (const item of items) {
        if (!item.id) continue;
        const dbProduct = await db.query.directSellingProducts.findFirst({
            where: eq(directSellingProducts.id, item.id),
        });

        if (dbProduct) {
            const currentStock = typeof dbProduct.stockQuantity === 'number' ? dbProduct.stockQuantity : (parseInt(dbProduct.stockQuantity as any) || 0);
            if (currentStock < item.quantity) {
                throw new Error(`Insufficient stock for "${dbProduct.name}". Only ${currentStock} item(s) available in stock.`);
            }

            const newStock = Math.max(0, currentStock - item.quantity);
            await db.update(directSellingProducts)
                .set({
                    stockQuantity: newStock,
                    updatedAt: new Date()
                })
                .where(eq(directSellingProducts.id, item.id));
        }
    }

    const newOrders = await db.insert(orders).values(orderValues).returning();
    
    // Log direct order creation
    for (const order of newOrders) {
        try {
            await recordOrderLog({
                orderId: order.id,
                actionType: 'order_created',
                newValue: { status: 'confirmed', total: order.totalAmount },
                message: `Direct sale order created by ${session.name || 'customer'}`
            });
        } catch (e) {
            console.error(`Failed to log direct order creation for order ${order.id}:`, e);
        }
    }
    
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath('/admin/direct-selling');
    revalidatePath('/printer/direct-selling');
    revalidatePath('/client/orders');
    revalidatePath('/freelancer/orders');
    revalidatePath('/admin/orders');
    revalidatePath('/printer/orders');

    return { success: true, orderIds: newOrders.map(o => o.id) };
}
