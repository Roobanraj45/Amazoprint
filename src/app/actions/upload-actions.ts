'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { db } from '@/db';
import { designUploads } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { contestParticipants } from '@/db/schema';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const uploadSchema = z.object({
    name: z.string().min(1, 'Design name is required.'),
    isPublic: z.preprocess((val) => val === 'true', z.boolean()),
    description: z.string().optional(),
    productId: z.preprocess((val) => (val === undefined || val === 'null' || val === 'undefined' || val === '' || val === null ? undefined : Number(val)), z.number().optional()),
    subProductId: z.preprocess((val) => (val === undefined || val === 'null' || val === 'undefined' || val === '' || val === null ? undefined : Number(val)), z.number().optional()),
    quantity: z.preprocess((val) => (val === undefined || val === 'null' || val === 'undefined' || val === '' || val === null ? 100 : Number(val)), z.number().optional().default(100)),
    contestId: z.preprocess((val) => (val === undefined || val === 'null' || val === 'undefined' || val === '' || val === null ? undefined : Number(val)), z.number().optional()),
});


export async function getMyUploads() {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }
    return await db.query.designUploads.findMany({
        where: eq(designUploads.userId, session.sub),
        orderBy: [desc(designUploads.createdAt)],
        with: {
            product: true,
            subProduct: true,
        },
    });
}

async function processAndSaveFile(file: File, userFolder: string): Promise<string> {
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
    return relativePath;
}


export async function uploadDesign(formData: FormData) {
    const session = await getSession();
    if (!session?.sub) {
        return { success: false, error: 'Not authenticated' };
    }

    const rawData = Object.fromEntries(formData.entries());
    const validated = uploadSchema.safeParse(rawData);

    if (!validated.success) {
        return { success: false, error: validated.error.errors.map(e => e.message).join(', ') };
    }
    const { name, isPublic, description, productId, subProductId, quantity, contestId } = validated.data;

    const file = formData.get('file') as File | null;
    if (!file) {
        return { success: false, error: 'No file provided.' };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: `File size must be less than 50MB.` };
    }

    try {
        const userFolder = session.sub;
        const filePath = await processAndSaveFile(file, userFolder);

        let thumbnailPath: string | undefined = undefined;
        const thumbnailFile = formData.get('thumbnail') as File | null;
        if (thumbnailFile && thumbnailFile.size > 0) {
            thumbnailPath = await processAndSaveFile(thumbnailFile, userFolder);
        }
        
        let customisationObj: any = {};
        const customisationStr = formData.get('customisation') as string | null;
        if (customisationStr) {
            try {
                customisationObj = JSON.parse(customisationStr);
            } catch (err) {
                console.error('Failed to parse customisation JSON', err);
            }
        }
        
        const [newUpload] = await db.insert(designUploads).values({
            userId: session.sub,
            filePath: filePath,
            originalFilename: name,
            fileSize: file.size,
            mimeType: file.type,
            thumbnailPath: thumbnailPath,
            uploadStatus: 'completed',
            isPublic: isPublic,
            metadata: description ? { description } : undefined,
            productId: productId,
            subProductId: subProductId,
            customisation: customisationObj,
        }).returning();
        
        if (contestId && newUpload.id) {
            await db.update(contestParticipants)
                .set({
                    templateId: newUpload.id,
                    status: 'submitted',
                })
                .where(and(eq(contestParticipants.contestId, contestId), eq(contestParticipants.freelancerId, session.sub)));
            
            revalidatePath(`/client/contests/${contestId}`);
            revalidatePath('/freelancer/contests');
            
            return { success: true, url: filePath, redirectTo: '/freelancer/contests' };
        }

        if (productId && subProductId && newUpload.id) {
            return { success: true, redirectTo: `/checkout?uploadId=${newUpload.id}&quantity=${quantity}` };
        }

        revalidatePath('/client/my-uploads');
        revalidatePath('/freelancer/my-uploads');

        return { success: true, url: filePath };
    } catch (e) {
        console.error('Error in uploadDesign:', e);
        return { success: false, error: formatDatabaseError(e) };
    }
}

function formatDatabaseError(e: any): string {
    if (!e) return 'An unexpected error occurred while saving your design.';
    const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : String(e));

    if (msg.includes('null value in column')) {
        if (msg.includes('product_id')) return 'Please select a valid product before uploading your design.';
        if (msg.includes('sub_product_id')) return 'Please select a specific size or variant for your product before uploading.';
        if (msg.includes('original_filename')) return 'A design title is required.';
        if (msg.includes('file_path')) return 'File upload failed. Please try uploading your artwork again.';
        return 'A required field is missing. Please ensure all necessary details are provided.';
    }

    if (msg.includes('violates foreign key constraint')) {
        if (msg.includes('product_id')) return 'The selected product is invalid or no longer available.';
        if (msg.includes('sub_product_id')) return 'The selected product size/variant is invalid or no longer available.';
        if (msg.includes('user_id')) return 'Your session appears to be invalid. Please log in again.';
        return 'Selected related information is invalid or no longer exists.';
    }

    if (msg.includes('violates unique constraint')) {
        return 'A record with this information already exists.';
    }

    if (msg.includes('value too long for type character varying')) {
        return 'The text entered is too long. Please shorten your title or description.';
    }

    if (msg.includes('invalid input syntax')) {
        return 'Invalid data format provided. Please check your selections and try again.';
    }

    return 'We encountered an issue saving your design details. Please try again.';
}

export async function deleteUpload(id: number) {
    const session = await getSession();
    if (!session?.sub) {
        throw new Error('Not authenticated');
    }

    const upload = await db.query.designUploads.findFirst({
        where: and(
            eq(designUploads.id, id),
            eq(designUploads.userId, session.sub)
        )
    });

    if (!upload) {
        throw new Error('Upload not found or you do not have permission to delete it.');
    }
    
    // Delete main file from filesystem
    const mainFilePath = join(process.cwd(), 'public', upload.filePath);
    if (fs.existsSync(mainFilePath)) {
        try {
            fs.unlinkSync(mainFilePath);
        } catch (e) {
            console.error(`Failed to delete file: ${mainFilePath}`, e);
        }
    }
    
    // Delete thumbnail file from filesystem
    if (upload.thumbnailPath) {
        const thumbFilePath = join(process.cwd(), 'public', upload.thumbnailPath);
        if (fs.existsSync(thumbFilePath)) {
            try {
                fs.unlinkSync(thumbFilePath);
            } catch (e) {
                console.error(`Failed to delete thumbnail file: ${thumbFilePath}`, e);
            }
        }
    }


    await db.delete(designUploads).where(eq(designUploads.id, id));

    revalidatePath('/client/my-uploads');
    revalidatePath('/freelancer/my-uploads');

    return { success: true };
}
