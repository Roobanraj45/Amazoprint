'use server';

import { getProducts } from '@/app/actions/product-actions';
import { getPublicDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { HomeClient } from './home-client';

export default async function Home() {
  // Fetch data on the server for reliability
  const [subProducts, directSellingProducts] = await Promise.all([
    getProducts().then(products => 
      products
        .filter(p => p.isActive)
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
        .slice(0, 8)
    ),
    getPublicDirectSellingProducts(),
  ]);

  return (
    <HomeClient 
      subProducts={subProducts} 
      directSellingProducts={directSellingProducts} 
    />
  );
}
