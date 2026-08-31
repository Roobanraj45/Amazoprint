import { Suspense } from 'react';
import { getProducts } from '@/app/actions/product-actions';
import { getPublicDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { ProductsClient } from './ProductsClient';

export default async function ProductsPage() {
    const productsFromDb = await getProducts();
    const activeProducts = productsFromDb.filter(p => p.isActive);
    const directSellingProducts = await getPublicDirectSellingProducts();

    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#464674] border-t-transparent rounded-full animate-spin" /></div>}>
            <ProductsClient initialProducts={activeProducts} directSellingProducts={directSellingProducts} />
        </Suspense>
    );
}
