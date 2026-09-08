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

  // 1. Try to find the file in storage uploads (local or temp)
  let filePath = resolveUploadPath('storage', path);
  
  // 2. Fallback to public uploads (local or temp)
  if (!filePath) {
    filePath = resolveUploadPath('public', path);
  }

  if (filePath) {
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
      console.error('Error reading local media file:', error);
      // fall through to remote proxy
    }
  }

  // 3. File not found locally — proxy from amazoprint.in (handles images uploaded on other machines)
  try {
    const remotePath = path.join('/');
    // Try /uploads/ first, then /api/media/
    const remoteUrl = `https://amazoprint.in/uploads/${remotePath}`;
    const remoteResponse = await fetch(remoteUrl, {
      headers: { 'User-Agent': 'AmazoPrint-Dev-Proxy/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (remoteResponse.ok) {
      const buffer = await remoteResponse.arrayBuffer();
      const contentType = remoteResponse.headers.get('content-type') || getContentType(extname(path[path.length - 1]));
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'X-Proxied-From': 'amazoprint.in',
        },
      });
    }
  } catch (proxyError) {
    console.error('Remote proxy fetch failed:', proxyError);
  }

  return new NextResponse('Not Found', { status: 404 });
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
