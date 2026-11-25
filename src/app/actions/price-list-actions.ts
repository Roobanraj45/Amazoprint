'use server';

import { z } from 'zod';
import { db } from '@/db';
import { printPriceLists } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

const specColumnSchema = z.object({
    name: z.string().trim().min(1),
    value: z.string().trim().default(''),
});

const quantityTierSchema = z.object({
    quantity: z.coerce.number().int().positive(),
    singleSidePrice: z.string().trim().default(''),
    doubleSidePrice: z.string().trim().default(''),
    workingDays: z.string().trim().default(''),
    hsnCode: z.string().trim().default(''),
    gstPercentage: z.string().trim().default(''),
});

const priceListItemSchema = z.object({
    id: z.string().uuid().optional(),
    catalogName: z.string().max(255).nullable().optional(),
    imageUrl: z.string().optional().default(''),
    categoryName: z.string().min(1, 'Category name is required').max(255),
    subCategory: z.string().max(255).nullable().optional(),
    productName: z.string().min(1, 'Product name is required').max(255),
    size: z.string().max(100).nullable().optional(),
    gsm: z.string().max(50).nullable().optional(),
    paperType: z.string().max(100).nullable().optional(),
    finishType: z.string().max(100).nullable().optional(),
    colorType: z.string().max(100).nullable().optional(),
    laminationType: z.string().max(100).nullable().optional(),
    qty250: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).nullable().optional()
    ),
    qty500: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).nullable().optional()
    ),
    qty1000: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).nullable().optional()
    ),
    qty5000: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).nullable().optional()
    ),
    specColumns: z.array(specColumnSchema).optional(),
    quantityTiers: z.array(quantityTierSchema).optional(),
    shippingType: z.enum(['included', 'excluded']).default('excluded').optional(),
    packagingCost: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().min(0).nullable().optional()
    ),
    currency: z.string().max(10).default('INR'),
    isGlossy: z.boolean().default(false),
    isMatt: z.boolean().default(false),
    isFAndB: z.boolean().default(false),
    isActive: z.boolean().default(true),
    displayOrder: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
        z.number().int().default(0)
    ),
    remarks: z.string().nullable().optional(),
});

export async function savePriceListItem(data: z.infer<typeof priceListItemSchema>) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const validated = priceListItemSchema.parse(data);

    const values = {
        printPressUserId: session.sub,
        catalogName: validated.catalogName || null,
        imageUrl: validated.imageUrl,
        categoryName: validated.categoryName,
        subCategory: validated.subCategory || null,
        productName: validated.productName,
        size: validated.size || null,
        gsm: validated.gsm || null,
        paperType: validated.paperType || null,
        finishType: validated.finishType || null,
        colorType: validated.colorType || null,
        laminationType: validated.laminationType || null,
        qty250: validated.qty250 ? String(validated.qty250) : null,
        qty500: validated.qty500 ? String(validated.qty500) : null,
        qty1000: validated.qty1000 ? String(validated.qty1000) : null,
        qty5000: validated.qty5000 ? String(validated.qty5000) : null,
        specColumns: validated.specColumns || [],
        quantityTiers: validated.quantityTiers || [],
        shippingType: validated.shippingType || 'excluded',
        packagingCost: validated.packagingCost !== undefined && validated.packagingCost !== null ? String(validated.packagingCost) : null,
        approvalStatus: 'pending' as const,
        currency: validated.currency,
        isGlossy: validated.isGlossy,
        isMatt: validated.isMatt,
        isFAndB: validated.isFAndB,
        isActive: validated.isActive,
        displayOrder: validated.displayOrder,
        remarks: validated.remarks || null,
        updatedAt: new Date()
    };

    if (validated.id) {
        // Update existing item
        // Verify owner first
        const existing = await db.query.printPriceLists.findFirst({
            where: and(eq(printPriceLists.id, validated.id), eq(printPriceLists.printPressUserId, session.sub))
        });
        if (!existing) {
            throw new Error('Item not found or unauthorized');
        }

        await db.update(printPriceLists)
            .set(values)
            .where(eq(printPriceLists.id, validated.id));
    } else {
        // Insert new item
        await db.insert(printPriceLists).values({
            ...values,
            createdAt: new Date()
        });
    }

    revalidatePath('/printer/price-list');
    return { success: true };
}

export async function getPrinterPriceList() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    return await db.query.printPriceLists.findMany({
        where: eq(printPriceLists.printPressUserId, session.sub),
        orderBy: [desc(printPriceLists.createdAt)]
    });
}

export async function getAllPriceListsAdmin() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    return await db.query.printPriceLists.findMany({
        with: {
            printer: {
                columns: {
                    fullName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                    city: true,
                },
            },
        },
        orderBy: [desc(printPriceLists.createdAt)],
    });
}

export async function updatePriceListApprovalAdmin(
    id: string,
    approvalStatus: 'approved' | 'rejected',
    adminNotes?: string
) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    await db.update(printPriceLists)
        .set({
            approvalStatus,
            ...(adminNotes !== undefined ? { adminNotes } : {}),
            updatedAt: new Date(),
        })
        .where(eq(printPriceLists.id, id));

    revalidatePath('/admin/printer-price-lists');
    revalidatePath('/admin/printers');
    revalidatePath('/printer/price-list');
    return { success: true };
}

export async function deletePriceListItem(id: string) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    // Verify owner first
    const existing = await db.query.printPriceLists.findFirst({
        where: and(eq(printPriceLists.id, id), eq(printPriceLists.printPressUserId, session.sub))
    });
    if (!existing) {
        throw new Error('Item not found or unauthorized');
    }

    await db.delete(printPriceLists)
        .where(eq(printPriceLists.id, id));

    revalidatePath('/printer/price-list');
    return { success: true };
}
