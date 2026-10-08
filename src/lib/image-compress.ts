import sharp from 'sharp';

export interface CompressedImageResult {
  buffer: Buffer;
  size: number;
  width?: number;
  height?: number;
  contentType: string;
  format: string;
  originalSize: number;
  wasCompressed: boolean;
}

const MAX_TARGET_BYTES = 1000 * 1024; // 1000 KB (strictly less than 1 MB = 1024 KB)

/**
 * Compresses an image buffer to less than 1 MB using Sharp.
 * Automatically handles image rotation, format optimization (WebP), and iterative quality/dimension reduction.
 * 
 * @param inputBuffer Raw buffer of the image
 * @param targetMaxBytes Target maximum byte size (default: 1000 KB, < 1 MB)
 * @param preferredFormat 'webp' | 'jpeg' | 'png' (default: 'webp')
 */
export async function compressImageBuffer(
  inputBuffer: Buffer,
  targetMaxBytes = MAX_TARGET_BYTES,
  preferredFormat: 'webp' | 'jpeg' | 'png' = 'webp'
): Promise<CompressedImageResult> {
  const originalSize = inputBuffer.length;

  // Check if buffer is SVG (vector)
  const isSvg = inputBuffer.slice(0, 100).toString('utf-8').includes('<svg');
  if (isSvg) {
    return {
      buffer: inputBuffer,
      size: originalSize,
      contentType: 'image/svg+xml',
      format: 'svg',
      originalSize,
      wasCompressed: false,
    };
  }

  try {
    const metadata = await sharp(inputBuffer).metadata();

    // If already under target size and in modern web format (webp/jpeg/png) with reasonable dimensions,
    // we can still convert to webp for optimal delivery, or keep if already small webp
    if (originalSize <= targetMaxBytes && (metadata.format === 'webp' || metadata.format === 'png' || metadata.format === 'jpeg')) {
      // If it's already well under 1MB and WebP, return directly
      if (metadata.format === 'webp') {
        return {
          buffer: inputBuffer,
          size: originalSize,
          width: metadata.width,
          height: metadata.height,
          contentType: 'image/webp',
          format: 'webp',
          originalSize,
          wasCompressed: false,
        };
      }
    }

    // Step-by-step reduction parameters if file is large
    const qualitySteps = [85, 75, 65, 55, 45];
    const maxDimensionSteps = [2048, 1600, 1200, 900, 700];

    let currentBuffer = inputBuffer;
    let finalContentType = 'image/webp';
    let finalFormat = preferredFormat;

    for (let step = 0; step < qualitySteps.length; step++) {
      const maxDim = maxDimensionSteps[step];
      const quality = qualitySteps[step];

      let pipeline = sharp(inputBuffer).rotate(); // auto-orient based on EXIF

      // Resize if dimensions exceed threshold
      if (metadata.width && metadata.height && (metadata.width > maxDim || metadata.height > maxDim)) {
        pipeline = pipeline.resize(maxDim, maxDim, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (preferredFormat === 'webp') {
        pipeline = pipeline.webp({ quality, effort: 4 });
        finalContentType = 'image/webp';
        finalFormat = 'webp';
      } else if (preferredFormat === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        finalContentType = 'image/jpeg';
        finalFormat = 'jpeg';
      } else {
        pipeline = pipeline.png({ compressionLevel: 8, quality });
        finalContentType = 'image/png';
        finalFormat = 'png';
      }

      const candidateBuffer = await pipeline.toBuffer();

      currentBuffer = candidateBuffer;

      // If we are below the target 1MB limit, stop iteration
      if (candidateBuffer.length <= targetMaxBytes) {
        break;
      }
    }

    const finalMeta = await sharp(currentBuffer).metadata().catch(() => ({}));

    return {
      buffer: currentBuffer,
      size: currentBuffer.length,
      width: finalMeta.width,
      height: finalMeta.height,
      contentType: finalContentType,
      format: finalFormat,
      originalSize,
      wasCompressed: currentBuffer.length !== originalSize,
    };
  } catch (error) {
    console.error('Sharp compression error, falling back to original buffer:', error);
    return {
      buffer: inputBuffer,
      size: originalSize,
      contentType: 'application/octet-stream',
      format: 'bin',
      originalSize,
      wasCompressed: false,
    };
  }
}
