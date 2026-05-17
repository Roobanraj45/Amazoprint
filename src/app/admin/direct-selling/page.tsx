'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { getDirectSellingProducts, createDirectSellingProduct, updateDirectSellingProduct, deleteDirectSellingProduct } from '@/app/actions/direct-selling-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, IndianRupee, Image as ImageIcon, Upload, X, Search, Filter, XCircle, Package, Tag, Sparkles, CheckCircle2, Layers, DollarSign, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveImagePath } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Zod Schema ---
const jsonFromString = z.string().transform((val, ctx) => {
    if (!val || val.trim() === '') return undefined;
    try {
        return JSON.parse(val);
    } catch (e) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON format',
        });
        return z.NEVER;
    }
});

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().optional().default(0),
  minStockLevel: z.coerce.number().int().optional().default(5),
  weight: z.coerce.number().optional(),
  dimensions: jsonFromString.optional(),
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: jsonFromString.optional(),
  shippingInfo: jsonFromString.optional(),
  textAllowed: z.boolean().default(false),
});

type Product = Awaited<ReturnType<typeof getDirectSellingProducts>>[0];

// --- Sub-components ---
function ImageManager({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
    const [urls, setUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        setUrls(value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
    }, [value]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'direct-selling');

        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            const newUrls = [...urls, result.url];
            onChange(newUrls.join(', '));
            toast({ title: 'Image uploaded successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = (urlToDelete: string) => {
        const newUrls = urls.filter(url => url !== urlToDelete);
        onChange(newUrls.join(', '));
    };

    return (
        <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Images</Label>
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {urls.map((url, idx) => (
                        <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                            <Image src={resolveImagePath(url)} alt={`Product image ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            {idx === 0 && (
                                <Badge variant="secondary" className="absolute top-2 left-2 bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm pointer-events-none">
                                    MAIN
                                </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive" size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                                    onClick={() => handleDelete(url)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                     <label className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">
                        {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" /> : <Upload className="h-6 w-6 mb-1" />}
                        <span className="text-xs font-bold mt-1 text-center">Upload Image</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>
            </div>
             <p className="text-xs text-muted-foreground font-medium italic">The first image uploaded will automatically serve as the primary product catalog showcase image.</p>
        </div>
    );
}

// --- Main Page ---
export default function DirectSellingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const prods = await getDirectSellingProducts();
      setProducts(prods);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load products.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Unique categories for the dropdown
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(cats))];
  }, [products]);

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (editingProduct) {
        await updateDirectSellingProduct(editingProduct.id, data);
        toast({ title: 'Success', description: 'Product updated.' });
      } else {
        await createDirectSellingProduct(data);
        toast({ title: 'Success', description: 'Product created.' });
      }
      setFormOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deleteDirectSellingProduct(id);
      toast({ title: "Success", description: "Product deleted." });
      await loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Stunning Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                <Package className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Direct Selling Inventory Engine
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Direct Selling Management</h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Create, organize, and monitor your direct-to-consumer physical inventory, pricing matrices, stock levels, and custom engraving options.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Dialog open={isFormOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingProduct(null); }}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-12 rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-6 transition-all hover:scale-[1.02] w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Direct Product
                </Button>
              </DialogTrigger>
              <ProductForm onSubmit={handleFormSubmit} product={editingProduct} onClose={() => setFormOpen(false)} />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search products by title, SKU, or category..." 
            className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto justify-end">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold">
              <Filter className="w-4 h-4 mr-2 text-indigo-500" />
              <SelectValue placeholder="Filter Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="font-semibold">
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || categoryFilter !== 'all') && (
            <Button variant="ghost" className="h-11 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>
              <XCircle className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading direct selling inventory...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
                <CardHeader className="p-0 relative flex-shrink-0">
                    <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950 relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                        {product.imageUrls?.[0] ? (
                            <Image src={resolveImagePath(product.imageUrls[0])} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">No Image Provided</span>
                            </div>
                        )}
                    </div>
                     <Badge variant={product.isActive ? 'default' : 'secondary'} className={`absolute top-3 right-3 h-6 text-[10px] font-extrabold px-2.5 rounded-full shadow-md ${product.isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                     </Badge>
                     {product.isFeatured && (
                        <Badge variant="secondary" className="absolute top-3 left-3 bg-amber-400 text-amber-950 border border-amber-300 dark:border-amber-500 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md">
                            <Sparkles className="w-3 h-3 mr-1 inline-block animate-pulse text-amber-900" /> Featured
                        </Badge>
                     )}
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{product.category || 'Uncategorized'}</p>
                        <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white line-clamp-2 h-14 mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</CardTitle>
                    </div>
                    <div className="flex justify-between items-baseline pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <span className="font-extrabold text-2xl text-slate-900 dark:text-white flex items-center">
                            <IndianRupee className="w-5 h-5 mr-0.5 text-indigo-500" />
                            {product.sellingPrice}
                        </span>
                        <Badge variant={product.stockQuantity > (product.minStockLevel || 0) ? 'secondary' : 'destructive'} className={`h-6 text-[11px] font-extrabold px-2.5 rounded-lg shadow-sm ${product.stockQuantity > (product.minStockLevel || 0) ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' : 'bg-red-500 text-white'}`}>
                            {product.stockQuantity} in stock
                        </Badge>
                    </div>
                </CardContent>
                <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 font-bold transition-colors" onClick={() => { setEditingProduct(product); setFormOpen(true); }}>
                      <Edit className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-955/30 dark:hover:text-red-400 text-destructive font-bold transition-colors">
                            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                      <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">Delete Product?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm font-medium">This action will permanently delete this direct selling product and its associated media. This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                          <AlertDialogAction className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDelete(product.id)}>Permanently Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center px-4 gap-4">
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                <Package className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Products Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">No direct selling inventory matches your current search query or category filter. Adjust your parameters to discover items.</p>
            <Button variant="outline" className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 shadow-sm mt-2" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>
                Clear All Filters
            </Button>
        </div>
      )}
    </div>
  );
}

// --- Product Form Component ---
function ProductForm({ onSubmit, product, onClose }: { onSubmit: (data: any) => void; product: Product | null; onClose: () => void; }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (product) {
        reset({
            ...product,
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
            weight: Number(product.weight),
            imageUrls: product.imageUrls?.join(', ') || '',
            tags: product.tags?.join(', ') || '',
            dimensions: product.dimensions ? JSON.stringify(product.dimensions, null, 2) : '',
            supplierInfo: product.supplierInfo ? JSON.stringify(product.supplierInfo, null, 2) : '',
            shippingInfo: product.shippingInfo ? JSON.stringify(product.shippingInfo, null, 2) : '',
            textAllowed: !!product.textAllowed,
        });
    } else {
      reset({ name: '', slug: '', description: '', category: '', costPrice: 0, sellingPrice: 0, sku: '', stockQuantity: 0, minStockLevel: 5, weight: 0, dimensions: '', imageUrls: '', tags: '', isFeatured: false, isActive: true, supplierInfo: '', shippingInfo: '', textAllowed: false });
    }
  }, [product, reset]);

  return (
    <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden">
      <DialogHeader className="p-8 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                        <Package className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                        Direct Selling Engine
                    </Badge>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">{product ? 'Edit Direct Selling Product' : 'Create Direct Selling Product'}</DialogTitle>
                <DialogDescription className="text-slate-300 text-sm mt-1">Configure physical attributes, pricing tiers, stock minimums, and custom engraving capabilities.</DialogDescription>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                <Package className="w-8 h-8 text-indigo-400" />
            </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2 mx-8 mt-6 max-w-[calc(100%-4rem)] flex-shrink-0 shadow-inner">
            <TabsTrigger value="basic" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Pricing & Stock</TabsTrigger>
            <TabsTrigger value="media" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Media & Shipping</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Customization</TabsTrigger>
            <TabsTrigger value="meta" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Meta & Status</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-8 py-4">
              <TabsContent value="basic" className="space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            General Product Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Name</Label>
                                <Input id="name" placeholder="e.g. Premium Executive Pen" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('name')} />
                                {errors.name && <p className="text-xs font-bold text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">URL Slug</Label>
                                <Input id="slug" placeholder="e.g. premium-executive-pen" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('slug')} />
                                {errors.slug && <p className="text-xs font-bold text-destructive mt-1">{errors.slug.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</Label>
                                <Input id="category" placeholder="e.g. Stationery, Accessories" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('category')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">SKU (Stock Keeping Unit)</Label>
                                <Input id="sku" placeholder="e.g. PEN-EXEC-001" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('sku')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Description</Label>
                            <Textarea id="description" placeholder="Provide a detailed, compelling description of the product features, materials, and benefits..." className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-4" {...register('description')} rows={5} />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Pricing Matrix & Inventory Thresholds
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="costPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cost Price (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="costPrice" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('costPrice')} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Selling Price (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="sellingPrice" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('sellingPrice')} />
                                </div>
                                {errors.sellingPrice && <p className="text-xs font-bold text-destructive mt-1">{errors.sellingPrice.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="stockQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Current Stock Quantity</Label>
                                <Input id="stockQuantity" type="number" placeholder="0" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('stockQuantity')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Minimum Stock Alert Threshold</Label>
                                <Input id="minStockLevel" type="number" placeholder="5" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('minStockLevel')} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-6 mt-0">
                 <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                     <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                         <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                             Media Gallery & Shipping Specifications
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 space-y-6">
                         <Controller
                            name="imageUrls"
                            control={control}
                            render={({ field }) => (
                                <ImageManager value={field.value} onChange={field.onChange} />
                            )}
                        />
                        {errors.imageUrls && <p className="text-xs font-bold text-destructive mt-1">{errors.imageUrls.message}</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Physical Weight (kg)</Label>
                                <Input id="weight" type="number" step="0.01" placeholder="e.g. 0.5" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-95 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('weight')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dimensions" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dimensions (Valid JSON)</Label>
                                <Textarea id="dimensions" {...register('dimensions')} placeholder='e.g. {"length": 15, "width": 10, "height": 5}' className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-3 font-mono text-xs" rows={3} />
                                {errors.dimensions && <p className="text-xs font-bold text-destructive mt-1">{errors.dimensions.message}</p>}
                            </div>
                        </div>
                         <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                             <Label htmlFor="shippingInfo" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Shipping Configuration (Valid JSON)</Label>
                             <Textarea id="shippingInfo" {...register('shippingInfo')} placeholder='e.g. {"carrier": "FedEx", "handlingFee": 50, "fragile": true}' className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-3 font-mono text-xs" rows={3} />
                             {errors.shippingInfo && <p className="text-xs font-bold text-destructive mt-1">{errors.shippingInfo.message}</p>}
                         </div>
                     </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="custom" className="space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Customer Engraving & Text Customization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="textAllowed" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Enable Custom Text Inputs</Label>
                                <p className="text-xs text-muted-foreground font-medium">Permit buyers to supply custom text, names, or messages to be printed or engraved on this product during checkout.</p>
                            </div>
                            <Controller 
                              name="textAllowed" 
                              control={control} 
                              render={({ field }) => (
                                <Switch id="textAllowed" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600" />
                              )} 
                            />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meta" className="space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Search Tags, Supplier & Visibility Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Search Keywords / Tags</Label>
                            <Textarea id="tags" {...register('tags')} placeholder="Enter comma-separated tags e.g. premium, gift, executive, pen" className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-3" rows={2} />
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label htmlFor="supplierInfo" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Supplier Information (Valid JSON)</Label>
                            <Textarea id="supplierInfo" {...register('supplierInfo')} placeholder='e.g. {"name": "Global Stationery Ltd", "contact": "support@globalstationery.com"}' className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-3 font-mono text-xs" rows={3} />
                            {errors.supplierInfo && <p className="text-xs font-bold text-destructive mt-1">{errors.supplierInfo.message}</p>}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isFeatured" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Featured Product</Label>
                                    <p className="text-[11px] text-muted-foreground font-medium">Highlight on the home catalog.</p>
                                </div>
                                <Controller name="isFeatured" control={control} render={({ field }) => <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-500" />} />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product is Active</Label>
                                    <p className="text-[11px] text-muted-foreground font-medium">Allow customers to view and buy.</p>
                                </div>
                                <Controller name="isActive" control={control} render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3 flex-shrink-0">
          <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Save Direct Product
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}