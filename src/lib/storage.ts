import { resolve, join } from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Checks if a directory is writable by writing a small test file.
 */
function isDirWritable(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const testFile = join(dir, `.write_test_${Math.random().toString(36).substring(2, 9)}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Gets the writable directory for storage.
 * Local: process.cwd() + '/[subDir]/uploads'
 * Production (Read-only filesystem): os.tmpdir() + '/amazoprint/[subDir]/uploads'
 */
export function getStorageDir(subDir: 'storage' | 'public'): string {
  const localDir = join(process.cwd(), subDir, 'uploads');
  if (isDirWritable(localDir)) {
    return localDir;
  }
  
  const tmpDir = join(os.tmpdir(), 'amazoprint', subDir, 'uploads');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

/**
 * Resolves a physical upload path, checking both local and temp directories.
 * Returns null if the file does not exist or if it tries to escape the base directory.
 */
export function resolveUploadPath(subDir: 'storage' | 'public', pathParts: string[]): string | null {
  // Check local first
  const localBase = resolve(process.cwd(), subDir, 'uploads');
  const localPath = resolve(localBase, ...pathParts);
  if (localPath.startsWith(localBase) && fs.existsSync(localPath)) {
    return localPath;
  }

  // Check temp second
  const tmpBase = resolve(os.tmpdir(), 'amazoprint', subDir, 'uploads');
  const tmpPath = resolve(tmpBase, ...pathParts);
  if (tmpPath.startsWith(tmpBase) && fs.existsSync(tmpPath)) {
    return tmpPath;
  }

  return null;
}
