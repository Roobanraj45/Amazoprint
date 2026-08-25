'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductById, updateProduct, deleteSubProduct } from '@/app/actions/product-actions';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { MediaLibraryDialog } from '@/components/admin/media-library-dialog';
import { useToast } from '@/hooks/use-toast';
import { resolveImagePath } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  ImageIcon,
  Layers,
  Library,
  Loader2,
  Package,
  PlusCircle,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  basePrice: z.coerce.number().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.productId);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [isImageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('products');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      category: '',
      description: '',
      imageUrl: '',
      isActive: true,
    },
  });

  const imageUrl = watch('imageUrl');

  const loadProduct = useCallback(async () => {
    if (!productId || isNaN(productId)) return;
    setIsLoading(true);
    try {
      const data = await getProductById(productId);
      if (!data) {
        toast({ variant: 'destructive', title: 'Product Not Found', description: 'Could not find the requested product.' });
        router.push('/admin/products');
        return;
      }
      setProductData(data);
      reset({
        name: data.name,
        slug: data.slug,
        category: data.category || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive,
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Loading Product', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [productId, reset, router, toast]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct(productId, data);
      toast({
        title: 'Product Updated',
        description: `Successfully updated "${data.name}".`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Product',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const handleDeleteVariant = async (variantId: number, variantName: string) => {
    try {
      await deleteSubProduct(variantId);
      toast({ title: 'Variant Deleted', description: `Successfully deleted "${variantName}".` });
      await loadProduct();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Deleting Variant', description: error.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/admin/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Products
              </Link>
              <span>/</span>
              <span className="truncate max-w-[200px]">{productData?.name || 'Product'}</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-200">Edit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Edit Product Master
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-2xl font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-5"
          >
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-11 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 px-6 transition-all hover:scale-[1.02]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Core Product Identity
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Update the master product identity, URL slug, and storefront categorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Product Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Premium Business Cards"
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-destructive text-xs font-semibold mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      URL Slug <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="slug"
                      placeholder="e.g. premium-business-cards"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-semibold"
                      {...register('slug')}
                    />
                    {errors.slug && <p className="text-destructive text-xs font-semibold mt-1">{errors.slug.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category Tag
                    </Label>
                    <Input
                      id="category"
                      placeholder="e.g. Business Cards, Marketing, Signage"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                      {...register('category')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Catalog & Overview Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed description, key selling features, paper stocks overview, etc..."
                    className="min-h-[140px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 p-3.5 text-sm font-medium leading-relaxed"
                    {...register('description')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column (1 col) */}
          <div className="space-y-6">
            {/* Media Asset Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Cover Image
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="w-full aspect-video rounded-2xl bg-slate-100 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center">
                  {imageUrl && imageUrl.trim() ? (
                    <Image src={resolveImagePath(imageUrl)} alt="Cover preview" fill className="object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-60" />
                      <p className="text-xs font-semibold">No cover image selected</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="https://... or /uploads/..."
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    {...register('imageUrl')}
                  />
                  {errors.imageUrl && <p className="text-destructive text-xs font-semibold mt-1">{errors.imageUrl.message}</p>}

                  <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors border-slate-200 dark:border-slate-800"
                      >
                        <Library className="mr-2 h-4 w-4" />
                        Browse Media Library
                      </Button>
                    </DialogTrigger>
                    <MediaLibraryDialog
                      folder={currentFolder}
                      setFolder={setCurrentFolder}
                      onSelect={(url) => {
                        setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                        setImageBrowserOpen(false);
                      }}
                    />
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Visibility & Status Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Storefront Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Active Status
                    </Label>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Publish this product catalog item to the live store.
                    </p>
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
      </form>

      {/* Configured Variants Overview Section */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Configured Variants ({productData?.subProducts?.length || 0})
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Physical size blueprints, pricing rules, and finishing options linked to this master product.
            </CardDescription>
          </div>
          <Button
            asChild
            className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
          >
            <Link href={`/admin/products/${productId}/variants/new`}>
              <PlusCircle className="mr-1.5 h-4 w-4" /> Add New Variant
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {(!productData?.subProducts || productData.subProducts.length === 0) ? (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No Variants Configured</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Add physical variations (e.g. Standard, Gloss, Rounded Corners) to allow clients to customize and purchase this product.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-2 h-9 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Link href={`/admin/products/${productId}/variants/new`}>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Create First Variant
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productData.subProducts.map((sp: any) => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-xs">
                      {sp.imageUrl?.trim() ? (
                        <Image src={resolveImagePath(sp.imageUrl.trim())} alt={sp.name} fill className="object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {sp.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-extrabold text-slate-900 dark:text-white">₹{sp.price}</span>
                        <span>•</span>
                        <span>{sp.width}×{sp.height}{sp.unitType || 'mm'}</span>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{sp.deliveryDays || '3-5 Days'} ({sp.minOrderQuantity ?? 100}-{sp.maxOrderQuantity ?? 10000} pcs)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8.5 rounded-xl font-semibold hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                    >
                      <Link href={`/admin/products/${productId}/variants/${sp.id}/edit`}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8.5 w-8.5 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">Delete Variant Blueprint?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm font-medium">
                            This action will permanently delete <span className="font-bold text-slate-900 dark:text-white">{sp.name}</span>. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="h-10 rounded-xl font-bold">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white"
                            onClick={() => handleDeleteVariant(sp.id, sp.name)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
