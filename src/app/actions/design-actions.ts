
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { designs, designVerifications } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

const designSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  productSlug: z.string(),
  width: z.number(),
  height: z.number(),
  quantity: z.number(),
  elements: z.any(),
  background: z.any(),
  guides: z.any().optional(),
});

const updateDesignSchema = designSchema.extend({
  id: z.number(),
  verificationId: z.string().optional().nullable(),
});


export async function getSavedDesigns(productSlug: string) {
    const session = await getSession();
    if (!session?.sub) {
        return []; 
    }
    
    return await db.query.designs.findMany({
        where: and(
            eq(designs.userId, session.sub),
            eq(designs.productSlug, productSlug)
        ),
        orderBy: [desc(designs.createdAt)]
    });
}

export async function saveDesign(data: z.infer<typeof designSchema>) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to save a design.');
    }

    const validated = designSchema.parse(data);

    const result = await db.insert(designs).values({
        ...validated,
        userId: session.sub,
    }).returning();

    revalidatePath('/design/*');
    revalidatePath('/freelancer/designs');
    return result[0];
}

export async function updateDesign(data: z.infer<typeof updateDesignSchema>) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to update a design.');
    }

    const validated = updateDesignSchema.parse(data);
    const { id, verificationId, elements, background, guides } = validated;


    const existingDesign = await db.query.designs.findFirst({
        where: eq(designs.id, id),
    });

    if (!existingDesign) {
        throw new Error('Design not found.');
    }
    
    // Authorization check
    let isAuthorized = false;
    // Case 1: User is the owner of the design.
    if (existingDesign.userId === session.sub) {
        isAuthorized = true;
    }
    
    // Case 2: User is an admin.
    const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
    if (!isAuthorized && session.role && adminRoles.includes(session.role)) {
        isAuthorized = true;
    }

    // Case 3: User is a freelancer working on a verification job.
    if (!isAuthorized && session.role === 'freelancer' && verificationId) {
        const verification = await db.query.designVerifications.findFirst({
            where: and(
                eq(designVerifications.id, Number(verificationId)),
                eq(designVerifications.freelancerId, session.sub),
                eq(designVerifications.designId, id)
            )
        });
        if (verification) {
            isAuthorized = true;
        }
    }


    if (!isAuthorized) {
        throw new Error('You are not authorized to update this design.');
    }
    
    const result = await db.update(designs)
        .set({ 
            elements,
            background,
            guides,
            updatedAt: new Date()
        })
        .where(eq(designs.id, id))
        .returning();

    revalidatePath('/design/*');
    revalidatePath('/freelancer/designs');
    if (verificationId) {
        revalidatePath(`/freelancer/verifications`);
    }
    return result[0];
}

export async function deleteDesign(id: number) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Authentication required.');
    }

    const design = await db.query.designs.findFirst({
        where: eq(designs.id, id)
    });

    if (!design) {
        throw new Error('Design not found.');
    }

    if (design.userId !== session.sub) {
        throw new Error('You are not authorized to delete this design.');
    }

    await db.delete(designs).where(eq(designs.id, id));
    
    revalidatePath('/design/*');
    revalidatePath('/freelancer/designs');
}

export async function getTemplatesForProduct(productSlug: string) {
    const templateUserId = '00000000-0000-0000-0000-000000000000';
    return await db.query.designs.findMany({
        where: and(
            eq(designs.userId, templateUserId),
            eq(designs.productSlug, productSlug)
        ),
        orderBy: [desc(designs.createdAt)]
    });
}

export async function getDesign(id: number) {
    return await db.query.designs.findFirst({
        where: eq(designs.id, id)
    });
}

export async function getMyDesigns() {
    const session = await getSession();
    if (!session?.sub) {
        return [];
    }

    return await db.query.designs.findMany({
        where: eq(designs.userId, session.sub),
        orderBy: [desc(designs.createdAt)]
    });
}

export async function getAdminAllDesigns() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('You are not authorized to view this page.');
    }

    const allDesigns = await db.query.designs.findMany({
        with: {
            user: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                }
            }
        },
        orderBy: [desc(designs.createdAt)]
    });

    return allDesigns;
}
