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
import { Loader2, PlusCircle, Edit, Trash2, IndianRupee, Image as ImageIcon, Upload, X, Search, Filter, XCircle, Package } from 'lucide-react';
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
        <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="p-3 border rounded-lg bg-background/50">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {urls.map((url) => (
                        <div key={url} className="group relative aspect-square">
                            <Image src={resolveImagePath(url)} alt="Product image" fill className="object-cover rounded-md bg-muted" />
                            <Button
                                variant="destructive" size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={() => handleDelete(url)}
                            ><X size={12} /></Button>
                        </div>
                    ))}
                     <label className="aspect-square flex flex-col items-center justify-center rounded-md border-2 border-dashed cursor-pointer bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors">
                        {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                        <span className="text-[10px] mt-1 text-center">Upload Image</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>
            </div>
             <p className="text-xs text-muted-foreground">The first image will be used as the main display image.</p>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Direct Selling Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog and inventory.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingProduct(null); }}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button></DialogTrigger>
          <ProductForm onSubmit={handleFormSubmit} product={editingProduct} onClose={() => setFormOpen(false)} />
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || categoryFilter !== 'all') && (
            <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>
              <XCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="p-0 relative">
                    <div className="aspect-[4/3] bg-muted">
                        {product.imageUrls?.[0] ? (
                            <Image src={resolveImagePath(product.imageUrls[0])} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                            </div>
                        )}
                    </div>
                     <Badge variant={product.isActive ? 'default' : 'destructive'} className="absolute top-3 right-3">{product.isActive ? 'Active' : 'Inactive'}</Badge>
                     {product.isFeatured && <Badge variant="secondary" className="absolute top-3 left-3 bg-amber-400 text-amber-900 border-amber-500">Featured</Badge>}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">{product.category || 'Uncategorized'}</p>
                    <CardTitle className="text-lg line-clamp-2 h-14 group-hover:text-primary transition-colors">{product.name}</CardTitle>
                    <div className="flex justify-between items-baseline pt-2">
                        <span className="font-bold text-2xl text-primary flex items-center"><IndianRupee size={18} className="mr-0.5" />{product.sellingPrice}</span>
                        <Badge variant={product.stockQuantity > (product.minStockLevel || 0) ? "secondary" : "destructive"}>{product.stockQuantity} in stock</Badge>
                    </div>
                </CardContent>
                <CardFooter className="p-2 bg-muted/50 border-t flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingProduct(product); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the product.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground">Adjust your filters or try a different search term.</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>Clear all filters</Button>
        </div>
      )}
    </div>
  );
}

// --- Product Form Component ---
function ProductForm({ onSubmit, product, onClose }: { onSubmit: (data: any) => void; product: Product | null; onClose: () => void; }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<z.infer<typeof formSchema>>({
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
        });
    } else {
      reset({ name: '', slug: '', description: '', category: '', costPrice: 0, sellingPrice: 0, sku: '', stockQuantity: 0, minStockLevel: 5, weight: 0, dimensions: '', imageUrls: '', tags: '', isFeatured: false, isActive: true, supplierInfo: '', shippingInfo: '' });
    }
  }, [product, reset]);

  return (
    <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit' : 'Add'} Product</DialogTitle>
        <DialogDescription>Fill in the details for the direct selling product.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
            <TabsTrigger value="media">Media & Shipping</TabsTrigger>
            <TabsTrigger value="meta">Meta</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-grow mt-4 pr-4">
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" {...register('name')} />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
                <div className="space-y-1.5"><Label htmlFor="slug">Slug</Label><Input id="slug" {...register('slug')} />{errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Input id="category" {...register('category')} /></div>
                <div className="space-y-1.5"><Label htmlFor="sku">SKU</Label><Input id="sku" {...register('sku')} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" {...register('description')} rows={5}/></div>
          </TabsContent>
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="costPrice">Cost Price</Label><Input id="costPrice" type="number" step="0.01" {...register('costPrice')} /></div>
                <div className="space-y-1.5"><Label htmlFor="sellingPrice">Selling Price</Label><Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />{errors.sellingPrice && <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="stockQuantity">Stock Quantity</Label><Input id="stockQuantity" type="number" {...register('stockQuantity')} /></div>
                <div className="space-y-1.5"><Label htmlFor="minStockLevel">Min. Stock Level</Label><Input id="minStockLevel" type="number" {...register('minStockLevel')} /></div>
            </div>
          </TabsContent>
          <TabsContent value="media" className="space-y-4">
             <Controller
                name="imageUrls"
                control={control}
                render={({ field }) => (
                    <ImageManager value={field.value} onChange={field.onChange} />
                )}
            />
            {errors.imageUrls && <p className="text-sm text-destructive">{errors.imageUrls.message}</p>}
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label htmlFor="weight">Weight (kg)</Label><Input id="weight" type="number" step="0.01" {...register('weight')} /></div>
                <div className="space-y-1.5"><Label htmlFor="dimensions">Dimensions (JSON)</Label><Textarea id="dimensions" {...register('dimensions')} placeholder='e.g., {"l":10, "w":10, "h":10}'/>{errors.dimensions && <p className="text-sm text-destructive">{errors.dimensions.message}</p>}</div>
            </div>
             <div className="space-y-1.5"><Label htmlFor="shippingInfo">Shipping Info (JSON)</Label><Textarea id="shippingInfo" {...register('shippingInfo')} placeholder='e.g., {"carrier":"self", "fee":0}'/>{errors.shippingInfo && <p className="text-sm text-destructive">{errors.shippingInfo.message}</p>}</div>
          </TabsContent>
          <TabsContent value="meta" className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="tags">Tags</Label><Textarea id="tags" {...register('tags')} placeholder="Enter tags, separated by commas"/></div>
            <div className="space-y-1.5"><Label htmlFor="supplierInfo">Supplier Info (JSON)</Label><Textarea id="supplierInfo" {...register('supplierInfo')} placeholder='e.g., {"name":"ABC Inc"}'/>{errors.supplierInfo && <p className="text-sm text-destructive">{errors.supplierInfo.message}</p>}</div>
            <div className="flex items-center space-x-2 pt-2"><Controller name="isFeatured" control={control} render={({ field }) => <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="isFeatured">Featured Product</Label></div>
            <div className="flex items-center space-x-2 pt-2"><Controller name="isActive" control={control} render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="isActive">Product is Active</Label></div>
          </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="pt-4 border-t mt-4">
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Product</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}