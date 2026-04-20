'use server';

import { z } from 'zod';
import { db } from '@/db';
import { foilTypes } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const foilTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  allowedSubProductIds: z.array(z.coerce.number()).optional().nullable(),
  colorCode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function getFoilTypes() {
  return await db.query.foilTypes.findMany({
    orderBy: [asc(foilTypes.createdAt)],
  });
}

export async function createFoilType(data: z.infer<typeof foilTypeSchema>) {
  const validated = foilTypeSchema.parse(data);
  const result = await db.insert(foilTypes).values(validated).returning();
  revalidatePath('/admin/foils');
  return result[0];
}

export async function updateFoilType(id: number, data: z.infer<typeof foilTypeSchema>) {
  const validated = foilTypeSchema.parse(data);
  const result = await db.update(foilTypes).set({ ...validated, updatedAt: new Date() }).where(eq(foilTypes.id, id)).returning();
  revalidatePath('/admin/foils');
  return result[0];
}

export async function deleteFoilType(id: number) {
  await db.delete(foilTypes).where(eq(foilTypes.id, id));
  revalidatePath('/admin/foils');
}
