'use client';

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from 'next/link';

export function PrintPreviewButton({ order }: { order: any }) {
    const design = order.design;
    if (!design) {
        return null;
    }

    const designUrl = `/design/${design.productSlug}?templateId=${design.id}`;

    return (
        <Button asChild variant="secondary">
            <Link href={designUrl} target="_blank">
                <FileText className="mr-2 h-4 w-4"/> View & Edit Design
            </Link>
        </Button>
    );
}
