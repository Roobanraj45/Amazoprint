import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA44QCFVPAJHhFJATQqR6dek_ONNaqYwzc',
  authDomain: 'amazoprint-2faa2.firebaseapp.com',
  projectId: 'amazoprint-2faa2',
  storageBucket: 'amazoprint-2faa2.firebasestorage.app',
};

// Singleton App & Storage instance
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseStorage = getStorage(firebaseApp);

export interface UploadResult {
  success: boolean;
  url: string;
  path: string;
  size: number;
  contentType: string;
}

/**
 * Upload an image buffer or Uint8Array to Firebase Storage
 * Bucket: gs://amazoprint-2faa2.firebasestorage.app
 * @param buffer The image data buffer
 * @param destinationPath e.g. "products/17234567-item.webp"
 * @param contentType e.g. "image/webp", "image/jpeg", "image/png"
 */
export async function uploadToFirebaseStorage(
  buffer: Buffer | Uint8Array,
  destinationPath: string,
  contentType = 'image/webp'
): Promise<UploadResult> {
  const normalizedPath = destinationPath.startsWith('/')
    ? destinationPath.slice(1)
    : destinationPath;

  const storageRef = ref(firebaseStorage, normalizedPath);
  const snapshot = await uploadBytes(storageRef, buffer, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
  });

  const url = await getDownloadURL(snapshot.ref);

  return {
    success: true,
    url,
    path: normalizedPath,
    size: buffer.byteLength,
    contentType,
  };
}

/**
 * Delete a file from Firebase Storage by URL or storage path
 */
export async function deleteFromFirebaseStorage(urlOrPath: string): Promise<boolean> {
  try {
    let path = urlOrPath;
    if (urlOrPath.includes('firebasestorage.googleapis.com')) {
      // Extract encoded path from URL: /o/<encodedPath>?
      const match = urlOrPath.match(/\/o\/([^?]+)/);
      if (match && match[1]) {
        path = decodeURIComponent(match[1]);
      }
    }
    const storageRef = ref(firebaseStorage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.warn('Firebase Storage delete warning:', error);
    return false;
  }
}

/**
 * List all files in a folder on Firebase Storage
 * @param folder e.g. "products"
 */
export async function listFirebaseStorageFiles(folder = 'products'): Promise<Array<{ name: string; url: string }>> {
  try {
    const listRef = ref(firebaseStorage, folder);
    const result = await listAll(listRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url,
        };
      })
    );
    return files;
  } catch (error) {
    console.error('Failed to list Firebase Storage files:', error);
    return [];
  }
}
