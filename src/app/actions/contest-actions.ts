// Updated to force re-registration of server actions
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { contests, contestParticipants, products, subProducts, users, designs, designUploads, contestWinners, orders, orderLogs } from '@/db/schema';
import { and, or, eq, sql, desc, count, gt, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
const contestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  productId: z.coerce.number().min(1, 'Product is required'),
  subProductId: z.coerce.number().min(1, 'Product variant is required'),
  prizeAmount: z.coerce.number().min(1, 'Prize amount must be positive'),
  maxFreelancers: z.coerce.number().min(1, 'Max freelancers must be at least 1'),
  entryFee: z.coerce.number().optional(),
  endDate: z.coerce.date().refine(date => date > new Date(), { message: "End date must be in the future" }),
  customisation: z.any().optional(),
  imageUrl: z.string().optional(),
  contestType: z.enum(['tier', 'individual']).optional().default('tier'),
  assignedFreelancerId: z.string().uuid().optional().nullable(),
});

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

export async function getFreelancers(search?: string) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    let queryCondition = and(eq(users.role, 'freelancer'), eq(users.isActive, true));
    if (search && search.trim().length >= 3) {
        const searchPattern = `%${search.trim()}%`;
        queryCondition = and(
            queryCondition,
            or(
                ilike(users.name, searchPattern),
                ilike(users.email, searchPattern)
            )
        );
    } else if (search) {
        return [];
    }

    const data = await db.query.users.findMany({
        where: queryCondition,
        orderBy: [desc(users.createdAt)],
        limit: 20,
    });
    return data.map(u => ({ id: u.id, name: u.name, email: u.email }));
}

export async function createContest(data: z.infer<typeof contestSchema>) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to create a contest.');
    }

    const validated = contestSchema.parse(data);

    const product = await db.query.products.findFirst({ where: eq(products.id, validated.productId) });
    const subProduct = await db.query.subProducts.findFirst({ where: eq(subProducts.id, validated.subProductId) });
    if (!product || !subProduct) {
        throw new Error('Invalid product selected.');
    }

    const { contestType, assignedFreelancerId, ...contestInsertData } = validated;

    const [insertedContest] = await db.insert(contests).values({
        ...contestInsertData,
        customisation: validated.customisation || {},
        userId: session.sub,
        productName: product.name,
        subProductName: subProduct.name,
        startDate: new Date(),
    }).returning();

    if (validated.contestType === 'individual' && validated.assignedFreelancerId) {
        await db.insert(contestParticipants).values({
            contestId: insertedContest.id,
            freelancerId: validated.assignedFreelancerId,
            status: 'active',
            joinedAt: new Date(),
        });
    }
    
    revalidatePath('/contests');
    revalidatePath('/client/contests');
    return insertedContest;
}

export async function getContests() {
    const data = await db.select({
        contest: contests,
        participantsCount: count(contestParticipants.id)
    }).from(contests)
      .leftJoin(contestParticipants, eq(contests.id, contestParticipants.contestId))
      .where(and(
        eq(contests.status, 'active'),
        gt(contests.endDate, new Date())
      ))
      .groupBy(contests.id)
      .having(sql`COUNT(${contestParticipants.id}) < ${contests.maxFreelancers}`)
      .orderBy(desc(contests.createdAt));

    return data;
}

export async function getClientContests() {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }
    const data = await db.query.contests.findMany({
        where: eq(contests.userId, session.sub),
        orderBy: [desc(contests.createdAt)],
        with: {
            participants: true
        }
    });
    return data;
}

export async function joinContest(contestId: number) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'freelancer') {
        return { success: false, error: 'Only freelancers can join contests.' };
    }
    const freelancerId = session.sub;

    const contest = await db.query.contests.findFirst({
        where: eq(contests.id, contestId)
    });

    if (!contest) {
        return { success: false, error: 'Contest not found.' };
    }

    if (contest.status !== 'active') {
        return { success: false, error: 'This contest is not active.' };
    }
    if (new Date() > new Date(contest.endDate)) {
         return { success: false, error: 'This contest has already ended.' };
    }
    
    const existingParticipation = await db.query.contestParticipants.findFirst({
        where: and(eq(contestParticipants.contestId, contestId), eq(contestParticipants.freelancerId, freelancerId))
    });

    if (existingParticipation) {
        return { success: false, error: 'You have already joined this contest.' };
    }

    const participants = await db.select({ count: count() }).from(contestParticipants).where(eq(contestParticipants.contestId, contestId));
    const participantsCount = participants[0]?.count ?? 0;
    
    if (participantsCount >= contest.maxFreelancers) {
        return { success: false, error: 'This contest is already full.' };
    }

    await db.insert(contestParticipants).values({
        contestId,
        freelancerId,
    });

    revalidatePath('/contests');
    revalidatePath(`/contests/${contestId}`);
    revalidatePath('/freelancer/contests');
    return { success: true };
}

export async function getJoinedContests() {
    const session = await getSession();
    if (!session?.sub || session.role !== 'freelancer') {
        throw new Error('Only freelancers can view joined contests.');
    }
    const freelancerId = session.sub;

    const freelancerParticipations = db.$with('freelancer_participations').as(
        db.select({ 
            contestId: contestParticipants.contestId, 
            joinedAt: contestParticipants.joinedAt,
            designId: contestParticipants.designId,
            templateId: contestParticipants.templateId,
            designIds: contestParticipants.designIds,
            templateIds: contestParticipants.templateIds,
        })
          .from(contestParticipants)
          .where(eq(contestParticipants.freelancerId, freelancerId))
    );

    const data = await db
        .with(freelancerParticipations)
        .select({
            contest: contests,
            product: products,
            subProduct: subProducts,
            user: {
                id: users.id,
                name: users.name,
                profileImage: users.profileImage,
            },
            participantsCount: sql<number>`count(distinct ${contestParticipants.id})`.mapWith(Number),
            joinedAt: freelancerParticipations.joinedAt,
            // Derive the active design from last element of design_ids array
            designId: sql<number | null>`(${freelancerParticipations.designIds})[array_length(${freelancerParticipations.designIds}, 1)]`,
            templateId: freelancerParticipations.templateId,
            designIds: freelancerParticipations.designIds,
            templateIds: freelancerParticipations.templateIds,
            winnerRank: sql<number>`(SELECT rank FROM ${contestWinners} WHERE ${contestWinners.contestId} = ${contests.id} AND ${contestWinners.freelancerId} = ${freelancerId} LIMIT 1)`.mapWith(Number),
        })
        .from(contests)
        .innerJoin(freelancerParticipations, eq(contests.id, freelancerParticipations.contestId))
        .innerJoin(users, eq(contests.userId, users.id))
        .innerJoin(products, eq(contests.productId, products.id))
        .innerJoin(subProducts, eq(contests.subProductId, subProducts.id))
        .leftJoin(contestParticipants, eq(contests.id, contestParticipants.contestId))
        .groupBy(
            contests.id, 
            products.id, 
            subProducts.id, 
            users.id, 
            freelancerParticipations.joinedAt,
            freelancerParticipations.templateId,
            freelancerParticipations.designIds,
            freelancerParticipations.templateIds,
        )
        .orderBy(desc(freelancerParticipations.joinedAt));
    
    return data;
}

/**
 * Fetch lightweight preview data for existing editor designs and uploaded files.
 * Used by the contest submission choice modal.
 */
export async function getSubmissionPreviews(
    designIds: number[],
    uploadIds: number[]
) {
    const session = await getSession();
    if (!session?.sub) throw new Error('Not authenticated');

    const designPreviews = designIds.length > 0
        ? await db.query.designs.findMany({
              where: (d, { and, eq, inArray }) => and(
                  eq(d.userId, session.sub),
                  inArray(d.id, designIds)
              ),
              columns: { id: true, name: true, thumbnailUrl: true, updatedAt: true },
          })
        : [];

    const uploadPreviews = uploadIds.length > 0
        ? await db.query.designUploads.findMany({
              where: (u, { and, eq, inArray }) => and(
                  eq(u.userId, session.sub),
                  inArray(u.id, uploadIds)
              ),
              columns: { id: true, originalFilename: true, thumbnailPath: true, updatedAt: true },
          })
        : [];

    return { designs: designPreviews, uploads: uploadPreviews };
}

/**
 * Fetch FULL design and upload records by their IDs for the client contest detail page.
 * Authenticated by contest ownership (not user ownership of designs).
 * Returns all fields needed by SubmissionPreview canvas renderer.
 */
export async function getContestSubmissionDetails(
    designIds: number[],
    uploadIds: number[]
) {
    const session = await getSession();
    if (!session?.sub) throw new Error('Not authenticated');

    const designDetails = designIds.length > 0
        ? await db.query.designs.findMany({
              where: (d, { inArray }) => inArray(d.id, designIds),
              columns: {
                  id: true, name: true, thumbnailUrl: true,
                  elements: true, background: true, guides: true,
                  width: true, height: true, productSlug: true,
                  createdAt: true, updatedAt: true,
              },
          })
        : [];

    const uploadDetails = uploadIds.length > 0
        ? await db.query.designUploads.findMany({
              where: (u, { inArray }) => inArray(u.id, uploadIds),
              columns: {
                  id: true, originalFilename: true, thumbnailPath: true,
                  filePath: true, fileSize: true, mimeType: true,
                  createdAt: true, updatedAt: true,
              },
          })
        : [];

    return { designs: designDetails, uploads: uploadDetails };
}

export async function getContestDetails(contestId: number) {
    const contestQuery = db
        .select({
            contest: contests,
            product: products,
            subProduct: subProducts,
            user: {
                name: users.name
            },
            participantsCount: count(contestParticipants.id)
        })
        .from(contests)
        .where(eq(contests.id, contestId))
        .innerJoin(users, eq(contests.userId, users.id))
        .innerJoin(products, eq(contests.productId, products.id))
        .innerJoin(subProducts, eq(contests.subProductId, subProducts.id))
        .leftJoin(contestParticipants, eq(contests.id, contestParticipants.contestId))
        .groupBy(contests.id, products.id, subProducts.id, users.id)
        .limit(1);

    const [data] = await contestQuery;

    if (!data) {
        return null;
    }

    const session = await getSession();
    let hasJoined = false;
    if (session?.sub && session.role === 'freelancer') {
        const participation = await db.query.contestParticipants.findFirst({
            where: and(eq(contestParticipants.contestId, contestId), eq(contestParticipants.freelancerId, session.sub))
        });
        hasJoined = !!participation;
    }

    return {
        ...data,
        hasJoined
    };
}

export async function submitContestEntry(
    contestId: number, 
    designData: Omit<z.infer<typeof designSchema>, 'name'>, 
    designIdParam?: number | null
) {
    const session = await getSession();
    if (!session?.sub || session.role !== 'freelancer') {
        throw new Error('Only authenticated freelancers can submit entries.');
    }
    const freelancerId = session.sub;

    // 1. Verify participation
    const participation = await db.query.contestParticipants.findFirst({
        where: and(
            eq(contestParticipants.contestId, contestId),
            eq(contestParticipants.freelancerId, freelancerId)
        ),
        with: {
            contest: true,
        },
    });

    if (!participation) {
        throw new Error('You are not a participant in this contest.');
    }
    
    if (participation.contest.status !== 'active' || new Date() > new Date(participation.contest.endDate)) {
        throw new Error('This contest is no longer accepting submissions.');
    }

    const designName = `Entry for Contest #${contestId} - ${participation.contest.title}`;
    let designId: number;

    // 2. Check if a design has already been submitted and we want to update it
    if (designIdParam) {
        // Verify design ownership
        const existingDesign = await db.query.designs.findFirst({
            where: and(
                eq(designs.id, designIdParam),
                eq(designs.userId, freelancerId)
            )
        });

        if (!existingDesign) {
            throw new Error('Design not found or not owned by you.');
        }

        // Try to update existing design
        const [updatedDesign] = await db.update(designs)
            .set({
                ...designData,
                updatedAt: new Date(),
            })
            .where(eq(designs.id, designIdParam))
            .returning({ id: designs.id });
        
        if (updatedDesign) {
            designId = updatedDesign.id;
        } else {
             // If update failed (e.g., design was deleted), create a new one.
            const [newDesign] = await db.insert(designs).values({
                ...designData,
                name: designName,
                userId: freelancerId,
            }).returning({ id: designs.id });

            if (!newDesign) throw new Error('Failed to create a new design entry after update failure.');
            designId = newDesign.id;
        }

    } else {
        // Create new design if it's the first submission or if client is forcing a new submission
        const [newDesign] = await db.insert(designs).values({
            ...designData,
            name: designName,
            userId: freelancerId,
        }).returning({ id: designs.id });

        if (!newDesign) {
            throw new Error('Failed to save the design entry.');
        }
        designId = newDesign.id;
    }

    // 3. Append new designId to design_ids array (this is the source of truth for all submissions).
    await db.execute(sql`
        UPDATE contest_participants
        SET
            status     = 'submitted',
            design_ids = CASE
                WHEN design_ids IS NULL THEN ARRAY[${designId}]::integer[]
                WHEN ${designId} = ANY(design_ids) THEN design_ids
                ELSE array_append(design_ids, ${designId})
            END
        WHERE id = ${participation.id}
    `);


    // 4. Revalidate paths
    revalidatePath(`/contests/${contestId}`);
    revalidatePath('/freelancer/contests');
    revalidatePath(`/client/contests/${contestId}`);

    return { success: true, designId: designId };
}

export async function getContestWithSubmissions(contestId: number) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    const contestData = await db.query.contests.findFirst({
        where: and(
            eq(contests.id, contestId),
            eq(contests.userId, session.sub) // Ensure client owns the contest
        ),
        with: {
            user: {
                columns: {
                    id: true,
                    name: true,
                    profileImage: true,
                }
            },
            participants: {
                columns: {
                    id: true,
                    contestId: true,
                    freelancerId: true,
                    joinedAt: true,
                    designId: true,
                    templateId: true,
                    status: true,
                    designIds: true,
                    templateIds: true,
                },
                with: {
                    freelancer: {
                        columns: {
                            id: true,
                            name: true,
                            profileImage: true,
                        }
                    },
                    submission: true,
                    template: true,
                },
            },
            winners: {
                with: {
                    freelancer: {
                        columns: {
                            id: true,
                            name: true,
                            profileImage: true,
                        }
                    }
                },
                orderBy: (contestWinners, { asc }) => [asc(contestWinners.rank)]
            },
            orders: {
                columns: {
                    id: true,
                    designId: true,
                    designUploadId: true,
                }
            }
        }
    });
    
    return contestData;
}



const winnerSchema = z.object({
  freelancerId: z.string().uuid(),
  submissionId: z.number(),
  rank: z.number().min(1).max(3),
});

export async function declareContestWinners(contestId: number, winners: z.infer<typeof winnerSchema>[]) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to declare winners.');
    }

    const contest = await db.query.contests.findFirst({
        where: and(
            eq(contests.id, contestId),
            eq(contests.userId, session.sub)
        )
    });

    if (!contest) {
        throw new Error('Contest not found or you are not the owner.');
    }

    // 1. Insert winners
    await db.insert(contestWinners).values(winners.map(w => ({
        contestId,
        freelancerId: w.freelancerId,
        templateUploadId: w.submissionId,
        rank: w.rank,
        // A simple prize distribution logic, can be expanded
        prizeAmount: w.rank === 1 ? contest.prizeAmount : '0', 
    })));
    
    // 2. Update contest status to completed and set end date to now
    await db.update(contests)
        .set({ status: 'completed', endDate: new Date() })
        .where(eq(contests.id, contestId));

    revalidatePath(`/client/contests/${contestId}`);
    revalidatePath('/client/contests');
    revalidatePath('/freelancer/contests');

    return { success: true };
}

export async function getAdminContests() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('You are not authorized to view this page.');
    }
    
    const data = await db.query.contests.findMany({
        orderBy: [desc(contests.createdAt)],
        with: {
            user: {
                columns: {
                    id: true,
                    name: true,
                }
            },
            participants: {
                columns: {
                    id: true,
                }
            }
        }
    });

    return data;
}

export async function getAdminContestDetails(contestId: number) {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Not authorized');
    }

    const contestData = await db.query.contests.findFirst({
        where: eq(contests.id, contestId),
        with: {
            user: {
                columns: {
                    id: true,
                    name: true,
                    profileImage: true,
                }
            },
            participants: {
                with: {
                    freelancer: {
                        columns: {
                            id: true,
                            name: true,
                            profileImage: true,
                        }
                    },
                    submission: true,
                    template: true,
                },
            },
            winners: {
                with: {
                    freelancer: {
                        columns: {
                            id: true,
                            name: true,
                            profileImage: true,
                        }
                    }
                },
                orderBy: (contestWinners, { asc }) => [asc(contestWinners.rank)]
            }
        }
    });
    
    return contestData;
}

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone is required'),
});

export async function orderContestSubmission(params: {
    contestId: number;
    submissionId?: number | null;
    templateId?: number | null;
    shippingAddress: z.infer<typeof addressSchema>;
}) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    const { contestId, submissionId, templateId, shippingAddress } = params;

    // 1. Fetch contest and verify client ownership
    const contest = await db.query.contests.findFirst({
        where: and(eq(contests.id, contestId), eq(contests.userId, session.sub))
    });

    if (!contest) {
        throw new Error('Contest not found or you are not authorized.');
    }

    // 2. Check if already ordered
    const existingOrder = await db.query.orders.findFirst({
        where: eq(orders.contestId, contestId)
    });
    if (existingOrder) {
        throw new Error('This contest has already been ordered for print production.');
    }

    // 3. Extract customization quantity
    const customisationObj = (contest.customisation as any) || {};
    const qty = parseInt(customisationObj.quantity || '1', 10);

    // 4. Create the prepaid order
    const result = await db.insert(orders).values({
        userId: session.sub,
        productId: contest.productId,
        subProductId: contest.subProductId,
        designId: submissionId || null,
        designUploadId: templateId || null,
        quantity: qty,
        unitPrice: '0.00',
        totalAmount: '0.00', // Already fully prepaid upfront
        shippingAddress: shippingAddress as any,
        billingAddress: shippingAddress as any, // Default to same
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'Contest Prepaid',
        customisation: customisationObj,
        contestId: contestId
    }).returning();

    const newOrder = result[0];

    // 5. Record order log
    try {
        await db.insert(orderLogs).values({
            orderId: newOrder.id,
            actionType: 'order_created',
            newValue: { status: 'confirmed', total: '0.00', prepaid: true },
            message: `Prepaid production order created directly from contest winner submission by ${session.name || 'client'}.`,
            performedBy: session.sub,
            performedByRole: session.role || 'client',
            isCustomerVisible: true
        });
    } catch (e) {
        console.error('Failed to log contest order creation:', e);
    }

    revalidatePath(`/client/contests/${contestId}`);
    revalidatePath('/client/orders');
    return { success: true, orderId: newOrder.id };
}

export async function linkDesignToContest(contestId: number, designId: number) {
    const session = await getSession();
    if (session?.role !== 'freelancer') {
        throw new Error('Only freelancers can link designs to contests.');
    }

    const participant = await db.query.contestParticipants.findFirst({
        where: and(
            eq(contestParticipants.contestId, contestId),
            eq(contestParticipants.freelancerId, session.sub)
        ),
    });

    if (!participant) {
        throw new Error('You are not a participant in this contest.');
    }

    const design = await db.query.designs.findFirst({
        where: and(
            eq(designs.id, designId),
            eq(designs.userId, session.sub)
        ),
    });

    if (!design) {
        throw new Error('Design not found or you are not the owner.');
    }

    // Append to design_ids array — this is the source of truth for all submissions
    await db.execute(sql`
        UPDATE contest_participants
        SET
            status     = 'submitted',
            design_ids = CASE
                WHEN design_ids IS NULL THEN ARRAY[${designId}]::integer[]
                WHEN ${designId} = ANY(design_ids) THEN design_ids
                ELSE array_append(design_ids, ${designId})
            END
        WHERE id = ${participant.id}
    `);

    revalidatePath('/freelancer/contests');
    revalidatePath(`/contests/${contestId}`);
    return { success: true };
}

export async function getCompletedContestsWithWinners() {
    const session = await getSession();
    if (!session?.sub || !['super_admin', 'company_admin', 'accounts', 'admin'].includes(session.role || '')) {
        throw new Error('Not authorized');
    }

    const data = await db.query.contests.findMany({
        where: eq(contests.status, 'completed'),
        orderBy: [desc(contests.updatedAt)],
        with: {
            user: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                }
            },
            winners: {
                with: {
                    freelancer: {
                        columns: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                        }
                    }
                },
                orderBy: (contestWinners, { asc }) => [asc(contestWinners.rank)]
            }
        }
    });

    return data;
}


