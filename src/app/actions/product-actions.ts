
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { products, subProducts, subProductPricing } from '@/db/schema';
import { and, eq, asc, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  basePrice: z.coerce.number().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

const subProductSchema = z.object({
  productId: z.number(),
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  price: z.coerce.number().optional(),
  width: z.coerce.number().min(0.1, 'Width must be positive'),
  height: z.coerce.number().min(0.1, 'Height must be positive'),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  maxPages: z.preprocess((val) => (val === '' || val === null || val === undefined ? 1 : val), z.coerce.number().min(1)),
  spotUvAllowed: z.boolean().default(false),
  allowedFoils: z.array(z.coerce.number()).optional(),
});

export async function getProducts() {
  return await db.query.products.findMany({
    with: {
      subProducts: {
        orderBy: [asc(subProducts.createdAt)],
        with: {
          pricingRules: {
            where: eq(subProductPricing.isActive, true),
          },
        },
      },
    },
    orderBy: [asc(products.createdAt)],
  });
}

export async function getProductBySlug(slug: string) {
  return await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      subProducts: {
        orderBy: [asc(subProducts.createdAt)],
      },
    },
  });
}

export async function createProduct(data: z.infer<typeof productSchema>) {
  const validated = productSchema.parse(data);
  const result = await db.insert(products).values(validated).returning();
  revalidatePath('/admin/products');
  return result[0];
}

export async function updateProduct(id: number, data: z.infer<typeof productSchema>) {
  const validated = productSchema.parse(data);
  const result = await db.update(products).set({ ...validated, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  revalidatePath('/admin/products');
  return result[0];
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/admin/products');
}

export async function createSubProduct(data: z.infer<typeof subProductSchema>) {
  const validated = subProductSchema.parse(data);
  const result = await db.insert(subProducts).values(validated).returning();
  revalidatePath('/admin/products');
  return result[0];
}

export async function updateSubProduct(id: number, data: Omit<z.infer<typeof subProductSchema>, 'productId'>) {
    const validated = subProductSchema.omit({productId: true}).parse(data);
    const result = await db.update(subProducts).set({ ...validated, updatedAt: new Date() }).where(eq(subProducts.id, id)).returning();
    revalidatePath('/admin/products');
    return result[0];
}

export async function deleteSubProduct(id: number) {
    await db.delete(subProducts).where(eq(subProducts.id, id));
    revalidatePath('/admin/products');
}
