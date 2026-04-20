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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const uploadSchema = z.object({
    name: z.string().min(1, 'Design name is required.'),
    isPublic: z.preprocess((val) => val === 'true', z.boolean()),
    description: z.string().optional(),
    productId: z.coerce.number().optional(),
    subProductId: z.coerce.number().optional(),
    quantity: z.coerce.number().optional().default(100),
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
    const { name, isPublic, description, productId, subProductId, quantity } = validated.data;

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
        }).returning();
        
        if (productId && subProductId && newUpload.id) {
            return { success: true, redirectTo: `/checkout?uploadId=${newUpload.id}&quantity=${quantity}` };
        }

        revalidatePath('/client/my-uploads');
        revalidatePath('/freelancer/my-uploads');

        return { success: true, url: filePath };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to save the file.' };
    }
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
