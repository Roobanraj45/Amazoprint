import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { otpVerifications, users } from '@/db/schema';
import { sendVerificationLinkEmail } from '@/lib/notifications';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const registerSchema = z.object({
  role: z.enum(['user', 'freelancer']),
  name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(10, 'Valid 10-digit mobile number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms and Privacy Policy' }),
  }),
  // Client optional field
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => !val || GSTIN_REGEX.test(val), 'Invalid GSTIN format (e.g., 33AAAAA0000A1Z5)')
    .optional()
    .or(z.literal('')),
  // Freelancer fields
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{3,30}$/, 'Username must be 3-30 characters (letters, numbers, _, -)')
    .optional(),
  skills: z.union([z.array(z.string().trim().min(1)), z.string()]).optional(),
  accountType: z.enum(['individual', 'agency']).optional(),
  businessRegistrationStatus: z.string().trim().optional().or(z.literal('')),
  portfolioUrl: z.string().trim().url('Please enter a valid URL').optional().or(z.literal('')),
  sampleDesigns: z.array(z.string().min(1)).max(5, 'Maximum 5 sample designs allowed').optional(),
  bio: z.string().optional(),
});

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^\d{10}$/.test(tenDigits)) return null;
  return `+91${tenDigits}`;
}

async function hasVerifiedOtp(target: string, channel: 'phone' | 'email'): Promise<boolean> {
  try {
    const record = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.target, target),
        eq(otpVerifications.channel, channel),
        eq(otpVerifications.verified, true)
      ),
      orderBy: [desc(otpVerifications.verifiedAt)],
    });

    if (!record?.verifiedAt) return false;
    // Verified within the last 30 minutes
    return Date.now() - new Date(record.verifiedAt).getTime() <= 30 * 60 * 1000;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase();
    const normalizedPhone = normalizePhone(data.phone);

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // 1. Check mobile OTP status (bypassed for now if not verified)
    const phoneVerified = await hasVerifiedOtp(normalizedPhone, 'phone');

    // 2. Check uniqueness of email and phone
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const existingPhone = await db.query.users.findFirst({
      where: eq(users.phone, normalizedPhone),
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'An account with this mobile number already exists.' },
        { status: 409 }
      );
    }

    // 3. Role-specific validation
    let parsedSkills: string[] | undefined;
    if (data.role === 'freelancer') {
      if (!data.username) {
        return NextResponse.json({ error: 'Designer username is required.' }, { status: 400 });
      }

      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, data.username.toLowerCase()),
      });
      if (existingUsername) {
        return NextResponse.json({ error: 'This designer username is already taken.' }, { status: 409 });
      }

      parsedSkills = Array.isArray(data.skills)
        ? data.skills.filter(Boolean)
        : data.skills
          ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

      if (parsedSkills.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least one design specialization.' },
          { status: 400 }
        );
      }

      if (!data.accountType) {
        return NextResponse.json({ error: 'Please select an account type.' }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date();

    if (data.role === 'user') {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.insert(users).values({
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: 'user',
        phone: normalizedPhone,
        phoneVerified,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        gstNumber: data.gstNumber ? data.gstNumber.toUpperCase() : null,
        approvalStatus: 'approved',
        acceptTermsConditions: true,
        acceptPrivacyPolicy: true,
        acceptedPoliciesAt: now,
      });

      const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
      const verificationUrl = `${origin}/verify-email?token=${verificationToken}`;
      const emailResult = await sendVerificationLinkEmail(normalizedEmail, data.name, verificationUrl);

      return NextResponse.json(
        {
          success: true,
          message: 'Account created! A verification link has been sent to your email.',
          ...(emailResult.devVerificationUrl ? { devVerificationUrl: emailResult.devVerificationUrl } : {}),
        },
        { status: 201 }
      );
    }

    // Freelancer registration
    await db.insert(users).values({
      name: data.name,
      username: data.username!.toLowerCase(),
      email: normalizedEmail,
      passwordHash,
      role: 'freelancer',
      phone: normalizedPhone,
      phoneVerified,
      emailVerified: true,
      approvalStatus: 'pending',
      acceptTermsConditions: true,
      acceptPrivacyPolicy: true,
      acceptedPoliciesAt: now,
      skills: parsedSkills,
      accountType: data.accountType,
      businessRegistrationStatus: data.businessRegistrationStatus || null,
      portfolioUrl: data.portfolioUrl || null,
      sampleDesigns: data.sampleDesigns && data.sampleDesigns.length > 0 ? data.sampleDesigns : null,
      bio: data.bio || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Freelancer registration submitted! Your profile is pending admin verification.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    const pgCode = error?.code || error?.cause?.code;
    if (pgCode === '42703' || pgCode === '42P01') {
      return NextResponse.json(
        { error: 'Database schema is out of date. Please run "npm run db:push" first.' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV !== 'production' && error?.message
            ? error.message
            : 'An internal error occurred',
      },
      { status: 500 }
    );
  }
}
