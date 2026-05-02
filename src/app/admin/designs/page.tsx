'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAdminAllDesigns } from '@/app/actions/design-actions';
import { getProducts } from '@/app/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Pencil, 
  Search, 
  Filter, 
  LayoutGrid, 
  User as UserIcon,
  Calendar,
  Maximize2,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { Product, DesignElement, Background, Guide } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Scale for preview
    const containerWidth = 280; 
    const containerHeight = 350;
    const scale = Math.min(containerWidth / (widthInPx || 1), containerHeight / (heightInPx || 1)) * 0.9;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="group flex flex-col h-full overflow-hidden rounded-[2rem] border-border/40 bg-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="aspect-[4/5] relative bg-muted/30 flex items-center justify-center overflow-hidden border-b">
                    {/* Live Design Rendering */}
                    <div className="relative transition-transform duration-500 group-hover:scale-105" style={{ width: widthInPx * scale, height: heightInPx * scale }}>
                        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }}>
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
                                isPreview={true}
                            />
                        </div>
                    </div>

                    {/* Category/Product Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-zinc-950/80 backdrop-blur-md text-[8px] font-black uppercase tracking-widest border-white/10">
                            {design.productSlug.replace('-', ' ')}
                        </Badge>
                    </div>

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-2">
                        <Button asChild size="sm" className="rounded-full bg-white text-black hover:bg-white/90 font-bold uppercase text-[10px] tracking-widest shadow-xl">
                            <Link href={`/design/${design.productSlug}?templateId=${design.id}`}>
                                <Pencil className="mr-2 h-3 w-3" /> Edit Design
                            </Link>
                        </Button>
                    </div>
                </div>

                <CardContent className="p-5 flex-1 space-y-4">
                    <div className="space-y-1">
                        <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {design.name}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-[9px] font-bold uppercase tracking-widest">{design.width}x{design.height}mm</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                <Calendar size={10} /> {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-border/40" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <Avatar className="h-8 w-8 border border-white shadow-sm">
                                    <AvatarImage src={design.user.profileImage || undefined} />
                                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                        {design.user.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-foreground leading-none">{design.user.name}</span>
                                <span className="text-[8px] font-medium text-muted-foreground mt-0.5 truncate max-w-[120px]">{design.user.email}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/50">
                            <MoreVertical size={14} className="text-muted-foreground" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
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
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest">
                        <ShieldCheck size={12} /> Design Governance
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase font-headline">User <span className="text-primary">Deployments.</span></h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        Monitor and manage all active designs across the ecosystem. Ensuring raw asset fidelity and print standards.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40">
                    <div className="px-4 py-2 bg-background rounded-xl border border-border shadow-sm">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Active</p>
                        <p className="text-xl font-black leading-none mt-1">{designs.length}</p>
                    </div>
                </div>
            </header>

            {/* Filter Hub */}
            <section className="p-6 rounded-[2.5rem] bg-zinc-950 text-white border border-white/5 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
                            <button className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-primary/20">
                                All Designs
                            </button>
                            <button className="px-4 py-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:text-white transition-all">
                                Templates
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={16} />
                            <Input
                                placeholder="Search designs, users, or emails..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-white/5 border-white/10 focus-visible:ring-primary/20 rounded-full text-sm font-medium text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <Select value={productFilter} onValueChange={setProductFilter}>
                            <SelectTrigger className="w-full md:w-[200px] h-12 bg-white/5 border-white/10 rounded-full text-sm font-medium text-white ring-offset-zinc-950">
                                <SelectValue placeholder="Product Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="all">All Products</SelectItem>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* Content Grid */}
            <main className="relative min-h-[400px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 bg-background/50 backdrop-blur-sm z-50">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Assets...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredDesigns.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
                                {filteredDesigns.map(design => (
                                    <DesignPreviewCard key={design.id} design={design} />
                                ))}
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-32 text-center space-y-6"
                            >
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                                    <LayoutGrid size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase font-headline">No matching deployments</h3>
                                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">Try broadening your search or adjusting the filters to explore other designs.</p>
                                </div>
                                <Button variant="outline" onClick={() => { setSearchTerm(''); setProductFilter('all'); }} className="rounded-full px-8 h-12 uppercase font-bold text-[11px] tracking-widest">
                                    Reset all filters
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
