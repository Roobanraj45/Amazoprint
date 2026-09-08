import { getFreelancerDirectSellingProducts } from '@/app/actions/direct-selling-actions';
import { FreelancerDirectSellingClient } from './FreelancerDirectSellingClient';

export default async function FreelancerDirectSellingPage() {
    const products = await getFreelancerDirectSellingProducts();

    return (
        <FreelancerDirectSellingClient initialProducts={products} />
    );
}
