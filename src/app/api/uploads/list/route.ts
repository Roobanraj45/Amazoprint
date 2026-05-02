import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

export async function GET() {
  const storageDir = join(process.cwd(), 'storage', 'uploads');
  const publicDir = join(process.cwd(), 'public', 'uploads');
  const folders: Record<string, Set<string>> = {};

  try {
    // Scan storage/uploads
    if (fs.existsSync(storageDir)) {
      const topLevelEntries = await readdir(storageDir);
      for (const entry of topLevelEntries) {
        const entryPath = join(storageDir, entry);
        const entryStat = await stat(entryPath);
        if (entryStat.isDirectory()) {
          const filenames = await readdir(entryPath);
          if (!folders[entry]) folders[entry] = new Set();
          filenames.forEach(name => folders[entry].add(`/api/media/${entry}/${name}`));
        }
      }
    }

    // Scan public/uploads for backward compatibility
    if (fs.existsSync(publicDir)) {
      const topLevelEntries = await readdir(publicDir);
      for (const entry of topLevelEntries) {
        const entryPath = join(publicDir, entry);
        const entryStat = await stat(entryPath);
        if (entryStat.isDirectory()) {
          const filenames = await readdir(entryPath);
          if (!folders[entry]) folders[entry] = new Set();
          filenames.forEach(name => folders[entry].add(`/api/media/${entry}/${name}`));
        }
      }
    }

    const result = Object.entries(folders).map(([name, files]) => ({
      name,
      files: Array.from(files).sort((a, b) => {
        // Sort by filename (which includes timestamp) descending
        const aName = a.split('/').pop() || '';
        const bName = b.split('/').pop() || '';
        return bName.localeCompare(aName);
      })
    }));

    return NextResponse.json({ success: true, folders: result });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    return NextResponse.json({ success: false, error: 'Failed to list uploaded files' }, { status: 500 });
  }
}
