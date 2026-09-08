/**
 * AmazoPrint Image URL Diagnostic & Fetch Script
 * 
 * Checks all product & sub-product image URLs from the database against amazoprint.in
 * to identify broken URLs, 404s, and test alternative URL structures.
 * 
 * Usage:
 *   node scripts/check-and-fetch-images.js
 */

const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not set in .env file');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Helper function to resolve image path matching utils.ts
function resolveImagePath(path) {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:')) return trimmed;

    let cleanPath = trimmed;

    if (cleanPath.includes('/public/')) {
        cleanPath = cleanPath.split('/public')[1];
    }

    // Normalize /api/media/products/ or /api/media/ to /uploads/
    if (cleanPath.startsWith('/api/media/products/')) {
        cleanPath = cleanPath.replace('/api/media/products/', '/uploads/products/');
    } else if (cleanPath.startsWith('api/media/products/')) {
        cleanPath = '/uploads/products/' + cleanPath.substring('api/media/products/'.length);
    }

    if (
        cleanPath.startsWith('http://localhost') ||
        cleanPath.startsWith('https://localhost') ||
        cleanPath.startsWith('http://0.0.0.0') ||
        cleanPath.startsWith('https://0.0.0.0') ||
        cleanPath.startsWith('http://127.0.0.1') ||
        cleanPath.startsWith('https://127.0.0.1')
    ) {
        try {
            const parsed = new URL(cleanPath);
            cleanPath = parsed.pathname + parsed.search;
        } catch {
            cleanPath = cleanPath.replace(/^https?:\/\/[^/]+/, '');
        }
    }

    if (cleanPath.startsWith('https://amazoprint.in') || cleanPath.startsWith('https://www.amazoprint.in')) {
        return cleanPath;
    }
    if (cleanPath.startsWith('http://amazoprint.in')) {
        return cleanPath.replace('http://amazoprint.in', 'https://amazoprint.in');
    }
    if (cleanPath.startsWith('http://www.amazoprint.in')) {
        return cleanPath.replace('http://www.amazoprint.in', 'https://amazoprint.in');
    }

    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }

    if (cleanPath.startsWith('//')) {
        return `https:${cleanPath}`;
    }

    if (cleanPath.startsWith('amazoprint.in')) {
        return `https://${cleanPath}`;
    }
    if (cleanPath.startsWith('www.amazoprint.in')) {
        return `https://${cleanPath}`;
    }

    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }

    try {
        const parts = cleanPath.split('/');
        const encodedParts = parts.map(part => {
            if (part.includes('%')) return part;
            return encodeURIComponent(part);
        });
        cleanPath = encodedParts.join('/');
    } catch {
        cleanPath = encodeURI(cleanPath);
    }

    return `https://amazoprint.in${cleanPath}`;
}

// Helper to check if a URL returns HTTP 200 using GET with browser headers
function checkUrlStatus(url) {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('http')) {
            return resolve({ status: 0, ok: false, error: 'Invalid URL format' });
        }

        try {
            const parsedUrl = new URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;

            const req = client.request(
                parsedUrl,
                {
                    method: 'GET',
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        'Referer': 'https://amazoprint.in/',
                    },
                },
                (res) => {
                    const ok = res.statusCode >= 200 && res.statusCode < 400;
                    res.destroy(); // Abort reading full body
                    resolve({
                        status: res.statusCode,
                        ok: ok,
                        contentType: res.headers['content-type'],
                        contentLength: res.headers['content-length'],
                    });
                }
            );

            req.on('timeout', () => {
                req.destroy();
                resolve({ status: 408, ok: false, error: 'Request Timeout' });
            });

            req.on('error', (err) => {
                resolve({ status: 500, ok: false, error: err.message });
            });

            req.end();
        } catch (err) {
            resolve({ status: 0, ok: false, error: err.message });
        }
    });
}

// Generate alternative URL candidates to test if primary fails
function getAlternativeUrls(rawPath) {
    if (!rawPath) return [];
    const clean = rawPath.replace(/^https?:\/\/(www\.)?amazoprint\.in\/?/, '').replace(/^\/+/, '');
    const basename = clean.split('/').pop();

    const alternatives = [
        `https://amazoprint.in/${clean}`,
        `https://amazoprint.in/uploads/${clean}`,
        `https://amazoprint.in/uploads/products/${clean}`,
        `https://amazoprint.in/uploads/products/${basename}`,
        `https://amazoprint.in/uploads/${basename}`,
    ];

    return Array.from(new Set(alternatives));
}

async function main() {
    console.log('\n======================================================');
    console.log('🔍 AmazoPrint Product & Sub-Product Image URL Checker');
    console.log('======================================================\n');

    console.log('⏳ Connecting to database...');
    
    // 1. Fetch Products
    const products = await sql`
        SELECT id, name, slug, image_url AS "imageUrl", category, is_active AS "isActive"
        FROM products 
        ORDER BY id ASC
    `;

    // 2. Fetch SubProducts
    const subProducts = await sql`
        SELECT id, product_id AS "productId", name, sku, image_url AS "imageUrl", image_urls AS "imageUrls", is_active AS "isActive"
        FROM sub_products 
        ORDER BY id ASC
    `;

    // 3. Fetch Direct Selling Products
    const directProducts = await sql`
        SELECT id, name, category, image_urls AS "imageUrls", is_active AS "isActive"
        FROM direct_selling_products
        ORDER BY id ASC
    `;

    console.log(`📊 Found:`);
    console.log(`   - ${products.length} Master Products`);
    console.log(`   - ${subProducts.length} Sub-Products`);
    console.log(`   - ${directProducts.length} Direct Selling Products\n`);

    const results = {
        working: [],
        broken: [],
        empty: [],
    };

    console.log('🚀 Checking Master Products Image URLs...');
    for (const p of products) {
        if (!p.imageUrl || !p.imageUrl.trim()) {
            results.empty.push({ type: 'Product', id: p.id, name: p.name, table: 'products', field: 'image_url' });
            continue;
        }

        const resolved = resolveImagePath(p.imageUrl);
        const check = await checkUrlStatus(resolved);

        if (check.ok) {
            results.working.push({ type: 'Product', id: p.id, name: p.name, raw: p.imageUrl, resolved, status: check.status });
            console.log(`  ✅ [Product #${p.id}] ${p.name} (HTTP ${check.status}) -> ${resolved}`);
        } else {
            // Test alternatives
            let workingAlt = null;
            for (const alt of getAlternativeUrls(p.imageUrl)) {
                if (alt === resolved) continue;
                const altCheck = await checkUrlStatus(alt);
                if (altCheck.ok) {
                    workingAlt = alt;
                    break;
                }
            }

            results.broken.push({
                type: 'Product',
                id: p.id,
                name: p.name,
                table: 'products',
                field: 'image_url',
                raw: p.imageUrl,
                resolved,
                status: check.status,
                error: check.error,
                workingAlternative: workingAlt,
            });

            console.log(`  ❌ [Product #${p.id}] ${p.name} -> HTTP ${check.status} (${resolved})`);
            if (workingAlt) {
                console.log(`     💡 Found working alternative: ${workingAlt}`);
            }
        }
    }

    console.log('\n🚀 Checking Sub-Products Image URLs...');
    for (const sp of subProducts) {
        if (!sp.imageUrl || !sp.imageUrl.trim()) {
            results.empty.push({ type: 'SubProduct', id: sp.id, name: sp.name, table: 'sub_products', field: 'image_url' });
            continue;
        }

        const resolved = resolveImagePath(sp.imageUrl);
        const check = await checkUrlStatus(resolved);

        if (check.ok) {
            results.working.push({ type: 'SubProduct', id: sp.id, name: sp.name, raw: sp.imageUrl, resolved, status: check.status });
            console.log(`  ✅ [SubProduct #${sp.id}] ${sp.name} (HTTP ${check.status}) -> ${resolved}`);
        } else {
            // Test alternatives
            let workingAlt = null;
            for (const alt of getAlternativeUrls(sp.imageUrl)) {
                if (alt === resolved) continue;
                const altCheck = await checkUrlStatus(alt);
                if (altCheck.ok) {
                    workingAlt = alt;
                    break;
                }
            }

            results.broken.push({
                type: 'SubProduct',
                id: sp.id,
                name: sp.name,
                table: 'sub_products',
                field: 'image_url',
                raw: sp.imageUrl,
                resolved,
                status: check.status,
                error: check.error,
                workingAlternative: workingAlt,
            });

            console.log(`  ❌ [SubProduct #${sp.id}] ${sp.name} -> HTTP ${check.status} (${resolved})`);
            if (workingAlt) {
                console.log(`     💡 Found working alternative: ${workingAlt}`);
            }
        }
    }

    console.log('\n🚀 Checking Direct Selling Products Image URLs...');
    for (const dp of directProducts) {
        const firstImg = Array.isArray(dp.imageUrls) && dp.imageUrls.length > 0 ? dp.imageUrls[0] : null;
        if (!firstImg || !firstImg.trim()) {
            results.empty.push({ type: 'DirectProduct', id: dp.id, name: dp.name, table: 'direct_selling_products', field: 'image_urls' });
            continue;
        }

        const resolved = resolveImagePath(firstImg);
        const check = await checkUrlStatus(resolved);

        if (check.ok) {
            results.working.push({ type: 'DirectProduct', id: dp.id, name: dp.name, raw: firstImg, resolved, status: check.status });
            console.log(`  ✅ [Direct #${dp.id}] ${dp.name} (HTTP ${check.status}) -> ${resolved}`);
        } else {
            results.broken.push({
                type: 'DirectProduct',
                id: dp.id,
                name: dp.name,
                table: 'direct_selling_products',
                field: 'image_urls',
                raw: firstImg,
                resolved,
                status: check.status,
                error: check.error,
            });

            console.log(`  ❌ [Direct #${dp.id}] ${dp.name} -> HTTP ${check.status} (${resolved})`);
        }
    }

    // ── SUMMARY REPORT ──
    console.log('\n======================================================');
    console.log('📈 DIAGNOSTIC SUMMARY');
    console.log('======================================================');
    console.log(`✅ Working Images (200 OK): ${results.working.length}`);
    console.log(`❌ Broken / 404 Images:     ${results.broken.length}`);
    console.log(`⚠️  Empty / Null Image URLs: ${results.empty.length}`);
    console.log('======================================================\n');

    if (results.broken.length > 0) {
        console.log('🚨 LIST OF BROKEN / 404 IMAGES:');
        results.broken.forEach((item, index) => {
            console.log(`\n${index + 1}. [${item.type} #${item.id}] ${item.name}`);
            console.log(`   Table:         ${item.table} (${item.field})`);
            console.log(`   DB Value:      "${item.raw}"`);
            console.log(`   Resolved URL:  ${item.resolved}`);
            console.log(`   Status:        HTTP ${item.status || 'ERROR'} ${item.error ? `(${item.error})` : ''}`);
            if (item.workingAlternative) {
                console.log(`   💡 Fix Suggestion: Update URL to "${item.workingAlternative}"`);
            }
        });

        console.log('\n======================================================');
        console.log('🛠️ SUGGESTED ACTIONS:');
        console.log('1. For images that exist under a different folder (e.g. /uploads/):');
        console.log('   Check the server directory or upload folder.');
        console.log('2. Update the DB values or use the working alternatives above.');
        console.log('======================================================\n');
    } else {
        console.log('🎉 All configured product images successfully return HTTP 200 OK!\n');
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error during image check:', err);
    process.exit(1);
});
