'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  createSubProduct,
  updateSubProduct,
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
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, ImageIcon, Library, Upload, Check, Tag, DollarSign, Ruler, Sparkles, Layers, Maximize2, FileText, CheckCircle2, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { resolveImagePath } from '@/lib/utils';


// Zod schemas for forms
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  basePrice: z.coerce.number().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

const subProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  price: z.coerce.number().optional(),
  width: z.coerce.number().min(0, 'Width must be non-negative'),
  height: z.coerce.number().min(0, 'Height must be non-negative'),
  imageUrl: z.string().optional().or(z.literal('')),
  imageUrls: z.array(z.string()).optional().default([]),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  maxPages: z.preprocess((val) => (val === '' || val === null || val === undefined ? 1 : val), z.coerce.number().min(1)),
  spotUvAllowed: z.boolean().default(false),
  allowedFoils: z.array(z.coerce.number()).optional(),
  allowedDieCuts: z.array(z.coerce.number()).optional(),
  allowedCardTextures: z.array(z.coerce.number()).optional(),
  unitType: z.enum(['mm', 'inch', 'ft']).optional().default('mm'),
  backSideCost: z.coerce.number().optional().default(0),
});

type Product = Awaited<ReturnType<typeof getProducts>>[0];
type SubProduct = Product['subProducts'][0];
type FoilType = Awaited<ReturnType<typeof getFoilTypes>>[0];
type DieCut = Awaited<ReturnType<typeof getDieCuts>>[0];
type CardTexture = Awaited<ReturnType<typeof getCardTextures>>[0];

type Folder = {
  name: string;
  files: string[];
};

// Main Page Component
export default function ProductsPage() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [foilTypes, setFoilTypes] = useState<FoilType[]>([]);
  const [dieCuts, setDieCuts] = useState<DieCut[]>([]);
  const [cardTextures, setCardTextures] = useState<CardTexture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, foils, cuts, textures] = await Promise.all([getProducts(), getFoilTypes(), getDieCuts(), getCardTextures()]);
      setProducts(prods);
      setFoilTypes(foils);
      setDieCuts(cuts);
      setCardTextures(textures);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProductFormSubmit = async (data: z.infer<typeof productSchema>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast({ title: 'Success', description: 'Product updated.' });
      } else {
        await createProduct(data);
        toast({ title: 'Success', description: 'Product created.' });
      }
      setProductFormOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  };
  
  const handleDeleteProduct = async (id: number) => {
    try {
        await deleteProduct(id);
        toast({ title: "Success", description: "Product deleted."});
        await loadData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Stunning Header Banner */}
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
          <Dialog open={isProductFormOpen} onOpenChange={(open) => {
              setProductFormOpen(open);
              if (!open) setEditingProduct(null);
          }}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 font-bold px-6 text-base transition-all duration-200 hover:scale-[1.02]">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
              </Button>
            </DialogTrigger>
            <ProductForm
              onSubmit={handleProductFormSubmit}
              product={editingProduct}
              onClose={() => setProductFormOpen(false)}
            />
          </Dialog>
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
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {products.map((product) => (
                <AccordionItem value={`product-${product.id}`} key={product.id} className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all shadow-sm">
                  <AccordionTrigger className="p-5 hover:no-underline hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex justify-between w-full items-center pr-4">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                {product.imageUrl?.trim() ? (
                                    <Image src={resolveImagePath(product.imageUrl.trim())} alt={product.name} fill className="object-cover" />
                                ) : (
                                    <Package className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                                )}
                            </div>
                            <div className="text-left space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">{product.name}</span>
                                <Badge variant="secondary" className="rounded-full font-bold text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5">
                                  {product.category || 'General'}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 max-w-xl">{product.description || 'No description provided.'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div role="button" className="p-2.5 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-none hover:shadow-sm" onClick={(e) => {e.stopPropagation(); handleEditProduct(product);}}>
                                <Edit className="h-4 w-4" />
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                     <div role="button" className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30 shadow-none hover:shadow-sm"><Trash2 className="h-4 w-4 text-destructive" /></div>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">Delete Product Master?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm font-medium">This action will permanently delete <span className="font-bold text-slate-900 dark:text-white">{product.name}</span> and all of its associated sub-product variants and pricing tiers. This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDeleteProduct(product.id)}>Permanently Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-5 px-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-955/80">
                    <div className="pt-5">
                      <SubProductsManager product={product} onUpdate={loadData} foilTypes={foilTypes} dieCuts={dieCuts} cardTextures={cardTextures} />
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

// Product Form Component
function ProductForm({
  onSubmit,
  product,
  onClose,
}: {
  onSubmit: (data: z.infer<typeof productSchema>) => void;
  product: Product | null;
  onClose: () => void;
}) {
  const [isImageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('products');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: product || { isActive: true, imageUrl: '' },
  });
  const imageUrl = watch('imageUrl');

  useEffect(() => {
    if (product) {
      reset(product);
    }
  }, [product, reset]);

  return (
    <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh] bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl">
      <DialogHeader className="p-8 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                <Package className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Product Master Blueprint
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">{product ? 'Edit Product Container' : 'Create New Product Container'}</DialogTitle>
            <DialogDescription className="text-slate-300 text-sm mt-1">
              Configure top-level product identity, categorization, slug, and core display imagery.
            </DialogDescription>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner">
            <Package className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Core Identity */}
                <div className="space-y-6">
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Core Identity & Metadata</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Name <span className="text-destructive">*</span></Label>
                            <Input id="name" placeholder="e.g. Premium Business Cards" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('name')} />
                            {errors.name && <p className="text-destructive text-xs font-semibold mt-1">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">URL Slug <span className="text-destructive">*</span></Label>
                            <Input id="slug" placeholder="e.g. premium-business-cards" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('slug')} />
                            {errors.slug && <p className="text-destructive text-xs font-semibold mt-1">{errors.slug.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</Label>
                            <Input id="category" placeholder="e.g. Business Cards" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('category')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Catalog Description</Label>
                            <Textarea id="description" placeholder="Provide a compelling overview of this product line..." className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 p-3 text-sm font-medium" {...register('description')} />
                        </div>
                      </CardContent>
                    </Card>
                </div>

                {/* Right Column: Media & Status */}
                <div className="space-y-6">
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Media Asset & Visibility</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Catalog Cover Image</Label>
                          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            {(imageUrl && imageUrl.trim()) ? (
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden border shadow-sm flex-shrink-0 bg-white">
                                <Image src={resolveImagePath(imageUrl)} alt="Current image" fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-dashed border-slate-300 dark:border-slate-700">
                                <ImageIcon className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <Input 
                                    type="text"
                                    placeholder="Image URL"
                                    className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                                   {...register('imageUrl')}
                                />
                                <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" size="sm" className="w-full h-8 rounded-xl text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors border-slate-200 dark:border-slate-800">
                                            <Library className="mr-2 h-3.5 w-3.5" />
                                            Browse Media Library
                                        </Button>
                                    </DialogTrigger>
                                    <ImageBrowserDialog 
                                        folder={currentFolder} 
                                        setFolder={setCurrentFolder} 
                                        onSelect={(url) => {
                                            setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                                            setImageBrowserOpen(false);
                                        }}
                                    />
                                </Dialog>
                            </div>
                          </div>
                           {errors.imageUrl && <p className="text-destructive text-xs font-semibold mt-1">{errors.imageUrl.message}</p>}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Status</Label>
                                <p className="text-[11px] text-muted-foreground font-medium">Make this product container visible on the public storefront.</p>
                            </div>
                             <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                )}
                            />
                        </div>
                      </CardContent>
                    </Card>
                </div>
            </div>
            {/* Added spacer to ensure last field isn't cut off */}
            <div className="h-8" />
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-50/20 px-6">
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Product Container
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// SubProducts Manager Component
function SubProductsManager({ product, onUpdate, foilTypes, dieCuts, cardTextures }: { product: Product; onUpdate: () => void; foilTypes: FoilType[]; dieCuts: DieCut[]; cardTextures: CardTexture[] }) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingSubProduct, setEditingSubProduct] = useState<SubProduct | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: z.infer<typeof subProductSchema>) => {
    try {
      if (editingSubProduct) {
        await updateSubProduct(editingSubProduct.id, { ...data });
        toast({ title: 'Success', description: 'Sub-product updated.' });
      } else {
        await createSubProduct({ ...data, productId: product.id });
        toast({ title: 'Success', description: 'Sub-product added.' });
      }
      setFormOpen(false);
      setEditingSubProduct(null);
      onUpdate();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (subProduct: SubProduct) => {
    setEditingSubProduct(subProduct);
    setFormOpen(true);
  };
  
  const handleDelete = async (id: number) => {
     try {
        await deleteSubProduct(id);
        toast({ title: "Success", description: "Sub-product deleted."});
        onUpdate();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Configured Sizes & Variants ({product.subProducts.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manage physical variations, dimensions, and specialized pricing tiers.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
            setFormOpen(open);
            if(!open) setEditingSubProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all">
              <PlusCircle className="mr-1.5 h-4 w-4" /> Add New Variant
            </Button>
          </DialogTrigger>
          <SubProductForm
            onSubmit={handleFormSubmit}
            subProduct={editingSubProduct}
            onClose={() => setFormOpen(false)}
            foilTypes={foilTypes}
            dieCuts={dieCuts}
            cardTextures={cardTextures}
          />
        </Dialog>
      </div>
      
      {/* Variants List */}
      <div className="space-y-4">
        {product.subProducts.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/50 gap-2">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No Variants Configured</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">This product currently has no physical variants. Click &apos;Add New Variant&apos; above to configure sizes and prices.</p>
          </div>
        ) : (
          product.subProducts.map((sp) => (
            <Card key={sp.id} className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                {sp.imageUrl?.trim() ? (
                                    <Image src={resolveImagePath(sp.imageUrl.trim())} alt={sp.name} fill className="object-cover" />
                                ) : (
                                    <ImageIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  {sp.name}
                                  <Badge variant={sp.isActive ? 'default' : 'secondary'} className={`h-5 text-[10px] font-bold px-2 rounded-full ${sp.isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                      {sp.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400">SKU Code: {sp.sku || 'N/A'}</CardDescription>
                                {sp.description && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">{sp.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                            <Button variant="ghost" size="sm" className="h-9 rounded-xl font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors" onClick={() => handleEdit(sp)}>
                              <Edit className="h-4 w-4 mr-1.5" /> Edit Variant
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors">
                                      <Trash2 className="h-4 w-4 mr-1.5 text-destructive" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">Delete Variant Blueprint?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm font-medium">This action will permanently delete the <span className="font-bold text-slate-900 dark:text-white">{sp.name}</span> variant and its custom pricing rules. This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDelete(sp.id)}>Permanently Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-sm">
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                            <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                              <Tag className="w-3 h-3 text-indigo-500" /> Base Price
                            </Label>
                            <p className="font-extrabold text-slate-900 dark:text-white text-lg">₹{sp.price}</p>
                        </div>
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                            <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                              <Ruler className="w-3 h-3 text-indigo-500" /> Dimensions
                            </Label>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{sp.width} x {sp.height} <span className="text-xs text-muted-foreground font-semibold">{sp.unitType || 'mm'}</span></p>
                        </div>
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                            <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-500" /> Enhancements
                            </Label>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {sp.spotUvAllowed && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-[10px] h-5 font-extrabold px-2 rounded-lg shadow-sm">SPOT UV</Badge>
                                )}
                                {(sp.allowedFoils?.length ?? 0) > 0 && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[10px] h-5 font-extrabold px-2 rounded-lg shadow-sm">FOIL ({sp.allowedFoils?.length})</Badge>
                                )}
                                {(sp.allowedDieCuts?.length ?? 0) > 0 && (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 text-[10px] h-5 font-extrabold px-2 rounded-lg shadow-sm">DIE ({sp.allowedDieCuts?.length})</Badge>
                                )}
                                {(sp.allowedCardTextures?.length ?? 0) > 0 && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[10px] h-5 font-extrabold px-2 rounded-lg shadow-sm">TEXTURE ({sp.allowedCardTextures?.length})</Badge>
                                )}
                                {!sp.spotUvAllowed && !sp.allowedFoils?.length && !sp.allowedDieCuts?.length && !sp.allowedCardTextures?.length && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">No enhancements</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                            <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                              <FileText className="w-3 h-3 text-indigo-500" /> Sides / Pages
                            </Label>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{sp.maxPages ?? 1} Side{(sp.maxPages ?? 1) > 1 ? 's' : ''}</p>
                        </div>
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                            <Label className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-indigo-500" /> Back Side Cost
                            </Label>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">₹{sp.backSideCost || '0.00'}</p>
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

// SubProduct Form Component
function SubProductForm({
  onSubmit,
  subProduct,
  onClose,
  foilTypes,
  dieCuts,
  cardTextures,
}: {
  onSubmit: (data: z.infer<typeof subProductSchema>) => void;
  subProduct: SubProduct | null;
  onClose: () => void;
  foilTypes: FoilType[];
  dieCuts: DieCut[];
  cardTextures: CardTexture[];
}) {
  const [isImageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [isAdditionalBrowserOpen, setAdditionalBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('products');
    
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<z.infer<typeof subProductSchema>>({
    resolver: zodResolver(subProductSchema),
    defaultValues: { isActive: true, imageUrl: '', imageUrls: [], description: '', spotUvAllowed: false, maxPages: 1, allowedFoils: [], allowedDieCuts: [], allowedCardTextures: [], dieCutPrices: {}, cardTexturePrices: {}, unitType: 'mm', backSideCost: 0 },
  });
  
  const imageUrl = watch('imageUrl');
  const spotUvAllowed = watch('spotUvAllowed');

  useEffect(() => {
    register('dieCutPrices');
    register('cardTexturePrices');
  }, [register]);

  useEffect(() => {
    if (subProduct) {
      reset({
          ...subProduct,
          price: Number(subProduct.price),
          width: Number(subProduct.width),
          height: Number(subProduct.height),
          maxPages: subProduct.maxPages ?? 1,
          allowedFoils: subProduct.allowedFoils || [],
          allowedDieCuts: subProduct.allowedDieCuts || [],
          allowedCardTextures: subProduct.allowedCardTextures || [],
          dieCutPrices: (subProduct as any).dieCutPrices || {},
          cardTexturePrices: (subProduct as any).cardTexturePrices || {},
          unitType: subProduct.unitType as any || 'mm',
          backSideCost: Number(subProduct.backSideCost || 0),
          imageUrls: subProduct.imageUrls || [],
          description: subProduct.description || '',
      });
    } else {
        reset({
            name: '',
            sku: '',
            description: '',
            price: undefined,
            width: 0,
            height: 0,
            imageUrl: '',
            imageUrls: [],
            isActive: true,
            spotUvAllowed: false,
            maxPages: 1,
            allowedFoils: [],
            allowedDieCuts: [],
            allowedCardTextures: [],
            dieCutPrices: {},
            cardTexturePrices: {},
            unitType: 'mm',
            backSideCost: 0,
        });
    }
  }, [subProduct, reset]);

  return (
     <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh] bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl">
      <DialogHeader className="p-8 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Variant Specification Engine
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">{subProduct ? 'Edit Variant Blueprint' : 'Create New Variant Blueprint'}</DialogTitle>
            <DialogDescription className="text-slate-300 text-sm mt-1">
              Configure physical properties, pricing tiers, media assets, and print enhancements.
            </DialogDescription>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner">
            <Layers className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
      </DialogHeader>
      
      <form onSubmit={handleSubmit((data) => {
          onSubmit({
              ...data,
              dieCutPrices: watch('dieCutPrices') || {},
              cardTexturePrices: watch('cardTexturePrices') || {}
          });
      })} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Core Identity & Economics */}
                <div className="space-y-6">
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Core Identity & Economics</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="sp-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Variant Name <span className="text-destructive">*</span></Label>
                            <Input id="sp-name" placeholder="e.g. Standard 300 GSM Matte" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500" {...register('name')} />
                            {errors.name && <p className="text-destructive text-xs font-semibold mt-1">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sp-description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</Label>
                            <Textarea id="sp-description" placeholder="Provide details about material finish, recommended usage, etc..." className="min-h-[80px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 p-3 text-sm font-medium" {...register('description')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sp-sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">SKU Code</Label>
                                <Input id="sp-sku" placeholder="e.g. BC-STD-MATTE" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500" {...register('sku')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sp-price" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Base Price (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="sp-price" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('price')} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label htmlFor="sp-backSideCost" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Back Side Cost (Add-on)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                <Input id="sp-backSideCost" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('backSideCost')} />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium mt-1">Extra cost applied per unit if double-sided printing is selected by the user.</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <Label htmlFor="sp-isActive" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Status</Label>
                                <p className="text-[11px] text-muted-foreground font-medium">Enable or disable this variant across the storefront.</p>
                            </div>
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="sp-isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                )}
                            />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Physical Blueprint */}
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Physical Blueprint & Setup</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="sp-unitType" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Measurement Unit</Label>
                            <Controller
                                name="unitType"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger id="sp-unitType" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold">
                                            <SelectValue placeholder="Select Unit" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="mm" className="font-semibold">Millimeters (mm)</SelectItem>
                                            <SelectItem value="inch" className="font-semibold">Inches (inch)</SelectItem>
                                            <SelectItem value="ft" className="font-semibold">Feet (ft)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sp-width" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Width</Label>
                                <Input id="sp-width" type="number" step="0.1" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('width')} />
                                {errors.width && <p className="text-destructive text-xs font-semibold mt-1">{errors.width.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sp-height" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Height</Label>
                                <Input id="sp-height" type="number" step="0.1" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('height')} />
                                {errors.height && <p className="text-destructive text-xs font-semibold mt-1">{errors.height.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label htmlFor="sp-max-pages" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Maximum Configurable Sides/Pages</Label>
                            <Input id="sp-max-pages" type="number" placeholder="1" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('maxPages')} />
                            {errors.maxPages && <p className="text-destructive text-xs font-semibold mt-1">{errors.maxPages.message}</p>}
                        </div>
                      </CardContent>
                    </Card>
                </div>

                {/* Right Column: Media Gallery & Print Enhancements */}
                <div className="space-y-6">
                    {/* Media Gallery */}
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Media Gallery</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Primary Display Image</Label>
                          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            {(imageUrl && imageUrl.trim()) ? (
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden border shadow-sm flex-shrink-0 bg-white">
                                <Image src={resolveImagePath(imageUrl)} alt="Current image" fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-dashed border-slate-300 dark:border-slate-700">
                                <ImageIcon className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <Input 
                                    type="text"
                                    placeholder="Image URL"
                                    className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                                   {...register('imageUrl')}
                                />
                                 <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" size="sm" className="w-full h-8 rounded-xl text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors border-slate-200 dark:border-slate-800">
                                            <Library className="mr-2 h-3.5 w-3.5" />
                                            Browse Media Library
                                        </Button>
                                    </DialogTrigger>
                                    <ImageBrowserDialog 
                                        folder={currentFolder} 
                                        setFolder={setCurrentFolder} 
                                        onSelect={(url) => {
                                            setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                                            setImageBrowserOpen(false);
                                        }}
                                    />
                                </Dialog>
                            </div>
                          </div>
                           {errors.imageUrl && <p className="text-destructive text-xs font-semibold mt-1">{errors.imageUrl.message}</p>}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Additional Supporting Images</Label>
                            <Dialog open={isAdditionalBrowserOpen} onOpenChange={setAdditionalBrowserOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors">
                                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                        Add Image
                                    </Button>
                                </DialogTrigger>
                                <ImageBrowserDialog 
                                    folder={currentFolder} 
                                    setFolder={setCurrentFolder} 
                                    onSelect={(url) => {
                                        const currentUrls = watch('imageUrls') || [];
                                        setValue('imageUrls', [...currentUrls, url], { shouldDirty: true, shouldValidate: true });
                                        setAdditionalBrowserOpen(false);
                                    }}
                                />
                            </Dialog>
                          </div>
                          <div className="grid grid-cols-4 gap-3 pt-1">
                            {(watch('imageUrls') || []).map((url, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-square shadow-sm">
                                <Image src={resolveImagePath(url)} alt={`Additional ${idx}`} fill className="object-cover" />
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px]">
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-full shadow-lg hover:scale-105 transition-transform" 
                                    onClick={() => {
                                      const currentUrls = watch('imageUrls') || [];
                                      setValue('imageUrls', currentUrls.filter((_, i) => i !== idx), { shouldDirty: true });
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {(watch('imageUrls') || []).length === 0 && (
                              <div className="col-span-4 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
                                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No additional images added yet.</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-600">Click &apos;Add Image&apos; above to showcase multiple angles or examples.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Print Enhancements & Add-ons */}
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Print Enhancements & Add-ons</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                         <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <Label htmlFor="sp-spotUvAllowed" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Spot UV Capability</Label>
                                <p className="text-[11px] text-muted-foreground font-medium">Allow high-gloss raised accent finishes on this variant.</p>
                            </div>
                            <Controller
                                name="spotUvAllowed"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="sp-spotUvAllowed"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                )}
                            />
                        </div>
                        {spotUvAllowed && (
                            <div className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                <Label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Configurable Foil Types</Label>
                                 <Controller
                                    name="allowedFoils"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            items={foilTypes}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select applicable foil finishes..."
                                        />
                                    )}
                                />
                            </div>
                        )}
                        <div className="space-y-3 pt-2">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Allowed Die Cuts & Custom Pricing</Label>
                             <Controller
                                name="allowedDieCuts"
                                control={control}
                                render={({ field }) => (
                                    <MultiSelect
                                        items={dieCuts}
                                        selected={field.value || []}
                                        onChange={(newSelected) => {
                                            field.onChange(newSelected);
                                            const currentPrices = watch('dieCutPrices') || {};
                                            const newPrices = { ...currentPrices };
                                            newSelected.forEach(id => {
                                                if (newPrices[id] === undefined) {
                                                    const dc = dieCuts.find(d => d.id === id);
                                                    newPrices[id] = Number(dc?.amount || 0);
                                                }
                                            });
                                            setValue('dieCutPrices', newPrices, { shouldDirty: true });
                                        }}
                                        placeholder="Select applicable die-cut shapes..."
                                    />
                                )}
                            />
                            
                            {/* Price configuration for selected die cuts */}
                            {(watch('allowedDieCuts') || []).length > 0 && (
                                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 shadow-inner">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per-card Die-Cut Pricing Override</p>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {(watch('allowedDieCuts') || []).map(id => {
                                            const dc = dieCuts.find(d => d.id === id);
                                            if (!dc) return null;
                                            const currentPrices = watch('dieCutPrices') || {};
                                            return (
                                                <div key={id} className="flex items-center justify-between gap-4 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition-colors">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                                      {dc.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 w-28">
                                                        <span className="text-[11px] text-muted-foreground font-bold">₹</span>
                                                        <Input 
                                                            type="number" 
                                                            step="0.01" 
                                                            className="h-8 text-xs font-bold px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                                                            value={currentPrices[id] ?? Number(dc.amount || 0)}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setValue('dieCutPrices', {
                                                                    ...currentPrices,
                                                                    [id]: val
                                                                }, { shouldDirty: true });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Allowed Card Textures & Custom Pricing</Label>
                                <Controller
                                    name="allowedCardTextures"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            items={cardTextures}
                                            selected={field.value || []}
                                            onChange={(newSelected) => {
                                                field.onChange(newSelected);
                                                const currentPrices = watch('cardTexturePrices') || {};
                                                const newPrices = { ...currentPrices };
                                                newSelected.forEach(id => {
                                                    if (newPrices[id] === undefined) {
                                                        const ct = cardTextures.find(c => c.id === id);
                                                        newPrices[id] = Number(ct?.amount || 0);
                                                    }
                                                });
                                                setValue('cardTexturePrices', newPrices, { shouldDirty: true });
                                            }}
                                            placeholder="Select applicable card textures..."
                                        />
                                    )}
                                />
                                
                                {/* Price configuration for selected card textures */}
                                {(watch('allowedCardTextures') || []).length > 0 && (
                                    <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 shadow-inner mt-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per-card Texture Pricing Override</p>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {(watch('allowedCardTextures') || []).map(id => {
                                                const ct = cardTextures.find(c => c.id === id);
                                                if (!ct) return null;
                                                const currentPrices = watch('cardTexturePrices') || {};
                                                return (
                                                    <div key={id} className="flex items-center justify-between gap-4 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition-colors">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                                                          {ct.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 w-28">
                                                            <span className="text-[11px] text-muted-foreground font-bold">₹</span>
                                                            <Input 
                                                                type="number" 
                                                                step="0.01" 
                                                                className="h-8 text-xs font-bold px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                                                                value={currentPrices[id] ?? Number(ct.amount || 0)}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    setValue('cardTexturePrices', {
                                                                        ...currentPrices,
                                                                        [id]: val
                                                                    }, { shouldDirty: true });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                </div>
             </div>
             {/* Added spacer */}
             <div className="h-8" />
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Variant Blueprint
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function MultiSelect({
    items,
    selected,
    onChange,
    placeholder
}: {
    items: { id: number; name: string }[];
    selected: number[];
    onChange: (selected: number[]) => void;
    placeholder?: string;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                    {selected.length > 0 ? `${selected.length} items selected` : (placeholder || "Select items...")}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-popover-trigger-width)] max-h-[300px] flex flex-col p-0" align="start">
                <DropdownMenuSeparator />
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-1">
                        {items.map(item => (
                            <DropdownMenuCheckboxItem
                                key={item.id}
                                checked={selected.includes(item.id)}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={(checked) => {
                                    const newSelected = checked
                                        ? [...selected, item.id]
                                        : selected.filter(id => id !== item.id);
                                    onChange(newSelected);
                                }}
                            >
                                <span>{item.name}</span>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ImageBrowserDialog({ onSelect, folder, setFolder }: { onSelect: (url: string) => void, folder: string, setFolder: (folder: string) => void }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/uploads/list');
      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
        if (data.folders.length > 0 && !folder) {
          setFolder(data.folders[0].name);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch assets');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Loading Error',
        description: 'Could not load uploaded assets.',
      });
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, folder, setFolder]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);
  
  const handleFileUpload = async () => {
    if (!fileToUpload) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }
    if (!folder) {
        toast({ variant: 'destructive', title: 'Folder name is required' });
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folder);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      onSelect(result.url); // Select the newly uploaded image
      await fetchAssets(); // Refresh the list
      toast({ title: 'Image uploaded successfully.' });
      setFileToUpload(null); // Reset file input
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Image Library</DialogTitle>
          <DialogDescription>Select an existing image or upload a new one.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex min-h-0">
          <Tabs defaultValue="browse" className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Existing</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>
            <TabsContent value="browse" className="flex-1 overflow-auto mt-2">
              {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No images found.</div>
                ) : (
                  <div className="flex h-full">
                      <ScrollArea className="w-48 border-r">
                          <div className="p-2">
                              {folders.map(f => (
                                <Button 
                                  key={f.name} 
                                  variant={folder === f.name ? 'secondary' : 'ghost'} 
                                  className="w-full justify-start capitalize"
                                  onClick={() => setFolder(f.name)}
                                >
                                  {f.name}
                                </Button>
                              ))}
                          </div>
                      </ScrollArea>
                      <ScrollArea className="flex-1 p-4">
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                              {folders.find(f => f.name === folder)?.files.map((fileUrl) => (
                                <DialogClose asChild key={fileUrl}>
                                  <button onClick={() => onSelect(fileUrl)} className="aspect-square relative rounded-md overflow-hidden ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                      <Image src={fileUrl} alt="" fill className="object-cover" />
                                  </button>
                                </DialogClose>
                              ))}
                          </div>
                      </ScrollArea>
                  </div>
              )}
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="folder-name-upload">Folder Name</Label>
                      <p className="text-sm text-muted-foreground">The current folder is <span className="font-semibold capitalize">{folder || 'N/A'}</span>. You can create a new folder by typing its name below.</p>
                      <Input
                          id="folder-name-upload"
                          placeholder="e.g., products, banners"
                          value={folder}
                          onChange={(e) => setFolder(e.target.value)}
                      />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="file-upload-dialog">File</Label>
                      <Input
                          id="file-upload-dialog"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                      />
                  </div>
                  <Button onClick={handleFileUpload} disabled={!fileToUpload || !folder || isUploading}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload and Select
                  </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </DialogContent>
  )
}
