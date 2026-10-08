import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { listFirebaseStorageFiles } from '@/lib/firebase';

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
    // 1. Scan server local directories
    await scanDir(join(process.cwd(), 'public', 'uploads'), '/uploads');
    await scanDir(join(process.cwd(), 'storage', 'uploads'), '/uploads');

    // 2. Fetch Firebase Storage assets for products
    try {
      const fbProducts = await listFirebaseStorageFiles('products');
      if (fbProducts.length > 0) {
        if (!folders['products']) folders['products'] = new Set();
        fbProducts.forEach(file => {
          folders['products'].add(file.url);
        });
      }
    } catch (fbErr) {
      console.warn('Failed to fetch Firebase Storage assets list:', fbErr);
    }

    const result = Object.entries(folders).map(([name, files]) => ({
      name,
      files: Array.from(files).sort((a, b) => {
        // Sort by filename descending
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
