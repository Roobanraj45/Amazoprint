import { Suspense } from 'react';
import { PaymentContent } from '@/components/payment/payment-content';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function PaymentPage() {
    return (
        <>
            <Header />
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
                <PaymentContent />
            </Suspense>
        </>
    )
}
