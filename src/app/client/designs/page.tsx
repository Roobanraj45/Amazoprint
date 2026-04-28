import { getMyDesigns } from "@/app/actions/design-actions";
import { getProducts } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, ImageIcon, Search, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DesignPreviewCard } from "./DesignPreviewCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { resolveImagePath } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function MyDesignsPage() {
    const designs = await getMyDesigns();
    const products = await getProducts();

    // Group designs by product slug
    const designsByProduct = designs.reduce((acc, design) => {
        const slug = design.productSlug;
        if (!acc[slug]) {
            acc[slug] = [];
        }
        acc[slug].push(design);
        return acc;
    }, {} as Record<string, typeof designs>);

    const productsWithDesigns = products.filter(p => designsByProduct[p.slug]);

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Design Library</Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Designs</h1>
                    <p className="text-muted-foreground font-medium">Access and edit your saved industrial cloud templates.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {designs.length > 0 && (
                        <div className="relative flex-1 md:w-64 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search designs..." className="pl-9 bg-card border-border/50 focus-visible:ring-primary/20 rounded-xl" />
                        </div>
                    )}
                    <Button asChild className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 group">
                        <Link href="/products">
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Design
                        </Link>
                    </Button>
                </div>
            </header>
            
            {designs.length === 0 ? (
                 <Card className="py-32 text-center border-dashed border-border/60 bg-muted/10 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Palette className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black font-headline">No Designs Yet</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">Create your first design using our 3D-native web studio.</p>
                        </div>
                         <Button asChild size="lg" className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 mt-4 font-bold tracking-widest uppercase text-xs">
                            <Link href="/products">
                                <Palette className="mr-2 h-4 w-4" />
                                Start Designing
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="multiple" defaultValue={productsWithDesigns.map(p => p.slug)} className="w-full space-y-6">
                    {productsWithDesigns.map(product => (
                        <AccordionItem key={product.id} value={product.slug} className="border border-border/40 rounded-3xl bg-card/40 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/5 hover:border-primary/20 transition-colors group/item">
                            <AccordionTrigger className="p-6 hover:no-underline hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover/item:border-primary/30 transition-colors">
                                        {product.imageUrl?.trim() ? (
                                            <Image src={resolveImagePath(product.imageUrl.trim())} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                        )}
                                    </div>
                                    <div className="text-left space-y-1">
                                        <h3 className="text-xl font-black tracking-tight">{product.name}</h3>
                                        <Badge variant="outline" className="bg-background text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{designsByProduct[product.slug].length} design{designsByProduct[product.slug].length !== 1 && 's'}</Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-2 bg-muted/5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4 border-t border-border/40">
                                    {designsByProduct[product.slug].map(design => (
                                        <DesignPreviewCard key={design.id} design={design as any} />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
