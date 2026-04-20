
'use server';

import { z } from 'zod';
import { db } from '@/db';
import { designVerifications, designs, designUploads, users } from '@/db/schema';
import { and, eq, desc, isNull, or, inArray, isNotNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

const verificationSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  designSourceType: z.enum(['saved', 'uploaded']),
  sourceId: z.coerce.number().min(1, 'A design must be selected.'),
  clientNotes: z.string().optional(),
});

export async function submitForVerification(data: z.infer<typeof verificationSchema>) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('You must be logged in to submit a verification request.');
    }

    const validated = verificationSchema.parse(data);

    // In a real app, you would process a payment here.
    const verificationFee = '500.00'; 
    
    await db.insert(designVerifications).values({
        userId: session.sub,
        title: validated.title,
        designId: validated.designSourceType === 'saved' ? validated.sourceId : null,
        uploadId: validated.designSourceType === 'uploaded' ? validated.sourceId : null,
        clientNotes: validated.clientNotes,
        verificationFee: verificationFee,
        status: 'pending',
    });

    revalidatePath('/client/verifications');
    return { success: true };
}


export async function getClientVerifications() {
    const session = await getSession();
    if (!session?.sub) throw new Error('Not authenticated.');

    return await db.query.designVerifications.findMany({
        where: eq(designVerifications.userId, session.sub),
        with: {
            freelancer: { columns: { name: true, profileImage: true } },
            design: true,
            upload: true,
        },
        orderBy: [desc(designVerifications.createdAt)],
    });
}

export async function getAvailableVerificationJobs() {
    const session = await getSession();
    if (session?.role !== 'freelancer') throw new Error('Only freelancers can view jobs.');
    
    return await db.query.designVerifications.findMany({
        where: eq(designVerifications.status, 'pending'),
        with: {
            user: { columns: { name: true, profileImage: true } },
            design: true,
            upload: true,
        },
        orderBy: [desc(designVerifications.createdAt)],
    });
}

export async function getFreelancerVerifications() {
    const session = await getSession();
    if (session?.role !== 'freelancer') throw new Error('Only freelancers can view their jobs.');

    return await db.query.designVerifications.findMany({
        where: eq(designVerifications.freelancerId, session.sub),
        with: {
            user: { columns: { name: true, profileImage: true } },
            design: true,
            upload: true,
        },
        orderBy: [desc(designVerifications.assignedAt)],
    });
}

export async function acceptVerificationJob(id: number) {
    const session = await getSession();
    if (session?.role !== 'freelancer') {
        throw new Error('Only freelancers can accept jobs.');
    }

    const job = await db.query.designVerifications.findFirst({ where: eq(designVerifications.id, id) });
    if (job?.status !== 'pending') {
        throw new Error('This job is no longer available.');
    }

    await db.update(designVerifications)
        .set({ 
            freelancerId: session.sub,
            status: 'assigned',
            assignedAt: new Date(),
        })
        .where(eq(designVerifications.id, id));

    revalidatePath('/freelancer/verifications');
}

const feedbackSchema = z.object({
  id: z.coerce.number(),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters.'),
});

export async function submitVerificationFeedback(data: z.infer<typeof feedbackSchema>) {
    const session = await getSession();
    if (session?.role !== 'freelancer') {
        throw new Error('Only freelancers can submit feedback.');
    }

    const { id, feedback } = feedbackSchema.parse(data);

    const job = await db.query.designVerifications.findFirst({ where: eq(designVerifications.id, id) });

    if (job?.freelancerId !== session.sub) {
        throw new Error('You are not assigned to this job.');
    }

    await db.update(designVerifications)
        .set({
            freelancerFeedback: feedback,
            status: 'completed',
            completedAt: new Date(),
        })
        .where(eq(designVerifications.id, id));

    revalidatePath('/freelancer/verifications');
    revalidatePath('/client/verifications');
}


export async function uploadVerificationRevision(formData: FormData) {
    const session = await getSession();
    if (session?.role !== 'freelancer') {
        throw new Error('Only freelancers can upload revisions.');
    }
    
    const verificationId = formData.get('verificationId');
    const file = formData.get('file') as File | null;

    if (!verificationId || !file) {
        throw new Error('Missing verification ID or file.');
    }

    const job = await db.query.designVerifications.findFirst({
        where: and(
            eq(designVerifications.id, Number(verificationId)),
            eq(designVerifications.freelancerId, session.sub)
        )
    });
    if (!job) {
        throw new Error('Verification job not found or you are not assigned to it.');
    }

    // Always save the new file first
    const userFolder = job.userId; // Save to client's folder for consistency
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'designs', userFolder);
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/designs/${userFolder}/${uniqueFilename}`;
    
    await writeFile(filePath, buffer);

    // Check if there's an existing upload to update
    if (job.uploadId) {
        // Find old upload to delete file, but be careful not to fail if it's missing
        try {
            const oldUpload = await db.query.designUploads.findFirst({ where: eq(designUploads.id, job.uploadId) });
            if (oldUpload?.filePath) {
                const oldFilePath = join(process.cwd(), 'public', oldUpload.filePath);
                 if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        } catch (e) {
            console.error("Could not delete old upload file, proceeding with DB update.", e);
        }

        const [updatedUpload] = await db.update(designUploads).set({
            filePath: relativePath,
            originalFilename: `[REVISION] ${file.name}`,
            fileSize: file.size,
            mimeType: file.type,
            updatedAt: new Date(),
        }).where(eq(designUploads.id, job.uploadId)).returning();
        
        revalidatePath(`/freelancer/verifications`);
        return { success: true, uploadId: updatedUpload.id };
    } else {
        // If no upload was associated, create a new one and link it to the verification job
        const [newUpload] = await db.insert(designUploads).values({
            userId: job.userId, // Attribute new upload to the client
            filePath: relativePath,
            originalFilename: `[REVISION] ${file.name}`,
            fileSize: file.size,
            mimeType: file.type,
            uploadStatus: 'completed',
            isPublic: false,
        }).returning();
        
        await db.update(designVerifications).set({
            uploadId: newUpload.id,
            updatedAt: new Date(),
        }).where(eq(designVerifications.id, Number(verificationId)));
        
        revalidatePath(`/freelancer/verifications`);
        return { success: true, uploadId: newUpload.id };
    }
}

export async function linkDesignToVerification(verificationId: number, designId: number) {
    const session = await getSession();
    if (session?.role !== 'freelancer') {
        throw new Error('Only freelancers can link designs.');
    }

    const verification = await db.query.designVerifications.findFirst({
        where: and(
            eq(designVerifications.id, verificationId),
            eq(designVerifications.freelancerId, session.sub)
        ),
    });

    if (!verification) {
        throw new Error('Verification job not found or you are not assigned to it.');
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

    await db.update(designVerifications).set({
        designId: designId,
        updatedAt: new Date(),
    }).where(eq(designVerifications.id, verificationId));

    revalidatePath('/freelancer/verifications');
    return { success: true };
}
