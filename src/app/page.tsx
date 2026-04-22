'use server';

import { getProducts } from '@/app/actions/product-actions';
import { getPublicDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { getContests } from '@/app/actions/contest-actions';
import { HomeClient } from './home-client';

export default async function Home() {
  // Fetch data on the server for reliability
  const [subProducts, directSellingProducts, contestsData] = await Promise.all([
    getProducts().then(products => 
      products
        .filter(p => p.isActive && p.subProducts.some(sp => sp.isActive))
        .flatMap(p => p.subProducts
          .filter(sp => sp.isActive)
          .map(sp => ({ ...sp, productSlug: p.slug, productName: p.name, parentProductImageUrl: p.imageUrl }))
        )
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, 8)
    ),
    getPublicDirectSellingProducts(),
    getContests().then(data => data.slice(0, 4)) // Get top 4 active contests for the home screen
  ]);

  return (
    <HomeClient 
      subProducts={subProducts} 
      directSellingProducts={directSellingProducts} 
      contests={contestsData}
    />
  );
}
