'use server';

import { z } from 'zod';
import { db } from '@/db';
import { customAddons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const customAddonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be positive').default(0),
  pricingType: z.enum(['per_unit', 'fixed']).default('per_unit'),
  isActive: z.boolean().default(true),
  allowedSubProductIds: z.array(z.number()).optional(),
});

export async function getCustomAddons() {
  return await db.query.customAddons.findMany({
    orderBy: [asc(customAddons.name)],
  });
}

export async function createCustomAddon(data: z.infer<typeof customAddonSchema>) {
  const validated = customAddonSchema.parse(data);
  const result = await db.insert(customAddons).values({
    ...validated,
    price: (validated.price ?? 0).toString(),
  }).returning();
  revalidatePath('/admin/addons');
  revalidatePath('/admin/custom-addons');
  revalidatePath('/products');
  return result[0];
}

export async function updateCustomAddon(id: number, data: z.infer<typeof customAddonSchema>) {
  const validated = customAddonSchema.parse(data);
  const result = await db.update(customAddons)
    .set({ 
      ...validated, 
      price: (validated.price ?? 0).toString(),
      updatedAt: new Date() 
    })
    .where(eq(customAddons.id, id))
    .returning();
  revalidatePath('/admin/addons');
  revalidatePath('/admin/custom-addons');
  revalidatePath('/products');
  return result[0];
}

export async function deleteCustomAddon(id: number) {
  await db.delete(customAddons).where(eq(customAddons.id, id));
  revalidatePath('/admin/addons');
  revalidatePath('/admin/custom-addons');
  revalidatePath('/products');
}
