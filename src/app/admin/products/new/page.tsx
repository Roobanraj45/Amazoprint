'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProduct } from '@/app/actions/product-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
  ImageIcon,
  Library,
  Loader2,
  Package,
  Sparkles,
  Tag,
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

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isImageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('products');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
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
  const nameValue = watch('name');

  const handleNameBlur = () => {
    const currentSlug = watch('slug');
    if (!currentSlug && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createProduct(data);
      toast({
        title: 'Product Created',
        description: `Successfully created "${data.name}". You can now configure its variant blueprints.`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Product',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Navigation Bar */}
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
              <span className="text-slate-800 dark:text-slate-200">New Product</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Create Product Master
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Save Product Container
              </>
            )}
          </Button>
        </div>
      </div>

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
                  Define the product title, URL slug, and storefront categorization.
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
                    onBlur={handleNameBlur}
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
    </div>
  );
}
