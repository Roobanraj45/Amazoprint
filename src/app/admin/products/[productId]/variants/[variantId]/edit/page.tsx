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
  CloudUpload,
  Cloud,
  LayoutGrid,
  Copy,
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
  const [customAddons, setCustomAddons] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'prices' | 'variants' | 'finishes' | 'delivery' | 'details'>('all');

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
        const sizeKb = Math.round((data.size || 0) / 1024);
        toast({
          title: 'Image Uploaded to Firebase Storage',
          description: `Compressed to ${sizeKb} KB (< 1 MB) and saved to products folder.`,
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
        const sizeKb = Math.round((data.size || 0) / 1024);
        toast({
          title: 'Gallery Image Uploaded',
          description: `Compressed to ${sizeKb} KB (< 1 MB) and added to gallery.`,
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
        toast({ variant: 'destructive', title: 'Variant Not Found', description: 'Could not find the requested variant.' });
        router.push('/admin/products');
        return;
      }

      setParentProduct(prod);
      setVariantData(variant);
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

  const onInvalid = (errors: any) => {
    console.error('Variant edit form validation errors:', errors);
    const fields = Object.keys(errors);
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: `Please review the following fields: ${fields.join(', ')}`,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      
      {/* ── TOP HERO HEADER & STICKY ACTIONS ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
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
                Make corrections quickly across media, pricing slabs, dimensions, and finishes.
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
              onClick={handleSubmit(onSubmit, onInvalid)}
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Base Unit Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 dark:text-white">
                ₹{watchPrice ? Number(watchPrice).toFixed(2) : '0.00'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">/ piece</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Price Slabs</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {priceSlabs.filter((s: any) => s.isActive).length} Active
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Slabs
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Configured Sizes</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {activeSizesCount} Active
              </span>
              {defaultSize && (
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[90px]">
                  ({defaultSize.width}×{defaultSize.height}{defaultSize.unit || 'mm'})
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Tax / GST</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {activeTaxes.length > 0 ? activeTaxes.map((t: any) => `${t.rate}%`).join(', ') : '0%'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {activeTaxes.length > 0 ? (activeTaxes[0].isInclusive ? 'Incl.' : 'Excl.') : ''}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Store Status</span>
              <span className={cn(
                "inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full",
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

      {/* ── STICKY CONTROL & FILTER STRIP ── */}
      <div className="sticky top-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'all'
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> All Sections
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'images'
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" /> 1. Images
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prices')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'prices'
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/60 dark:hover:text-amber-400"
            )}
          >
            <DollarSign className="w-3.5 h-3.5" /> 2. Prices & Slabs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'variants'
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400"
            )}
          >
            <Ruler className="w-3.5 h-3.5" /> 3. Sizes & Variants
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finishes')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'finishes'
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/60 dark:hover:text-purple-400"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" /> 4. Finishes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'delivery'
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400"
            )}
          >
            <Truck className="w-3.5 h-3.5" /> 5. Delivery & Pathways
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap",
              activeTab === 'details'
                ? "bg-slate-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Tag className="w-3.5 h-3.5" /> 6. Details & Specs
          </button>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleSubmit(onSubmit, onInvalid)}
          disabled={isSubmitting}
          className="h-8 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs px-4 text-xs shrink-0"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />} Save
        </Button>
      </div>

      {/* ── MAIN FORM BODY ── */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: IMAGES (PRIMARY & GALLERY) - TOP PRIORITY                */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'images') && (
          <section id="section-images" className="scroll-mt-20">
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/90 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center">
                      01
                    </span>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Variant Media & Visual Gallery
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Configure cover photo and supporting angles. All files auto-compressed to &lt; 1 MB on Firebase Storage.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left: Primary Cover Image (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Primary Cover Image</span>
                        </Label>
                        {imageUrl?.includes('firebasestorage.googleapis.com') ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1 font-bold">
                            <Cloud className="w-3 h-3 text-amber-500" /> Firebase
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 font-semibold">
                            Storefront Thumbnail
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {imageUrl && imageUrl.trim() ? (
                          <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0 bg-white">
                            <Image src={resolveImagePath(imageUrl)} alt="Primary image" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800 flex flex-col items-center justify-center flex-shrink-0 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                            <ImageIcon className="h-7 w-7 mb-1" />
                            <span className="text-[10px] font-bold">No Cover</span>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Main image displayed on cards, categories & product header.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <label className={cn(
                              "cursor-pointer inline-flex items-center justify-center h-8.5 px-3 rounded-xl text-xs font-bold border transition-colors",
                              isUploadingPrimary
                                ? "bg-slate-100 text-slate-400 border-slate-200"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs"
                            )}>
                              {isUploadingPrimary ? (
                                <>
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Uploading...
                                </>
                              ) : (
                                <>
                                  <CloudUpload className="mr-1 h-3.5 w-3.5" /> Upload File
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
                                  className="h-8.5 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 border-slate-200 dark:border-slate-800"
                                >
                                  <Library className="mr-1 h-3.5 w-3.5" /> Media Library
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
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          placeholder="Image URL or Firebase Storage link..."
                          className="h-8 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300"
                          {...register('imageUrl')}
                        />
                        {imageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-[10px] text-slate-400 hover:text-rose-600 shrink-0"
                            onClick={() => setValue('imageUrl', '', { shouldDirty: true })}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Supporting Gallery Images (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Gallery Perspectives
                        </Label>
                        <Badge variant="secondary" className="text-[10px] font-black h-5 px-1.5 rounded-md">
                          {imageUrls.length}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className={cn(
                          "cursor-pointer inline-flex items-center justify-center h-8 px-3 rounded-xl text-xs font-bold border transition-colors",
                          isUploadingGallery
                            ? "bg-slate-100 text-slate-400 border-slate-200"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs"
                        )}>
                          {isUploadingGallery ? (
                            <>
                              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Uploading...
                            </>
                          ) : (
                            <>
                              <CloudUpload className="mr-1.5 h-3 w-3" /> Upload Angle
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
                              className="h-8 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Library className="mr-1.5 h-3 w-3" /> Library
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
                    </div>

                    {imageUrls.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/50 gap-1.5">
                        <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-bold text-slate-500">No supporting angles added yet</p>
                        <p className="text-[10px] text-muted-foreground">Upload finish closeups, back view, or stack perspectives.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {imageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 aspect-square shadow-xs"
                          >
                            <Image src={resolveImagePath(url)} alt={`Gallery ${idx}`} fill className="object-cover" />
                            {url.includes('firebasestorage.googleapis.com') && (
                              <span className="absolute top-1 left-1 bg-amber-500/90 text-white rounded-full p-0.5 shadow-sm">
                                <Cloud className="w-2.5 h-2.5" />
                              </span>
                            )}
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
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: PRICES, QUANTITY SLABS & TAXES                           */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'prices') && (
          <section id="section-prices" className="scroll-mt-20">
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/90 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                      02
                    </span>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Pricing, Quantity Slabs & Taxes
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Base rates, per-card printing add-ons, quantity package discounts, and GST calculation.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Base Pricing & Tax Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Base Price (₹) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-black">₹</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-10 rounded-xl pl-8 bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/80 font-black text-base text-amber-700 dark:text-amber-300"
                        {...register('price')}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      GST Rate Mode
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
                      <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18" className="font-bold">GST 18% (Standard Print)</SelectItem>
                        <SelectItem value="12" className="font-bold">GST 12%</SelectItem>
                        <SelectItem value="5" className="font-bold">GST 5%</SelectItem>
                        <SelectItem value="28" className="font-bold">GST 28%</SelectItem>
                        <SelectItem value="0" className="font-bold">Exempt 0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
                      <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive">Exclusive (+ Added extra)</SelectItem>
                        <SelectItem value="inclusive">Inclusive (Included in price)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Printing Sides Configuration (Single vs Double Sided) */}
                <div className="p-4 bg-slate-50/90 dark:bg-slate-950/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Printing Sides Configuration
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Specify if this variant is single-sided only or allows customers to choose front & back double-sided printing.
                      </p>
                    </div>
                    {maxPages > 1 ? (
                      <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-black tracking-wide px-2.5 py-0.5 rounded-lg shrink-0">
                        Double-Sided Enabled (2 Sides)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg shrink-0">
                        Single-Sided Only (1 Side)
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
                    {/* Interactive Selection Cards */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setValue('maxPages', 1, { shouldDirty: true, shouldValidate: true });
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150",
                          maxPages <= 1
                            ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-500/20"
                            : "border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          maxPages <= 1
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        )}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white">Single Sided Only</span>
                            {maxPages <= 1 && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Front page only (1 side)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setValue('maxPages', 2, { shouldDirty: true, shouldValidate: true });
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150",
                          maxPages > 1
                            ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-500/20"
                            : "border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          maxPages > 1
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        )}>
                          <Copy className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white">Double Sided Allowed</span>
                            {maxPages > 1 && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Customer chooses 1 or 2 sides</p>
                        </div>
                      </button>
                    </div>

                    {/* Back-Side Surcharge Input */}
                    <div className="md:col-span-4 space-y-1.5">
                      <Label htmlFor="backSideCost" className={cn(
                        "text-xs font-bold uppercase tracking-wider flex items-center justify-between",
                        maxPages > 1 ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"
                      )}>
                        <span>Back-Side Add-on (₹)</span>
                        {maxPages > 1 ? (
                          <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">per piece surcharge</span>
                        ) : (
                          <span className="text-[10px] font-normal text-slate-400">Not Applicable</span>
                        )}
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
                            "h-10 rounded-xl pl-8 font-bold",
                            maxPages > 1
                              ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 focus-visible:ring-indigo-500"
                              : "bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                          )}
                          {...register('backSideCost')}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {maxPages > 1
                          ? "Added to unit price when customer chooses 'Front & Back'."
                          : "Enable 'Double Sided Allowed' above to configure surcharge."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity Price Slabs Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <Label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Quantity Package Slabs ({priceSlabs.length})
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Fixed price package bundles for defined quantity tiers.</p>
                    </div>

                    <div className="flex items-center gap-2">
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
                        className="h-8.5 rounded-xl text-xs font-bold border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Slab
                      </Button>
                    </div>
                  </div>

                  {/* Quick Presets Bar */}
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 mr-1 flex items-center gap-1">
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
                        className="h-6.5 px-2 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:text-amber-600"
                      >
                        +{preset.qty} Pcs (₹{preset.price})
                      </Button>
                    ))}
                  </div>

                  {/* Slabs List */}
                  {priceSlabs.length === 0 ? (
                    <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-1.5">
                      <Coins className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-bold text-slate-500">No Quantity Price Slabs Configured</p>
                      <p className="text-[11px] text-muted-foreground">Select presets above or click Add Slab to specify bundle pricing.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-950 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        <div className="col-span-3 sm:col-span-3">Quantity (Cards/Pcs)</div>
                        <div className="col-span-4 sm:col-span-3">Total Package Price (₹)</div>
                        <div className="col-span-3 sm:col-span-3">Est. Rate / Piece</div>
                        <div className="col-span-1 sm:col-span-2 text-center">Status</div>
                        <div className="col-span-1 sm:col-span-1 text-right">Delete</div>
                      </div>

                      {priceSlabs.map((slabItem: any, idx: number) => {
                        const qtyVal = Number(slabItem.quantity) || 1;
                        const priceVal = Number(slabItem.price) || 0;
                        const unitRate = (priceVal / qtyVal).toFixed(2);

                        return (
                          <div
                            key={slabItem.id || idx}
                            className={cn(
                              "grid grid-cols-12 gap-3 items-center px-4 py-2.5 transition-colors",
                              slabItem.isActive ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-950/60 opacity-60"
                            )}
                          >
                            <div className="col-span-3 sm:col-span-3">
                              <Input
                                type="number"
                                min="1"
                                value={slabItem.quantity}
                                onChange={(e) => {
                                  const updated = [...priceSlabs];
                                  updated[idx].quantity = parseInt(e.target.value, 10) || 0;
                                  setValue('priceSlabs', updated, { shouldDirty: true });
                                }}
                                className="h-8.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs font-bold"
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
                                className="h-8.5 rounded-lg pl-6 bg-slate-50 dark:bg-slate-950 text-xs font-black text-amber-600 dark:text-amber-400"
                              />
                            </div>

                            <div className="col-span-3 sm:col-span-3">
                              <Badge variant="outline" className="text-[11px] font-mono font-bold bg-slate-50 dark:bg-slate-950 border-slate-200">
                                ≈ ₹{unitRate} / pc
                              </Badge>
                            </div>

                            <div className="col-span-1 sm:col-span-2 flex items-center justify-center">
                              <Switch
                                checked={slabItem.isActive ?? true}
                                onCheckedChange={(val) => {
                                  const updated = [...priceSlabs];
                                  updated[idx].isActive = val;
                                  setValue('priceSlabs', updated, { shouldDirty: true });
                                }}
                                className="data-[state=checked]:bg-amber-600"
                              />
                            </div>

                            <div className="col-span-1 sm:col-span-1 flex justify-end">
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
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: VARIANTS, SIZES & DIMENSIONS                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'variants') && (
          <section id="section-variants" className="scroll-mt-20">
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/90 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center">
                      03
                    </span>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Product Sizes & Dimension Variants ({sizes.length})
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Configure standard and custom size choices for customer selection with individual price adjustments.
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
                  className="h-8.5 rounded-xl text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 shrink-0"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Custom Size
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                
                {/* Base Blueprint Dimension Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
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
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mr-1 flex items-center gap-1">
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
                      className="h-6.5 px-2 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600"
                    >
                      +{preset.name}
                    </Button>
                  ))}
                </div>

                {/* Size Variants Table */}
                {sizes.length === 0 ? (
                  <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-1.5">
                    <Ruler className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-bold text-slate-500">Using standard dimensions ({width} × {height} {unitType})</p>
                    <p className="text-[11px] text-muted-foreground">Select presets above to offer multiple size options.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      <div className="col-span-4">Size Name / Label</div>
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
                          "grid grid-cols-12 gap-3 items-center px-4 py-2.5 transition-colors",
                          sizeItem.isActive ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-950/60 opacity-60"
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
                            className="h-8.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs font-bold"
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
                            className="h-8.5 rounded-lg pr-7 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                          />
                          <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
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
                            className="h-8.5 rounded-lg pr-7 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                          />
                          <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
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
                            className="h-8.5 rounded-lg pl-6 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                          />
                        </div>

                        <div className="col-span-1 flex justify-center">
                          {sizeItem.isDefault ? (
                            <Badge className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 shadow-xs">
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
                              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              Set Default
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
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 4: FINISHES, FOILS, DIE-CUTS & TEXTURES                    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'finishes') && (
          <section id="section-finishes" className="scroll-mt-20">
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/90 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center">
                      04
                    </span>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Print Finishes & Shape Enhancements
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Spot UV, metallic foil accents, specialty paper textures, and custom die cuts.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Finishes & Specialty Papers (6 cols) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="space-y-0.5">
                        <Label htmlFor="spotUvAllowed" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Spot UV Coating Option
                        </Label>
                        <p className="text-[11px] text-muted-foreground">Enable glossy raised UV varnish accent selection on storefront.</p>
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

                    {spotUvAllowed && (
                      <div className="space-y-2 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                        <Label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                          Allowed Metallic Foil Finishes
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

                    {/* Paper Textures Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Allowed Card Textures
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
                      </div>

                      {(watch('allowedCardTextures') || []).length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Texture Unit Overrides (₹)
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {(watch('allowedCardTextures') || []).map((id) => {
                              const ct = cardTextures.find((c) => c.id === id);
                              if (!ct) return null;
                              const currentPrices = watch('cardTexturePrices') || {};
                              return (
                                <div
                                  key={id}
                                  className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                                >
                                  <span className="text-xs font-bold truncate">{ct.name}</span>
                                  <div className="relative w-20">
                                    <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-bold">₹</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="h-7 pl-5 text-xs font-bold"
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

                  {/* Right Column: Custom Die Cuts (6 cols) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Allowed Custom Die Cuts
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
                      </div>

                      {(watch('allowedDieCuts') || []).length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Die-Cut Unit Overrides (₹)
                          </p>
                          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {(watch('allowedDieCuts') || []).map((id) => {
                              const dc = dieCuts.find((d) => d.id === id);
                              if (!dc) return null;
                              const currentPrices = watch('dieCutPrices') || {};
                              return (
                                <div
                                  key={id}
                                  className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                                >
                                  <span className="text-xs font-bold truncate">{dc.name}</span>
                                  <div className="relative w-20">
                                    <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-bold">₹</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="h-7 pl-5 text-xs font-bold"
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
                  </div>

                  {/* Full-width Section: Custom Add-ons */}
                  <div className="lg:col-span-12 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="p-5 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-slate-50 dark:to-slate-950 rounded-2xl border border-purple-500/20 dark:border-purple-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <Label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              Allowed Custom Add-ons
                            </Label>
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 px-2 py-0.5 font-bold">
                              Multi-Select Enabled
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Select bespoke custom add-ons (coatings, accessories, rush jobs) available for multi-selection on the customer design page.
                          </p>
                        </div>
                        <Link 
                          href="/admin/addons" 
                          target="_blank" 
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 self-start sm:self-auto hover:underline"
                        >
                          Manage Add-on Catalog &rarr;
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
                            placeholder="Select allowed custom add-ons..."
                          />
                        )}
                      />

                      {(watch('allowedCustomAddons') || []).length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-purple-200/50 dark:border-purple-900/30">
                          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                            Custom Add-on Price Overrides for this Variant
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(watch('allowedCustomAddons') || []).map((id) => {
                              const ca = customAddons.find((c) => c.id === id);
                              if (!ca) return null;
                              const currentPrices = watch('customAddonPrices') || {};
                              const isFixed = ca.pricingType === 'fixed';
                              return (
                                <div
                                  key={id}
                                  className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-black truncate text-slate-900 dark:text-white">{ca.name}</p>
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      {isFixed ? 'Fixed Flat Fee' : 'Per Unit Rate'} (catalog ₹{Number(ca.price).toFixed(2)})
                                    </span>
                                  </div>
                                  <div className="relative w-24 shrink-0">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="h-8 pl-6 text-xs font-bold"
                                      value={currentPrices[id] ?? Number(ca.price || 0)}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setValue('customAddonPrices', { ...currentPrices, [id]: val }, { shouldDirty: true });
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

                  {/* Sub-product Level Custom Add-on Sections */}
                  <div className="lg:col-span-12 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <CustomAddonSectionsBuilder
                      sections={watch('customAddonSections') || []}
                      onChange={(newSections) => setValue('customAddonSections', newSections, { shouldDirty: true })}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 5: DELIVERY & PRODUCTION PATHWAYS                           */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'delivery') && (
          <section id="section-delivery" className="scroll-mt-20">
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/90 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                      05
                    </span>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Delivery & Creation Pathways
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Order quantities, standard turnaround, expedited tiers, and customer ordering workflows.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Delivery Controls (6 cols) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="minOrderQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Min Quantity <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="minOrderQuantity"
                          type="number"
                          placeholder="100"
                          className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                          {...register('minOrderQuantity')}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="maxOrderQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Max Quantity <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="maxOrderQuantity"
                          type="number"
                          placeholder="10000"
                          className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                          {...register('maxOrderQuantity')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="deliveryDays" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Turnaround Days
                        </Label>
                        <Input
                          id="deliveryDays"
                          placeholder="3-5 Business Days"
                          className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-xs"
                          {...register('deliveryDays')}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="deliveryAmount" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Standard Shipping (₹)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                          <Input
                            id="deliveryAmount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                            {...register('deliveryAmount')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expedited Tiers */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Expedited Shipping Tiers ({deliveryTiers.length})
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addDeliveryTier}
                          className="h-7.5 rounded-xl text-xs font-bold"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add Tier
                        </Button>
                      </div>

                      {deliveryTiers.map((tier, idx) => (
                        <div
                          key={tier.id || idx}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              Tier #{idx + 1}
                            </span>
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
                              className="h-8 text-xs font-bold"
                            />
                            <Input
                              value={tier.estimatedTime}
                              placeholder="Turnaround"
                              onChange={(e) => updateDeliveryTier(idx, 'estimatedTime', e.target.value)}
                              className="h-8 text-xs font-semibold"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={tier.amount}
                              onChange={(e) => updateDeliveryTier(idx, 'amount', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs font-bold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pathways (6 cols) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowDesignerTool" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <PenSquare className="w-3.5 h-3.5 text-indigo-600" /> Online Designer Tool
                        </Label>
                        <p className="text-[11px] text-muted-foreground">Interactive web canvas designer.</p>
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

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowFileUpload" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" /> File Upload (PDF / AI)
                        </Label>
                        <p className="text-[11px] text-muted-foreground">Direct print-ready file uploads.</p>
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

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowFreelancerContest" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-pink-600" /> Freelancer Contests
                        </Label>
                        <p className="text-[11px] text-muted-foreground">Community graphic design requests.</p>
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

                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="youtubeUrl" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Video className="w-3.5 h-3.5 text-rose-500" /> YouTube Video Guide URL
                      </Label>
                      <Input
                        id="youtubeUrl"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-medium"
                        {...register('youtubeUrl')}
                      />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 6: IDENTITY, SKU & SAMPLE FILES                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'details') && (
          <section id="section-details" className="scroll-mt-20">
            <Card className="border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/90 pb-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center">
                      06
                    </span>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                      Identity Details & Starter Templates
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Variant name, SKU, HSN tax classification, specifications, and downloadable customer templates.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                        <span>Variant Name <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-medium">Customer Facing</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. Premium 350 GSM Matte Lamination"
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-bold text-sm"
                        {...register('name')}
                      />
                      {errors.name && <p className="text-rose-500 text-xs font-bold mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          SKU Code
                        </Label>
                        <Input
                          id="sku"
                          placeholder="e.g. BC-350-MATTE"
                          className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-bold uppercase"
                          {...register('sku')}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="hsnCode" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          HSN / SAC Code
                        </Label>
                        <Input
                          id="hsnCode"
                          placeholder="e.g. 49111090"
                          className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono text-xs font-bold"
                          {...register('hsnCode')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-1.5 flex flex-col">
                    <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Specifications & Overview
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Material specs, GSM paper thickness, finish attributes, and ideal print applications..."
                      className="h-[140px] resize-y rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 p-3 text-xs font-medium"
                      {...register('description')}
                    />
                  </div>
                </div>

                {/* Sample Starter Templates */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileDown className="w-4 h-4 text-indigo-600" /> Downloadable Starter Files ({sampleFiles.length})
                      </Label>
                      <p className="text-[11px] text-muted-foreground">Downloadable starter templates for customers (PDF, PSD, AI, CDR).</p>
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
                      className="h-8 rounded-xl text-xs font-bold"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add File
                    </Button>
                  </div>

                  {sampleFiles.length === 0 ? (
                    <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-1.5">
                      <FileDown className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-bold text-slate-500">No template files attached</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sampleFiles.map((fileItem, idx) => (
                        <div
                          key={fileItem.id || idx}
                          className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                              className="h-8 text-xs font-bold col-span-2"
                            />
                            <Input
                              placeholder="PDF"
                              value={fileItem.fileType || ''}
                              onChange={(e) => {
                                const updated = [...sampleFiles];
                                updated[idx].fileType = e.target.value.toUpperCase();
                                setValue('sampleFiles', updated, { shouldDirty: true });
                              }}
                              className="h-8 text-xs font-bold uppercase text-center"
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
                            <label className="cursor-pointer inline-flex items-center justify-center h-8 px-2.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs shrink-0 border border-indigo-200">
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

              </CardContent>
            </Card>
          </section>
        )}

        {/* ── BOTTOM STICKY/FINAL ACTION BAR ── */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-2xl font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6"
          >
            <Link href="/admin/products">Back to Products</Link>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 px-8 transition-all hover:scale-[1.02]"
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

      </form>
    </div>
  );
}
