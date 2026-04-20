
import { getMyDesigns } from "@/app/actions/design-actions";
import { getProducts } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DesignPreviewCard } from "./DesignPreviewCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { resolveImagePath } from "@/lib/utils";

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Designs</h1>
                <Button asChild>
                    <Link href="/products">
                        <Palette className="mr-2 h-4 w-4" />
                        Create New Design
                    </Link>
                </Button>
            </div>
            
            {designs.length === 0 ? (
                 <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        You haven't saved any designs yet.
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="multiple" defaultValue={productsWithDesigns.map(p => p.slug)} className="w-full space-y-4">
                    {productsWithDesigns.map(product => (
                        <AccordionItem key={product.id} value={product.slug} className="border rounded-lg bg-card overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                        {product.imageUrl?.trim() ? (
                                            <Image src={resolveImagePath(product.imageUrl.trim())} alt={product.name} width={48} height={48} className="rounded-md object-cover" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-left">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground text-left">{designsByProduct[product.slug].length} design(s)</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
