import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')?.trim();
    if (!token) {
      return NextResponse.json({ error: 'Verification token is missing' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.emailVerificationToken, token),
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or already used verification link' }, { status: 400 });
    }

    if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}
