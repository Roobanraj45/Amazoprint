import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { otpVerifications } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { hashOtp } from '@/app/api/auth/send-otp/route';

const verifyOtpSchema = z.object({
  channel: z.enum(['phone', 'email']),
  target: z.string().min(3),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

function normalizeTarget(channel: 'phone' | 'email', raw: string): string {
  if (channel === 'email') {
    return raw.trim().toLowerCase();
  }
  const digits = raw.replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91${tenDigits}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 });
    }

    const { channel, otp } = parsed.data;
    const normalizedTarget = normalizeTarget(channel, parsed.data.target);

    const record = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.target, normalizedTarget),
        eq(otpVerifications.channel, channel)
      ),
      orderBy: [desc(otpVerifications.createdAt)],
    });

    if (!record) {
      return NextResponse.json({ error: 'No OTP found. Please request a new code.' }, { status: 404 });
    }

    if (record.verified) {
      return NextResponse.json({ success: true, verified: true, target: normalizedTarget });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many invalid attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    const expectedHash = hashOtp(normalizedTarget, channel, otp);
    if (expectedHash !== record.otpHash) {
      await db
        .update(otpVerifications)
        .set({ attempts: record.attempts + 1 })
        .where(eq(otpVerifications.id, record.id));

      return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
    }

    await db
      .update(otpVerifications)
      .set({ verified: true, verifiedAt: new Date() })
      .where(eq(otpVerifications.id, record.id));

    return NextResponse.json({
      success: true,
      verified: true,
      target: normalizedTarget,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
