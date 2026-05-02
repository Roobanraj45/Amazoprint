import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { path } = await params;
  
  if (!path || path.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const filePath = join(process.cwd(), 'storage', 'uploads', ...path);

  // Security check: ensure path is within storage/uploads
  const storageDir = join(process.cwd(), 'storage', 'uploads');
  if (!filePath.startsWith(storageDir)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    // Fallback to public/uploads just in case some old files are still there
    const publicFallbackPath = join(process.cwd(), 'public', 'uploads', ...path);
    if (fs.existsSync(publicFallbackPath)) {
      try {
        const fileBuffer = await readFile(publicFallbackPath);
        const contentType = getContentType(extname(publicFallbackPath));
        return new NextResponse(fileBuffer, {
          headers: { 'Content-Type': contentType },
        });
      } catch (e) {
        return new NextResponse('Error reading file', { status: 500 });
      }
    }
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    const contentType = getContentType(extname(filePath));

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error reading media file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.otf': 'font/otf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}
