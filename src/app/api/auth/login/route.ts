import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  keepLoggedIn: z.boolean().optional(),
  portal: z.enum(['client', 'freelancer']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password, keepLoggedIn, portal } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (portal === 'client' && dbUser.role !== 'user') {
      return NextResponse.json(
        { error: 'This account is registered as a Freelancer. Please use Freelancer Login.' },
        { status: 403 }
      );
    }

    if (portal === 'freelancer' && dbUser.role !== 'freelancer') {
      return NextResponse.json(
        { error: 'This account is registered as a Client. Please use Client Login.' },
        { status: 403 }
      );
    }

    if (dbUser.isActive === false) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    if (!dbUser.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in.' },
        { status: 403 }
      );
    }

    if (dbUser.role === 'freelancer' && dbUser.approvalStatus === 'pending') {
      return NextResponse.json(
        { error: 'Your freelancer profile is pending admin verification.' },
        { status: 403 }
      );
    }

    if (dbUser.role === 'freelancer' && dbUser.approvalStatus === 'rejected') {
      return NextResponse.json(
        { error: 'Your freelancer application was not approved. Please contact support.' },
        { status: 403 }
      );
    }

    const passwordsMatch = await bcrypt.compare(password, dbUser.passwordHash);
    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await createSession(dbUser.id, dbUser.role, dbUser.name, !!keepLoggedIn);

    return NextResponse.json({ success: true, role: dbUser.role }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
