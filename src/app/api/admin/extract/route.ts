import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export async function GET(req: NextRequest) {
  try {
    const zip = new JSZip();
    const publicDir = path.join(process.cwd(), 'public');

    if (!fs.existsSync(publicDir)) {
      return NextResponse.json({ error: 'Public directory not found' }, { status: 404 });
    }

    const addFilesToZip = (dir: string, zipFolder: JSZip) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          const newZipFolder = zipFolder.folder(file);
          if (newZipFolder) {
            addFilesToZip(filePath, newZipFolder);
          }
        } else {
          const fileContent = fs.readFileSync(filePath);
          zipFolder.file(file, fileContent);
        }
      }
    };

    addFilesToZip(publicDir, zip);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="amazoprint-uploads.zip"`,
      },
    });
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract files' }, { status: 500 });
  }
}
