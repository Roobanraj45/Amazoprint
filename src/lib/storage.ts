import { resolve, join } from 'path';
import fs from 'fs';

/**
 * Gets the server uploads directory.
 * Always resolves to process.cwd() + '/public/uploads' (or specified subDir)
 */
export function getStorageDir(subDir: 'storage' | 'public' = 'public'): string {
  const dir = join(process.cwd(), subDir === 'storage' ? 'storage' : 'public', 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Resolves a physical upload path on the server filesystem.
 * Returns null if the file does not exist or if it tries to escape the base directory.
 */
export function resolveUploadPath(subDir: 'storage' | 'public', pathParts: string[]): string | null {
  // Check public/uploads first
  const publicBase = resolve(process.cwd(), 'public', 'uploads');
  const publicPath = resolve(publicBase, ...pathParts);
  if (publicPath.startsWith(publicBase) && fs.existsSync(publicPath)) {
    return publicPath;
  }

  // Check storage/uploads as secondary server path
  const storageBase = resolve(process.cwd(), 'storage', 'uploads');
  const storagePath = resolve(storageBase, ...pathParts);
  if (storagePath.startsWith(storageBase) && fs.existsSync(storagePath)) {
    return storagePath;
  }

  return null;
}
