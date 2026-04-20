

'use server';

import { z } from 'zod';
import { db } from '@/db';
import { orders, designs, designUploads, products, subProducts } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
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
    
    const unitPrice = parseFloat(subProductInfo.price);
    const totalAmount = unitPrice * quantity;

    const result = await db.insert(orders).values({
        userId: session.sub,
        productId,
        subProductId,
        designId,
        designUploadId: uploadId,
        quantity,
        unitPrice: String(unitPrice),
        totalAmount: String(totalAmount),
        shippingAddress: shippingAddress as any,
        billingAddress: billingAddress as any,
        paymentMethod: 'Card', // Placeholder
        paymentStatus: 'paid', // Placeholder
        orderStatus: 'confirmed',
        paymentId,
    }).returning();
    
    revalidatePath('/client/orders');
    return result[0];
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

    // 1. Find the most specific base price for the quantity
    const standardRule = pricingRules.find(r => !r.isDiscount && !r.isContest && !r.isVerification && quantity >= (r.minQuantity || 1) && (!r.maxQuantity || quantity <= r.maxQuantity));
    if (standardRule && standardRule.unitPrice) {
        baseUnitPrice = Number(standardRule.unitPrice);
        finalUnitPrice = baseUnitPrice;
    }

    const originalTotal = baseUnitPrice * quantity;

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

    const total = finalUnitPrice * quantity;

    return { ...details, unitPrice: finalUnitPrice, total, originalTotal, discountDescription, totalDiscount };
}

export async function getMyOrders() {
    const session = await getSession();
    if (!session?.sub) {
        return [];
    }

    const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, session.sub),
        with: {
            product: true,
            subProduct: true,
            design: true,
            designUpload: true,
            directSellingProduct: true,
        },
        orderBy: [desc(orders.createdAt)]
    });

    return userOrders;
}

export async function getAdminAllOrders() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    return await db.query.orders.findMany({
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
        },
        orderBy: [desc(orders.createdAt)],
    });
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
        },
    });

    if (!order) {
        return null;
    }
    return order;
}
