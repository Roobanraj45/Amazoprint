import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side Google Fonts proxy.
 * Fetches font CSS + font binary files, converts them to base64,
 * and returns a self-contained @font-face CSS string.
 * This avoids CORS issues that occur when html-to-image tries to embed fonts client-side.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const families = searchParams.get('families')?.split(',').map(f => f.trim()).filter(Boolean) ?? [];

  if (families.length === 0) {
    return new NextResponse('', { headers: { 'Content-Type': 'text/css' } });
  }

  let allCss = '';

  for (const family of families) {
    try {
      // Request both regular and bold weights
      const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap`;
      const cssRes = await fetch(cssUrl, {
        headers: {
          // Use a Chrome UA to get WOFF2 format (best quality)
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!cssRes.ok) continue;

      let css = await cssRes.text();

      // Find all Google font binary URLs in the CSS
      const fontUrls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]);

      // Fetch each font file and replace URL with base64
      for (const fontUrl of fontUrls) {
        try {
          const fontRes = await fetch(fontUrl);
          if (!fontRes.ok) continue;

          const buffer = await fontRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = fontUrl.endsWith('.woff2')
            ? 'font/woff2'
            : fontUrl.endsWith('.woff')
            ? 'font/woff'
            : 'font/truetype';

          css = css.replace(fontUrl, `data:${mimeType};base64,${base64}`);
        } catch {
          // keep original URL as fallback
        }
      }

      allCss += css + '\n';
    } catch (err) {
      console.error(`Failed to embed font "${family}":`, err);
    }
  }

  return new NextResponse(allCss, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=86400', // cache for 24h
    },
  });
}
