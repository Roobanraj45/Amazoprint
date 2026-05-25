'use server';

import { z } from 'zod';
import { db } from '@/db';
import { newDesignOptions, printPressUsers } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

const proposalSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required'),
    optionType: z.string().min(1, 'Category is required'),
    estimatedCost: z.preprocess(
        (val) => (val === '' ? undefined : Number(val)),
        z.number().min(0, 'Cost must be positive').optional()
    ),
    images: z.array(z.string()).optional(),
});

export async function createProposal(data: z.infer<typeof proposalSchema>) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    const validated = proposalSchema.parse(data);

    await db.insert(newDesignOptions).values({
        printerId: session.sub,
        title: validated.title,
        description: validated.description,
        optionType: validated.optionType,
        estimatedCost: validated.estimatedCost ? String(validated.estimatedCost) : null,
        images: validated.images || [],
        status: 'pending',
    });

    revalidatePath('/printer/design-options');
    return { success: true };
}

export async function getPrinterProposals() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'printer') {
        throw new Error('Unauthorized');
    }

    return await db.query.newDesignOptions.findMany({
        where: eq(newDesignOptions.printerId, session.sub),
        orderBy: [desc(newDesignOptions.createdAt)]
    });
}

export async function getAllProposalsAdmin() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    return await db.query.newDesignOptions.findMany({
        with: {
            printer: {
                columns: {
                    fullName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                    city: true,
                }
            }
        },
        orderBy: [desc(newDesignOptions.createdAt)]
    });
}

export async function updateProposalStatusAdmin(proposalId: number, status: 'approved' | 'rejected') {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Unauthorized');
    }

    if (status !== 'approved' && status !== 'rejected') {
        throw new Error('Invalid status');
    }

    await db.update(newDesignOptions)
        .set({
            status,
            updatedAt: new Date()
        })
        .where(eq(newDesignOptions.id, proposalId));

    revalidatePath('/admin/printer-proposals');
    return { success: true };
}
