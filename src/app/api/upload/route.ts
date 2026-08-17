import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { getStorageDir, resolveUploadPath } from '@/lib/storage';

// Helper to sanitize folder names
const sanitizeFolderName = (name: string) => {
  return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
};

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;
  const folder: string | null = data.get('folder') as unknown as string;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
  }

  const folderName = sanitizeFolderName(folder || 'products');

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 1. Ensure the public/uploads folder in project exists and write file
  const publicUploadsDir = join(process.cwd(), 'public', 'uploads', folderName);
  if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
  }

  // Create a unique filename to avoid overwriting files
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const publicPath = join(publicUploadsDir, filename);

  try {
    await writeFile(publicPath, buffer);

    // 2. Also write to storage/uploads directory for redundancy
    try {
      const storageUploadsDir = getStorageDir('storage');
      const storageDir = join(storageUploadsDir, folderName);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      const storagePath = join(storageDir, filename);
      await writeFile(storagePath, buffer);
    } catch (err) {
      // Non-critical fallback error
    }

    const relativeUrl = `/uploads/${folderName}/${filename}`;
    
    return NextResponse.json({ success: true, url: relativeUrl });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlToDelete = searchParams.get('url');

    if (!urlToDelete || (!urlToDelete.startsWith('/uploads/') && !urlToDelete.startsWith('/api/media/'))) {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    // Sanitize the path to prevent directory traversal
    const sanitizedPath = urlToDelete.replace('/api/media/', '').replace('/uploads/', '').replace(/\.\./g, '').replace(/^\/+/, '');
    const pathParts = sanitizedPath.split('/');
    
    // Check direct public path in project
    const localPublicPath = join(process.cwd(), 'public', 'uploads', ...pathParts);
    if (fs.existsSync(localPublicPath)) {
      try {
        await unlink(localPublicPath);
      } catch (e) {}
    }

    // Resolve paths using our helper
    const storagePath = resolveUploadPath('storage', pathParts);
    const publicPath = resolveUploadPath('public', pathParts);
    
    if (storagePath && fs.existsSync(storagePath)) {
      try {
        await unlink(storagePath);
      } catch (e) {}
    }
    if (publicPath && fs.existsSync(publicPath) && publicPath !== localPublicPath) {
      try {
        await unlink(publicPath);
      } catch (e) {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
}
