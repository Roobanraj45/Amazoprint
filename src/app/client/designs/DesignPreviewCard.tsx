
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { Product, DesignElement, Background, Guide } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DesignActions } from './DesignActions';

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

type DesignFromDb = {
    id: number;
    name: string;
    productSlug: string;
    elements: any; 
    background: any; 
    guides: any; 
    createdAt: Date;
    width: number;
    height: number;
}

export function DesignPreviewCard({ design }: { design: DesignFromDb }) {
    const widthInPx = Math.round(design.width * MM_TO_PX);
    const heightInPx = Math.round(design.height * MM_TO_PX);

    const productForCanvas: Product = {
        id: design.productSlug,
        name: design.name,
        description: '',
        imageId: '',
        width: widthInPx,
        height: heightInPx,
        type: '',
    };

    const isMultiPage = Array.isArray(design.elements) && design.elements.length > 0 && Array.isArray(design.elements[0]);

    const elements: DesignElement[] = (isMultiPage ? design.elements[0] : design.elements) as DesignElement[];
    const background: Background = (isMultiPage && Array.isArray(design.background) ? design.background[0] : design.background) as Background;

    // Scale for small preview card
    const previewScale = 250 / widthInPx;
    const previewHeight = heightInPx * previewScale;

    return (
        <Card className="flex flex-col h-full overflow-hidden rounded-lg">
            <CardContent className="p-4 bg-muted/50 flex-grow flex items-center justify-center" style={{ minHeight: `${previewHeight}px` }}>
                 <div style={{ width: 250, height: previewHeight, overflow: 'hidden' }}>
                    <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }}>
                        <DesignCanvas
                            product={productForCanvas}
                            elements={elements}
                            background={background}
                            guides={design.guides as Guide[] || []}
                            showRulers={false}
                            showGrid={false}
                            showPrintGuidelines={false}
                            gridSize={20}
                            bleed={0}
                            safetyMargin={0}
                            viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                        />
                    </div>
                </div>
            </CardContent>
            <CardHeader className="p-4">
                <CardTitle className="text-base font-semibold line-clamp-2">{design.name}</CardTitle>
                <CardDescription className="text-xs">
                    {design.width}mm x {design.height}mm &middot; Saved {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}
                </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button asChild variant="secondary" size="sm">
                    <Link href={`/design/${design.productSlug}?templateId=${design.id}`}>
                        <Pencil className="mr-2 h-3 w-3" /> Edit Design
                    </Link>
                </Button>
                <DesignActions designId={design.id} />
            </CardFooter>
        </Card>
    );
}
