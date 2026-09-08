import { notFound } from 'next/navigation';
import { getFreelancerDirectSellingProductById } from '@/app/actions/direct-selling-actions';
import { FreelancerEditProductClient } from './FreelancerEditProductClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function FreelancerEditProductPage({ params }: Props) {
    const { id } = await params;
    const productId = Number(id);

    if (isNaN(productId) || productId <= 0) {
        notFound();
    }

    const product = await getFreelancerDirectSellingProductById(productId);

    if (!product) {
        notFound();
    }

    return <FreelancerEditProductClient product={product} />;
}
