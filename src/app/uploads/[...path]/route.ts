import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { extname, join, dirname } from 'path';
import { resolveUploadPath } from '@/lib/storage';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  
  if (!path || path.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 1. Try to find the file in public uploads (local)
  let filePath = resolveUploadPath('public', path);
  
  // 2. Try secondary storage uploads (local)
  if (!filePath) {
    filePath = resolveUploadPath('storage', path);
  }

  if (filePath && fs.existsSync(filePath)) {
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
      // Fall through to remote proxy if local read fails
    }
  }

  // 3. Fallback: Proxy from remote production server if file was uploaded on remote or during dev testing
  try {
    const remotePath = path.join('/');
    const remoteUrl = `https://amazoprint.in/uploads/${remotePath}`;
    const remoteResponse = await fetch(remoteUrl, {
      headers: { 'User-Agent': 'AmazoPrint-Dev-Proxy/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (remoteResponse.ok) {
      const arrayBuffer = await remoteResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = remoteResponse.headers.get('content-type') || getContentType(extname(path[path.length - 1]));

      // Cache file locally so subsequent requests are served directly from disk
      try {
        const localSavePath = join(process.cwd(), 'public', 'uploads', ...path);
        const parentDir = dirname(localSavePath);
        if (!fs.existsSync(parentDir)) {
          await mkdir(parentDir, { recursive: true });
        }
        await writeFile(localSavePath, buffer);
      } catch (cacheErr) {
        // Non-critical caching error
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'X-Proxied-From': 'amazoprint.in',
        },
      });
    }
  } catch (proxyError) {
    // Remote proxy fetch failed
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
