// Updated to force re-registration of server actions
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { contests, contestParticipants, products, subProducts, users, designs, contestWinners } from '@/db/schema';
import { and, eq, sql, desc, count, gt } from 'drizzle-orm';
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

    const result = await db.insert(contests).values({
        ...validated,
        userId: session.sub,
        productName: product.name,
        subProductName: subProduct.name,
        startDate: new Date(),
    }).returning();
    
    revalidatePath('/contests');
    revalidatePath('/client/contests');
    return result[0];
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
        db.select({ contestId: contestParticipants.contestId, joinedAt: contestParticipants.joinedAt })
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
            winnerRank: sql<number>`(SELECT rank FROM ${contestWinners} WHERE ${contestWinners.contestId} = ${contests.id} AND ${contestWinners.freelancerId} = ${freelancerId} LIMIT 1)`.mapWith(Number),
        })
        .from(contests)
        .innerJoin(freelancerParticipations, eq(contests.id, freelancerParticipations.contestId))
        .innerJoin(users, eq(contests.userId, users.id))
        .innerJoin(products, eq(contests.productId, products.id))
        .innerJoin(subProducts, eq(contests.subProductId, subProducts.id))
        .leftJoin(contestParticipants, eq(contests.id, contestParticipants.contestId))
        .groupBy(contests.id, products.id, subProducts.id, users.id, freelancerParticipations.joinedAt)
        .orderBy(desc(freelancerParticipations.joinedAt));
    
    return data;
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

export async function submitContestEntry(contestId: number, designData: Omit<z.infer<typeof designSchema>, 'name'>) {
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

    // 2. Check if a design has already been submitted and update it, otherwise create a new one.
    if (participation.templateUploadId) {
        // Try to update existing design
        const [updatedDesign] = await db.update(designs)
            .set({
                ...designData,
                updatedAt: new Date(),
            })
            .where(eq(designs.id, participation.templateUploadId))
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
        // Create new design if it's the first submission
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

    // 3. ALWAYS update the contest_participants table with the correct designId and status.
    await db.update(contestParticipants)
        .set({
            templateUploadId: designId,
            status: 'submitted'
        })
        .where(eq(contestParticipants.id, participation.id));


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
                with: {
                    freelancer: {
                        columns: {
                            id: true,
                            name: true,
                            profileImage: true,
                        }
                    },
                    submission: true,
                },
                where: eq(contestParticipants.status, 'submitted')
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
