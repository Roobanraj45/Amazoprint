import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import fs from 'fs';

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

  // Ensure the specific uploads directory exists
  const uploadsDir = join(process.cwd(), 'storage', 'uploads', folderName);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create a unique filename to avoid overwriting files
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const path = join(uploadsDir, filename);

  try {
    await writeFile(path, buffer);
    const relativeUrl = `/api/media/${folderName}/${filename}`;
    
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
    
    // Check both storage and public
    const storagePath = resolve(process.cwd(), 'storage', 'uploads', sanitizedPath);
    const publicPath = resolve(process.cwd(), 'public', 'uploads', sanitizedPath);
    
    if (fs.existsSync(storagePath)) {
      await unlink(storagePath);
      return NextResponse.json({ success: true });
    } else if (fs.existsSync(publicPath)) {
      await unlink(publicPath);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
}
