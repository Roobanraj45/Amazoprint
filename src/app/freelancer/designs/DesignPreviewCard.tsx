
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
        <Card className="flex flex-col h-full overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-violet-500/30 hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-0 bg-muted/20 flex-grow flex items-center justify-center border-b border-border/40 relative overflow-hidden" style={{ minHeight: `${previewHeight}px` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent z-0" />
                 <div style={{ width: 250, height: previewHeight, overflow: 'hidden' }} className="relative z-10 group-hover:scale-105 transition-transform duration-500">
                    <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }} className="shadow-2xl shadow-black/20">
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
            <CardHeader className="p-5 pb-3">
                <CardTitle className="text-lg font-black tracking-tight line-clamp-1 group-hover:text-violet-500 transition-colors">{design.name}</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground mt-1">
                    <span className="font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md uppercase tracking-widest">{design.width}x{design.height}mm</span> &middot; Saved {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}
                </CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-0 flex justify-between items-center gap-3">
                <Button asChild variant="secondary" size="sm" className="w-full font-bold uppercase tracking-widest text-[10px] bg-muted hover:bg-violet-500 hover:text-white transition-colors group/btn">
                    <Link href={`/design/${design.productSlug}?templateId=${design.id}`}>
                        <Pencil className="mr-2 h-3 w-3 group-hover/btn:rotate-12 transition-transform" /> Edit Design
                    </Link>
                </Button>
                <DesignActions designId={design.id} />
            </CardFooter>
        </Card>
    );
}
