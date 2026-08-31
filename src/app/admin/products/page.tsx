'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getProducts,
  deleteProduct,
  deleteSubProduct,
} from '@/app/actions/product-actions';
import { getFoilTypes } from '@/app/actions/foil-actions';
import { getDieCuts } from '@/app/actions/die-cut-actions';
import { getCardTextures } from '@/app/actions/card-texture-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  ImageIcon,
  Tag,
  DollarSign,
  Ruler,
  Sparkles,
  Layers,
  FileText,
  Package,
  Truck,
  PenSquare,
} from 'lucide-react';
import { resolveImagePath } from '@/lib/utils';

type Product = Awaited<ReturnType<typeof getProducts>>[0];
type SubProduct = Product['subProducts'][0];
type FoilType = Awaited<ReturnType<typeof getFoilTypes>>[0];
type DieCut = Awaited<ReturnType<typeof getDieCuts>>[0];
type CardTexture = Awaited<ReturnType<typeof getCardTextures>>[0];

export default function ProductsPage() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const prods = await getProducts();
      setProducts(prods);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load catalog data.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id);
      toast({ title: 'Success', description: 'Product deleted.' });
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                <Package className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Product Catalog Management
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Master Products & Variants</h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Create, organize, and configure top-level print products and their associated physical variant blueprints.
            </p>
          </div>
          <Button
            asChild
            className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 font-bold px-6 text-base transition-all duration-200 hover:scale-[1.02]"
          >
            <Link href="/admin/products/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Catalog Container */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading catalog matrix...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Products Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">Your catalog is currently empty. Click &apos;Add New Product&apos; above to create your first top-level product container.</p>
              <Button asChild className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white mt-2">
                <Link href="/admin/products/new">
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Create First Product
                </Link>
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {products.map((product) => (
                <AccordionItem
                  value={`product-${product.id}`}
                  key={product.id}
                  className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors">
                    <AccordionTrigger className="flex-1 p-0 hover:no-underline font-medium text-left">
                      <div className="flex items-center gap-4 sm:gap-5 pr-3">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                          {product.imageUrl?.trim() ? (
                            <Image src={resolveImagePath(product.imageUrl.trim())} alt={product.name} fill className="object-cover" />
                          ) : (
                            <Package className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                          )}
                        </div>
                        <div className="text-left space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">{product.name}</span>
                            <Badge variant="secondary" className="rounded-full font-bold text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5">
                              {product.category || 'General'}
                            </Badge>
                            <Badge variant={product.isActive ? 'default' : 'secondary'} className={`rounded-full font-bold text-[10px] px-2 py-0.5 ${product.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 max-w-xl">{product.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1.5" /> Edit Product
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">Delete Product Master?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm font-medium">
                              This action will permanently delete <span className="font-bold text-slate-900 dark:text-white">{product.name}</span> and all of its associated sub-product variants and pricing tiers. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Permanently Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent className="pt-0 pb-5 px-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-955/80">
                    <div className="pt-5">
                      <SubProductsList product={product} onUpdate={loadData} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// SubProducts List Component (inside accordion)
function SubProductsList({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      await deleteSubProduct(id);
      toast({ title: 'Success', description: 'Variant deleted.' });
      onUpdate();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-4">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Configured Sizes & Variants ({product.subProducts.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Physical variations, dimensions, and specialized pricing tiers for {product.name}.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="h-9 rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs transition-all"
        >
          <Link href={`/admin/products/${product.id}/variants/new`}>
            <PlusCircle className="mr-1.5 h-4 w-4" /> Add New Variant
          </Link>
        </Button>
      </div>

      {/* Variants List */}
      <div className="space-y-4">
        {product.subProducts.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/50 gap-2">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No Variants Configured</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              This product currently has no physical variants. Click &apos;Add New Variant&apos; above to configure sizes and prices.
            </p>
          </div>
        ) : (
          product.subProducts.map((sp) => (
            <Card key={sp.id} className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden relative">
                      {sp.imageUrl?.trim() ? (
                        <Image src={resolveImagePath(sp.imageUrl.trim())} alt={sp.name} fill className="object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {sp.name}
                        <Badge
                          variant={sp.isActive ? 'default' : 'secondary'}
                          className={`h-5 text-[10px] font-bold px-2 rounded-full ${sp.isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                        >
                          {sp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                        <span>SKU: {sp.sku || 'N/A'}</span>
                        {sp.hsnCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                              HSN/SAC: {sp.hsnCode}
                            </span>
                          </>
                        )}
                      </CardDescription>
                      {sp.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">{sp.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-xl font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Link href={`/admin/products/${product.id}/variants/${sp.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1.5" /> Edit Variant
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5 text-destructive" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">Delete Variant Blueprint?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm font-medium">
                            This action will permanently delete the <span className="font-bold text-slate-900 dark:text-white">{sp.name}</span> variant and its custom pricing rules. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                            onClick={() => handleDelete(sp.id)}
                          >
                            Permanently Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 text-sm">
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-500" /> Base Price
                    </Label>
                    <p className="font-extrabold text-slate-900 dark:text-white text-base">₹{sp.price}</p>
                  </div>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-indigo-500" /> Dimensions
                    </Label>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{sp.width} x {sp.height} <span className="text-[10px] text-muted-foreground font-semibold">{sp.unitType || 'mm'}</span></p>
                  </div>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3 h-3 text-indigo-500" /> Delivery & Limits
                    </Label>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 line-clamp-1">{sp.deliveryDays || '3-5 Days'} • {Number(sp.deliveryAmount) > 0 ? `₹${sp.deliveryAmount}` : 'Free'}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{sp.minOrderQuantity ?? 100} - {sp.maxOrderQuantity ?? 10000} pcs</p>
                  </div>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> Enhancements
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sp.spotUvAllowed && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">SPOT UV</Badge>
                      )}
                      {(sp.allowedFoils?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">FOIL ({sp.allowedFoils?.length})</Badge>
                      )}
                      {(sp.allowedDieCuts?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">DIE ({sp.allowedDieCuts?.length})</Badge>
                      )}
                      {(sp.allowedCardTextures?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">TEXTURE ({sp.allowedCardTextures?.length})</Badge>
                      )}
                      {!sp.spotUvAllowed && !sp.allowedFoils?.length && !sp.allowedDieCuts?.length && !sp.allowedCardTextures?.length && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">None</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <PenSquare className="w-3 h-3 text-indigo-500" /> Design Options
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(sp.allowDesignerTool ?? true) && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">STUDIO</Badge>
                      )}
                      {(sp.allowFileUpload ?? true) && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">UPLOAD</Badge>
                      )}
                      {(sp.allowFreelancerContest ?? true) && (
                        <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800 text-[9px] h-4.5 font-extrabold px-1.5 rounded shadow-xs">CONTEST</Badge>
                      )}
                      {!(sp.allowDesignerTool ?? true) && !(sp.allowFileUpload ?? true) && !(sp.allowFreelancerContest ?? true) && (
                        <span className="text-[10px] text-red-500 font-medium italic">None</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-500" /> Sides / Pages
                    </Label>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{sp.maxPages ?? 1} Side{(sp.maxPages ?? 1) > 1 ? 's' : ''}</p>
                  </div>
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                    <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-indigo-500" /> Back Side Cost
                    </Label>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">₹{sp.backSideCost || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
