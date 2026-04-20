
'use server';

import { db } from '@/db';
import { contestMessages, contests, users } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function getConversation(contestId: number, freelancerId: string) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    const contest = await db.query.contests.findFirst({
        where: eq(contests.id, contestId)
    });

    if (!contest) {
        throw new Error('Contest not found.');
    }
    
    // Security check: Only the contest owner or the specified freelancer can view messages.
    if (session.sub !== contest.userId && session.sub !== freelancerId) {
        throw new Error('You are not authorized to view this conversation.');
    }

    const messages = await db.query.contestMessages.findMany({
        where: and(
            eq(contestMessages.contestId, contestId),
            eq(contestMessages.freelancerId, freelancerId)
        ),
        with: {
            sender: {
                columns: {
                    id: true,
                    name: true,
                    profileImage: true,
                }
            }
        },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)]
    });

    return messages;
}


const messageSchema = z.object({
    contestId: z.coerce.number(),
    receiverId: z.string().uuid(),
    freelancerId: z.string().uuid(),
    message: z.string().min(1, "Message cannot be empty."),
});

export async function sendMessage(formData: FormData) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    const validated = messageSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validated.success) {
        throw new Error(validated.error.errors.map(e => e.message).join(', '));
    }

    const { contestId, receiverId, freelancerId, message } = validated.data;
    const senderId = session.sub;

    const contest = await db.query.contests.findFirst({ where: eq(contests.id, contestId) });
    if (!contest) throw new Error('Contest not found.');

    // Security check: Sender must be either client or freelancer
    if (senderId !== contest.userId && senderId !== freelancerId) {
        throw new Error('You are not authorized to send messages in this contest.');
    }

    await db.insert(contestMessages).values({
        contestId,
        senderId,
        receiverId,
        freelancerId,
        message,
    });

    revalidatePath(`/client/contests/${contestId}`);
    // Future: revalidatePath for freelancer view as well
}

export async function markConversationAsRead(contestId: number, freelancerId: string) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    const contest = await db.query.contests.findFirst({
        where: eq(contests.id, contestId)
    });
    if (!contest) {
        throw new Error('Contest not found.');
    }
    
    // Security check: Only participants of the conversation can mark messages as read.
    if (session.sub !== contest.userId && session.sub !== freelancerId) {
        throw new Error('You are not authorized to perform this action.');
    }

    await db.update(contestMessages).set({
        isRead: true
    }).where(and(
        eq(contestMessages.contestId, contestId),
        eq(contestMessages.freelancerId, freelancerId),
        eq(contestMessages.receiverId, session.sub),
        eq(contestMessages.isRead, false)
    ));
}
