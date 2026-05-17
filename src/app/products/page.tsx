import { getProducts } from '@/app/actions/product-actions';
import { getPublicDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { ProductsClient } from './ProductsClient';

export default async function ProductsPage() {
    const productsFromDb = await getProducts();
    const activeProducts = productsFromDb.filter(p => p.isActive && p.subProducts.some(sp => sp.isActive));
    const directSellingProducts = await getPublicDirectSellingProducts();

    return <ProductsClient initialProducts={activeProducts} directSellingProducts={directSellingProducts} />;
}
