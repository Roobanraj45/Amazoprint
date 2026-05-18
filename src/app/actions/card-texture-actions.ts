'use server';

import { z } from 'zod';
import { db } from '@/db';
import { cardTextures } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const cardTextureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  amount: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  allowedSubProductIds: z.array(z.number()).optional(),
});

export async function getCardTextures() {
  return await db.query.cardTextures.findMany({
    orderBy: [asc(cardTextures.name)],
  });
}

export async function createCardTexture(data: z.infer<typeof cardTextureSchema>) {
  const validated = cardTextureSchema.parse(data);
  const result = await db.insert(cardTextures).values(validated).returning();
  revalidatePath('/admin/card-textures');
  revalidatePath('/admin/addons');
  return result[0];
}

export async function updateCardTexture(id: number, data: z.infer<typeof cardTextureSchema>) {
  const validated = cardTextureSchema.parse(data);
  const result = await db.update(cardTextures)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(cardTextures.id, id))
    .returning();
  revalidatePath('/admin/card-textures');
  revalidatePath('/admin/addons');
  return result[0];
}

export async function deleteCardTexture(id: number) {
  await db.delete(cardTextures).where(eq(cardTextures.id, id));
  revalidatePath('/admin/card-textures');
  revalidatePath('/admin/addons');
}
