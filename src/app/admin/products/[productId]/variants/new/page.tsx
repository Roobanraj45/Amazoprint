'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductById, createSubProduct } from '@/app/actions/product-actions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { MediaLibraryDialog } from '@/components/admin/media-library-dialog';
import { MultiSelect } from '@/components/admin/multi-select';
import { useToast } from '@/hooks/use-toast';
import { resolveImagePath } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  ImageIcon,
  Layers,
  Library,
  Loader2,
  PlusCircle,
  Ruler,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Clock,
  PackageCheck,
  Plus,
  PenSquare,
  Upload,
  Trophy,
  Video,
  FileDown,
} from 'lucide-react';

const deliveryTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  estimatedTime: z.string().min(1, 'Estimated time is required'),
  amount: z.coerce.number().min(0).default(0),
  minCount: z.coerce.number().min(1).default(1),
  maxCount: z.coerce.number().min(1).default(100000),
  isActive: z.boolean().default(true),
});

const sampleFileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  fileUrl: z.string().min(1, 'File is required'),
  fileType: z.string().optional().default('PDF'),
  fileSize: z.string().optional().default(''),
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
  dieCutPrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  allowedCardTextures: z.array(z.coerce.number()).optional(),
  cardTexturePrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  unitType: z.enum(['mm', 'inch', 'ft']).optional().default('mm'),
  backSideCost: z.coerce.number().optional().default(0),
  hsnCode: z.string().optional().nullable(),
  minOrderQuantity: z.preprocess((val) => (val === '' || val === null || val === undefined ? 1 : val), z.coerce.number().min(1).default(1)),
  maxOrderQuantity: z.preprocess((val) => (val === '' || val === null || val === undefined ? 100000 : val), z.coerce.number().min(1).default(100000)),
  deliveryDays: z.string().optional().default('3-5 Business Days'),
  deliveryAmount: z.coerce.number().optional().default(0),
  allowDesignerTool: z.boolean().default(true),
  allowFreelancerContest: z.boolean().default(true),
  allowFileUpload: z.boolean().default(true),
  youtubeUrl: z.string().optional().or(z.literal('')),
  sampleFiles: z.array(sampleFileSchema).optional().default([]),
  deliveryTiers: z.array(deliveryTierSchema).optional().default([]),
});

type SubProductFormData = z.infer<typeof subProductSchema>;

export default function NewVariantPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.productId);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [parentProduct, setParentProduct] = useState<any>(null);
  const [foilTypes, setFoilTypes] = useState<any[]>([]);
  const [dieCuts, setDieCuts] = useState<any[]>([]);
  const [cardTextures, setCardTextures] = useState<any[]>([]);

  const [isPrimaryBrowserOpen, setPrimaryBrowserOpen] = useState(false);
  const [isGalleryBrowserOpen, setGalleryBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('products');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
  } = useForm<SubProductFormData>({
    resolver: zodResolver(subProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      hsnCode: '',
      description: '',
      price: undefined,
      width: 0,
      height: 0,
      imageUrl: '',
      imageUrls: [],
      isActive: true,
      spotUvAllowed: false,
      allowDesignerTool: true,
      allowFreelancerContest: true,
      allowFileUpload: true,
      youtubeUrl: '',
      sampleFiles: [],
      maxPages: 1,
      allowedFoils: [],
      allowedDieCuts: [],
      dieCutPrices: {},
      allowedCardTextures: [],
      cardTexturePrices: {},
      unitType: 'mm',
      backSideCost: 0,
      minOrderQuantity: 100,
      maxOrderQuantity: 10000,
      deliveryDays: '3-5 Business Days',
      deliveryAmount: 0,
      deliveryTiers: [],
    },
  });

  const imageUrl = watch('imageUrl');
  const imageUrls = watch('imageUrls') || [];
  const spotUvAllowed = watch('spotUvAllowed');
  const deliveryTiers = watch('deliveryTiers') || [];
  const sampleFiles = watch('sampleFiles') || [];

  const handleSampleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = `${sizeInMb} MB`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'samples');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const updated = [...sampleFiles];
        updated[index] = {
          ...updated[index],
          fileUrl: data.url,
          name: updated[index].name || file.name.replace(/\.[^/.]+$/, ''),
          fileType: ext,
          fileSize: sizeStr,
        };
        setValue('sampleFiles', updated, { shouldDirty: true, shouldValidate: true });
        toast({ title: 'File Uploaded', description: `Uploaded "${file.name}" successfully.` });
      } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: data.error || 'Could not upload file' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Error', description: err.message });
    }
  };

  useEffect(() => {
    register('dieCutPrices');
    register('cardTexturePrices');
    register('deliveryTiers');
  }, [register]);

  const loadData = useCallback(async () => {
    if (!productId || isNaN(productId)) return;
    setIsLoading(true);
    try {
      const [prod, foils, cuts, textures] = await Promise.all([
        getProductById(productId),
        getFoilTypes(),
        getDieCuts(),
        getCardTextures(),
      ]);
      if (!prod) {
        toast({ variant: 'destructive', title: 'Product Not Found', description: 'Could not load parent product.' });
        router.push('/admin/products');
        return;
      }
      setParentProduct(prod);
      setFoilTypes(foils);
      setDieCuts(cuts);
      setCardTextures(textures);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Loading Options', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [productId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addDeliveryTier = () => {
    const newTier = {
      id: 'tier_' + Date.now(),
      name: 'Express Delivery',
      estimatedTime: '24-48 Hours',
      amount: 150,
      minCount: watch('minOrderQuantity') || 100,
      maxCount: watch('maxOrderQuantity') || 5000,
      isActive: true,
    };
    setValue('deliveryTiers', [...deliveryTiers, newTier], { shouldDirty: true });
  };

  const removeDeliveryTier = (index: number) => {
    setValue('deliveryTiers', deliveryTiers.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const updateDeliveryTier = (index: number, key: string, value: any) => {
    const updated = [...deliveryTiers];
    updated[index] = { ...updated[index], [key]: value };
    setValue('deliveryTiers', updated, { shouldDirty: true });
  };

  const onSubmit = async (data: SubProductFormData) => {
    try {
      await createSubProduct({
        ...data,
        productId,
        dieCutPrices: watch('dieCutPrices') || {},
        cardTexturePrices: watch('cardTexturePrices') || {},
        deliveryTiers: watch('deliveryTiers') || [],
      });
      toast({
        title: 'Variant Created',
        description: `Successfully added variant "${data.name}" to ${parentProduct?.name || 'Product'}.`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Variant',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-500">Loading variant configuration blueprint...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
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
              <span className="truncate max-w-[200px]">{parentProduct?.name || 'Product'}</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-200">New Variant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Add New Variant Blueprint
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
                <CheckCircle2 className="mr-2 h-4 w-4" /> Save Variant
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Core Identity, Dimensions, Delivery */}
          <div className="space-y-6">
            {/* Identity & Economics Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Core Identity & Economics
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Specify variant naming, SKU identification, and base unit pricing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Variant Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Standard 300 GSM Matte, Glossy Lamination"
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-destructive text-xs font-semibold mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Variant Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Material specs, paper thickness, finish attributes, recommended use cases..."
                    className="min-h-[80px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 p-3 text-sm font-medium"
                    {...register('description')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      SKU Code
                    </Label>
                    <Input
                      id="sku"
                      placeholder="e.g. BC-300-MATTE"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-semibold"
                      {...register('sku')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hsnCode" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      HSN / SAC Code
                    </Label>
                    <Input
                      id="hsnCode"
                      placeholder="e.g. 49111090"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-semibold"
                      {...register('hsnCode')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Base Price (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">₹</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-11 rounded-xl pl-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold"
                        {...register('price')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label htmlFor="backSideCost" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Back Side Cost (Add-on ₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">₹</span>
                    <Input
                      id="backSideCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-11 rounded-xl pl-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                      {...register('backSideCost')}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Additional cost per piece added automatically when the customer selects 2-sided printing.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Variant Active Status
                    </Label>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Allow customers to order this variant on the storefront.
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

            {/* Delivery & Quantity Configuration Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Delivery & Order Quantity Bounds
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-[10px] font-bold">
                    Turnaround & Limits
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Define delivery timelines, standard shipping charges, minimum/maximum piece counts, and express shipping tiers.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Min Order Count (Pieces) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      placeholder="100"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold"
                      {...register('minOrderQuantity')}
                    />
                    {errors.minOrderQuantity && <p className="text-destructive text-xs font-semibold mt-1">{errors.minOrderQuantity.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxOrderQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Max Order Count (Pieces) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="maxOrderQuantity"
                      type="number"
                      placeholder="10000"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold"
                      {...register('maxOrderQuantity')}
                    />
                    {errors.maxOrderQuantity && <p className="text-destructive text-xs font-semibold mt-1">{errors.maxOrderQuantity.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDays" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Standard Delivery Time
                    </Label>
                    <Input
                      id="deliveryDays"
                      placeholder="e.g. 3-5 Business Days, 48 Hours"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                      {...register('deliveryDays')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAmount" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Standard Delivery Fee (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">₹</span>
                      <Input
                        id="deliveryAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-11 rounded-xl pl-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold"
                        {...register('deliveryAmount')}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Tier Speed Delivery Options */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Expedited / Multi-Speed Shipping Tiers ({deliveryTiers.length})
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Add optional delivery tiers like Express Air or Rush Delivery with customized turnaround and price overrides.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDeliveryTier}
                      className="h-8.5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Tier
                    </Button>
                  </div>

                  <div className="space-y-3 pt-1">
                    {deliveryTiers.map((tier, idx) => (
                      <div
                        key={tier.id || idx}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 relative group"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Tier #{idx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDeliveryTier(idx)}
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Tier Name</Label>
                            <Input
                              value={tier.name}
                              placeholder="e.g. Express Air"
                              onChange={(e) => updateDeliveryTier(idx, 'name', e.target.value)}
                              className="h-9 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Turnaround</Label>
                            <Input
                              value={tier.estimatedTime}
                              placeholder="e.g. 24-48 Hours"
                              onChange={(e) => updateDeliveryTier(idx, 'estimatedTime', e.target.value)}
                              className="h-9 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Fee (₹)</Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={tier.amount}
                                onChange={(e) => updateDeliveryTier(idx, 'amount', parseFloat(e.target.value) || 0)}
                                className="h-9 text-xs font-bold pl-6 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Min Count</Label>
                            <Input
                              type="number"
                              value={tier.minCount}
                              onChange={(e) => updateDeliveryTier(idx, 'minCount', parseInt(e.target.value) || 1)}
                              className="h-8 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Max Count</Label>
                            <Input
                              type="number"
                              value={tier.maxCount}
                              onChange={(e) => updateDeliveryTier(idx, 'maxCount', parseInt(e.target.value) || 10000)}
                              className="h-8 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Blueprint Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Physical Blueprint & Dimensions
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="unitType" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Measurement Unit
                  </Label>
                  <Controller
                    name="unitType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="unitType" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold">
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
                    <Label htmlFor="width" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Width
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                      {...register('width')}
                    />
                    {errors.width && <p className="text-destructive text-xs font-semibold mt-1">{errors.width.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Height
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                      {...register('height')}
                    />
                    {errors.height && <p className="text-destructive text-xs font-semibold mt-1">{errors.height.message}</p>}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label htmlFor="maxPages" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Max Configurable Sides / Pages
                  </Label>
                  <Input
                    id="maxPages"
                    type="number"
                    placeholder="1"
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold"
                    {...register('maxPages')}
                  />
                  {errors.maxPages && <p className="text-destructive text-xs font-semibold mt-1">{errors.maxPages.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Media Gallery & Print Enhancements */}
          <div className="space-y-6">
            {/* Media Gallery */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Variant Media Gallery
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Primary Display Image */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Primary Variant Image
                  </Label>
                  <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {imageUrl && imageUrl.trim() ? (
                      <div className="relative w-18 h-18 rounded-xl overflow-hidden border shadow-xs flex-shrink-0 bg-white">
                        <Image src={resolveImagePath(imageUrl)} alt="Primary image" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-18 h-18 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-dashed border-slate-300 dark:border-slate-700">
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
                      <Dialog open={isPrimaryBrowserOpen} onOpenChange={setPrimaryBrowserOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8.5 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-800"
                          >
                            <Library className="mr-2 h-3.5 w-3.5" />
                            Browse Media Library
                          </Button>
                        </DialogTrigger>
                        <MediaLibraryDialog
                          folder={currentFolder}
                          setFolder={setCurrentFolder}
                          onSelect={(url) => {
                            setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                            setPrimaryBrowserOpen(false);
                          }}
                        />
                      </Dialog>
                    </div>
                  </div>
                </div>

                {/* Additional Supporting Images */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Additional Gallery Images ({imageUrls.length})
                    </Label>
                    <Dialog open={isGalleryBrowserOpen} onOpenChange={setGalleryBrowserOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Image
                        </Button>
                      </DialogTrigger>
                      <MediaLibraryDialog
                        folder={currentFolder}
                        setFolder={setCurrentFolder}
                        onSelect={(url) => {
                          setValue('imageUrls', [...imageUrls, url], { shouldDirty: true, shouldValidate: true });
                          setGalleryBrowserOpen(false);
                        }}
                      />
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-1">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-square shadow-xs"
                      >
                        <Image src={resolveImagePath(url)} alt={`Gallery ${idx}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px]">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-full shadow-lg hover:scale-105 transition-transform"
                            onClick={() => {
                              setValue('imageUrls', imageUrls.filter((_, i) => i !== idx), { shouldDirty: true });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {imageUrls.length === 0 && (
                      <div className="col-span-4 py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-1.5">
                        <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-semibold text-slate-400">No additional photos uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allowed Design Creation Pathways Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <PenSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Allowed Design Creation Pathways
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Choose which design creation workflows are enabled for customers selecting this size variant.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* 1. Designer Tool Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowDesignerTool" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <PenSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Online Designer Tool
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Allow customers to create and customize artwork directly in the interactive canvas editor.
                    </p>
                  </div>
                  <Controller
                    name="allowDesignerTool"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="allowDesignerTool"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                    )}
                  />
                </div>

                {/* 2. File Upload Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowFileUpload" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> File Upload / Upload Artwork
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Allow customers to upload their own print-ready files (PDF, PNG, JPG, AI).
                    </p>
                  </div>
                  <Controller
                    name="allowFileUpload"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="allowFileUpload"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                    )}
                  />
                </div>

                {/* 3. Freelancer Contest Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowFreelancerContest" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" /> Freelancers Contest / Hire Designer
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Allow customers to start a design contest and hire community freelance designers.
                    </p>
                  </div>
                  <Controller
                    name="allowFreelancerContest"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="allowFreelancerContest"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-pink-600"
                      />
                    )}
                  />
                </div>

                {/* 4. YouTube Video Tutorial Link */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Label htmlFor="youtubeUrl" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-red-500" /> YouTube Video Tutorial Link (Optional)
                  </Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-red-500 text-xs font-medium"
                    {...register('youtubeUrl')}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Provide a YouTube video tutorial specifically for this variant. If left empty, the parent product's tutorial will be used as fallback.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Downloadable Sample & Guideline Files Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Downloadable Sample & Guideline Files ({sampleFiles.length})
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Upload sample starter templates (PDF, PSD, AI, CDR, ZIP) that customers can download on the product page.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('sampleFiles', [
                      ...sampleFiles,
                      { id: `sample-${Date.now()}`, name: '', fileUrl: '', fileType: 'PDF', fileSize: '' }
                    ], { shouldDirty: true });
                  }}
                  className="h-8 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Sample File
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {sampleFiles.length === 0 ? (
                  <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
                    <FileDown className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-semibold text-slate-500">No sample files attached yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      Click &quot;Add Sample File&quot; above to provide downloadable guideline files or starter templates for this variant.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sampleFiles.map((fileItem, idx) => (
                      <div
                        key={fileItem.id || idx}
                        className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] flex items-center justify-center font-black">
                              {idx + 1}
                            </span>
                            Sample File #{idx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setValue('sampleFiles', sampleFiles.filter((_, i) => i !== idx), { shouldDirty: true });
                            }}
                            className="h-7 px-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          {/* Display Name */}
                          <div className="sm:col-span-5 space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Display Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g. Photoshop PSD Bleed Template"
                              value={fileItem.name}
                              onChange={(e) => {
                                const updated = [...sampleFiles];
                                updated[idx].name = e.target.value;
                                setValue('sampleFiles', updated, { shouldDirty: true });
                              }}
                              className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                            />
                          </div>

                          {/* File Type Badge / Format */}
                          <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Format
                            </Label>
                            <Input
                              placeholder="e.g. PSD, PDF"
                              value={fileItem.fileType || ''}
                              onChange={(e) => {
                                const updated = [...sampleFiles];
                                updated[idx].fileType = e.target.value.toUpperCase();
                                setValue('sampleFiles', updated, { shouldDirty: true });
                              }}
                              className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-center"
                            />
                          </div>

                          {/* File Upload / URL */}
                          <div className="sm:col-span-5 space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              File Upload or URL <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="/uploads/samples/... or https://..."
                                value={fileItem.fileUrl}
                                onChange={(e) => {
                                  const updated = [...sampleFiles];
                                  updated[idx].fileUrl = e.target.value;
                                  setValue('sampleFiles', updated, { shouldDirty: true });
                                }}
                                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono"
                              />
                              <label className="cursor-pointer inline-flex items-center justify-center h-10 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 font-bold text-xs shrink-0 border border-indigo-200 dark:border-indigo-800 transition-colors">
                                <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleSampleFileUpload(idx, e)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {fileItem.fileUrl && (
                          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-medium">
                            <span className="truncate max-w-[350px]">Link: {fileItem.fileUrl}</span>
                            {fileItem.fileSize && <span className="font-semibold text-slate-700 dark:text-slate-300">Size: {fileItem.fileSize}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Print Enhancements Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Print Enhancements & Overrides
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Spot UV Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="spotUvAllowed" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Spot UV Option
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enable raised gloss accent finishes on this size variant.
                    </p>
                  </div>
                  <Controller
                    name="spotUvAllowed"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="spotUvAllowed"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                    )}
                  />
                </div>

                {/* Foils */}
                {spotUvAllowed && (
                  <div className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                    <Label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                      Allowed Foil Finishes
                    </Label>
                    <Controller
                      name="allowedFoils"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          items={foilTypes}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Select allowed metallic foils..."
                        />
                      )}
                    />
                  </div>
                )}

                {/* Die Cuts with Custom Price Overrides */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Allowed Die Cuts & Price Overrides
                  </Label>
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
                          newSelected.forEach((id) => {
                            if (newPrices[id] === undefined) {
                              const dc = dieCuts.find((d) => d.id === id);
                              newPrices[id] = Number(dc?.amount || 0);
                            }
                          });
                          setValue('dieCutPrices', newPrices, { shouldDirty: true });
                        }}
                        placeholder="Select die-cut shape options..."
                      />
                    )}
                  />

                  {(watch('allowedDieCuts') || []).length > 0 && (
                    <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Per-card Die-Cut Price Override
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {(watch('allowedDieCuts') || []).map((id) => {
                          const dc = dieCuts.find((d) => d.id === id);
                          if (!dc) return null;
                          const currentPrices = watch('dieCutPrices') || {};
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-4 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800"
                            >
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                {dc.name}
                              </span>
                              <div className="flex items-center gap-2 w-28">
                                <span className="text-[11px] text-muted-foreground font-bold">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-8 text-xs font-bold px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                  value={currentPrices[id] ?? Number(dc.amount || 0)}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setValue('dieCutPrices', { ...currentPrices, [id]: val }, { shouldDirty: true });
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

                {/* Card Textures with Custom Price Overrides */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Allowed Card Textures & Price Overrides
                  </Label>
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
                          newSelected.forEach((id) => {
                            if (newPrices[id] === undefined) {
                              const ct = cardTextures.find((c) => c.id === id);
                              newPrices[id] = Number(ct?.amount || 0);
                            }
                          });
                          setValue('cardTexturePrices', newPrices, { shouldDirty: true });
                        }}
                        placeholder="Select specialty paper textures..."
                      />
                    )}
                  />

                  {(watch('allowedCardTextures') || []).length > 0 && (
                    <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Per-card Texture Price Override
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {(watch('allowedCardTextures') || []).map((id) => {
                          const ct = cardTextures.find((c) => c.id === id);
                          if (!ct) return null;
                          const currentPrices = watch('cardTexturePrices') || {};
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-4 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800"
                            >
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                                {ct.name}
                              </span>
                              <div className="flex items-center gap-2 w-28">
                                <span className="text-[11px] text-muted-foreground font-bold">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-8 text-xs font-bold px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                  value={currentPrices[id] ?? Number(ct.amount || 0)}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setValue('cardTexturePrices', { ...currentPrices, [id]: val }, { shouldDirty: true });
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
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
