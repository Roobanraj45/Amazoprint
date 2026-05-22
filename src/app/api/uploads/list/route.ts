import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

export async function GET() {
  const folders: Record<string, Set<string>> = {};

  const scanDir = async (baseDir: string, apiPrefix: string) => {
    if (!fs.existsSync(baseDir)) return;
    try {
      const topLevelEntries = await readdir(baseDir);
      for (const entry of topLevelEntries) {
        const entryPath = join(baseDir, entry);
        const entryStat = await stat(entryPath);
        if (entryStat.isDirectory()) {
          const filenames = await readdir(entryPath);
          if (!folders[entry]) folders[entry] = new Set();
          filenames.forEach(name => {
            if (!name.startsWith('.write_test_')) {
              folders[entry].add(`${apiPrefix}/${entry}/${name}`);
            }
          });
        }
      }
    } catch (e) {
      console.error(`Error scanning directory ${baseDir}:`, e);
    }
  };

  try {
    // Scan storage/uploads in local and temp
    await scanDir(join(process.cwd(), 'storage', 'uploads'), '/api/media');
    await scanDir(join(os.tmpdir(), 'amazoprint', 'storage', 'uploads'), '/api/media');

    // Scan public/uploads in local and temp for backward compatibility
    await scanDir(join(process.cwd(), 'public', 'uploads'), '/api/media');
    await scanDir(join(os.tmpdir(), 'amazoprint', 'public', 'uploads'), '/api/media');

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
