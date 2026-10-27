'use server';

import { getProducts } from '@/app/actions/product-actions';
import { getPublicDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { resolveImagePath } from '@/lib/utils';
import { HomeClient } from './home-client';

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  'business cards': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
  'visiting cards': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
  'invitations': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80',
  'invitation cards': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80',
  'flyers': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=80',
  'marketing': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=80',
  'envelopes': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80',
  'labels': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
  'stickers': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
  'banners': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&auto=format&fit=crop&q=80',
  'calendar': 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=80',
  'posters': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80',
  'stationery': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80',
  'photo frames': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
  'customize photo frame': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
  'photo maps': 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=80',
  't-shirts': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
  't-shirt print': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
  'apparel & clothing': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
  'gifts': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
  'packaging': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
  'package': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
  'printing blanks': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80',
};

const CURATED_DEFAULT_CATEGORIES = [
  { name: 'Business Cards', category: 'Business Cards' },
  { name: 'Invitations', category: 'Invitation Cards' },
  { name: 'Marketing & Flyers', category: 'Marketing' },
  { name: 'Envelopes', category: 'Envelopes' },
  { name: 'Labels & Stickers', category: 'Stickers' },
  { name: 'Custom Banners', category: 'Banners' },
  { name: 'Posters & Prints', category: 'Posters' },
  { name: 'Stationery', category: 'Stationery' },
  { name: 'Photo Frames', category: 'customize photo frame' },
  { name: 'T-Shirts & Apparel', category: 'Apparel & Clothing' },
  { name: 'Packaging & Boxes', category: 'package' },
  { name: 'Desk Calendars', category: 'Calendar' },
  { name: 'Gifts & Merch', category: 'Gifts' },
  { name: 'Printing Blanks', category: 'Printing Blanks' },
];

export default async function Home() {
  // Fetch data on the server for reliability
  const [productsRaw, directSellingProducts] = await Promise.all([
    getProducts(),
    getPublicDirectSellingProducts(),
  ]);

  const activeProducts = (productsRaw || []).filter(p => p.isActive);

  // Flat subproducts for the latest products showcase section
  const subProducts = activeProducts
    .flatMap(p => {
      const activeSubs = (p.subProducts || []).filter(sp => sp.isActive);
      if (activeSubs.length > 0) {
        return activeSubs.map(sp => ({ ...sp, productSlug: p.slug, productName: p.name, parentProductImageUrl: p.imageUrl }));
      }
      return [{
        id: null,
        name: p.name,
        price: p.basePrice || 0,
        imageUrl: p.imageUrl,
        productSlug: p.slug,
        productName: p.name,
        parentProductImageUrl: p.imageUrl,
        isActive: true,
      }];
    })
    .sort(() => 0.5 - Math.random()) // Shuffle
    .slice(0, 8);

  // Build dynamic categories/products with real product images
  const categoryMap = new Map<string, {
    name: string;
    category: string;
    imageUrl: string;
    itemCount: number;
    startingPrice: number | null;
    href: string;
  }>();

  // 1. Process active standard products
  activeProducts.forEach(p => {
    const rawCat = p.category?.trim() || p.name?.trim() || 'General';
    const catKey = rawCat.toLowerCase();
    const activeSubs = (p.subProducts || []).filter((sp: any) => sp.isActive);
    const subWithImg = activeSubs.find((sp: any) => sp.imageUrl && sp.imageUrl.trim());
    const rawImg = subWithImg?.imageUrl || p.imageUrl || '';
    const imgUrl = rawImg ? resolveImagePath(rawImg) : (FALLBACK_CATEGORY_IMAGES[catKey] || '');

    const minSubPrice = activeSubs.reduce((min: number, sp: any) => {
      const pr = Number(sp.price || 0);
      return pr > 0 && (min === 0 || pr < min) ? pr : min;
    }, Number(p.basePrice || 0));

    if (!categoryMap.has(catKey)) {
      categoryMap.set(catKey, {
        name: rawCat,
        category: rawCat,
        imageUrl: imgUrl,
        itemCount: activeSubs.length || 1,
        startingPrice: minSubPrice > 0 ? minSubPrice : null,
        href: `/products?category=${encodeURIComponent(rawCat)}`,
      });
    } else {
      const existing = categoryMap.get(catKey)!;
      existing.itemCount += (activeSubs.length || 1);
      if (!existing.imageUrl && imgUrl) existing.imageUrl = imgUrl;
      if (minSubPrice > 0 && (!existing.startingPrice || minSubPrice < existing.startingPrice)) {
        existing.startingPrice = minSubPrice;
      }
    }
  });

  // 2. Process active direct selling products
  (directSellingProducts || []).forEach((dsp: any) => {
    const rawCat = dsp.category?.trim() || 'Apparel & Clothing';
    const catKey = rawCat.toLowerCase();
    const rawImg = dsp.imageUrls?.[0] || '';
    const imgUrl = rawImg ? resolveImagePath(rawImg) : (FALLBACK_CATEGORY_IMAGES[catKey] || '');
    const price = Number(dsp.price || 0);

    if (!categoryMap.has(catKey)) {
      categoryMap.set(catKey, {
        name: rawCat,
        category: rawCat,
        imageUrl: imgUrl,
        itemCount: 1,
        startingPrice: price > 0 ? price : null,
        href: `/products?category=${encodeURIComponent(rawCat)}`,
      });
    } else {
      const existing = categoryMap.get(catKey)!;
      existing.itemCount += 1;
      if (!existing.imageUrl && imgUrl) existing.imageUrl = imgUrl;
      if (price > 0 && (!existing.startingPrice || price < existing.startingPrice)) {
        existing.startingPrice = price;
      }
    }
  });

  // 3. Supplement with curated print categories so there are up to 14 items (2 rows of 7)
  const categoryProductsList = Array.from(categoryMap.values());

  CURATED_DEFAULT_CATEGORIES.forEach(item => {
    const catKey = item.category.toLowerCase();
    const nameKey = item.name.toLowerCase();
    const alreadyExists = categoryProductsList.some(
      c => c.category.toLowerCase() === catKey || c.name.toLowerCase() === nameKey
    );
    if (!alreadyExists && categoryProductsList.length < 14) {
      categoryProductsList.push({
        name: item.name,
        category: item.category,
        imageUrl: FALLBACK_CATEGORY_IMAGES[catKey] || FALLBACK_CATEGORY_IMAGES[nameKey] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
        itemCount: 1,
        startingPrice: null,
        href: `/products?category=${encodeURIComponent(item.category)}`,
      });
    }
  });

  // Limit to at most 14 items (strictly 2 rows of 7 on desktop)
  const finalCategoryProducts = categoryProductsList.slice(0, 14);

  return (
    <HomeClient 
      subProducts={subProducts} 
      directSellingProducts={directSellingProducts}
      categoryProducts={finalCategoryProducts}
    />
  );
}
