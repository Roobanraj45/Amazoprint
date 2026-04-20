import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;
    const adminId = session.sub;

    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordsMatch = await bcrypt.compare(currentPassword, adminUser.passwordHash);

    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.update(admins)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(admins.id, adminId));

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
