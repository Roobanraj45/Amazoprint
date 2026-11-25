'use server';

import { z } from 'zod';
import { db } from '@/db';
import { bankDetails, printPressUsers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const printerSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  fullName: z.string().trim().min(2, 'Contact person name is required.'),
  phone: z.string().trim().min(10, 'Valid mobile number is required.'),
  companyName: z.string().trim().min(2, 'Company / Business name is required.'),
  address: z.string().trim().min(5, 'Business address is required.'),
  city: z.string().trim().min(2, 'City is required.'),
  state: z.string().trim().min(2, 'State is required.'),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  country: z.string().optional(),
  // Step 2: Pickup & Capacity
  sameAsBusinessAddress: z.boolean().default(true),
  pickupAddress: z.string().optional(),
  pickupCity: z.string().optional(),
  pickupState: z.string().optional(),
  pickupPostalCode: z.string().optional(),
  pickupContactPerson: z.string().optional(),
  pickupPhone: z.string().optional(),
  printingUnitAreaSqFt: z.coerce.number().int().positive().optional(),
  totalEmployees: z.coerce.number().int().positive().optional(),
  availableMachinery: z.array(z.string()).default([]),
  otherMachinery: z.string().optional(),
  dailyOrderCapacity: z.string().optional(),
  approxDailyProduction: z.string().optional(),
  workDescription: z.string().optional(),
  // Step 3: GST & Bank
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => GSTIN_REGEX.test(val), 'Enter a valid 15-character GSTIN.'),
  gstVerified: z.boolean().optional(),
  accountHolderName: z.string().trim().min(2, 'Account holder name is required.'),
  accountNumber: z.string().trim().min(6, 'Valid account number is required.'),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => IFSC_REGEX.test(val), 'Enter a valid 11-character IFSC code.'),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  bankVerified: z.boolean().optional(),
  acceptPrivacyPolicy: z.boolean().refine((val) => val === true, 'Privacy policy must be accepted.'),
  acceptTermsConditions: z.boolean().refine((val) => val === true, 'Terms and conditions must be accepted.'),
});

function buildBaseUsername(companyName: string, email: string): string {
  const source = (companyName || email.split('@')[0] || 'printer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${source || 'printer'}_${suffix}`;
}

export async function registerPrinter(data: z.infer<typeof printerSchema>) {
  const validated = printerSchema.parse(data);
  const normalizedEmail = validated.email.toLowerCase();

  const existingEmail = await db.query.printPressUsers.findFirst({
    where: eq(printPressUsers.email, normalizedEmail),
  });
  if (existingEmail) {
    throw new Error('A printing partner with this email already exists.');
  }

  let finalUsername = validated.username?.trim().toLowerCase() || buildBaseUsername(validated.companyName, normalizedEmail);
  const existingUsername = await db.query.printPressUsers.findFirst({
    where: eq(printPressUsers.username, finalUsername),
  });
  if (existingUsername) {
    finalUsername = buildBaseUsername(validated.companyName, normalizedEmail);
  }

  const passwordHash = await bcrypt.hash(validated.password, 10);
  const samePickup = validated.sameAsBusinessAddress;

  const [createdPrinter] = await db
    .insert(printPressUsers)
    .values({
      username: finalUsername,
      email: normalizedEmail,
      passwordHash,
      fullName: validated.fullName,
      phone: validated.phone,
      companyName: validated.companyName,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      postalCode: validated.postalCode,
      country: validated.country || 'India',
      gstNumber: validated.gstNumber,
      gstVerified: !!validated.gstVerified,
      sameAsBusinessAddress: samePickup,
      pickupAddress: samePickup ? validated.address : validated.pickupAddress || validated.address,
      pickupCity: samePickup ? validated.city : validated.pickupCity || validated.city,
      pickupState: samePickup ? validated.state : validated.pickupState || validated.state,
      pickupPostalCode: samePickup ? validated.postalCode : validated.pickupPostalCode || validated.postalCode,
      pickupContactPerson: validated.pickupContactPerson || validated.fullName,
      pickupPhone: validated.pickupPhone || validated.phone,
      printingUnitAreaSqFt: validated.printingUnitAreaSqFt || null,
      totalEmployees: validated.totalEmployees || null,
      availableMachinery: validated.availableMachinery,
      otherMachinery: validated.otherMachinery || null,
      dailyOrderCapacity: validated.dailyOrderCapacity || null,
      approxDailyProduction: validated.approxDailyProduction || null,
      workDescription:
        validated.workDescription ||
        [...validated.availableMachinery, validated.otherMachinery].filter(Boolean).join(', ') ||
        null,
      acceptPrivacyPolicy: true,
      acceptTermsConditions: true,
      acceptedPoliciesAt: new Date(),
      status: 'pending',
      isApproved: false,
    })
    .returning();

  await db.insert(bankDetails).values({
    printPressUserId: createdPrinter.id,
    accountHolderName: validated.accountHolderName,
    accountNumber: validated.accountNumber,
    bankName: validated.bankName || 'Verified via IFSC',
    branchName: validated.branchName || null,
    ifscCode: validated.ifscCode,
    accountType: 'current',
    isPrimary: true,
    isVerified: !!validated.bankVerified,
  });

  revalidatePath('/admin/printers');
  return createdPrinter;
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
        with: {
            priceLists: {
                orderBy: (priceLists, { desc }) => [desc(priceLists.createdAt)]
            },
            bankDetails: true,
        }
    });
}

export async function updatePrinterApproval(id: string, isApproved: boolean) {
    await verifyAdmin();
    await db.update(printPressUsers)
        .set({ 
          isApproved, 
          status: isApproved ? 'approved' : 'rejected',
          updatedAt: new Date() 
        })
        .where(eq(printPressUsers.id, id));
    revalidatePath('/admin/printers');
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
  keepLoggedIn: z.boolean().default(false).optional(),
});

export async function loginPrinter(data: z.infer<typeof loginSchema>) {
    const validated = loginSchema.parse(data);

    const user = await db.query.printPressUsers.findFirst({
        where: eq(printPressUsers.email, validated.email),
    });

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    if (!user.isActive) {
        throw new Error('This account has been deactivated.');
    }

    if (!user.isApproved) {
        throw new Error('Your application is still pending review. We will notify you once approved.');
    }

    const passwordMatch = await bcrypt.compare(validated.password, user.passwordHash);

    if (!passwordMatch) {
        throw new Error('Invalid email or password.');
    }

    // Update last login
    await db.update(printPressUsers)
        .set({ lastLogin: new Date() })
        .where(eq(printPressUsers.id, user.id));

    // Create session
    const { createSession } = await import('@/lib/auth');
    await createSession(user.id, 'printer', user.fullName, !!validated.keepLoggedIn);

    return { success: true, role: 'printer' };
}
