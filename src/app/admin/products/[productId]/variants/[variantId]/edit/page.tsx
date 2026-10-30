'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductById, getSubProductById, updateSubProduct } from '@/app/actions/product-actions';
import { getFoilTypes } from '@/app/actions/foil-actions';
import { getDieCuts } from '@/app/actions/die-cut-actions';
import { getCardTextures } from '@/app/actions/card-texture-actions';
import { getCustomAddons } from '@/app/actions/custom-addon-actions';
import { CustomAddonSectionsBuilder } from '@/components/admin/custom-addon-sections-builder';
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
import { resolveImagePath, cn } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  ImageIcon,
  Loader2,
  Ruler,
  Sparkles,
  Trash2,
  Truck,
  Plus,
  PenSquare,
  Upload,
  Trophy,
  Video,
  FileDown,
  Coins,
  Copy,
  CloudUpload,
  Cloud,
  LayoutGrid,
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

const taxSlabSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tax name is required'),
  rate: z.coerce.number().min(0, 'Tax rate must be non-negative'),
  type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  isInclusive: z.boolean().optional().default(false),
  isActive: z.boolean().default(true),
});

const sizeVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Size name is required'),
  width: z.coerce.number().min(0, 'Width must be non-negative'),
  height: z.coerce.number().min(0, 'Height must be non-negative'),
  unit: z.enum(['mm', 'inch', 'ft', 'cm', 'px']).optional().default('mm'),
  priceAdjustment: z.coerce.number().optional().default(0),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().default(true),
});

const priceSlabSchema = z.object({
  id: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
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
  dieCutPrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  allowedCardTextures: z.array(z.coerce.number()).optional(),
  cardTexturePrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  allowedCustomAddons: z.array(z.coerce.number()).optional(),
  customAddonPrices: z.record(z.string(), z.coerce.number()).optional().default({}),
  customAddonSections: z.array(z.any()).optional().default([]),
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
  taxSlabs: z.array(taxSlabSchema).optional().default([]),
  sizes: z.array(sizeVariantSchema).optional().default([]),
  priceSlabs: z.array(priceSlabSchema).optional().default([]),
});

type SubProductFormData = z.infer<typeof subProductSchema>;

type SectionTab = 'basic' | 'prices' | 'sizes' | 'finishes' | 'delivery' | 'all';

export default function EditVariantPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.productId);
  const variantId = Number(params.variantId);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [parentProduct, setParentProduct] = useState<any>(null);
  const [foilTypes, setFoilTypes] = useState<any[]>([]);
  const [dieCuts, setDieCuts] = useState<any[]>([]);
  const [cardTextures, setCardTextures] = useState<any[]>([]);
  const [customAddons, setCustomAddons] = useState<any[]>([]);

  // Clean Tab Selector
  const [activeTab, setActiveTab] = useState<SectionTab>('basic');

  const [isPrimaryBrowserOpen, setPrimaryBrowserOpen] = useState(false);
  const [isGalleryBrowserOpen, setGalleryBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('products');
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
    reset,
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
      taxSlabs: [],
      maxPages: 1,
      allowedFoils: [],
      allowedDieCuts: [],
      dieCutPrices: {},
      allowedCardTextures: [],
      cardTexturePrices: {},
      allowedCustomAddons: [],
      customAddonPrices: {},
      customAddonSections: [],
      unitType: 'mm',
      backSideCost: 0,
      minOrderQuantity: 100,
      maxOrderQuantity: 10000,
      deliveryDays: '3-5 Business Days',
      deliveryAmount: 0,
      deliveryTiers: [],
      sizes: [],
      priceSlabs: [],
    },
  });

  const watchName = watch('name');
  const watchPrice = watch('price');
  const watchIsActive = watch('isActive');
  const imageUrl = watch('imageUrl');
  const imageUrls = watch('imageUrls') || [];
  const spotUvAllowed = watch('spotUvAllowed');
  const deliveryTiers = watch('deliveryTiers') || [];
  const sampleFiles = watch('sampleFiles') || [];
  const taxSlabs = watch('taxSlabs') || [];
  const sizes = watch('sizes') || [];
  const priceSlabs = watch('priceSlabs') || [];
  const unitType = watch('unitType') || 'mm';
  const width = watch('width') || 0;
  const height = watch('height') || 0;
  const maxPages = watch('maxPages') ?? 1;

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

  const handleDirectPrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPrimary(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setValue('imageUrl', data.url, { shouldDirty: true, shouldValidate: true });
        toast({
          title: 'Image Uploaded',
          description: 'Primary cover image saved successfully.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: data.error || 'Failed to upload image' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Error', description: err.message });
    } finally {
      setIsUploadingPrimary(false);
      e.target.value = '';
    }
  };

  const handleDirectGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGallery(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setValue('imageUrls', [...imageUrls, data.url], { shouldDirty: true, shouldValidate: true });
        toast({
          title: 'Gallery Image Added',
          description: 'Image added to sub-product gallery.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: data.error || 'Failed to upload image' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Error', description: err.message });
    } finally {
      setIsUploadingGallery(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    register('dieCutPrices');
    register('cardTexturePrices');
    register('customAddonPrices');
    register('customAddonSections');
    register('deliveryTiers');
  }, [register]);

  const loadData = useCallback(async () => {
    if (!productId || !variantId || isNaN(productId) || isNaN(variantId)) return;
    setIsLoading(true);
    try {
      const [prod, variant, foils, cuts, textures, addons] = await Promise.all([
        getProductById(productId),
        getSubProductById(variantId),
        getFoilTypes(),
        getDieCuts(),
        getCardTextures(),
        getCustomAddons(),
      ]);

      if (!variant) {
        toast({ variant: 'destructive', title: 'Sub-Product Not Found', description: 'Could not find the requested sub-product.' });
        router.push('/admin/products');
        return;
      }

      setParentProduct(prod);
      setFoilTypes(foils);
      setDieCuts(cuts);
      setCardTextures(textures);
      setCustomAddons(addons);

      reset({
        name: variant.name,
        sku: variant.sku || '',
        hsnCode: (variant as any).hsnCode || '',
        description: variant.description || '',
        price: Number(variant.price),
        width: Number(variant.width),
        height: Number(variant.height),
        imageUrl: variant.imageUrl || '',
        imageUrls: variant.imageUrls || [],
        isActive: variant.isActive,
        spotUvAllowed: variant.spotUvAllowed,
        allowDesignerTool: (variant as any).allowDesignerTool ?? true,
        allowFreelancerContest: (variant as any).allowFreelancerContest ?? true,
        allowFileUpload: (variant as any).allowFileUpload ?? true,
        youtubeUrl: (variant as any).youtubeUrl || '',
        sampleFiles: (variant as any).sampleFiles || [],
        maxPages: variant.maxPages ?? 1,
        allowedFoils: variant.allowedFoils || [],
        allowedDieCuts: variant.allowedDieCuts || [],
        dieCutPrices: (variant as any).dieCutPrices || {},
        allowedCardTextures: variant.allowedCardTextures || [],
        cardTexturePrices: (variant as any).cardTexturePrices || {},
        allowedCustomAddons: (variant as any).allowedCustomAddons || [],
        customAddonPrices: (variant as any).customAddonPrices || {},
        customAddonSections: (variant as any).customAddonSections || (variant as any).custom_addon_sections || [],
        unitType: (variant.unitType as any) || 'mm',
        backSideCost: Number(variant.backSideCost || 0),
        minOrderQuantity: (variant as any).minOrderQuantity ?? 100,
        maxOrderQuantity: (variant as any).maxOrderQuantity ?? 10000,
        deliveryDays: (variant as any).deliveryDays || '3-5 Business Days',
        deliveryAmount: Number((variant as any).deliveryAmount || 0),
        deliveryTiers: (variant as any).deliveryTiers || [],
        taxSlabs: (variant as any).taxSlabs || [],
        sizes: (variant as any).sizes || [],
        priceSlabs: (variant as any).priceSlabs || [],
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Loading Data', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [productId, variantId, reset, router, toast]);

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

  const onInvalid = (validationErrors: any) => {
    console.error('Sub-product form validation errors:', validationErrors);
    const fields = Object.keys(validationErrors);
    toast({
      variant: 'destructive',
      title: 'Missing Required Fields',
      description: `Please verify: ${fields.join(', ')}`,
    });
  };

  const onSubmit = async (data: SubProductFormData) => {
    try {
      await updateSubProduct(variantId, {
        ...data,
        dieCutPrices: watch('dieCutPrices') || {},
        cardTexturePrices: watch('cardTexturePrices') || {},
        deliveryTiers: watch('deliveryTiers') || [],
        priceSlabs: watch('priceSlabs') || [],
        customAddonSections: watch('customAddonSections') || [],
      });
      toast({
        title: 'Changes Saved',
        description: `Sub-product "${data.name}" updated successfully.`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Changes',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-slate-500">Loading sub-product details...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'basic' as SectionTab, label: 'Basic Info & Photos', icon: FileText },
    { id: 'prices' as SectionTab, label: 'Pricing & Slabs', icon: DollarSign },
    { id: 'sizes' as SectionTab, label: 'Dimensions & Sizes', icon: Ruler },
    { id: 'finishes' as SectionTab, label: 'Finishes & Add-ons', icon: Sparkles },
    { id: 'delivery' as SectionTab, label: 'Delivery & Settings', icon: Truck },
    { id: 'all' as SectionTab, label: 'All Sections', icon: LayoutGrid },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* ── TOP UNIFIED HEADER BAR (SEAMLESSLY DOCKED, NOT FLOATING) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Main Bar */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 shrink-0"
            >
              <Link href="/admin/products" title="Back to Products">
                <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </Link>
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/admin/products" className="hover:text-indigo-600 transition-colors">Products</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{parentProduct?.name || 'Product'}</span>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Sub-Product #{variantId}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {watchName || 'Edit Sub-Product'}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-end md:self-center">
            {/* Active Switch */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className={cn(
                "text-xs font-semibold",
                watchIsActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
              )}>
                {watchIsActive ? 'Active' : 'Inactive'}
              </span>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-600 scale-90"
                  />
                )}
              />
            </div>

            <Button
              asChild
              variant="outline"
              className="h-9 rounded-xl font-medium border-slate-200 dark:border-slate-800 text-xs px-4"
            >
              <Link href="/admin/products">Cancel</Link>
            </Button>

            <Button
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isSubmitting}
              className="h-9 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs px-5 text-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Clean Docked Tabs (Integrated into Header, Flush Border) */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 px-3 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/90 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FORM CONTAINER ── */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: BASIC INFO & PHOTOS                                   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'basic') && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/40 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Basic Information & Photos
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                General sub-product title, inventory SKU, HSN tax classification, description, and images.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {/* Title, SKU, HSN */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-12 space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sub-Product Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Premium 350 GSM Matte Lamination"
                    className="h-10 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-sm"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-rose-500 text-xs font-medium mt-1">{errors.name.message}</p>}
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label htmlFor="sku" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SKU Code
                  </Label>
                  <Input
                    id="sku"
                    placeholder="e.g. BC-350-MATTE"
                    className="h-10 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs uppercase"
                    {...register('sku')}
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label htmlFor="hsnCode" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    HSN / SAC Code
                  </Label>
                  <Input
                    id="hsnCode"
                    placeholder="e.g. 49111090"
                    className="h-10 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
                    {...register('hsnCode')}
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxPages" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-indigo-600" /> No. of Pages / Sides
                    </Label>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {maxPages <= 1 ? '1 Page (Single)' : maxPages === 2 ? '2 Pages (Front & Back)' : `${maxPages} Pages`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="maxPages"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      className="h-10 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold text-xs"
                      {...register('maxPages', { valueAsNumber: true })}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setValue('maxPages', 1, { shouldDirty: true, shouldValidate: true })}
                        className={cn(
                          "h-10 px-2.5 rounded-xl border text-[11px] font-bold transition-all",
                          maxPages === 1
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        )}
                        title="1 Page - Single Sided"
                      >
                        1P
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('maxPages', 2, { shouldDirty: true, shouldValidate: true })}
                        className={cn(
                          "h-10 px-2.5 rounded-xl border text-[11px] font-bold transition-all",
                          maxPages === 2
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        )}
                        title="2 Pages - Front & Back (Double Sided)"
                      >
                        2P
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description & Specifications
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Material specs, GSM paper thickness, finish attributes, and ideal applications..."
                    className="rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-medium"
                    {...register('description')}
                  />
                </div>
              </div>

              {/* Photos Section */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <Label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" /> Sub-Product Images
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Primary Cover Image */}
                  <div className="md:col-span-5 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Primary Cover Image
                      </span>
                      {imageUrl?.includes('firebasestorage.googleapis.com') ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          <Cloud className="w-3 h-3 mr-1 text-amber-500" /> Firebase
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                          Storefront
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {imageUrl && imageUrl.trim() ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shrink-0">
                          <Image src={resolveImagePath(imageUrl)} alt="Primary image" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 shrink-0">
                          <ImageIcon className="h-5 w-5 mb-0.5" />
                          <span className="text-[9px] font-medium">No Image</span>
                        </div>
                      )}

                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <label className={cn(
                            "cursor-pointer inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold border transition-colors",
                            isUploadingPrimary
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                          )}>
                            {isUploadingPrimary ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading...
                              </>
                            ) : (
                              <>
                                <CloudUpload className="mr-1 h-3 w-3" /> Upload Photo
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingPrimary}
                              onChange={handleDirectPrimaryUpload}
                            />
                          </label>

                          <Dialog open={isPrimaryBrowserOpen} onOpenChange={setPrimaryBrowserOpen}>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg text-xs font-medium border-slate-200 dark:border-slate-800"
                              >
                                Media Library
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

                    <div className="flex items-center gap-1.5 pt-1">
                      <Input
                        type="text"
                        placeholder="Image URL link..."
                        className="h-8 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px] font-mono"
                        {...register('imageUrl')}
                      />
                      {imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 shrink-0"
                          onClick={() => setValue('imageUrl', '', { shouldDirty: true })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Supporting Gallery Images */}
                  <div className="md:col-span-7 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Gallery Photos ({imageUrls.length})
                      </span>

                      <div className="flex items-center gap-2">
                        <label className={cn(
                          "cursor-pointer inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors",
                          isUploadingGallery
                            ? "bg-slate-100 text-slate-400 border-slate-200"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                        )}>
                          {isUploadingGallery ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Plus className="mr-1 h-3 w-3" /> Add Photo
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingGallery}
                            onChange={handleDirectGalleryUpload}
                          />
                        </label>

                        <Dialog open={isGalleryBrowserOpen} onOpenChange={setGalleryBrowserOpen}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-xs font-medium border-slate-200 dark:border-slate-800"
                            >
                              Media Library
                            </Button>
                          </DialogTrigger>
                          <MediaLibraryDialog
                            folder={currentFolder}
                            setFolder={setCurrentFolder}
                            onSelect={(url) => {
                              setValue('imageUrls', [...imageUrls, url], { shouldDirty: true });
                              setGalleryBrowserOpen(false);
                            }}
                          />
                        </Dialog>
                      </div>
                    </div>

                    {imageUrls.length === 0 ? (
                      <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 gap-1">
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                        <span className="text-xs">No gallery photos added yet</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {imageUrls.map((url, idx) => (
                          <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                            <Image src={resolveImagePath(url)} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setValue('imageUrls', imageUrls.filter((_, i) => i !== idx), { shouldDirty: true })}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: PRICING & QUANTITY SLABS                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'prices') && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/40 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Pricing, Slabs & Taxes
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Base piece pricing, double-sided printing surcharges, quantity package slabs, and GST mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {/* Base Price & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Base Unit Price (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-10 rounded-xl pl-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-base"
                      {...register('price')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    GST Tax Rate
                  </Label>
                  <Select
                    value={taxSlabs[0]?.rate?.toString() || '18'}
                    onValueChange={(val) => {
                      const num = Number(val);
                      const updated = taxSlabs.length > 0 ? [...taxSlabs] : [{ id: 'tax-1', name: 'GST', rate: 18, isInclusive: false, isActive: true }];
                      updated[0] = { ...updated[0], rate: num, name: num === 0 ? 'Exempt' : `GST ${num}%` };
                      setValue('taxSlabs', updated, { shouldDirty: true });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18">GST 18% (Standard Print)</SelectItem>
                      <SelectItem value="12">GST 12%</SelectItem>
                      <SelectItem value="5">GST 5%</SelectItem>
                      <SelectItem value="28">GST 28%</SelectItem>
                      <SelectItem value="0">Exempt 0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tax Application
                  </Label>
                  <Select
                    value={taxSlabs[0]?.isInclusive ? 'inclusive' : 'exclusive'}
                    onValueChange={(val) => {
                      const isInc = val === 'inclusive';
                      const updated = taxSlabs.length > 0 ? [...taxSlabs] : [{ id: 'tax-1', name: 'GST', rate: 18, isInclusive: false, isActive: true }];
                      updated[0] = { ...updated[0], isInclusive: isInc };
                      setValue('taxSlabs', updated, { shouldDirty: true });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Exclusive (+ Tax added extra)</SelectItem>
                      <SelectItem value="inclusive">Inclusive (Tax included in price)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* No. of Pages & Printing Sides Configuration */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-indigo-600" /> No. of Pages & Printing Sides Configuration
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Configure printable pages count (single side, double side, or multi-page) and back-side surcharge.</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs px-2.5 py-0.5 font-semibold",
                    maxPages > 1 ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {maxPages <= 1 ? '1 Page · Single Sided' : maxPages === 2 ? '2 Pages · Double Sided' : `${maxPages} Pages · Multi-Page`}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
                  <div className="md:col-span-8 grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setValue('maxPages', 1, { shouldDirty: true, shouldValidate: true })}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        maxPages === 1
                          ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-xs ring-1 ring-indigo-500/30"
                          : "border-slate-200 dark:border-slate-800 bg-white/60 hover:border-slate-300"
                      )}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">1 Page (Single)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Front print only</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValue('maxPages', 2, { shouldDirty: true, shouldValidate: true })}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        maxPages === 2
                          ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-xs ring-1 ring-indigo-500/30"
                          : "border-slate-200 dark:border-slate-800 bg-white/60 hover:border-slate-300"
                      )}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">2 Pages (Double)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Front & back sides</p>
                    </button>

                    <div className={cn(
                      "p-2.5 rounded-xl border transition-all flex flex-col justify-between",
                      maxPages > 2
                        ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-xs ring-1 ring-indigo-500/30"
                        : "border-slate-200 dark:border-slate-800 bg-white/60"
                    )}>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white block">Custom Pages</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="4"
                          value={maxPages}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setValue('maxPages', val, { shouldDirty: true, shouldValidate: true });
                          }}
                          className="h-7 text-xs font-bold px-2"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">pgs</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <Label htmlFor="backSideCost" className={cn(
                      "text-xs font-semibold flex items-center justify-between",
                      maxPages > 1 ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
                    )}>
                      <span>Back-Side Surcharge (₹)</span>
                      {maxPages > 1 && <span className="text-[10px] text-indigo-600 font-medium">per piece</span>}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                      <Input
                        id="backSideCost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={maxPages <= 1}
                        className={cn(
                          "h-10 rounded-xl pl-8 font-semibold",
                          maxPages > 1 ? "bg-white dark:bg-slate-900" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                        {...register('backSideCost')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Price Slabs Table */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-600" /> Quantity Price Slabs ({priceSlabs.length})
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Fixed bundle pricing for defined order quantities.</p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentSlabs = watch('priceSlabs') || [];
                      const nextQty = currentSlabs.length === 0 ? 100 : (Number(currentSlabs[currentSlabs.length - 1].quantity) * 2);
                      const nextPrice = currentSlabs.length === 0 ? 200 : (Number(currentSlabs[currentSlabs.length - 1].price) * 1.8);
                      const newSlab = {
                        id: `slab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        quantity: nextQty,
                        price: Math.round(nextPrice),
                        isActive: true,
                      };
                      setValue('priceSlabs', [...currentSlabs, newSlab], { shouldDirty: true });
                    }}
                    className="h-8 rounded-lg text-xs font-semibold border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Slab
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Quick Add:
                  </span>
                  {[
                    { qty: 100, price: 200 },
                    { qty: 250, price: 450 },
                    { qty: 500, price: 800 },
                    { qty: 1000, price: 1400 },
                    { qty: 2500, price: 3200 },
                    { qty: 5000, price: 6000 },
                  ].map((preset) => (
                    <Button
                      key={preset.qty}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentSlabs = watch('priceSlabs') || [];
                        const exists = currentSlabs.some((s: any) => Number(s.quantity) === preset.qty);
                        if (!exists) {
                          setValue('priceSlabs', [
                            ...currentSlabs,
                            {
                              id: `slab-${Date.now()}-${preset.qty}`,
                              quantity: preset.qty,
                              price: preset.price,
                              isActive: true,
                            }
                          ].sort((a: any, b: any) => Number(a.quantity) - Number(b.quantity)), { shouldDirty: true });
                        }
                      }}
                      className="h-6.5 px-2 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 hover:border-amber-500 hover:text-amber-600"
                    >
                      +{preset.qty} Pcs (₹{preset.price})
                    </Button>
                  ))}
                </div>

                {/* Table */}
                {priceSlabs.length === 0 ? (
                  <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 gap-1">
                    <Coins className="w-5 h-5" />
                    <span className="text-xs font-medium">No quantity price slabs configured yet</span>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-950 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <div className="col-span-3">Quantity (Pcs)</div>
                      <div className="col-span-4 sm:col-span-3">Total Price (₹)</div>
                      <div className="col-span-3 sm:col-span-3">Rate / Piece</div>
                      <div className="col-span-1 sm:col-span-2 text-center">Status</div>
                      <div className="col-span-1 text-right">Delete</div>
                    </div>

                    {priceSlabs.map((slabItem: any, idx: number) => {
                      const qtyVal = Number(slabItem.quantity) || 1;
                      const priceVal = Number(slabItem.price) || 0;
                      const unitRate = (priceVal / qtyVal).toFixed(2);

                      return (
                        <div
                          key={slabItem.id || idx}
                          className={cn(
                            "grid grid-cols-12 gap-3 items-center px-4 py-2 transition-colors",
                            slabItem.isActive ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 opacity-60"
                          )}
                        >
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min="1"
                              value={slabItem.quantity}
                              onChange={(e) => {
                                const updated = [...priceSlabs];
                                updated[idx].quantity = parseInt(e.target.value, 10) || 0;
                                setValue('priceSlabs', updated, { shouldDirty: true });
                              }}
                              className="h-8 rounded-lg text-xs font-bold"
                            />
                          </div>

                          <div className="col-span-4 sm:col-span-3 relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={slabItem.price}
                              onChange={(e) => {
                                const updated = [...priceSlabs];
                                updated[idx].price = parseFloat(e.target.value) || 0;
                                setValue('priceSlabs', updated, { shouldDirty: true });
                              }}
                              className="h-8 rounded-lg pl-6 text-xs font-bold text-amber-600 dark:text-amber-400"
                            />
                          </div>

                          <div className="col-span-3 sm:col-span-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                            ≈ ₹{unitRate} / pc
                          </div>

                          <div className="col-span-1 sm:col-span-2 flex items-center justify-center">
                            <Switch
                              checked={slabItem.isActive ?? true}
                              onCheckedChange={(val) => {
                                const updated = [...priceSlabs];
                                updated[idx].isActive = val;
                                setValue('priceSlabs', updated, { shouldDirty: true });
                              }}
                              className="data-[state=checked]:bg-amber-600 scale-90"
                            />
                          </div>

                          <div className="col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setValue('priceSlabs', priceSlabs.filter((_, i) => i !== idx), { shouldDirty: true });
                              }}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: DIMENSIONS & SIZES                                    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'sizes') && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/40 dark:bg-slate-950/40 flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                    Dimensions & Size Variants ({sizes.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Default print dimensions and optional customer size variants with price adjustments.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentSizes = watch('sizes') || [];
                  const newSize = {
                    id: `size-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    name: `Size Option ${currentSizes.length + 1}`,
                    width: Number(watch('width') || 85),
                    height: Number(watch('height') || 55),
                    unit: (watch('unitType') || 'mm') as any,
                    priceAdjustment: 0,
                    isDefault: currentSizes.length === 0,
                    isActive: true,
                  };
                  setValue('sizes', [...currentSizes, newSize], { shouldDirty: true });
                }}
                className="h-8 rounded-lg text-xs font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50 shrink-0"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Size
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">

              {/* Default Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Default Unit</Label>
                  <Controller
                    name="unitType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">Millimeters (mm)</SelectItem>
                          <SelectItem value="inch">Inches (inch)</SelectItem>
                          <SelectItem value="ft">Feet (ft)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Default Width</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    {...register('width')}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Default Height</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-9 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    {...register('height')}
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Popular Presets:
                </span>
                {[
                  { name: 'Standard (85 × 55 mm)', width: 85, height: 55, unit: 'mm' },
                  { name: 'Square (65 × 65 mm)', width: 65, height: 65, unit: 'mm' },
                  { name: 'Slim (90 × 45 mm)', width: 90, height: 45, unit: 'mm' },
                  { name: 'A6 (105 × 148 mm)', width: 105, height: 148, unit: 'mm' },
                  { name: 'A5 (148 × 210 mm)', width: 148, height: 210, unit: 'mm' },
                  { name: 'A4 (210 × 297 mm)', width: 210, height: 297, unit: 'mm' },
                  { name: 'Photo (4 × 6 in)', width: 4, height: 6, unit: 'inch' },
                ].map((preset) => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const currentSizes = watch('sizes') || [];
                      const exists = currentSizes.some((s: any) => s.width === preset.width && s.height === preset.height && s.unit === preset.unit);
                      if (!exists) {
                        setValue('sizes', [
                          ...currentSizes,
                          {
                            id: `size-${Date.now()}-${preset.width}x${preset.height}`,
                            name: preset.name,
                            width: preset.width,
                            height: preset.height,
                            unit: preset.unit as any,
                            priceAdjustment: 0,
                            isDefault: currentSizes.length === 0,
                            isActive: true,
                          }
                        ], { shouldDirty: true });
                      }
                    }}
                    className="h-6.5 px-2 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600"
                  >
                    +{preset.name}
                  </Button>
                ))}
              </div>

              {/* Sizes Table */}
              {sizes.length === 0 ? (
                <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 gap-1">
                  <Ruler className="w-5 h-5" />
                  <span className="text-xs font-medium">Using default dimensions ({width} × {height} {unitType})</span>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-950 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-4">Size Label</div>
                    <div className="col-span-2">Width</div>
                    <div className="col-span-2">Height</div>
                    <div className="col-span-2">Price Adj. (₹)</div>
                    <div className="col-span-1 text-center">Default</div>
                    <div className="col-span-1 text-right">Delete</div>
                  </div>

                  {sizes.map((sizeItem: any, idx: number) => (
                    <div
                      key={sizeItem.id || idx}
                      className={cn(
                        "grid grid-cols-12 gap-3 items-center px-4 py-2 transition-colors",
                        sizeItem.isActive ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 opacity-60"
                      )}
                    >
                      <div className="col-span-4">
                        <Input
                          placeholder="e.g. Standard"
                          value={sizeItem.name}
                          onChange={(e) => {
                            const updated = [...sizes];
                            updated[idx].name = e.target.value;
                            setValue('sizes', updated, { shouldDirty: true });
                          }}
                          className="h-8 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-2 relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={sizeItem.width}
                          onChange={(e) => {
                            const updated = [...sizes];
                            updated[idx].width = parseFloat(e.target.value) || 0;
                            setValue('sizes', updated, { shouldDirty: true });
                          }}
                          className="h-8 rounded-lg pr-7 text-xs font-medium"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 pointer-events-none">
                          {sizeItem.unit || watch('unitType') || 'mm'}
                        </span>
                      </div>

                      <div className="col-span-2 relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={sizeItem.height}
                          onChange={(e) => {
                            const updated = [...sizes];
                            updated[idx].height = parseFloat(e.target.value) || 0;
                            setValue('sizes', updated, { shouldDirty: true });
                          }}
                          className="h-8 rounded-lg pr-7 text-xs font-medium"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 pointer-events-none">
                          {sizeItem.unit || watch('unitType') || 'mm'}
                        </span>
                      </div>

                      <div className="col-span-2 relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={sizeItem.priceAdjustment ?? 0}
                          onChange={(e) => {
                            const updated = [...sizes];
                            updated[idx].priceAdjustment = parseFloat(e.target.value) || 0;
                            setValue('sizes', updated, { shouldDirty: true });
                          }}
                          className="h-8 rounded-lg pl-6 text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        {sizeItem.isDefault ? (
                          <Badge className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5">
                            Default
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = sizes.map((s: any, i: number) => ({
                                ...s,
                                isDefault: i === idx,
                              }));
                              setValue('sizes', updated, { shouldDirty: true });
                            }}
                            className="text-[10px] font-medium text-slate-400 hover:text-indigo-600"
                          >
                            Set
                          </button>
                        )}
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setValue('sizes', sizes.filter((_, i) => i !== idx), { shouldDirty: true });
                          }}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: FINISHES & CUSTOM ADD-ONS                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'finishes') && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/40 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Finishes & Custom Add-ons
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Spot UV varnish, metallic foils, paper textures, die cuts, and custom add-on sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Spot UV & Foils */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <Label htmlFor="spotUvAllowed" className="text-xs font-semibold text-slate-900 dark:text-white block">
                        Spot UV Coating
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Enable raised glossy UV coating option.</p>
                    </div>
                    <Controller
                      name="spotUvAllowed"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="spotUvAllowed"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-indigo-600 scale-90"
                        />
                      )}
                    />
                  </div>

                  {spotUvAllowed && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 space-y-1.5">
                      <Label className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                        Allowed Metallic Foils
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

                  {/* Paper Textures */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Allowed Paper Textures
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
                          placeholder="Select paper textures..."
                        />
                      )}
                    />

                    {(watch('allowedCardTextures') || []).length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Texture Surcharges (₹)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {(watch('allowedCardTextures') || []).map((id) => {
                            const ct = cardTextures.find((c) => c.id === id);
                            if (!ct) return null;
                            const currentPrices = watch('cardTexturePrices') || {};
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                              >
                                <span className="text-xs font-medium truncate">{ct.name}</span>
                                <div className="relative w-16">
                                  <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400 font-bold">₹</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-7 pl-4 text-xs font-semibold"
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
                </div>

                {/* Die Cuts & Catalog Add-ons */}
                <div className="space-y-4">
                  {/* Die Cuts */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Allowed Die Cuts
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
                          placeholder="Select die-cut patterns..."
                        />
                      )}
                    />

                    {(watch('allowedDieCuts') || []).length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Die-Cut Surcharges (₹)
                        </span>
                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                          {(watch('allowedDieCuts') || []).map((id) => {
                            const dc = dieCuts.find((d) => d.id === id);
                            if (!dc) return null;
                            const currentPrices = watch('dieCutPrices') || {};
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                              >
                                <span className="text-xs font-medium truncate">{dc.name}</span>
                                <div className="relative w-16">
                                  <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400 font-bold">₹</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-7 pl-4 text-xs font-semibold"
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

                  {/* Catalog Addons */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Allowed Catalog Add-ons
                      </Label>
                      <Link href="/admin/addons" target="_blank" className="text-xs font-medium text-indigo-600 hover:underline">
                        Manage Add-ons &rarr;
                      </Link>
                    </div>
                    <Controller
                      name="allowedCustomAddons"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          items={customAddons}
                          selected={field.value || []}
                          onChange={(newSelected) => {
                            field.onChange(newSelected);
                            const currentPrices = watch('customAddonPrices') || {};
                            const newPrices = { ...currentPrices };
                            newSelected.forEach((id) => {
                              if (newPrices[id] === undefined) {
                                const ca = customAddons.find((c) => c.id === id);
                                newPrices[id] = Number(ca?.price || 0);
                              }
                            });
                            setValue('customAddonPrices', newPrices, { shouldDirty: true });
                          }}
                          placeholder="Select catalog add-ons..."
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Product Custom Add-on Sections */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                <CustomAddonSectionsBuilder
                  sections={watch('customAddonSections') || []}
                  onChange={(newSections) => setValue('customAddonSections', newSections, { shouldDirty: true })}
                />
              </div>

            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: DELIVERY & ORDER SETTINGS                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'delivery') && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/40 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Delivery & Order Settings
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Order limits, delivery turnaround, shipping tiers, design options, and customer template files.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Quantities & Delivery */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="minOrderQuantity" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Min Quantity <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="minOrderQuantity"
                        type="number"
                        placeholder="100"
                        className="h-10 rounded-xl text-xs font-semibold"
                        {...register('minOrderQuantity')}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="maxOrderQuantity" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Max Quantity <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="maxOrderQuantity"
                        type="number"
                        placeholder="10000"
                        className="h-10 rounded-xl text-xs font-semibold"
                        {...register('maxOrderQuantity')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="deliveryDays" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Turnaround Days
                      </Label>
                      <Input
                        id="deliveryDays"
                        placeholder="3-5 Business Days"
                        className="h-10 rounded-xl text-xs"
                        {...register('deliveryDays')}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="deliveryAmount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Standard Shipping (₹)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                        <Input
                          id="deliveryAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-10 rounded-xl pl-7 text-xs font-semibold"
                          {...register('deliveryAmount')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expedited Tiers */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Expedited Shipping Tiers ({deliveryTiers.length})
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDeliveryTier}
                        className="h-7 rounded-lg text-xs font-medium"
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Tier
                      </Button>
                    </div>

                    {deliveryTiers.map((tier, idx) => (
                      <div
                        key={tier.id || idx}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-600">Tier #{idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDeliveryTier(idx)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={tier.name}
                            placeholder="Name"
                            onChange={(e) => updateDeliveryTier(idx, 'name', e.target.value)}
                            className="h-7 text-xs font-medium"
                          />
                          <Input
                            value={tier.estimatedTime}
                            placeholder="Turnaround"
                            onChange={(e) => updateDeliveryTier(idx, 'estimatedTime', e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={tier.amount}
                            onChange={(e) => updateDeliveryTier(idx, 'amount', parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordering Options & Media */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <Label htmlFor="allowDesignerTool" className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <PenSquare className="w-3.5 h-3.5 text-indigo-600" /> Online Designer Tool
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Allow customers to design directly in browser.</p>
                    </div>
                    <Controller
                      name="allowDesignerTool"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="allowDesignerTool"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-indigo-600 scale-90"
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <Label htmlFor="allowFileUpload" className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" /> Print File Upload
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Allow PDF, AI, PSD, and CDR uploads.</p>
                    </div>
                    <Controller
                      name="allowFileUpload"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="allowFileUpload"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-indigo-600 scale-90"
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <Label htmlFor="allowFreelancerContest" className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-pink-600" /> Freelancer Contest Requests
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Allow graphic design contest requests.</p>
                    </div>
                    <Controller
                      name="allowFreelancerContest"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="allowFreelancerContest"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-pink-600 scale-90"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="youtubeUrl" className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-rose-500" /> Video Guide URL
                    </Label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="h-10 rounded-xl text-xs"
                      {...register('youtubeUrl')}
                    />
                  </div>
                </div>

                {/* Templates Section */}
                <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileDown className="w-4 h-4 text-indigo-600" /> Downloadable Starter Templates ({sampleFiles.length})
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Blank design starter templates for customers (PDF, PSD, AI, CDR).</p>
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
                      className="h-8 rounded-lg text-xs font-medium"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Template
                    </Button>
                  </div>

                  {sampleFiles.length === 0 ? (
                    <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 gap-1">
                      <FileDown className="w-5 h-5" />
                      <span className="text-xs">No starter templates attached</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sampleFiles.map((fileItem, idx) => (
                        <div
                          key={fileItem.id || idx}
                          className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Template #{idx + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setValue('sampleFiles', sampleFiles.filter((_, i) => i !== idx), { shouldDirty: true });
                              }}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Name"
                              value={fileItem.name}
                              onChange={(e) => {
                                const updated = [...sampleFiles];
                                updated[idx].name = e.target.value;
                                setValue('sampleFiles', updated, { shouldDirty: true });
                              }}
                              className="h-8 text-xs font-semibold col-span-2"
                            />
                            <Input
                              placeholder="PDF/AI"
                              value={fileItem.fileType || ''}
                              onChange={(e) => {
                                const updated = [...sampleFiles];
                                updated[idx].fileType = e.target.value.toUpperCase();
                                setValue('sampleFiles', updated, { shouldDirty: true });
                              }}
                              className="h-8 text-xs font-semibold uppercase text-center"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="File URL..."
                              value={fileItem.fileUrl}
                              onChange={(e) => {
                                const updated = [...sampleFiles];
                                updated[idx].fileUrl = e.target.value;
                                setValue('sampleFiles', updated, { shouldDirty: true });
                              }}
                              className="h-8 text-xs font-mono"
                            />
                            <label className="cursor-pointer inline-flex items-center justify-center h-8 px-2.5 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-xs shrink-0 border border-indigo-200">
                              <Upload className="w-3 h-3 mr-1" />
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleSampleFileUpload(idx, e)}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* ── BOTTOM ACTIONS ── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl font-medium border-slate-200 dark:border-slate-800 text-xs px-5"
          >
            <Link href="/admin/products">Back to Products</Link>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs px-6 text-xs transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Save Sub-Product
              </>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
