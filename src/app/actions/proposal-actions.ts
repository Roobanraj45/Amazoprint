'use server';

import { z } from 'zod';
import { db } from '@/db';
import { newDesignOptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

const specColumnSchema = z.object({
  name: z.string().trim().min(1, 'Column name is required'),
  value: z.string().trim().default(''),
});

const quantityTierSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  singleSidePrice: z.string().trim().default(''),
  doubleSidePrice: z.string().trim().default(''),
  workingDays: z.string().trim().default(''),
  hsnCode: z.string().trim().default(''),
  gstPercentage: z.string().trim().default(''),
});

const proposalSchema = z.object({
  categoryName: z.string().trim().min(1, 'Product category is required').max(150),
  productName: z.string().trim().min(1, 'Product name is required').max(255),
  optionType: z.string().trim().default('product_matrix'),
  description: z.string().trim().default(''),
  specColumns: z.array(specColumnSchema).min(1, 'At least one specification column is required'),
  quantityTiers: z.array(quantityTierSchema).min(1, 'At least one quantity tier is required'),
  shippingType: z.enum(['included', 'excluded']).default('excluded'),
  packagingCost: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Packaging cost must be positive').optional()
  ),
  images: z.array(z.string()).optional(),
});

export async function createProposal(data: z.infer<typeof proposalSchema>) {
  const session = await getSession();
  if (!session?.sub || session.role !== 'printer') {
    throw new Error('Unauthorized');
  }

  const validated = proposalSchema.parse(data);

  const lowestPrice = validated.quantityTiers
    .map((t) => Number(t.singleSidePrice || t.doubleSidePrice || 0))
    .filter((n) => !Number.isNaN(n) && n > 0)
    .sort((a, b) => a - b)[0];

  const summaryDesc =
    validated.description ||
    `${validated.categoryName} — ${validated.specColumns
      .filter((s) => s.value)
      .map((s) => `${s.name}: ${s.value}`)
      .join(' | ')}`;

  const [created] = await db
    .insert(newDesignOptions)
    .values({
      printerId: session.sub,
      title: validated.productName,
      description: summaryDesc,
      optionType: validated.optionType || validated.categoryName.toLowerCase().replace(/\s+/g, '_'),
      categoryName: validated.categoryName,
      productName: validated.productName,
      specColumns: validated.specColumns,
      quantityTiers: validated.quantityTiers,
      shippingType: validated.shippingType,
      packagingCost:
        validated.packagingCost !== undefined ? String(validated.packagingCost) : null,
      estimatedCost: lowestPrice !== undefined ? String(lowestPrice) : null,
      images: validated.images || [],
      status: 'pending',
    })
    .returning();

  revalidatePath('/printer/design-options');
  revalidatePath('/admin/printer-proposals');
  return { success: true, proposal: created };
}

export async function getPrinterProposals() {
  const session = await getSession();
  if (!session?.sub || session.role !== 'printer') {
    throw new Error('Unauthorized');
  }

  return await db.query.newDesignOptions.findMany({
    where: eq(newDesignOptions.printerId, session.sub),
    orderBy: [desc(newDesignOptions.createdAt)],
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
        },
      },
    },
    orderBy: [desc(newDesignOptions.createdAt)],
  });
}

export async function updateProposalStatusAdmin(
  proposalId: number,
  status: 'approved' | 'rejected',
  adminNotes?: string
) {
  const session = await getSession();
  const adminRoles = ['admin', 'super_admin', 'company_admin'];
  if (!session?.sub || !adminRoles.includes(session.role)) {
    throw new Error('Unauthorized');
  }

  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('Invalid status');
  }

  await db
    .update(newDesignOptions)
    .set({
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(newDesignOptions.id, proposalId));

  revalidatePath('/admin/printer-proposals');
  revalidatePath('/printer/design-options');
  return { success: true };
}
