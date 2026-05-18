
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { dieCuts } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const dieCutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  amount: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  allowedSubProductIds: z.array(z.number()).optional(),
});

export async function getDieCuts() {
  return await db.query.dieCuts.findMany({
    orderBy: [asc(dieCuts.name)],
  });
}

export async function createDieCut(data: z.infer<typeof dieCutSchema>) {
  const validated = dieCutSchema.parse(data);
  const result = await db.insert(dieCuts).values(validated).returning();
  revalidatePath('/admin/die-cuts');
  revalidatePath('/admin/addons');
  return result[0];
}

export async function updateDieCut(id: number, data: z.infer<typeof dieCutSchema>) {
  const validated = dieCutSchema.parse(data);
  const result = await db.update(dieCuts)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(dieCuts.id, id))
    .returning();
  revalidatePath('/admin/die-cuts');
  revalidatePath('/admin/addons');
  return result[0];
}

export async function deleteDieCut(id: number) {
  await db.delete(dieCuts).where(eq(dieCuts.id, id));
  revalidatePath('/admin/die-cuts');
  revalidatePath('/admin/addons');
}
