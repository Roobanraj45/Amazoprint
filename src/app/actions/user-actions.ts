'use server';

import { z } from 'zod';
import { db } from '@/db';
import { users, contests, orders, designVerifications, contestParticipants, contestWinners } from '@/db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
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
        with: {
            bankDetails: true,
        }
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

export async function logout() {
    const { deleteSession } = await import('@/lib/auth');
    await deleteSession();
    revalidatePath('/');
    return { success: true };
}

export async function getUserProfile() {
    const session = await getAuthSession();
    if (!session?.sub) {
        throw new Error('Unauthorized');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.sub)
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

export async function getUserStats() {
    const session = await getAuthSession();
    if (!session?.sub) {
        throw new Error('Unauthorized');
    }

    if (session.role === 'freelancer') {
        const [joinedResult] = await db.select({ count: count() }).from(contestParticipants).where(eq(contestParticipants.freelancerId, session.sub));
        const [wonResult] = await db.select({ count: count() }).from(contestWinners).where(eq(contestWinners.freelancerId, session.sub));
        const [verificationsResult] = await db.select({ count: count() }).from(designVerifications).where(
            and(
                eq(designVerifications.freelancerId, session.sub),
                eq(designVerifications.status, 'completed')
            )
        );

        return {
            contestsJoined: joinedResult.count,
            contestsWon: wonResult.count,
            verificationsCompleted: verificationsResult.count,
        };
    } else {
        // Assume client/user
        const [createdResult] = await db.select({ count: count() }).from(contests).where(eq(contests.userId, session.sub));
        const [ordersResult] = await db.select({ count: count() }).from(orders).where(eq(orders.userId, session.sub));
        const [verificationsResult] = await db.select({ count: count() }).from(designVerifications).where(eq(designVerifications.userId, session.sub));

        return {
            contestsCreated: createdResult.count,
            ordersPlaced: ordersResult.count,
            verificationsRequested: verificationsResult.count,
        };
    }
}

const freelancerProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.coerce.number().nullable().optional(),
  hourlyRate: z.coerce.number().nullable().optional(),
  portfolioUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  availabilityStatus: z.enum(['available', 'busy', 'offline']).optional(),
});

export async function updateFreelancerProfile(data: z.infer<typeof freelancerProfileSchema>) {
  const session = await getAuthSession();
  if (!session?.sub || session.role !== 'freelancer') {
    throw new Error('Unauthorized');
  }

  const validated = freelancerProfileSchema.parse(data);

  await db.update(users)
    .set({
      name: validated.name,
      phone: validated.phone || null,
      profileImage: validated.profileImage || null,
      skills: validated.skills || [],
      experienceYears: validated.experienceYears || null,
      hourlyRate: validated.hourlyRate ? validated.hourlyRate.toString() : null,
      portfolioUrl: validated.portfolioUrl || null,
      bio: validated.bio || null,
      availabilityStatus: validated.availabilityStatus || 'available',
      updatedAt: new Date()
    })
    .where(eq(users.id, session.sub));

  revalidatePath('/freelancer/profile');
  return { success: true };
}
