import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

export async function GET() {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  const folders = [];

  try {
    // Ensure the root uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return NextResponse.json({ success: true, folders: [] });
    }

    const topLevelEntries = await readdir(uploadsDir);

    for (const entry of topLevelEntries) {
      const entryPath = join(uploadsDir, entry);
      const entryStat = await stat(entryPath);

      if (entryStat.isDirectory()) {
        const filenames = await readdir(entryPath);
        // Sort files by creation time (newest first), if possible.
        // This is a simple approximation by filename date prefix.
        const sortedFilenames = filenames.sort((a, b) => {
            const aTime = parseInt(a.split('-')[0]);
            const bTime = parseInt(b.split('-')[0]);
            if (!isNaN(aTime) && !isNaN(bTime)) {
                return bTime - aTime;
            }
            return b.localeCompare(a);
        });

        const fileUrls = sortedFilenames.map(name => `/uploads/${entry}/${name}`);
        folders.push({ name: entry, files: fileUrls });
      }
    }

    return NextResponse.json({ success: true, folders });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    return NextResponse.json({ success: false, error: 'Failed to list uploaded files' }, { status: 500 });
  }
}
