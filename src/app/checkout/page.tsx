import { Suspense } from 'react';
import { CheckoutContent } from '@/components/checkout/checkout-content';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
