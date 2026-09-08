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

// Helper to verify freelancer
async function verifyFreelancer() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'freelancer') {
        throw new Error('Unauthorized: Freelancer access required');
    }
    return session;
}

const jsonOrObjectField = z.preprocess((val) => {
    if (!val || val === '') return undefined;
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        } catch {
            return undefined;
        }
    }
    return val;
}, z.any().optional());

const sizesField = z.preprocess((val) => {
    if (!val) return [];
    if (typeof val === 'string') {
        if (!val.trim()) return [];
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return val.split(',').map(s => ({ name: s.trim() })).filter(s => s.name);
        }
    }
    return val;
}, z.array(z.any()).optional().default([]));

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

const jsonObjectField = z.preprocess((val) => {
  if (!val) return {};
  if (typeof val === 'string') {
    if (!val.trim()) return {};
    try { return JSON.parse(val); } catch { return {}; }
  }
  return val;
}, z.record(z.any()).optional().default({}));

const offersField = z.preprocess((val) => {
  if (!val) return [];
  if (typeof val === 'string') {
    if (!val.trim()) return [];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch { return []; }
  }
  return val;
}, z.array(z.any()).optional().default([]));

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
  dimensions: jsonOrObjectField,
  sizes: sizesField,
  attributes: z.preprocess((val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return val;
  }, z.array(z.any()).optional().default([])),
  variations: z.preprocess((val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return val;
  }, z.array(z.any()).optional().default([])),
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
  offers: offersField,
  offerBadge: z.string().optional().nullable(),
  specifications: jsonObjectField,
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: jsonOrObjectField,
  shippingInfo: jsonObjectField,
  textAllowed: z.boolean().default(false),
});

// Admin: Get all direct selling products with printer and freelancer info
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
            freelancer: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
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

// Admin: Get a single direct selling product by ID with details
export async function getDirectSellingProductById(id: number) {
    await verifyAdmin();
    if (!id || isNaN(id)) return null;
    return await db.query.directSellingProducts.findFirst({
        where: eq(directSellingProducts.id, id),
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
            freelancer: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
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
      attributes: validatedData.attributes || [],
      variations: validatedData.variations || [],
      taxSlabs: validatedData.taxSlabs || [],
      priceSlabs: validatedData.priceSlabs || [],
      offers: validatedData.offers || [],
      offerBadge: validatedData.offerBadge || null,
      specifications: validatedData.specifications || {},
      shippingInfo: validatedData.shippingInfo || {},
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
      attributes: validatedData.attributes || [],
      variations: validatedData.variations || [],
      taxSlabs: validatedData.taxSlabs || [],
      priceSlabs: validatedData.priceSlabs || [],
      offers: validatedData.offers || [],
      offerBadge: validatedData.offerBadge || null,
      specifications: validatedData.specifications || {},
      shippingInfo: validatedData.shippingInfo || {},
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
          attributes: validatedData.attributes || [],
          variations: validatedData.variations || [],
          taxSlabs: validatedData.taxSlabs || [],
          priceSlabs: validatedData.priceSlabs || [],
          offers: validatedData.offers || [],
          offerBadge: validatedData.offerBadge || null,
          specifications: validatedData.specifications || {},
          shippingInfo: validatedData.shippingInfo || {},
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
          attributes: validatedData.attributes || [],
          variations: validatedData.variations || [],
          taxSlabs: validatedData.taxSlabs || [],
          priceSlabs: validatedData.priceSlabs || [],
          offers: validatedData.offers || [],
          offerBadge: validatedData.offerBadge || null,
          specifications: validatedData.specifications || {},
          shippingInfo: validatedData.shippingInfo || {},
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

// Freelancer: Get only this freelancer's products
export async function getFreelancerDirectSellingProducts() {
    const session = await verifyFreelancer();
    return await db.query.directSellingProducts.findMany({
        where: eq(directSellingProducts.freelancerId, session.sub),
        orderBy: [desc(directSellingProducts.createdAt)],
    });
}

// Freelancer: Get single direct selling product owned by freelancer
export async function getFreelancerDirectSellingProductById(id: number) {
    const session = await verifyFreelancer();
    if (!id || isNaN(id)) return null;
    return await db.query.directSellingProducts.findFirst({
        where: and(
            eq(directSellingProducts.id, id),
            eq(directSellingProducts.freelancerId, session.sub)
        ),
    });
}

// Freelancer: Create product (starts in pending approval status)
export async function createFreelancerDirectSellingProduct(data: z.infer<typeof formSchema>) {
    const session = await verifyFreelancer();
    const validatedData = formSchema.parse(data);
    const result = await db.insert(directSellingProducts).values({
      ...validatedData,
      sizes: validatedData.sizes || [],
      attributes: validatedData.attributes || [],
      variations: validatedData.variations || [],
      taxSlabs: validatedData.taxSlabs || [],
      priceSlabs: validatedData.priceSlabs || [],
      offers: validatedData.offers || [],
      offerBadge: validatedData.offerBadge || null,
      specifications: validatedData.specifications || {},
      shippingInfo: validatedData.shippingInfo || {},
      hsnCode: validatedData.hsnCode || null,
      addedBy: 'freelancer',
      freelancerId: session.sub,
      approvalStatus: 'pending',
      rejectionReason: null,
      imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).returning();

    revalidatePath('/freelancer/direct-selling');
    revalidatePath('/admin/direct-selling');
    return result[0];
}

// Freelancer: Update freelancer's own product (resets to pending for review)
export async function updateFreelancerDirectSellingProduct(id: number, data: z.infer<typeof formSchema>) {
    const session = await verifyFreelancer();
    
    // Verify ownership
    const existing = await db.query.directSellingProducts.findFirst({
        where: and(
            eq(directSellingProducts.id, id),
            eq(directSellingProducts.freelancerId, session.sub)
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
          attributes: validatedData.attributes || [],
          variations: validatedData.variations || [],
          taxSlabs: validatedData.taxSlabs || [],
          priceSlabs: validatedData.priceSlabs || [],
          offers: validatedData.offers || [],
          offerBadge: validatedData.offerBadge || null,
          specifications: validatedData.specifications || {},
          shippingInfo: validatedData.shippingInfo || {},
          hsnCode: validatedData.hsnCode || null,
          approvalStatus: 'pending',
          rejectionReason: null,
          imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
          tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
          updatedAt: new Date() 
        })
        .where(and(
            eq(directSellingProducts.id, id),
            eq(directSellingProducts.freelancerId, session.sub)
        ))
        .returning();

    revalidatePath('/freelancer/direct-selling');
    revalidatePath('/admin/direct-selling');
    revalidatePath('/products');
    revalidatePath('/');
    return result[0];
}

// Freelancer: Delete own direct selling product
export async function deleteFreelancerDirectSellingProduct(id: number) {
    const session = await verifyFreelancer();
    await db.delete(directSellingProducts).where(and(
        eq(directSellingProducts.id, id),
        eq(directSellingProducts.freelancerId, session.sub)
    ));
    revalidatePath('/freelancer/direct-selling');
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
        const sellingPrice = parseFloat(item.sellingPrice || item.unitPrice || '0');
        if (isNaN(sellingPrice)) {
            throw new Error(`Invalid selling price for product: ${item.name || 'Direct Product'}`);
        }
        const qty = Number(item.quantity) || 1;
        const calculatedTotal = item.totalAmount ? parseFloat(item.totalAmount) : (sellingPrice * qty);
        const totalAmount = isNaN(calculatedTotal) ? (sellingPrice * qty) : calculatedTotal;

        const selectedSize = item.selectedSize || 
            item.selectedAttributes?.['Size'] || 
            item.selectedAttributes?.['Size / Dimensions'] || 
            item.selectedAttributes?.['Dimensions'] || 
            undefined;

        const selectedAttributesFormatted = item.selectedAttributesFormatted || 
            (item.selectedAttributes && typeof item.selectedAttributes === 'object'
                ? Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')
                : undefined);

        return {
            userId: session.sub,
            directSellingProductId: item.id || item.productId || item.directSellingProductId,
            printerAssigned: null,
            printerAssignedAt: null,
            quantity: qty,
            unitPrice: String(sellingPrice.toFixed(2)),
            totalAmount: String(totalAmount.toFixed(2)),
            shippingAddress: shippingAddress,
            billingAddress: shippingAddress,
            paymentMethod: 'Online Payment',
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            selectedSize: selectedSize,
            customisation: {
                productName: item.name,
                productCategory: item.category,
                productImage: item.image || item.imageUrl || (item.images && item.images[0]),
                sku: item.sku,
                hsnCode: item.hsnCode,
                selectedAttributes: item.selectedAttributes || {},
                selectedAttributesFormatted: selectedAttributesFormatted,
                selectedSize: selectedSize,
                customText: item.customText || undefined,
                shippingFee: item.shippingFee !== undefined ? Number(item.shippingFee) : 0,
                deliveryMode: item.deliveryMode || 'standard',
                taxDetails: item.taxDetails || [],
                taxAmount: item.taxAmount !== undefined ? Number(item.taxAmount) : 0,
                pricingBreakdown: item.pricingBreakdown || {
                    unitPrice: sellingPrice.toFixed(2),
                    quantity: qty,
                    productSubtotal: (sellingPrice * qty).toFixed(2),
                    totalAmount: totalAmount.toFixed(2),
                },
                ...(item.customisation || {}),
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
