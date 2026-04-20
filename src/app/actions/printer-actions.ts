'use server';

import { z } from 'zod';
import { db } from '@/db';
import { printPressUsers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

const printerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  fullName: z.string().min(2, 'Full name is required.'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export async function registerPrinter(data: z.infer<typeof printerSchema>) {
    const validated = printerSchema.parse(data);

    const existingUser = await db.query.printPressUsers.findFirst({
        where: (users, { or, eq }) => or(eq(users.email, validated.email), eq(users.username, validated.username)),
    });

    if (existingUser) {
        throw new Error('User with this email or username already exists.');
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const result = await db.insert(printPressUsers).values({
        ...validated,
        passwordHash,
    }).returning();

    revalidatePath('/admin/printers');
    return result[0];
}

async function verifyAdmin() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }
}

export async function getPrinters() {
    await verifyAdmin();
    return await db.query.printPressUsers.findMany({
        orderBy: [desc(printPressUsers.createdAt)],
    });
}

export async function updatePrinterApproval(id: string, isApproved: boolean) {
    await verifyAdmin();
    await db.update(printPressUsers)
        .set({ isApproved, updatedAt: new Date() })
        .where(eq(printPressUsers.id, id));
    revalidatePath('/admin/printers');
}
