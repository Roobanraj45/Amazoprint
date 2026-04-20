'use server';

import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession as getAuthSession } from '@/lib/auth';

// Function to check for admin privileges
async function verifyAdmin() {
    const session = await getAuthSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('You are not authorized to perform this action.');
    }
}

export async function getUsers() {
    await verifyAdmin();
    const data = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
    });
    return data;
}

const userStatusSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function updateUserStatus(data: z.infer<typeof userStatusSchema>) {
    await verifyAdmin();
    const validated = userStatusSchema.parse(data);

    await db.update(users)
        .set({ isActive: validated.isActive, updatedAt: new Date() })
        .where(eq(users.id, validated.userId));

    revalidatePath('/admin/users');
    return { success: true };
}

export async function getUserRole() {
  const session = await getAuthSession();
  return session?.role;
}

export async function getSession() {
  const session = await getAuthSession();
  return session;
}
