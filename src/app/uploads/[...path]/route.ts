import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import { resolveUploadPath } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  
  if (!path || path.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Find the file in either process.cwd()/public/uploads or /tmp/amazoprint/public/uploads
  const filePath = resolveUploadPath('public', path);
  if (!filePath) {
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
    console.error('Error reading media file from uploads route:', error);
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
