import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
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
  const uploadsDir = join(process.cwd(), 'public', 'uploads', folderName);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create a unique filename to avoid overwriting files
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const path = join(uploadsDir, filename);

  try {
    await writeFile(path, buffer);
    const relativeUrl = `/uploads/${folderName}/${filename}`;
    
    return NextResponse.json({ success: true, url: relativeUrl });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file' }, { status: 500 });
  }
}
