import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  keepLoggedIn: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password, keepLoggedIn } = parsed.data;

    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, email.toLowerCase()),
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    if (adminUser.isActive === false) {
      return NextResponse.json(
        { error: 'This administrator account is inactive.' },
        { status: 403 }
      );
    }

    const passwordsMatch = await bcrypt.compare(password, adminUser.passwordHash);
    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Invalid administrator credentials' }, { status: 401 });
    }

    await createSession(adminUser.id, adminUser.role, adminUser.name, !!keepLoggedIn);
    await db.update(admins).set({ lastLogin: new Date() }).where(eq(admins.id, adminUser.id));

    return NextResponse.json({ success: true, role: adminUser.role }, { status: 200 });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
