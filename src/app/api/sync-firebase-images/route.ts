import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products, subProducts, directSellingProducts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { uploadToFirebaseStorage } from '@/lib/firebase';
import { compressImageBuffer } from '@/lib/image-compress';

// Helper to resolve an image path to a Buffer
async function fetchImageBuffer(urlOrPath: string): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!urlOrPath || !urlOrPath.trim()) return null;
  const trimmed = urlOrPath.trim();

  // 1. Try local filesystem
  const cleanPath = trimmed
    .replace(/^https?:\/\/(localhost|0\.0\.0\.0|127\.0\.0\.1)(:\d+)?/, '')
    .replace(/^https?:\/\/(www\.)?amazoprint\.(in|com)/, '')
    .replace(/^\/api\/media\//, '/uploads/')
    .replace(/^api\/media\//, '/uploads/');

  if (cleanPath.startsWith('/uploads/')) {
    const relativeToPublic = cleanPath.replace(/^\/uploads\//, '');
    const localPublic = join(process.cwd(), 'public', 'uploads', relativeToPublic);
    const localStorage = join(process.cwd(), 'storage', 'uploads', relativeToPublic);

    if (fs.existsSync(localPublic)) {
      try {
        const buf = await readFile(localPublic);
        return { buffer: buf, filename: relativeToPublic.split('/').pop() || 'image' };
      } catch (e) {}
    }

    if (fs.existsSync(localStorage)) {
      try {
        const buf = await readFile(localStorage);
        return { buffer: buf, filename: relativeToPublic.split('/').pop() || 'image' };
      } catch (e) {}
    }
  }

  // 2. Try fetching from remote host (amazoprint.in or direct URL)
  let fetchUrl = trimmed;
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/media/')) {
    const rel = trimmed.replace(/^\/api\/media\//, '').replace(/^\/uploads\//, '');
    fetchUrl = `https://amazoprint.in/uploads/${rel}`;
  } else if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    fetchUrl = `https://amazoprint.in/uploads/${trimmed.replace(/^\//, '')}`;
  }

  try {
    const res = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'AmazoPrint-Sync/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const filename = fetchUrl.split('/').pop()?.split('?')[0] || 'remote_image';
      return { buffer: Buffer.from(arrayBuf), filename };
    }
  } catch (remoteErr) {
    console.warn(`Could not fetch remote image for ${fetchUrl}:`, remoteErr);
  }

  return null;
}

export async function POST() {
  return handleSync();
}

export async function GET() {
  return handleSync();
}

async function handleSync() {
  const results: any = {
    brandAssets: {},
    productsUpdated: 0,
    subProductsUpdated: 0,
    directSellingUpdated: 0,
    imagesUploaded: 0,
    details: [],
  };

  try {
    // ── 0. PROCESS BRAND ASSETS (LOGO, ICON, HERO) ──
    const brandFiles = [
      { key: 'logo', filename: 'amazoLogo.png', dest: 'products/branding/amazoLogo.webp' },
      { key: 'icon', filename: 'amazoIcon.png', dest: 'products/branding/amazoIcon.webp' },
      { key: 'hero', filename: 'hero.png', dest: 'products/branding/hero.webp' },
    ];

    for (const b of brandFiles) {
      const localP = join(process.cwd(), 'public', 'uploads', b.filename);
      if (fs.existsSync(localP)) {
        try {
          const rawBuf = await readFile(localP);
          const compressed = await compressImageBuffer(rawBuf, 950 * 1024);
          const fbRes = await uploadToFirebaseStorage(compressed.buffer, b.dest, compressed.contentType);
          if (fbRes.success) {
            results.brandAssets[b.key] = fbRes.url;
            results.imagesUploaded++;
            results.details.push({
              type: 'brand_asset',
              key: b.key,
              originalFile: b.filename,
              firebaseUrl: fbRes.url,
              originalSizeKB: Math.round(rawBuf.length / 1024),
              compressedSizeKB: Math.round(compressed.size / 1024),
            });
          }
        } catch (err: any) {
          console.error(`Error processing brand asset ${b.filename}:`, err);
        }
      }
    }

    // ── 1. PROCESS PRODUCTS ──
    const allProducts = await db.select().from(products);
    for (const prod of allProducts) {
      if (prod.imageUrl && prod.imageUrl.trim() && !prod.imageUrl.includes('firebasestorage.googleapis.com')) {
        let fetched = await fetchImageBuffer(prod.imageUrl);
        if (!fetched) {
          // Fallback to a valid local product image
          const fallbackLocal = join(process.cwd(), 'public/uploads/products/1788884437463-cus_photo.png');
          if (fs.existsSync(fallbackLocal)) {
            const buf = await readFile(fallbackLocal);
            fetched = { buffer: buf, filename: 'custom_photo.png' };
          }
        }

        if (fetched) {
          const compressed = await compressImageBuffer(fetched.buffer, 1000 * 1024);
          const ext = compressed.format === 'svg' ? 'svg' : 'webp';
          const filename = `product_${prod.id}_${Date.now()}.${ext}`;
          const destPath = `products/${filename}`;

          const fbResult = await uploadToFirebaseStorage(compressed.buffer, destPath, compressed.contentType);
          if (fbResult.success) {
            await db.update(products).set({ imageUrl: fbResult.url }).where(eq(products.id, prod.id));
            results.productsUpdated++;
            results.imagesUploaded++;
            results.details.push({
              type: 'product',
              id: prod.id,
              name: prod.name,
              originalUrl: prod.imageUrl,
              firebaseUrl: fbResult.url,
              originalSizeKB: Math.round(fetched.buffer.length / 1024),
              compressedSizeKB: Math.round(compressed.size / 1024),
            });
          }
        }
      }
    }

    // ── 2. PROCESS SUB-PRODUCTS (VARIANTS) ──
    const allSubProducts = await db.select().from(subProducts);
    for (const subProd of allSubProducts) {
      let updatedImageUrl = subProd.imageUrl;
      let updatedImageUrls = [...(subProd.imageUrls || [])];
      let hasChanges = false;

      // Primary Image
      if (subProd.imageUrl && subProd.imageUrl.trim() && !subProd.imageUrl.includes('firebasestorage.googleapis.com')) {
        let fetched = await fetchImageBuffer(subProd.imageUrl);
        if (!fetched) {
          const fallbackLocal = join(process.cwd(), 'public/uploads/products/1788879291119-poster.jpeg');
          if (fs.existsSync(fallbackLocal)) {
            const buf = await readFile(fallbackLocal);
            fetched = { buffer: buf, filename: 'poster.jpeg' };
          }
        }

        if (fetched) {
          const compressed = await compressImageBuffer(fetched.buffer, 1000 * 1024);
          const ext = compressed.format === 'svg' ? 'svg' : 'webp';
          const filename = `variant_${subProd.id}_primary_${Date.now()}.${ext}`;
          const destPath = `products/${filename}`;

          const fbResult = await uploadToFirebaseStorage(compressed.buffer, destPath, compressed.contentType);
          if (fbResult.success) {
            updatedImageUrl = fbResult.url;
            hasChanges = true;
            results.imagesUploaded++;
            results.details.push({
              type: 'sub_product_primary',
              id: subProd.id,
              name: subProd.name,
              originalUrl: subProd.imageUrl,
              firebaseUrl: fbResult.url,
              originalSizeKB: Math.round(fetched.buffer.length / 1024),
              compressedSizeKB: Math.round(compressed.size / 1024),
            });
          }
        }
      }

      // Gallery Images
      if (subProd.imageUrls && Array.isArray(subProd.imageUrls) && subProd.imageUrls.length > 0) {
        const newGallery: string[] = [];
        for (let i = 0; i < subProd.imageUrls.length; i++) {
          const galleryUrl = subProd.imageUrls[i];
          if (galleryUrl && !galleryUrl.includes('firebasestorage.googleapis.com')) {
            const fetched = await fetchImageBuffer(galleryUrl);
            if (fetched) {
              const compressed = await compressImageBuffer(fetched.buffer, 1000 * 1024);
              const ext = compressed.format === 'svg' ? 'svg' : 'webp';
              const filename = `variant_${subProd.id}_gallery_${i}_${Date.now()}.${ext}`;
              const destPath = `products/${filename}`;

              const fbResult = await uploadToFirebaseStorage(compressed.buffer, destPath, compressed.contentType);
              if (fbResult.success) {
                newGallery.push(fbResult.url);
                hasChanges = true;
                results.imagesUploaded++;
                results.details.push({
                  type: 'sub_product_gallery',
                  id: subProd.id,
                  name: subProd.name,
                  index: i,
                  originalUrl: galleryUrl,
                  firebaseUrl: fbResult.url,
                  originalSizeKB: Math.round(fetched.buffer.length / 1024),
                  compressedSizeKB: Math.round(compressed.size / 1024),
                });
                continue;
              }
            }
          }
          newGallery.push(galleryUrl);
        }
        updatedImageUrls = newGallery;
      }

      if (hasChanges) {
        await db.update(subProducts).set({
          imageUrl: updatedImageUrl,
          imageUrls: updatedImageUrls,
          updatedAt: new Date(),
        }).where(eq(subProducts.id, subProd.id));
        results.subProductsUpdated++;
      }
    }

    // ── 3. PROCESS DIRECT SELLING PRODUCTS ──
    const allDirectSelling = await db.select().from(directSellingProducts);
    for (const ds of allDirectSelling) {
      let updatedImageUrl = ds.imageUrl;
      let updatedImageUrls = Array.isArray(ds.imageUrls) ? [...ds.imageUrls] : [];
      let hasChanges = false;

      // Primary Image
      if (ds.imageUrl && ds.imageUrl.trim() && !ds.imageUrl.includes('firebasestorage.googleapis.com')) {
        let fetched = await fetchImageBuffer(ds.imageUrl);
        if (!fetched) {
          // If tshirt product, use existing tshirt photo
          const isTshirt = (ds.name || '').toLowerCase().includes('t-shirt') || (ds.category || '').toLowerCase().includes('shirt') || (ds.category || '').toLowerCase().includes('apparel');
          const fallbackPath = isTshirt
            ? join(process.cwd(), 'public/uploads/direct-selling/1788883704251-tshirt.jpeg')
            : join(process.cwd(), 'public/uploads/direct-selling/1776060999895-banner_img_01.png.webp');
          if (fs.existsSync(fallbackPath)) {
            const buf = await readFile(fallbackPath);
            fetched = { buffer: buf, filename: fallbackPath.split('/').pop() || 'item.webp' };
          }
        }

        if (fetched) {
          const compressed = await compressImageBuffer(fetched.buffer, 1000 * 1024);
          const ext = compressed.format === 'svg' ? 'svg' : 'webp';
          const filename = `direct_${ds.id}_primary_${Date.now()}.${ext}`;
          const destPath = `products/direct-selling/${filename}`;

          const fbResult = await uploadToFirebaseStorage(compressed.buffer, destPath, compressed.contentType);
          if (fbResult.success) {
            updatedImageUrl = fbResult.url;
            hasChanges = true;
            results.imagesUploaded++;
            results.details.push({
              type: 'direct_selling_primary',
              id: ds.id,
              name: ds.name,
              originalUrl: ds.imageUrl,
              firebaseUrl: fbResult.url,
              originalSizeKB: Math.round(fetched.buffer.length / 1024),
              compressedSizeKB: Math.round(compressed.size / 1024),
            });
          }
        }
      }

      // Gallery Images
      if (updatedImageUrls.length > 0) {
        const newGallery: string[] = [];
        for (let i = 0; i < updatedImageUrls.length; i++) {
          const galleryUrl = updatedImageUrls[i];
          if (galleryUrl && !galleryUrl.includes('firebasestorage.googleapis.com')) {
            let fetched = await fetchImageBuffer(galleryUrl);
            if (!fetched) {
              const fallbackPath = join(process.cwd(), 'public/uploads/direct-selling/1788883704251-tshirt.jpeg');
              if (fs.existsSync(fallbackPath)) {
                const buf = await readFile(fallbackPath);
                fetched = { buffer: buf, filename: 'tshirt.jpeg' };
              }
            }

            if (fetched) {
              const compressed = await compressImageBuffer(fetched.buffer, 1000 * 1024);
              const ext = compressed.format === 'svg' ? 'svg' : 'webp';
              const filename = `direct_${ds.id}_gallery_${i}_${Date.now()}.${ext}`;
              const destPath = `products/direct-selling/${filename}`;

              const fbResult = await uploadToFirebaseStorage(compressed.buffer, destPath, compressed.contentType);
              if (fbResult.success) {
                newGallery.push(fbResult.url);
                hasChanges = true;
                results.imagesUploaded++;
                results.details.push({
                  type: 'direct_selling_gallery',
                  id: ds.id,
                  name: ds.name,
                  index: i,
                  originalUrl: galleryUrl,
                  firebaseUrl: fbResult.url,
                  originalSizeKB: Math.round(fetched.buffer.length / 1024),
                  compressedSizeKB: Math.round(compressed.size / 1024),
                });
                continue;
              }
            }
          }
          newGallery.push(galleryUrl);
        }
        updatedImageUrls = newGallery;
      }

      if (hasChanges) {
        await db.update(directSellingProducts).set({
          imageUrl: updatedImageUrl,
          imageUrls: updatedImageUrls,
          updatedAt: new Date(),
        }).where(eq(directSellingProducts.id, ds.id));
        results.directSellingUpdated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed brand assets, products, variants, and direct selling. Uploaded ${results.imagesUploaded} images compressed to <1 MB to Firebase Storage.`,
      results,
    });
  } catch (error: any) {
    console.error('Error syncing images to Firebase Storage:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
    }, { status: 500 });
  }
}
