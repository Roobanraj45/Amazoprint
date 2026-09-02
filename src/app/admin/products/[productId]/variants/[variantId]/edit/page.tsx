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
  Plus,
  PenSquare,
  Upload,
  Trophy,
  Video,
  FileDown,
  Percent,
  Receipt,
  Coins,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  Scissors,
  Check,
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
  taxSlabs: z.array(taxSlabSchema).optional().default([]),
  sizes: z.array(sizeVariantSchema).optional().default([]),
});

type SubProductFormData = z.infer<typeof subProductSchema>;

export default function EditVariantPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.productId);
  const variantId = Number(params.variantId);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [parentProduct, setParentProduct] = useState<any>(null);
  const [variantData, setVariantData] = useState<any>(null);
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
      unitType: 'mm',
      backSideCost: 0,
      minOrderQuantity: 100,
      maxOrderQuantity: 10000,
      deliveryDays: '3-5 Business Days',
      deliveryAmount: 0,
      deliveryTiers: [],
      sizes: [],
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
  const unitType = watch('unitType') || 'mm';
  const width = watch('width') || 0;
  const height = watch('height') || 0;

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
    if (!productId || !variantId || isNaN(productId) || isNaN(variantId)) return;
    setIsLoading(true);
    try {
      const [prod, variant, foils, cuts, textures] = await Promise.all([
        getProductById(productId),
        getSubProductById(variantId),
        getFoilTypes(),
        getDieCuts(),
        getCardTextures(),
      ]);

      if (!variant) {
        toast({ variant: 'destructive', title: 'Variant Not Found', description: 'Could not find the requested variant.' });
        router.push('/admin/products');
        return;
      }

      setParentProduct(prod);
      setVariantData(variant);
      setFoilTypes(foils);
      setDieCuts(cuts);
      setCardTextures(textures);

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
        unitType: (variant.unitType as any) || 'mm',
        backSideCost: Number(variant.backSideCost || 0),
        minOrderQuantity: (variant as any).minOrderQuantity ?? 100,
        maxOrderQuantity: (variant as any).maxOrderQuantity ?? 10000,
        deliveryDays: (variant as any).deliveryDays || '3-5 Business Days',
        deliveryAmount: Number((variant as any).deliveryAmount || 0),
        deliveryTiers: (variant as any).deliveryTiers || [],
        taxSlabs: (variant as any).taxSlabs || [],
        sizes: (variant as any).sizes || [],
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Loading Variant', description: error.message });
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

  const onSubmit = async (data: SubProductFormData) => {
    try {
      await updateSubProduct(variantId, {
        ...data,
        dieCutPrices: watch('dieCutPrices') || {},
        cardTexturePrices: watch('cardTexturePrices') || {},
        deliveryTiers: watch('deliveryTiers') || [],
      });
      toast({
        title: 'Variant Updated',
        description: `Successfully updated variant "${data.name}".`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Variant',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-500">Loading sub-product configuration blueprint...</p>
      </div>
    );
  }

  const activeSizesCount = sizes.filter((s: any) => s.isActive).length;
  const defaultSize = sizes.find((s: any) => s.isDefault) || sizes[0];
  const activeTaxes = taxSlabs.filter((t: any) => t.isActive);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* ── TOP HERO HEADER & STICKY ACTIONS ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-xs hover:bg-slate-100 shrink-0"
            >
              <Link href="/admin/products">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link href="/admin/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Products
                </Link>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{parentProduct?.name || 'Product'}</span>
                <span>/</span>
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                  ID: #{variantId}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                {watchName || 'Edit Sub-Product'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Configure sizes, unit pricing, taxes, production pathways, and print finishes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5"
            >
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-11 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 px-7 transition-all hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Save Sub-Product
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Top Quick Status & KPI Highlight Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Base Unit Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                ₹{watchPrice ? Number(watchPrice).toFixed(2) : '0.00'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">/ piece</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Configured Sizes</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {activeSizesCount} Active
              </span>
              {defaultSize && (
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
                  ({defaultSize.width}×{defaultSize.height}{defaultSize.unit || 'mm'})
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Tax / GST Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {activeTaxes.length > 0 ? activeTaxes.map((t: any) => `${t.rate}%`).join(', ') : 'Exempt (0%)'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {activeTaxes.length > 0 ? (activeTaxes[0].isInclusive ? 'Incl.' : 'Excl.') : ''}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Store Status</span>
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full",
                watchIsActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              )}>
                {watchIsActive ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-emerald-600"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* ── MAIN FORM BODY ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* ═══ SECTION 1: TOP PRIORITY — SIZES & CORE ECONOMICS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Core Identity & Base Pricing (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-2 border-indigo-500/30 dark:border-indigo-500/20 shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                    Core Identity & Pricing
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Variant naming, SKU identification, and base price configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Variant Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                    <span>Variant Name <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-medium">Customer Facing</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Premium 350 GSM Matte Lamination"
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold text-sm"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-rose-500 text-xs font-bold mt-1">{errors.name.message}</p>}
                </div>

                {/* Base Price & Back Side Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Base Price (₹) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-black">₹</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-11 rounded-xl pl-8 bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500 font-black text-base text-indigo-700 dark:text-indigo-300"
                        {...register('price')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backSideCost" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Back-Side Add-on (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">₹</span>
                      <Input
                        id="backSideCost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-11 rounded-xl pl-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold"
                        {...register('backSideCost')}
                      />
                    </div>
                  </div>
                </div>

                {/* SKU Code & HSN Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      SKU Code
                    </Label>
                    <Input
                      id="sku"
                      placeholder="e.g. BC-350-MATTE"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-bold uppercase"
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
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-bold"
                      {...register('hsnCode')}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Specifications & Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Material specs, GSM paper thickness, finish attributes, and ideal print applications..."
                    className="min-h-[85px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 p-3 text-xs font-medium"
                    {...register('description')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Product Sizes & Dimension Variants (7 cols - TOP PRIORITY HIGHLIGHT) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-2 border-indigo-500/40 dark:border-indigo-500/30 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Product Sizes & Dimensions ({sizes.filter((s: any) => s.isActive).length} Active)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Configure multiple sizes for this variant. Customers select their desired dimension on storefront.
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
                  className="h-9 rounded-xl text-xs font-bold border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400 shrink-0"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Custom Size
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Base Blueprint Unit & Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Default Unit</Label>
                    <Controller
                      name="unitType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="mm" className="font-bold">Millimeters (mm)</SelectItem>
                            <SelectItem value="inch" className="font-bold">Inches (inch)</SelectItem>
                            <SelectItem value="ft" className="font-bold">Feet (ft)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Base Width</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs"
                      {...register('width')}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Base Height</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs"
                      {...register('height')}
                    />
                  </div>
                </div>

                {/* Quick Add Presets Bar */}
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Add Popular Size Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Standard (85 × 55 mm)', width: 85, height: 55, unit: 'mm' },
                      { name: 'Square (65 × 65 mm)', width: 65, height: 65, unit: 'mm' },
                      { name: 'Slim (90 × 45 mm)', width: 90, height: 45, unit: 'mm' },
                      { name: 'A6 (105 × 148 mm)', width: 105, height: 148, unit: 'mm' },
                      { name: 'A5 (148 × 210 mm)', width: 148, height: 210, unit: 'mm' },
                      { name: 'A4 (210 × 297 mm)', width: 210, height: 297, unit: 'mm' },
                      { name: 'Photo (4 × 6 in)', width: 4, height: 6, unit: 'inch' },
                      { name: 'Poster (12 × 18 in)', width: 12, height: 18, unit: 'inch' },
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
                        className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600"
                      >
                        +{preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Size Variants List */}
                {sizes.length === 0 ? (
                  <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
                    <Ruler className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-bold text-slate-500">Using standard dimensions ({width} × {height} {unitType})</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      Click &quot;Add Custom Size&quot; or choose from the presets above to enable customer size selection.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {sizes.map((sizeItem: any, idx: number) => (
                      <div
                        key={sizeItem.id || idx}
                        className={cn(
                          "p-4 rounded-2xl border transition-all space-y-3",
                          sizeItem.isActive 
                            ? "bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80" 
                            : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 opacity-70"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] flex items-center justify-center font-black">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Size #{idx + 1}
                            </span>
                            {sizeItem.isDefault ? (
                              <Badge className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Default Size
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
                                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] font-bold text-slate-500">Active</Label>
                              <Switch
                                checked={sizeItem.isActive ?? true}
                                onCheckedChange={(val) => {
                                  const updated = [...sizes];
                                  updated[idx].isActive = val;
                                  setValue('sizes', updated, { shouldDirty: true });
                                }}
                                className="data-[state=checked]:bg-indigo-600"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setValue('sizes', sizes.filter((_, i) => i !== idx), { shouldDirty: true });
                              }}
                              className="h-7 px-2 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-5 space-y-1">
                            <Label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">Label / Name</Label>
                            <Input
                              placeholder="e.g. Standard (85 × 55 mm)"
                              value={sizeItem.name}
                              onChange={(e) => {
                                const updated = [...sizes];
                                updated[idx].name = e.target.value;
                                setValue('sizes', updated, { shouldDirty: true });
                              }}
                              className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">Width</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={sizeItem.width}
                              onChange={(e) => {
                                const updated = [...sizes];
                                updated[idx].width = parseFloat(e.target.value) || 0;
                                setValue('sizes', updated, { shouldDirty: true });
                              }}
                              className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">Height</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={sizeItem.height}
                              onChange={(e) => {
                                const updated = [...sizes];
                                updated[idx].height = parseFloat(e.target.value) || 0;
                                setValue('sizes', updated, { shouldDirty: true });
                              }}
                              className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase">Price Adj. (₹)</Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={sizeItem.priceAdjustment ?? 0}
                                onChange={(e) => {
                                  const updated = [...sizes];
                                  updated[idx].priceAdjustment = parseFloat(e.target.value) || 0;
                                  setValue('sizes', updated, { shouldDirty: true });
                                }}
                                className="h-9 rounded-xl pl-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ SECTION 2: TAXES & FINANCIALS + PRIMARY MEDIA ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tax & GST Settings (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Tax & GST Slabs ({taxSlabs.filter((t: any) => t.isActive).length} Active)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Configure tax rates applied automatically at checkout and order summary.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('taxSlabs', [
                      ...taxSlabs,
                      { id: `tax-${Date.now()}`, name: 'GST', rate: 18, isInclusive: false, isActive: true }
                    ], { shouldDirty: true });
                  }}
                  className="h-9 rounded-xl text-xs font-bold border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 shrink-0"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Tax Slab
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Quick Presets */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" /> Quick Add Tax Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'GST 18%', rate: 18 },
                      { name: 'GST 12%', rate: 12 },
                      { name: 'GST 5%', rate: 5 },
                      { name: 'GST 28%', rate: 28 },
                      { name: 'Exempt 0%', rate: 0 },
                    ].map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const exists = taxSlabs.some((t: any) => t.rate === preset.rate && t.name === preset.name);
                          if (!exists) {
                            setValue('taxSlabs', [
                              ...taxSlabs,
                              { id: `tax-${Date.now()}-${preset.rate}`, name: preset.name, rate: preset.rate, isInclusive: false, isActive: true }
                            ], { shouldDirty: true });
                          }
                        }}
                        className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600"
                      >
                        +{preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tax List */}
                {taxSlabs.length === 0 ? (
                  <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
                    <Percent className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-bold text-slate-500">No Tax Slabs Configured</p>
                    <p className="text-[11px] text-muted-foreground">Select a preset above (e.g. GST 18%) to calculate taxes.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {taxSlabs.map((taxItem: any, idx: number) => (
                      <div
                        key={taxItem.id || idx}
                        className={cn(
                          "p-4 rounded-2xl border transition-all space-y-3",
                          taxItem.isActive 
                            ? "bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80" 
                            : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 opacity-70"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            Tax Slab #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] font-bold text-slate-500">Active</Label>
                            <Switch
                              checked={taxItem.isActive ?? true}
                              onCheckedChange={(val) => {
                                const updated = [...taxSlabs];
                                updated[idx].isActive = val;
                                setValue('taxSlabs', updated, { shouldDirty: true });
                              }}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setValue('taxSlabs', taxSlabs.filter((_, i) => i !== idx), { shouldDirty: true });
                              }}
                              className="h-7 px-2 text-xs font-semibold text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-5 space-y-1">
                            <Label className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">Tax Label</Label>
                            <Input
                              placeholder="e.g. GST (Goods & Services Tax)"
                              value={taxItem.name}
                              onChange={(e) => {
                                const updated = [...taxSlabs];
                                updated[idx].name = e.target.value;
                                setValue('taxSlabs', updated, { shouldDirty: true });
                              }}
                              className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={taxItem.rate}
                              onChange={(e) => {
                                const updated = [...taxSlabs];
                                updated[idx].rate = parseFloat(e.target.value) || 0;
                                setValue('taxSlabs', updated, { shouldDirty: true });
                              }}
                              className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-black text-emerald-600 dark:text-emerald-400"
                            />
                          </div>

                          <div className="sm:col-span-4 space-y-1">
                            <Label className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">Mode</Label>
                            <Select
                              value={taxItem.isInclusive ? 'inclusive' : 'exclusive'}
                              onValueChange={(val) => {
                                const updated = [...taxSlabs];
                                updated[idx].isInclusive = val === 'inclusive';
                                setValue('taxSlabs', updated, { shouldDirty: true });
                              }}
                            >
                              <SelectTrigger className="h-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exclusive">Exclusive (+ Extra)</SelectItem>
                                <SelectItem value="inclusive">Inclusive (Inside)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media & Visual Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                    Variant Media Gallery
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Primary Display Image */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Primary Display Image
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
                            className="w-full h-8 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 border-slate-200 dark:border-slate-800"
                          >
                            <Library className="mr-2 h-3.5 w-3.5" /> Browse Media Library
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
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Supporting Gallery Images ({imageUrls.length})
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

                  <div className="grid grid-cols-4 gap-3">
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
                            className="h-7 w-7 rounded-full shadow-lg hover:scale-105"
                            onClick={() => {
                              setValue('imageUrls', imageUrls.filter((_, i) => i !== idx), { shouldDirty: true });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ SECTION 3: OPERATIONS — DELIVERY & DESIGN CREATION PATHWAYS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Order Quantities & Delivery Tiers (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                    Delivery & Quantity Controls
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Min Quantity (Pieces) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      placeholder="100"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                      {...register('minOrderQuantity')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxOrderQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Max Quantity (Pieces) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="maxOrderQuantity"
                      type="number"
                      placeholder="10000"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                      {...register('maxOrderQuantity')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDays" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Standard Delivery Time
                    </Label>
                    <Input
                      id="deliveryDays"
                      placeholder="e.g. 3-5 Business Days"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold"
                      {...register('deliveryDays')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAmount" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Standard Shipping Fee (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">₹</span>
                      <Input
                        id="deliveryAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-11 rounded-xl pl-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                        {...register('deliveryAmount')}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Speed Shipping Tiers */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Expedited Shipping Tiers ({deliveryTiers.length})
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDeliveryTier}
                      className="h-8 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Tier
                    </Button>
                  </div>

                  {deliveryTiers.map((tier, idx) => (
                    <div
                      key={tier.id || idx}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2.5"
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
                          className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <Input
                          value={tier.name}
                          placeholder="Tier Name"
                          onChange={(e) => updateDeliveryTier(idx, 'name', e.target.value)}
                          className="h-8 text-xs font-bold rounded-lg bg-white dark:bg-slate-900"
                        />
                        <Input
                          value={tier.estimatedTime}
                          placeholder="Turnaround"
                          onChange={(e) => updateDeliveryTier(idx, 'estimatedTime', e.target.value)}
                          className="h-8 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900"
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={tier.amount}
                            onChange={(e) => updateDeliveryTier(idx, 'amount', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs font-bold pl-6 rounded-lg bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Design Creation Pathways (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <PenSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                    Design Creation Pathways
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* 1. Designer Tool */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowDesignerTool" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <PenSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Online Designer Tool
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Interactive canvas artwork designer.</p>
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

                {/* 2. File Upload */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowFileUpload" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> File Upload (PDF / Image / AI)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Direct print-ready artwork file uploads.</p>
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

                {/* 3. Freelancer Contest */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowFreelancerContest" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" /> Freelancer Contest / Hire
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Community designer contests.</p>
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

                {/* YouTube Video Link */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label htmlFor="youtubeUrl" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-rose-500" /> YouTube Video Tutorial Link
                  </Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-medium"
                    {...register('youtubeUrl')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ SECTION 4: FINISHING & SAMPLE ASSETS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Print Enhancements, Spot UV, Foils, Die Cuts & Textures (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                    Print Enhancements & Overrides
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Spot UV */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="spotUvAllowed" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Spot UV Option
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Enable gloss accent finishes.</p>
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
                    Allowed Custom Die Cuts & Shape Overrides
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
                        placeholder="Select die-cut shape patterns..."
                      />
                    )}
                  />

                  {(watch('allowedDieCuts') || []).length > 0 && (
                    <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-950">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Per-card Die-Cut Price Overrides
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(watch('allowedDieCuts') || []).map((id) => {
                          const dc = dieCuts.find((d) => d.id === id);
                          if (!dc) return null;
                          const currentPrices = watch('dieCutPrices') || {};
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800"
                            >
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {dc.name}
                              </span>
                              <div className="flex items-center gap-1.5 w-24">
                                <span className="text-[10px] text-muted-foreground font-bold">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-7 text-xs font-bold px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
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
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Allowed Card Textures & Paper Overrides
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
                    <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-950">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Per-card Texture Price Overrides
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(watch('allowedCardTextures') || []).map((id) => {
                          const ct = cardTextures.find((c) => c.id === id);
                          if (!ct) return null;
                          const currentPrices = watch('cardTexturePrices') || {};
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800"
                            >
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {ct.name}
                              </span>
                              <div className="flex items-center gap-1.5 w-24">
                                <span className="text-[10px] text-muted-foreground font-bold">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-7 text-xs font-bold px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
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

          {/* Downloadable Guideline & Sample Files (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Sample Starter Files ({sampleFiles.length})
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Downloadable starter templates for customers (PDF, PSD, AI, CDR).
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
                  className="h-9 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 shrink-0"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add File
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {sampleFiles.length === 0 ? (
                  <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
                    <FileDown className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-bold text-slate-500">No sample files attached</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sampleFiles.map((fileItem, idx) => (
                      <div
                        key={fileItem.id || idx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            File #{idx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setValue('sampleFiles', sampleFiles.filter((_, i) => i !== idx), { shouldDirty: true });
                            }}
                            className="h-6 px-1.5 text-xs text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="File Name"
                            value={fileItem.name}
                            onChange={(e) => {
                              const updated = [...sampleFiles];
                              updated[idx].name = e.target.value;
                              setValue('sampleFiles', updated, { shouldDirty: true });
                            }}
                            className="h-8 text-xs font-bold rounded-lg col-span-2 bg-white dark:bg-slate-900"
                          />
                          <Input
                            placeholder="Format"
                            value={fileItem.fileType || ''}
                            onChange={(e) => {
                              const updated = [...sampleFiles];
                              updated[idx].fileType = e.target.value.toUpperCase();
                              setValue('sampleFiles', updated, { shouldDirty: true });
                            }}
                            className="h-8 text-xs font-bold uppercase text-center rounded-lg bg-white dark:bg-slate-900"
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
                            className="h-8 text-xs font-mono rounded-lg bg-white dark:bg-slate-900"
                          />
                          <label className="cursor-pointer inline-flex items-center justify-center h-8 px-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
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
              </CardContent>
            </Card>
          </div>
        </div>

      </form>
    </div>
  );
}
