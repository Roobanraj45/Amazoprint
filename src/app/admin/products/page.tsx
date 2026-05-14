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
import { Loader2, PlusCircle, Edit, Trash2, ImageIcon, Library, Upload, Check } from 'lucide-react';
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
  isActive: z.boolean().default(true),
  maxPages: z.preprocess((val) => (val === '' || val === null || val === undefined ? 1 : val), z.coerce.number().min(1)),
  spotUvAllowed: z.boolean().default(false),
  allowedFoils: z.array(z.coerce.number()).optional(),
  allowedDieCuts: z.array(z.coerce.number()).optional(),
  unitType: z.enum(['mm', 'inch', 'ft']).optional().default('mm'),
  backSideCost: z.coerce.number().optional().default(0),
});

type Product = Awaited<ReturnType<typeof getProducts>>[0];
type SubProduct = Product['subProducts'][0];
type FoilType = Awaited<ReturnType<typeof getFoilTypes>>[0];
type DieCut = Awaited<ReturnType<typeof getDieCuts>>[0];

type Folder = {
  name: string;
  files: string[];
};

// Main Page Component
export default function ProductsPage() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [foilTypes, setFoilTypes] = useState<FoilType[]>([]);
  const [dieCuts, setDieCuts] = useState<DieCut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, foils, cuts] = await Promise.all([getProducts(), getFoilTypes(), getDieCuts()]);
      setProducts(prods);
      setFoilTypes(foils);
      setDieCuts(cuts);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Dialog open={isProductFormOpen} onOpenChange={(open) => {
            setProductFormOpen(open);
            if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <ProductForm
            onSubmit={handleProductFormSubmit}
            product={editingProduct}
            onClose={() => setProductFormOpen(false)}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {products.map((product) => (
                <AccordionItem value={`product-${product.id}`} key={product.id}>
                  <AccordionTrigger>
                      <div className="flex justify-between w-full items-center pr-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                {product.imageUrl?.trim() ? (
                                    <Image src={resolveImagePath(product.imageUrl.trim())} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <span>{product.name} ({product.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div role="button" className="p-2 hover:bg-accent rounded-md" onClick={(e) => {e.stopPropagation(); handleEditProduct(product);}}>
                                <Edit className="h-4 w-4" />
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                     <div role="button" className="p-2 hover:bg-accent rounded-md"><Trash2 className="h-4 w-4 text-destructive" /></div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the product and all its sub-products.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SubProductsManager product={product} onUpdate={loadData} foilTypes={foilTypes} dieCuts={dieCuts} />
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
    <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
      <DialogHeader className="p-6 pb-4 border-b">
        <DialogTitle>{product ? 'Edit' : 'Add'} Product</DialogTitle>
        <DialogDescription>
          {product ? 'Edit the details of the product.' : 'Add a new product to your catalog.'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" {...register('slug')} />
                        {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" {...register('category')} />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} className="min-h-[100px]" />
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="flex items-center gap-4">
                        {(imageUrl && imageUrl.trim()) ? (
                          <Image src={resolveImagePath(imageUrl)} alt="Current image" width={80} height={80} className="rounded-md object-cover aspect-square bg-muted" />
                        ) : (
                          <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                            <Input 
                                type="text"
                                placeholder="Image URL"
                               {...register('imageUrl')}
                            />
                            <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full">
                                        <Library className="mr-2 h-4 w-4" />
                                        Browse Library
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
                       {errors.imageUrl && <p className="text-destructive text-sm">{errors.imageUrl.message}</p>}
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4">
                         <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="isActive"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>
                </div>
            </div>
            {/* Added spacer to ensure last field isn't cut off */}
            <div className="h-8" />
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// SubProducts Manager Component
function SubProductsManager({ product, onUpdate, foilTypes, dieCuts }: { product: Product; onUpdate: () => void; foilTypes: FoilType[]; dieCuts: DieCut[] }) {
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
    <div className="pl-4 border-l-2 ml-2 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Sizes & Variants</h4>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
            setFormOpen(open);
            if(!open) setEditingSubProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
            </Button>
          </DialogTrigger>
          <SubProductForm
            onSubmit={handleFormSubmit}
            subProduct={editingSubProduct}
            onClose={() => setFormOpen(false)}
            foilTypes={foilTypes}
            dieCuts={dieCuts}
          />
        </Dialog>
      </div>
      
       {product.subProducts.map((sp) => (
        <Card key={sp.id}>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            {sp.imageUrl?.trim() ? (
                                <Image src={resolveImagePath(sp.imageUrl.trim())} alt={sp.name} width={48} height={48} className="rounded-md object-cover" />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-base">{sp.name}</CardTitle>
                            <CardDescription>SKU: {sp.sku || 'N/A'}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(sp)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete the sub-product.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(sp.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 text-sm">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Base Price</Label>
                        <p className="font-bold text-slate-900 dark:text-white text-base">₹{sp.price}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Dimensions</Label>
                        <p className="font-bold">{sp.width} x {sp.height} <span className="text-[10px] text-muted-foreground">{sp.unitType || 'mm'}</span></p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Enhancements</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {sp.spotUvAllowed && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 text-[9px] h-4 font-bold px-1.5">UV</Badge>
                            )}
                            {(sp.allowedFoils?.length ?? 0) > 0 && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 text-[9px] h-4 font-bold px-1.5">FOIL ({sp.allowedFoils?.length})</Badge>
                            )}
                            {(sp.allowedDieCuts?.length ?? 0) > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 text-[9px] h-4 font-bold px-1.5">DIE ({sp.allowedDieCuts?.length})</Badge>
                            )}
                            {!sp.spotUvAllowed && !sp.allowedFoils?.length && !sp.allowedDieCuts?.length && (
                                <span className="text-[10px] text-muted-foreground font-medium italic">No enhancements</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Pages</Label>
                        <p className="font-bold">{sp.maxPages ?? 1} Side{(sp.maxPages ?? 1) > 1 ? 's' : ''}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Back Side</Label>
                        <p className="font-bold">₹{sp.backSideCost || '0.00'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Status</Label>
                        <div>
                            <Badge variant={sp.isActive ? 'default' : 'destructive'} className="h-5 text-[10px] font-bold">
                                {sp.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
       ))}
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
}: {
  onSubmit: (data: z.infer<typeof subProductSchema>) => void;
  subProduct: SubProduct | null;
  onClose: () => void;
  foilTypes: FoilType[];
  dieCuts: DieCut[];
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
  } = useForm<z.infer<typeof subProductSchema>>({
    resolver: zodResolver(subProductSchema),
    defaultValues: { isActive: true, imageUrl: '', spotUvAllowed: false, maxPages: 1, allowedFoils: [], allowedDieCuts: [], dieCutPrices: {}, unitType: 'mm', backSideCost: 0 },
  });
  
  const imageUrl = watch('imageUrl');
  const spotUvAllowed = watch('spotUvAllowed');

  useEffect(() => {
    register('dieCutPrices');
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
          dieCutPrices: (subProduct as any).dieCutPrices || {},
          unitType: subProduct.unitType as any || 'mm',
          backSideCost: Number(subProduct.backSideCost || 0),
      });
    } else {
        reset({
            name: '',
            sku: '',
            price: undefined,
            width: 0,
            height: 0,
            imageUrl: '',
            isActive: true,
            spotUvAllowed: false,
            maxPages: 1,
            allowedFoils: [],
            allowedDieCuts: [],
            dieCutPrices: {},
            unitType: 'mm',
            backSideCost: 0,
        });
    }
  }, [subProduct, reset]);

  return (
     <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
      <DialogHeader className="p-6 pb-4 border-b">
        <DialogTitle>{subProduct ? 'Edit' : 'Add'} Variant / Size</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit((data) => {
          onSubmit({
              ...data,
              dieCutPrices: watch('dieCutPrices') || {}
          });
      })} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="sp-name">Variant Name</Label>
                        <Input id="sp-name" {...register('name')} />
                        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sp-sku">SKU</Label>
                            <Input id="sp-sku" {...register('sku')} />
                        </div>
                        <div>
                            <Label htmlFor="sp-price">Base Price</Label>
                            <Input id="sp-price" type="number" step="0.01" {...register('price')} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="sp-backSideCost">Back Side Cost (Add-on)</Label>
                            <Input id="sp-backSideCost" type="number" step="0.01" placeholder="0.00" {...register('backSideCost')} />
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Extra cost applied per unit if double-sided is selected.</p>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="sp-unitType">Unit Type</Label>
                        <Controller
                            name="unitType"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger id="sp-unitType">
                                        <SelectValue placeholder="Select Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mm">mm</SelectItem>
                                        <SelectItem value="inch">inch</SelectItem>
                                        <SelectItem value="ft">ft</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sp-width">Width</Label>
                            <Input id="sp-width" type="number" step="0.1" {...register('width')} />
                            {errors.width && <p className="text-destructive text-sm">{errors.width.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="sp-height">Height</Label>
                            <Input id="sp-height" type="number" step="0.1" {...register('height')} />
                            {errors.height && <p className="text-destructive text-sm">{errors.height.message}</p>}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="sp-max-pages">Max Pages</Label>
                        <Input id="sp-max-pages" type="number" placeholder="1" {...register('maxPages')} />
                        {errors.maxPages && <p className="text-destructive text-sm">{errors.maxPages.message}</p>}
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="flex items-center gap-4">
                        {(imageUrl && imageUrl.trim()) ? (
                          <Image src={resolveImagePath(imageUrl)} alt="Current image" width={80} height={80} className="rounded-md object-cover aspect-square bg-muted" />
                        ) : (
                          <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                            <Input 
                                type="text"
                                placeholder="Image URL"
                               {...register('imageUrl')}
                            />
                             <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full">
                                        <Library className="mr-2 h-4 w-4" />
                                        Browse Library
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
                       {errors.imageUrl && <p className="text-destructive text-sm">{errors.imageUrl.message}</p>}
                    </div>
                    
                    <div className="pt-4 space-y-4">
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="sp-isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="sp-isActive">Active</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Controller
                                name="spotUvAllowed"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="sp-spotUvAllowed"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="sp-spotUvAllowed">Spot UV Allowed</Label>
                        </div>
                        {spotUvAllowed && (
                            <div className="space-y-2 pl-2">
                                <Label>Allowed Foils</Label>
                                 <Controller
                                    name="allowedFoils"
                                    control={control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            items={foilTypes}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select foils..."
                                        />
                                    )}
                                />
                            </div>
                        )}
                        <div className="space-y-4 pl-2">
                            <Label className="text-sm font-bold">Allowed Die Cuts & Pricing</Label>
                             <Controller
                                name="allowedDieCuts"
                                control={control}
                                render={({ field }) => (
                                    <MultiSelect
                                        items={dieCuts}
                                        selected={field.value || []}
                                        onChange={(newSelected) => {
                                            field.onChange(newSelected);
                                            // Initialize prices for new selections
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
                                        placeholder="Select die cuts..."
                                    />
                                )}
                            />
                            
                            {/* Price configuration for selected die cuts */}
                            {(watch('allowedDieCuts') || []).length > 0 && (
                                <div className="space-y-2 border rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per-card pricing</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(watch('allowedDieCuts') || []).map(id => {
                                            const dc = dieCuts.find(d => d.id === id);
                                            if (!dc) return null;
                                            const currentPrices = watch('dieCutPrices') || {};
                                            return (
                                                <div key={id} className="flex items-center justify-between gap-4 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <span className="text-xs font-bold truncate">{dc.name}</span>
                                                    <div className="flex items-center gap-2 w-24">
                                                        <span className="text-[10px] text-muted-foreground">₹</span>
                                                        <Input 
                                                            type="number" 
                                                            step="0.01" 
                                                            className="h-7 text-xs font-bold px-2"
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
                        </div>
                    </div>
                </div>
             </div>
             {/* Added spacer */}
             <div className="h-8" />
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
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
