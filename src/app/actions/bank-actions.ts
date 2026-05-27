'use server';

import { db } from '@/db';
import { bankDetails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getBankDetails() {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Unauthorized');
    }

    const isPrinter = session.role === 'printer';

    if (isPrinter) {
        return db.query.bankDetails.findFirst({
            where: eq(bankDetails.printPressUserId, session.sub),
        });
    } else {
        return db.query.bankDetails.findFirst({
            where: eq(bankDetails.userId, session.sub),
        });
    }
}

export async function saveBankDetails(data: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    branchName?: string;
    ifscCode: string;
    accountType?: 'savings' | 'current' | 'business';
    isPrimary?: boolean;
}) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Unauthorized');
    }

    const { accountHolderName, accountNumber, bankName, branchName, ifscCode, accountType, isPrimary } = data;

    if (!accountHolderName.trim() || !accountNumber.trim() || !bankName.trim() || !ifscCode.trim()) {
        throw new Error('All fields except branch name are required.');
    }

    const isPrinter = session.role === 'printer';
    
    // Find existing bank details
    const existing = await (isPrinter
        ? db.query.bankDetails.findFirst({ where: eq(bankDetails.printPressUserId, session.sub) })
        : db.query.bankDetails.findFirst({ where: eq(bankDetails.userId, session.sub) })
    );

    const values = {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        branchName: branchName?.trim() || null,
        ifscCode: ifscCode.trim().toUpperCase(),
        accountType: accountType || 'savings',
        isPrimary: isPrimary ?? true,
        updatedAt: new Date(),
    };

    if (existing) {
        await db.update(bankDetails)
            .set(values)
            .where(eq(bankDetails.id, existing.id));
    } else {
        await db.insert(bankDetails).values({
            ...values,
            userId: isPrinter ? null : session.sub,
            printPressUserId: isPrinter ? session.sub : null,
            isVerified: false,
        });
    }

    revalidatePath('/client/profile');
    revalidatePath('/freelancer/profile');
    revalidatePath('/printer/bank-details');
    return { success: true };
}

export async function toggleBankVerification(bankDetailsId: string, isVerified: boolean) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    await db.update(bankDetails)
        .set({ isVerified, updatedAt: new Date() })
        .where(eq(bankDetails.id, bankDetailsId));

    revalidatePath('/admin/users');
    revalidatePath('/admin/printers');
    return { success: true };
}

