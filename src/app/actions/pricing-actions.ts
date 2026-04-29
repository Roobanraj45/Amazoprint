'use server';

import { z } from 'zod';
import { db } from '@/db';
import { subProductPricing, products, subProducts } from '@/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const pricingRuleSchema = z.object({
  subProductId: z.number(),
  minQuantity: z.coerce.number().optional().nullable(),
  maxQuantity: z.coerce.number().optional().nullable(),
  unitPrice: z.coerce.number().optional().nullable(),
  minParticipants: z.coerce.number().optional().nullable(),
  maxParticipants: z.coerce.number().optional().nullable(),
  contestPrice: z.coerce.number().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  discountValue: z.coerce.number().optional().nullable(),
  designVerificationFee: z.coerce.number().optional().nullable(),
  isContest: z.boolean().default(false),
  isVerification: z.boolean().default(false),
  isDiscount: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // Add-on fields
  addonPriceAmount: z.coerce.number().optional().nullable(),
  addonName: z.string().optional().nullable(),
  isAddon: z.boolean().default(false),
});

export async function createPricingRule(data: z.infer<typeof pricingRuleSchema>) {
    const validatedData = pricingRuleSchema.parse(data);
    const result = await db.insert(subProductPricing).values(validatedData).returning();
    revalidatePath('/admin/pricing');
    return result[0];
}

export async function updatePricingRule(id: number, data: z.infer<typeof pricingRuleSchema>) {
    const validatedData = pricingRuleSchema.parse(data);
    const result = await db.update(subProductPricing)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(subProductPricing.id, id))
        .returning();
    revalidatePath('/admin/pricing');
    return result[0];
}

export async function deletePricingRule(id: number) {
    await db.delete(subProductPricing).where(eq(subProductPricing.id, id));
    revalidatePath('/admin/pricing');
}

export async function getProductsWithPricing() {
    return await db.query.products.findMany({
        orderBy: [asc(products.createdAt)],
        with: {
            subProducts: {
                orderBy: [asc(subProducts.name)],
                with: {
                    pricingRules: {
                        orderBy: [desc(subProductPricing.createdAt)]
                    }
                }
            }
        }
    });
}

export async function getContestPricingRules(subProductId: number) {
    return await db.query.subProductPricing.findMany({
        where: and(
            eq(subProductPricing.subProductId, subProductId),
            eq(subProductPricing.isContest, true),
            eq(subProductPricing.isActive, true)
        ),
        orderBy: [asc(subProductPricing.minParticipants)]
    });
}

export async function getPricingRulesForSubProduct(subProductId: number) {
    return await db.query.subProductPricing.findMany({
        where: and(
            eq(subProductPricing.subProductId, subProductId),
            eq(subProductPricing.isActive, true)
        ),
        orderBy: [asc(subProductPricing.minQuantity)]
    });
}
