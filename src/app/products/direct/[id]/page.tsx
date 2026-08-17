import { notFound } from 'next/navigation';
import { getPublicDirectSellingProductById } from '@/app/actions/direct-selling-actions';
import { DirectProductDetailClient } from './DirectProductDetailClient';
import type { Metadata } from 'next';

interface DirectProductPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DirectProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const product = await getPublicDirectSellingProductById(Number(id));
    if (!product) {
        return {
            title: 'Product Not Found | AmazoPrint',
        };
    }

    return {
        title: `${product.name} | Direct Order | AmazoPrint`,
        description: product.description || `Order ${product.name} directly with fast nationwide dispatch on AmazoPrint.`,
    };
}

export default async function DirectProductPage({ params }: DirectProductPageProps) {
    const { id } = await params;
    const productId = Number(id);

    if (isNaN(productId) || productId <= 0) {
        notFound();
    }

    const product = await getPublicDirectSellingProductById(productId);

    if (!product) {
        notFound();
    }

    return <DirectProductDetailClient product={product} />;
}
