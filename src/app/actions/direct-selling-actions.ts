
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { orders, directSellingProducts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

// Helper to verify admin
async function verifyAdmin() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }
}

const arrayFromString = z.string().transform((val) => (val ? val.split(',').map(s => s.trim()).filter(Boolean) : []));

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


const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().optional().default(0),
  minStockLevel: z.coerce.number().int().optional().default(5),
  weight: z.coerce.number().optional(),
  dimensions: jsonFromString.optional(),
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: jsonFromString.optional(),
  shippingInfo: jsonFromString.optional(),
});


export async function getDirectSellingProducts() {
    await verifyAdmin();
    return await db.query.directSellingProducts.findMany({
        orderBy: [desc(directSellingProducts.createdAt)],
    });
}

export async function createDirectSellingProduct(data: z.infer<typeof formSchema>) {
    await verifyAdmin();
    const validatedData = formSchema.parse(data);
    const result = await db.insert(directSellingProducts).values({
      ...validatedData,
      imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).returning();
    revalidatePath('/admin/direct-selling');
    return result[0];
}

export async function updateDirectSellingProduct(id: number, data: z.infer<typeof formSchema>) {
    await verifyAdmin();
    const validatedData = formSchema.parse(data);
    const result = await db.update(directSellingProducts)
        .set({ 
          ...validatedData, 
          imageUrls: validatedData.imageUrls ? validatedData.imageUrls.split(',').map(s => s.trim()).filter(Boolean) : [],
          tags: validatedData.tags ? validatedData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
          updatedAt: new Date() 
        })
        .where(eq(directSellingProducts.id, id))
        .returning();
    revalidatePath('/admin/direct-selling');
    return result[0];
}

export async function deleteDirectSellingProduct(id: number) {
    await verifyAdmin();
    await db.delete(directSellingProducts).where(eq(directSellingProducts.id, id));
    revalidatePath('/admin/direct-selling');
}

export async function getPublicDirectSellingProducts() {
    return await db.query.directSellingProducts.findMany({
        where: eq(directSellingProducts.isActive, true),
        orderBy: [desc(directSellingProducts.isFeatured), desc(directSellingProducts.createdAt)],
        // limit: 4, We can show more now
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
        const totalAmount = sellingPrice * item.quantity;
        return {
            userId: session.sub,
            directSellingProductId: item.id,
            quantity: item.quantity,
            unitPrice: String(sellingPrice),
            totalAmount: String(totalAmount),
            shippingAddress: shippingAddress,
            billingAddress: shippingAddress, // Using shipping for billing for simplicity
            paymentMethod: 'Card', // Placeholder
            paymentStatus: 'paid', // Placeholder
            orderStatus: 'confirmed',
            paymentId: paymentId,
        };
    });

    const newOrders = await db.insert(orders).values(orderValues).returning();
    
    revalidatePath('/client/orders');
    revalidatePath('/freelancer/orders');
    revalidatePath('/admin/orders');

    return { success: true, orderIds: newOrders.map(o => o.id) };
}
