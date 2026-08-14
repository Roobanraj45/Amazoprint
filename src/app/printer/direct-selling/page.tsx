import { getPrinterDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { PrinterDirectSellingClient } from './PrinterDirectSellingClient';

export default async function PrinterDirectSellingPage() {
    const products = await getPrinterDirectSellingProducts();

    return (
        <PrinterDirectSellingClient initialProducts={products} />
    );
}
