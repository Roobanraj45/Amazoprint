import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '@/db';
import { otpVerifications, users } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { sendEmailOtp, sendPhoneOtp } from '@/lib/notifications';

const sendOtpSchema = z.object({
  channel: z.enum(['phone', 'email']),
  target: z.string().min(3),
});

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    return null;
  }
  return `+91${tenDigits}`;
}

export function hashOtp(target: string, channel: string, otp: string): string {
  const secret = process.env.JWT_SECRET || 'amazoprint-otp-secret';
  return crypto.createHmac('sha256', secret).update(`${channel}:${target}:${otp}`).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid OTP request' }, { status: 400 });
    }

    const { channel } = parsed.data;
    let normalizedTarget = parsed.data.target.trim();

    if (channel === 'phone') {
      const phone = normalizePhone(normalizedTarget);
      if (!phone) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit Indian mobile number.' },
          { status: 400 }
        );
      }
      normalizedTarget = phone;

      const existingPhone = await db.query.users.findFirst({
        where: eq(users.phone, normalizedTarget),
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: 'An account with this mobile number already exists.' },
          { status: 409 }
        );
      }
    } else {
      normalizedTarget = normalizedTarget.toLowerCase();
      const emailCheck = z.string().email().safeParse(normalizedTarget);
      if (!emailCheck.success) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, normalizedTarget),
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'An account with this email address already exists.' },
          { status: 409 }
        );
      }
    }

    // Cooldown: prevent spamming OTP within 30 seconds
    const latest = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.target, normalizedTarget),
        eq(otpVerifications.channel, channel)
      ),
      orderBy: [desc(otpVerifications.createdAt)],
    });

    if (latest?.createdAt) {
      const secondsSinceLast = (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
      if (secondsSinceLast < 30 && !latest.verified) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(30 - secondsSinceLast)}s before requesting another OTP.` },
          { status: 429 }
        );
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(normalizedTarget, channel, otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otpVerifications).values({
      target: normalizedTarget,
      channel,
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    const delivery =
      channel === 'phone'
        ? await sendPhoneOtp(normalizedTarget, otp)
        : await sendEmailOtp(normalizedTarget, otp);

    return NextResponse.json({
      success: true,
      target: normalizedTarget,
      message: channel === 'phone' ? 'OTP sent to your mobile number.' : 'Verification code sent to your email.',
      ...(delivery.devOtp ? { devOtp: delivery.devOtp } : {}),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
