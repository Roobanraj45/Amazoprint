import { getProducts } from '@/app/actions/product-actions';
import { ProductsClient } from './ProductsClient';

export default async function ProductsPage() {
    const productsFromDb = await getProducts();
    const activeProducts = productsFromDb.filter(p => p.isActive && p.subProducts.some(sp => sp.isActive));

    return <ProductsClient initialProducts={activeProducts} />;
}
