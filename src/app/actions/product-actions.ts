
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
  youtubeUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const deliveryTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  estimatedTime: z.string().min(1, 'Estimated time is required'),
  amount: z.coerce.number().min(0).default(0),
  minCount: z.coerce.number().min(1).default(1),
  maxCount: z.coerce.number().min(1).default(100000),
  isActive: z.boolean().default(true),
});

const sampleFileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  fileUrl: z.string().min(1, 'File is required'),
  fileType: z.string().optional().default('PDF'),
  fileSize: z.string().optional().default(''),
});

const subProductSchema = z.object({
  productId: z.number(),
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  price: z.coerce.number().optional(),
  width: z.coerce.number().min(0, 'Width must be non-negative'),
  height: z.coerce.number().min(0, 'Height must be non-negative'),
  imageUrl: z.string().optional().or(z.literal('')),
  imageUrls: z.array(z.string()).optional().default([]),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  maxPages: z.preprocess((val) => (val === '' || val === null || val === undefined ? 1 : val), z.coerce.number().min(1)),
  spotUvAllowed: z.boolean().default(false),
  allowedFoils: z.array(z.coerce.number()).optional(),
  allowedDieCuts: z.array(z.coerce.number()).optional(),
  dieCutPrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  allowedCardTextures: z.array(z.coerce.number()).optional(),
  cardTexturePrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  unitType: z.enum(['mm', 'inch', 'ft']).optional().default('mm'),
  backSideCost: z.coerce.number().optional().default(0),
  hsnCode: z.string().optional().nullable(),
  minOrderQuantity: z.preprocess((val) => (val === '' || val === null || val === undefined ? 1 : val), z.coerce.number().min(1).default(1)),
  maxOrderQuantity: z.preprocess((val) => (val === '' || val === null || val === undefined ? 100000 : val), z.coerce.number().min(1).default(100000)),
  deliveryDays: z.string().optional().default('3-5 Business Days'),
  deliveryAmount: z.coerce.number().optional().default(0),
  allowDesignerTool: z.boolean().default(true),
  allowFreelancerContest: z.boolean().default(true),
  allowFileUpload: z.boolean().default(true),
  youtubeUrl: z.string().optional().nullable(),
  sampleFiles: z.array(sampleFileSchema).optional().default([]),
  deliveryTiers: z.array(deliveryTierSchema).optional().default([]),
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

export async function getProductById(id: number) {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
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
  });
}

export async function getSubProductById(id: number) {
  return await db.query.subProducts.findFirst({
    where: eq(subProducts.id, id),
    with: {
      product: true,
      pricingRules: {
        where: eq(subProductPricing.isActive, true),
      },
    },
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
  revalidatePath('/products');
  revalidatePath('/');
  return result[0];
}

export async function updateProduct(id: number, data: z.infer<typeof productSchema>) {
  const validated = productSchema.parse(data);
  const result = await db.update(products).set({ ...validated, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  return result[0];
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}

export async function createSubProduct(data: z.infer<typeof subProductSchema>) {
  const validated = subProductSchema.parse(data);
  const result = await db.insert(subProducts).values({
    ...validated,
    deliveryAmount: (validated.deliveryAmount ?? 0).toString(),
    deliveryTiers: validated.deliveryTiers || [],
    sampleFiles: validated.sampleFiles || [],
    dieCutPrices: validated.dieCutPrices || {},
    cardTexturePrices: validated.cardTexturePrices || {},
  }).returning();
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  return result[0];
}

export async function updateSubProduct(id: number, data: Omit<z.infer<typeof subProductSchema>, 'productId'>) {
    const validated = subProductSchema.omit({productId: true}).parse(data);
    const result = await db.update(subProducts)
        .set({ 
            ...validated, 
            deliveryAmount: (validated.deliveryAmount ?? 0).toString(),
            deliveryTiers: validated.deliveryTiers || [],
            sampleFiles: validated.sampleFiles || [],
            dieCutPrices: validated.dieCutPrices || {},
            cardTexturePrices: validated.cardTexturePrices || {},
            updatedAt: new Date() 
        })
        .where(eq(subProducts.id, id))
        .returning();
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/');
    return result[0];
}

export async function deleteSubProduct(id: number) {
    await db.delete(subProducts).where(eq(subProducts.id, id));
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/');
}
