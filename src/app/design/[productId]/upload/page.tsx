import { Suspense } from 'react';
import { UploadDesignContent } from '@/components/design/upload-design-content';
import { Loader2 } from 'lucide-react';

export default function UploadDesignPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <UploadDesignContent />
        </Suspense>
    );
}
