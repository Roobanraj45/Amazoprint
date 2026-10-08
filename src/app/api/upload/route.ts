import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { getStorageDir, resolveUploadPath } from '@/lib/storage';
import { uploadToFirebaseStorage, deleteFromFirebaseStorage } from '@/lib/firebase';
import { compressImageBuffer } from '@/lib/image-compress';

// Helper to sanitize folder names
const sanitizeFolderName = (name: string) => {
  return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folder: string | null = data.get('folder') as unknown as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
    }

    const folderName = sanitizeFolderName(folder || 'products');

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // 1. Compress image to less than 1 MB (< 1000 KB)
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|tiff)$/i.test(file.name);
    let finalBuffer: Buffer = rawBuffer;
    let finalContentType = file.type || 'application/octet-stream';
    let ext = file.name.split('.').pop()?.toLowerCase() || 'webp';

    if (isImage) {
      const compressed = await compressImageBuffer(rawBuffer, 1000 * 1024, ext === 'png' ? 'png' : 'webp');
      finalBuffer = compressed.buffer;
      finalContentType = compressed.contentType;
      if (compressed.format === 'webp') {
        ext = 'webp';
      } else if (compressed.format === 'svg') {
        ext = 'svg';
      }
    }

    // Clean filename
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${Date.now()}-${baseName}.${ext}`;

    // 2. Upload to Firebase Storage (Bucket: gs://amazoprint-2faa2.firebasestorage.app)
    let firebaseDownloadUrl: string | null = null;
    const firebasePath = `${folderName}/${filename}`;

    try {
      const fbResult = await uploadToFirebaseStorage(finalBuffer, firebasePath, finalContentType);
      if (fbResult.success) {
        firebaseDownloadUrl = fbResult.url;
      }
    } catch (fbError) {
      console.error('Firebase Storage upload failed, falling back to local storage:', fbError);
    }

    // 3. Local storage redundancy (public/uploads)
    const publicUploadsDir = join(process.cwd(), 'public', 'uploads', folderName);
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }
    const publicPath = join(publicUploadsDir, filename);
    await writeFile(publicPath, finalBuffer);

    try {
      const storageUploadsDir = getStorageDir('storage');
      const storageDir = join(storageUploadsDir, folderName);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      const storagePath = join(storageDir, filename);
      await writeFile(storagePath, finalBuffer);
    } catch (err) {
      // Non-critical local storage fallback
    }

    const relativeUrl = `/uploads/${folderName}/${filename}`;
    // Prefer Firebase Storage URL if available; otherwise use relative url
    const returnUrl = firebaseDownloadUrl || relativeUrl;

    return NextResponse.json({
      success: true,
      url: returnUrl,
      relativeUrl,
      size: finalBuffer.length,
      compressed: finalBuffer.length < rawBuffer.length,
      originalSize: rawBuffer.length,
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save file' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlToDelete = searchParams.get('url');

    if (!urlToDelete) {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    // If Firebase Storage URL, delete from Firebase
    if (urlToDelete.includes('firebasestorage.googleapis.com')) {
      await deleteFromFirebaseStorage(urlToDelete);
    }

    // Also remove from local filesystem if applicable
    if (urlToDelete.startsWith('/uploads/') || urlToDelete.startsWith('/api/media/')) {
      const sanitizedPath = urlToDelete
        .replace('/api/media/', '')
        .replace('/uploads/', '')
        .replace(/\.\./g, '')
        .replace(/^\/+/, '');
      const pathParts = sanitizedPath.split('/');

      const localPublicPath = join(process.cwd(), 'public', 'uploads', ...pathParts);
      if (fs.existsSync(localPublicPath)) {
        try {
          await unlink(localPublicPath);
        } catch (e) {}
      }

      const storagePath = resolveUploadPath('storage', pathParts);
      if (storagePath && fs.existsSync(storagePath)) {
        try {
          await unlink(storagePath);
        } catch (e) {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
}
