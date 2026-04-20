'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAdminAllDesigns } from '@/app/actions/design-actions';
import { getProducts } from '@/app/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { Product, DesignElement, Background, Guide } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';


type DesignWithUser = Awaited<ReturnType<typeof getAdminAllDesigns>>[0];
type ProductData = Awaited<ReturnType<typeof getProducts>>[0];

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

function DesignPreviewCard({ design }: { design: DesignWithUser }) {
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
    const previewScale = 250 / (widthInPx || 1);
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
                 <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={design.user.profileImage || undefined} />
                        <AvatarFallback>{design.user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">{design.user.name}</span>
                </div>
                <Button asChild variant="secondary" size="sm">
                    <Link href={`/design/${design.productSlug}?templateId=${design.id}`}>
                        <Pencil className="mr-2 h-3 w-3" /> View
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function AdminDesignsPage() {
    const [designs, setDesigns] = useState<DesignWithUser[]>([]);
    const [products, setProducts] = useState<ProductData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [productFilter, setProductFilter] = useState('all');
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [fetchedDesigns, fetchedProducts] = await Promise.all([
                    getAdminAllDesigns(),
                    getProducts(),
                ]);
                setDesigns(fetchedDesigns);
                setProducts(fetchedProducts);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load data',
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    const filteredDesigns = useMemo(() => {
        return designs.filter(design => {
            const matchesSearch = searchTerm.toLowerCase() === '' ||
                design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                design.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                design.user.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProduct = productFilter === 'all' || design.productSlug === productFilter;
            
            return matchesSearch && matchesProduct;
        });
    }, [designs, searchTerm, productFilter]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">All User Designs</h1>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <Input
                            placeholder="Search by design, user name, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select value={productFilter} onValueChange={setProductFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by product" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Products</SelectItem>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : filteredDesigns.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredDesigns.map(design => (
                                <DesignPreviewCard key={design.id} design={design} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-lg text-muted-foreground">No designs found matching your criteria.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
