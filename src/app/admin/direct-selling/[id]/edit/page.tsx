'use client';

import React, { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  getDirectSellingProductById, 
  updateDirectSellingProduct, 
  deleteDirectSellingProduct,
  approveDirectSellingProduct,
  rejectDirectSellingProduct 
} from '@/app/actions/direct-selling-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { resolveImagePath, cn } from '@/lib/utils';
import { 
  ArrowLeft, CheckCircle2, ImageIcon, Layers, Loader2, 
  Package, Sparkles, Trash2, SlidersHorizontal, 
  DollarSign, Truck, Gift, FileText, Percent, 
  Receipt, Coins, Plus, X, Upload, Check, AlertCircle, 
  Eye, RefreshCw, Factory, Zap, Shirt, Coffee, Frame, Watch, Smartphone
} from 'lucide-react';

const taxSlabSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tax name is required'),
  rate: z.coerce.number().min(0, 'Tax rate must be non-negative'),
  type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  isInclusive: z.boolean().optional().default(true),
  isActive: z.boolean().default(true),
});

const priceSlabSchema = z.object({
  id: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true),
});

const formSchema = z.object({
  name: z.string().min(1, 'Product title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional().default('General'),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be 0 or higher'),
  sku: z.string().optional(),
  hsnCode: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().optional().default(50),
  minStockLevel: z.coerce.number().int().optional().default(5),
  weight: z.coerce.number().optional().default(0.25),
  dimensions: z.any().optional(),
  attributes: z.any().optional().default([]),
  variations: z.any().optional().default([]),
  taxSlabs: z.array(taxSlabSchema).optional().default([]),
  priceSlabs: z.array(priceSlabSchema).optional().default([]),
  offers: z.array(z.any()).optional().default([]),
  offerBadge: z.string().optional().nullable(),
  specifications: z.any().optional().default({}),
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: z.any().optional(),
  shippingInfo: z.any().optional().default({}),
  textAllowed: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function FlexibleDirectProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id || params.productId);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejectingOpen, setIsRejectingOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Helper state for adding attribute & options easily
  const [newAttrName, setNewAttrName] = useState('');
  const [hasVariants, setHasVariants] = useState(true);

  // Bulk edit values for variations
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [skuPrefix, setSkuPrefix] = useState('');

  // Length, Width, Height, Unit state for clean non-JSON dimensions
  const [dimLength, setDimLength] = useState<number | ''>(15);
  const [dimWidth, setDimWidth] = useState<number | ''>(10);
  const [dimHeight, setDimHeight] = useState<number | ''>(2);
  const [dimUnit, setDimUnit] = useState('cm');

  // Custom Spec helper
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: 'General',
      sellingPrice: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      weight: 0.25,
      imageUrls: '',
      tags: '',
      isFeatured: false,
      isActive: true,
      textAllowed: false,
      offerBadge: '',
      attributes: [],
      variations: [],
      taxSlabs: [],
      priceSlabs: [],
      offers: [],
      specifications: {},
      shippingInfo: {}
    }
  });

  const watchName = watch('name');
  const watchSellingPrice = watch('sellingPrice') || 0;
  const watchCostPrice = watch('costPrice') || 0;
  const watchAttributes = watch('attributes') || [];
  const watchVariations = watch('variations') || [];
  const watchImages = watch('imageUrls') || '';
  const watchSpecs = watch('specifications') || {};
  const watchPriceSlabs = watch('priceSlabs') || [];
  const watchOfferBadge = watch('offerBadge') || '';

  const imageUrlsList = useMemo(() => {
    return watchImages.split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [watchImages]);

  // Real-time Profit and Discount calculation
  const discountPercent = useMemo(() => {
    if (watchCostPrice > watchSellingPrice && watchCostPrice > 0) {
      return Math.round(((watchCostPrice - watchSellingPrice) / watchCostPrice) * 100);
    }
    return 0;
  }, [watchSellingPrice, watchCostPrice]);

  // Load Product Data
  const loadProduct = async () => {
    if (!productId || isNaN(productId)) {
      toast({ variant: 'destructive', title: 'Invalid Product ID' });
      router.push('/admin/direct-selling');
      return;
    }

    setIsLoading(true);
    try {
      const product = await getDirectSellingProductById(productId);
      if (!product) {
        toast({ variant: 'destructive', title: 'Product not found' });
        router.push('/admin/direct-selling');
        return;
      }

      setProductData(product);

      // Extract dimensions if available
      if (product.dimensions && typeof product.dimensions === 'object') {
        setDimLength((product.dimensions as any).length ?? 15);
        setDimWidth((product.dimensions as any).width ?? 10);
        setDimHeight((product.dimensions as any).height ?? 2);
        setDimUnit((product.dimensions as any).unit || 'cm');
      }

      const rawAttrs = (product as any).attributes || [];
      const rawVars = (product as any).variations || [];
      setHasVariants(rawAttrs.length > 0 || rawVars.length > 0);

      reset({
        ...product,
        costPrice: Number(product.costPrice || 0),
        sellingPrice: Number(product.sellingPrice || 0),
        weight: product.weight ? Number(product.weight) : 0.25,
        imageUrls: product.imageUrls?.join(', ') || '',
        tags: product.tags?.join(', ') || '',
        attributes: rawAttrs,
        variations: rawVars,
        hsnCode: (product as any).hsnCode || '',
        taxSlabs: (product as any).taxSlabs || [{ id: 'tax-gst', name: 'GST', rate: 18, type: 'percentage', isInclusive: true, isActive: true }],
        priceSlabs: (product as any).priceSlabs || [],
        offers: (product as any).offers || [],
        offerBadge: (product as any).offerBadge || '',
        specifications: (product as any).specifications || {
          'Brand': 'AmazoPrint Premium',
          'Country of Origin': 'Made in India',
        },
        shippingInfo: product.shippingInfo || {
          estimatedDays: '2-4 Business Days',
          deliveryCharge: 0,
          freeDeliveryThreshold: 499,
          expressDeliveryAvailable: true,
          expressDays: '1-2 Days',
          expressCharge: 99,
          codAvailable: true,
          dispatchTime: 'Ships within 24 hours',
          returnPolicy: '7 Days Replacement Guarantee'
        },
        textAllowed: !!product.textAllowed,
        isActive: product.isActive ?? true,
        isFeatured: !!product.isFeatured,
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load product', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  // Image Upload handler
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
      
      const newUrls = [...imageUrlsList, result.url];
      setValue('imageUrls', newUrls.join(', '));
      toast({ title: 'Photo uploaded successfully!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (urlToRemove: string) => {
    const remaining = imageUrlsList.filter(u => u !== urlToRemove);
    setValue('imageUrls', remaining.join(', '));
  };

  const setPrimaryImage = (urlToSet: string) => {
    const filtered = imageUrlsList.filter(u => u !== urlToSet);
    setValue('imageUrls', [urlToSet, ...filtered].join(', '));
    toast({ title: 'Set as primary showcase image' });
  };

  // Variations Matrix Generator
  const generateVariationsMatrix = (
    attrsToUse: Array<{ id: string; name: string; options: string[] }>,
    basePrice = watchSellingPrice,
    mrpPrice = watchCostPrice
  ) => {
    const validAttrs = attrsToUse.filter(a => a.options && a.options.length > 0);
    if (validAttrs.length === 0) {
      setValue('variations', []);
      return;
    }

    const cartesian = (arr: any[]): any[] => {
      return arr.reduce((a, b) => {
        return a.flatMap((d: any) => b.options.map((e: any) => ({ ...d, [b.name]: e })));
      }, [{}]);
    };

    const combinations = cartesian(validAttrs);
    const newVars = combinations.map((combo, idx) => {
      const existing = watchVariations.find((v: any) => {
        return Object.entries(combo).every(([k, val]) => v.attributes && v.attributes[k] === val);
      });

      if (existing) return existing;

      const comboLabel = Object.values(combo).join('-');
      const slugPrefix = (watch('slug') || 'PROD').toUpperCase().substring(0, 4);
      return {
        id: `var-${Date.now()}-${idx}`,
        sku: `${slugPrefix}-${comboLabel.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
        attributes: combo,
        price: basePrice || 0,
        basePrice: mrpPrice || undefined,
        stock: 20,
        image: imageUrlsList[0] || '',
        isActive: true,
      };
    });

    setValue('variations', newVars);
  };

  // Attribute Dimension Helpers
  const addAttributeDimension = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (watchAttributes.some((a: any) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ variant: 'destructive', title: 'Attribute dimension already exists' });
      return;
    }
    const newAttrs = [
      ...watchAttributes,
      { id: `attr-${Date.now()}`, name: trimmed, options: [] }
    ];
    setValue('attributes', newAttrs);
    setNewAttrName('');
  };

  const removeAttributeDimension = (attrId: string) => {
    const filtered = watchAttributes.filter((a: any) => a.id !== attrId);
    setValue('attributes', filtered);
    generateVariationsMatrix(filtered);
  };

  const addOptionToAttribute = (attrIdx: number, optValue: string) => {
    const trimmed = optValue.trim();
    if (!trimmed) return;
    const currentAttr = watchAttributes[attrIdx];
    if (currentAttr.options.includes(trimmed)) return;

    const updated = [...watchAttributes];
    updated[attrIdx] = {
      ...currentAttr,
      options: [...currentAttr.options, trimmed]
    };
    setValue('attributes', updated);
    generateVariationsMatrix(updated);
  };

  const removeOptionFromAttribute = (attrIdx: number, optToRemove: string) => {
    const currentAttr = watchAttributes[attrIdx];
    const updated = [...watchAttributes];
    updated[attrIdx] = {
      ...currentAttr,
      options: currentAttr.options.filter((o: string) => o !== optToRemove)
    };
    setValue('attributes', updated);
    generateVariationsMatrix(updated);
  };

  // Bulk Apply Tools
  const applyBulkPrice = () => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p < 0) return;
    const updated = watchVariations.map((v: any) => ({ ...v, price: p }));
    setValue('variations', updated);
    toast({ title: `Updated price to ₹${p} for all variations` });
    setBulkPrice('');
  };

  const applyBulkStock = () => {
    const s = parseInt(bulkStock);
    if (isNaN(s) || s < 0) return;
    const updated = watchVariations.map((v: any) => ({ ...v, stock: s }));
    setValue('variations', updated);
    toast({ title: `Updated stock to ${s} for all variations` });
    setBulkStock('');
  };

  const applyAutoSKUs = () => {
    const prefix = (skuPrefix.trim() || watch('slug') || 'ITEM').toUpperCase().substring(0, 6);
    const updated = watchVariations.map((v: any, idx: number) => {
      const comboStr = Object.values(v.attributes || {}).join('-').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return { ...v, sku: `${prefix}-${comboStr || idx + 1}` };
    });
    setValue('variations', updated);
    toast({ title: 'Generated unique SKUs for all variations' });
    setSkuPrefix('');
  };

  // Specifications
  const addCustomSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setValue('specifications', {
      ...watchSpecs,
      [specKey.trim()]: specVal.trim()
    });
    setSpecKey('');
    setSpecVal('');
  };

  const removeSpec = (k: string) => {
    const copy = { ...watchSpecs };
    delete copy[k];
    setValue('specifications', copy);
  };

  // Tiered Volume Slabs
  const addPriceSlab = (qty: number, price: number) => {
    if (!qty || !price) return;
    const updated = [
      ...watchPriceSlabs,
      { id: `slab-${Date.now()}`, quantity: qty, price: price, isActive: true }
    ].sort((a, b) => a.quantity - b.quantity);
    setValue('priceSlabs', updated);
  };

  const removePriceSlab = (id: string) => {
    setValue('priceSlabs', watchPriceSlabs.filter((s: any) => s.id !== id));
  };

  // Submit Handler
  const onSubmit = async (data: FormData) => {
    try {
      const finalDimensions = {
        length: dimLength ? Number(dimLength) : 0,
        width: dimWidth ? Number(dimWidth) : 0,
        height: dimHeight ? Number(dimHeight) : 0,
        unit: dimUnit
      };

      const payload: any = {
        ...data,
        dimensions: finalDimensions,
        attributes: hasVariants ? data.attributes : [],
        variations: hasVariants ? data.variations : [],
      };

      await updateDirectSellingProduct(productId, payload);
      toast({
        title: 'Product Updated Successfully!',
        description: `"${data.name}" changes saved.`
      });
      router.push('/admin/direct-selling');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message
      });
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDirectSellingProduct(productId);
      toast({ title: 'Product Deleted' });
      router.push('/admin/direct-selling');
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      setIsDeleting(false);
    }
  };

  // Approval Handlers
  const handleApprove = async () => {
    try {
      await approveDirectSellingProduct(productId);
      toast({ title: 'Product Approved & Live in Catalog!' });
      loadProduct();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Approval Failed', description: error.message });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsRejecting(true);
    try {
      await rejectDirectSellingProduct(productId, rejectionReason);
      toast({ title: 'Product Rejected', description: 'Partner has been notified with feedback.' });
      setIsRejectingOpen(false);
      loadProduct();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Rejection Failed', description: error.message });
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-500">Loading Product #{productId}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-36">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/direct-selling">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Direct Store Catalog</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Badge variant="outline" className="text-[10px] font-mono font-bold">ID #{productData?.id}</Badge>
                {productData?.approvalStatus === 'pending' && (
                  <Badge className="bg-amber-500 text-amber-950 text-[10px] font-extrabold animate-pulse">Pending Review</Badge>
                )}
                {productData?.approvalStatus === 'approved' && (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold">Approved</Badge>
                )}
                {productData?.approvalStatus === 'rejected' && (
                  <Badge className="bg-rose-600 text-white text-[10px] font-extrabold">Rejected</Badge>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-sm sm:max-w-xl">
                {watchName || 'Edit Product'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link href={`/products/direct/${productId}`} target="_blank">
              <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Live
              </Button>
            </Link>

            {productData?.approvalStatus === 'pending' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  className="h-9 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectingOpen(true)}
                  className="h-9 rounded-xl text-xs font-bold border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                </Button>
              </>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 rounded-xl text-xs font-bold text-destructive hover:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Direct Selling Product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently remove this product from the direct selling catalog.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-white">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Permanently Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="h-9 rounded-xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5 text-xs"
            >
              {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* Partner Attribution Banner if sourced from a partner/freelancer */}
        {(productData?.addedBy === 'printer' || productData?.addedBy === 'freelancer') && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-amber-950 dark:text-amber-200">
                    {productData?.addedBy === 'freelancer' ? 'Freelancer Creator Listing' : 'Printer Partner Inventory'}
                  </h4>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold capitalize">
                    {productData?.addedBy} Sourced
                  </Badge>
                </div>
                <p className="text-xs text-amber-900/70 dark:text-amber-300/70 font-medium mt-0.5">
                  Uploaded by: <strong>{productData?.freelancer?.name || productData?.printer?.companyName || 'Seller Partner'}</strong> ({productData?.freelancer?.email || productData?.printer?.email})
                </p>
              </div>
            </div>

            {productData?.approvalStatus === 'rejected' && productData?.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <strong>Rejection Reason:</strong> {productData.rejectionReason}
              </div>
            )}
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAIN LEFT COLUMN (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Basic Product Info */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" /> Basic Information
                </CardTitle>
                <CardDescription>Product title, category classification, and description.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Product Title *
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Slug: /{watch('slug')}
                    </span>
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g. Classic Bio-Washed Crewneck T-Shirt"
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-sm sm:text-base focus-visible:ring-indigo-500"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs font-bold text-rose-500">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Category *
                    </Label>
                    <Input
                      id="category"
                      placeholder="e.g. Apparel & Clothing, Stationery, Drinkware"
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs sm:text-sm"
                      {...register('category')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Base SKU
                    </Label>
                    <Input
                      id="sku"
                      placeholder="e.g. TSH-001-BASE"
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono uppercase font-bold text-xs"
                      {...register('sku')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Product Description
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Highlight features, material comfort, fabric quality, design details, usage instructions..."
                    className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 font-medium text-xs sm:text-sm resize-y"
                    {...register('description')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Media & Product Gallery */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Media & Product Gallery ({imageUrlsList.length} Photos)
                    </CardTitle>
                    <CardDescription>Upload high resolution photos. The first image is the primary store cover.</CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-8 rounded-xl font-bold text-xs border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                    Upload Image
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                {imageUrlsList.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-all text-center"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Click to upload product images</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Supports PNG, JPG, WebP up to 10MB</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {imageUrlsList.map((url, idx) => (
                      <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
                        <Image src={resolveImagePath(url)} alt={`Image ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform" />
                        
                        {idx === 0 ? (
                          <Badge className="absolute top-2 left-2 bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm pointer-events-none">
                            PRIMARY COVER
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(url)}
                            className="absolute top-2 left-2 bg-black/60 hover:bg-black/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Cover
                          </button>
                        )}

                        <div className="absolute top-2 right-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeImage(url)}
                            className="h-7 w-7 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 text-slate-500 hover:text-indigo-600 transition-all bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> : <Plus className="w-6 h-6 mb-1" />}
                      <span className="text-[11px] font-bold">Add Photo</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Pricing & Inventory */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-indigo-600" /> Pricing & Central Stock
                    </CardTitle>
                    <CardDescription>Default catalog selling price and central stock availability.</CardDescription>
                  </div>
                  {discountPercent > 0 && (
                    <Badge className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                      🏷️ {discountPercent}% OFF (Save ₹{watchCostPrice - watchSellingPrice})
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Selling Price (₹) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400">₹</span>
                      <Input
                        id="sellingPrice"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="499"
                        className="h-11 pl-8 rounded-xl bg-slate-50 dark:bg-slate-950 font-black text-indigo-600 dark:text-indigo-400 text-base"
                        {...register('sellingPrice')}
                      />
                    </div>
                    {errors.sellingPrice && <p className="text-xs font-bold text-rose-500">{errors.sellingPrice.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Regular MRP (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                      <Input
                        id="costPrice"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="799"
                        className="h-11 pl-8 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-sm"
                        {...register('costPrice')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Central Stock Count
                    </Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      placeholder="50"
                      className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-sm"
                      {...register('stockQuantity')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Low Stock Warning Level
                    </Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      min="0"
                      placeholder="5"
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs"
                      {...register('minStockLevel')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hsnCode" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      HSN / SAC Code
                    </Label>
                    <Input
                      id="hsnCode"
                      placeholder="e.g. 6109 (T-Shirts), 4911 (Prints)"
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono font-bold text-xs"
                      {...register('hsnCode')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Product Variants & Multi-Attribute Options */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" /> Options & Multi-Variant Generator
                    </CardTitle>
                    <CardDescription>Configure multiple Sizes, Colors, Materials with independent pricing and stock.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-indigo-100 dark:border-slate-700">
                    <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">Enable Variations</span>
                    <Switch
                      checked={hasVariants}
                      onCheckedChange={setHasVariants}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </div>
                </div>
              </CardHeader>

              {hasVariants && (
                <CardContent className="p-6 space-y-6">
                  {/* Step A: Add Attribute Dimensions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        1. Product Option Dimensions ({watchAttributes.length} Dimensions)
                      </Label>
                    </div>

                    {/* Quick Add Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Add:</span>
                      {['Size', 'Color', 'Material', 'Finish', 'Style', 'Capacity'].map((dim) => {
                        const exists = watchAttributes.some((a: any) => a.name.toLowerCase() === dim.toLowerCase());
                        return (
                          <button
                            key={dim}
                            type="button"
                            onClick={() => {
                              if (!exists) {
                                const newAttrs = [
                                  ...watchAttributes,
                                  { 
                                    id: `attr-${Date.now()}`, 
                                    name: dim, 
                                    options: dim === 'Size' ? ['S', 'M', 'L', 'XL'] : dim === 'Color' ? ['Black', 'White', 'Navy Blue'] : []
                                  }
                                ];
                                setValue('attributes', newAttrs);
                                generateVariationsMatrix(newAttrs);
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-xs font-bold transition-all border",
                              exists
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                            )}
                          >
                            + {dim} {exists && '✓'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Dimension Input */}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add custom option (e.g. Frame Style, Paper GSM)..."
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAttributeDimension(newAttrName);
                          }
                        }}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                      />
                      <Button
                        type="button"
                        onClick={() => addAttributeDimension(newAttrName)}
                        disabled={!newAttrName.trim()}
                        className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
                      </Button>
                    </div>

                    {/* Render Each Active Dimension Box */}
                    {watchAttributes.map((attr: any, attrIdx: number) => (
                      <div key={attr.id || attrIdx} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs px-2.5 py-0.5">
                              {attr.name}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-medium">({attr.options.length} tags)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttributeDimension(attr.id)}
                            className="h-7 w-7 text-slate-400 hover:text-rose-500 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Interactive Tag Chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {attr.options.map((opt: string) => (
                            <span key={opt} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                              {attr.name.toLowerCase().includes('color') && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block"
                                  style={{
                                    backgroundColor: opt.toLowerCase().includes('black') ? '#111'
                                      : opt.toLowerCase().includes('white') ? '#fff'
                                      : opt.toLowerCase().includes('navy') || opt.toLowerCase().includes('blue') ? '#1d4ed8'
                                      : opt.toLowerCase().includes('red') || opt.toLowerCase().includes('maroon') ? '#b91c1c'
                                      : opt.toLowerCase().includes('green') ? '#15803d'
                                      : opt.toLowerCase().includes('gold') || opt.toLowerCase().includes('yellow') ? '#eab308'
                                      : '#6366f1'
                                  }}
                                />
                              )}
                              {opt}
                              <button
                                type="button"
                                onClick={() => removeOptionFromAttribute(attrIdx, opt)}
                                className="text-slate-400 hover:text-rose-500 ml-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}

                          <input
                            placeholder="+ Type option & press Enter"
                            className="h-8 px-3 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-indigo-500 w-44"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const target = e.target as HTMLInputElement;
                                addOptionToAttribute(attrIdx, target.value);
                                target.value = '';
                              }
                            }}
                          />
                        </div>

                        {attr.name.toLowerCase().includes('size') && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Sizes:</span>
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'A4', 'A3', '12x18'].map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => addOptionToAttribute(attrIdx, sz)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
                              >
                                +{sz}
                              </button>
                            ))}
                          </div>
                        )}

                        {attr.name.toLowerCase().includes('color') && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Colors:</span>
                            {['Black', 'White', 'Navy Blue', 'Maroon', 'Olive Green', 'Gold'].map(col => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => addOptionToAttribute(attrIdx, col)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
                              >
                                +{col}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step B: Live Variations Table with Bulk Tools */}
                  {watchVariations.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          2. Generated Variant Matrix ({watchVariations.length} Variants)
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => generateVariationsMatrix(watchAttributes)}
                          className="h-7 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Re-generate Matrix
                        </Button>
                      </div>

                      {/* Bulk Quick Action Bar */}
                      <div className="p-3 bg-indigo-50/50 dark:bg-slate-950 rounded-2xl border border-indigo-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold text-indigo-950 dark:text-indigo-300 text-[11px] uppercase tracking-wider mr-1">Bulk Apply:</span>
                        
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="Price (₹)"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            className="h-8 w-24 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold"
                          />
                          <Button type="button" size="sm" onClick={applyBulkPrice} disabled={!bulkPrice} className="h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs px-2.5">
                            Apply Price
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={bulkStock}
                            onChange={(e) => setBulkStock(e.target.value)}
                            className="h-8 w-20 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold"
                          />
                          <Button type="button" size="sm" onClick={applyBulkStock} disabled={!bulkStock} className="h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs px-2.5">
                            Apply Stock
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="SKU Prefix"
                            value={skuPrefix}
                            onChange={(e) => setSkuPrefix(e.target.value)}
                            className="h-8 w-24 bg-white dark:bg-slate-900 rounded-xl text-xs font-mono uppercase"
                          />
                          <Button type="button" size="sm" onClick={applyAutoSKUs} className="h-8 rounded-xl bg-slate-900 text-white font-bold text-xs px-2.5">
                            Gen SKUs
                          </Button>
                        </div>
                      </div>

                      {/* Variant Rows Table */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                              <tr>
                                <th className="p-3">Status</th>
                                <th className="p-3">Variant Combination</th>
                                <th className="p-3">Selling Price (₹)</th>
                                <th className="p-3">MRP (₹)</th>
                                <th className="p-3">Stock</th>
                                <th className="p-3">Variant SKU</th>
                                <th className="p-3">Photo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950 font-medium">
                              {watchVariations.map((v: any, vIdx: number) => (
                                <tr key={v.id || vIdx} className={cn("hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors", !v.isActive && "opacity-40")}>
                                  <td className="p-3">
                                    <Switch
                                      checked={v.isActive !== false}
                                      onCheckedChange={(val) => {
                                        const updated = [...watchVariations];
                                        updated[vIdx] = { ...v, isActive: val };
                                        setValue('variations', updated);
                                      }}
                                      className="scale-75 data-[state=checked]:bg-emerald-600"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {Object.entries(v.attributes || {}).map(([key, val]) => (
                                        <Badge key={key} variant="outline" className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900">
                                          <span className="text-slate-400 mr-1">{key}:</span>{String(val)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-[10px] text-slate-400">₹</span>
                                      <Input
                                        type="number"
                                        value={v.price ?? ''}
                                        placeholder={String(watchSellingPrice || '0')}
                                        onChange={(e) => {
                                          const updated = [...watchVariations];
                                          updated[vIdx] = { ...v, price: Number(e.target.value) || 0 };
                                          setValue('variations', updated);
                                        }}
                                        className="h-8 w-24 pl-5 font-bold text-xs rounded-lg bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-[10px] text-slate-400">₹</span>
                                      <Input
                                        type="number"
                                        value={v.basePrice ?? ''}
                                        placeholder={String(watchCostPrice || '0')}
                                        onChange={(e) => {
                                          const updated = [...watchVariations];
                                          updated[vIdx] = { ...v, basePrice: Number(e.target.value) || undefined };
                                          setValue('variations', updated);
                                        }}
                                        className="h-8 w-24 pl-5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <Input
                                      type="number"
                                      value={v.stock ?? ''}
                                      placeholder="50"
                                      onChange={(e) => {
                                        const updated = [...watchVariations];
                                        updated[vIdx] = { ...v, stock: Number(e.target.value) || 0 };
                                        setValue('variations', updated);
                                      }}
                                      className="h-8 w-20 text-xs font-bold rounded-lg bg-slate-50 dark:bg-slate-900"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <Input
                                      value={v.sku || ''}
                                      placeholder="SKU"
                                      onChange={(e) => {
                                        const updated = [...watchVariations];
                                        updated[vIdx] = { ...v, sku: e.target.value };
                                        setValue('variations', updated);
                                      }}
                                      className="h-8 w-28 text-xs font-mono uppercase rounded-lg bg-slate-50 dark:bg-slate-900"
                                    />
                                  </td>
                                  <td className="p-3">
                                    {imageUrlsList.length > 0 ? (
                                      <select
                                        value={v.image || ''}
                                        onChange={(e) => {
                                          const updated = [...watchVariations];
                                          updated[vIdx] = { ...v, image: e.target.value };
                                          setValue('variations', updated);
                                        }}
                                        className="h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold px-2"
                                      >
                                        <option value="">Default Photo</option>
                                        {imageUrlsList.map((img, imgIdx) => (
                                          <option key={img} value={img}>Photo #{imgIdx + 1}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">No photos</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* 5. Tiered Volume / Wholesale Price Slabs */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-600" /> Tiered Bulk Volume Discounts (Optional)
                </CardTitle>
                <CardDescription>Reward customers who buy in wholesale quantities (e.g. 10+ pcs, 50+ pcs).</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { qty: 5, price: Math.round(watchSellingPrice * 0.95) },
                    { qty: 10, price: Math.round(watchSellingPrice * 0.90) },
                    { qty: 25, price: Math.round(watchSellingPrice * 0.85) },
                    { qty: 50, price: Math.round(watchSellingPrice * 0.80) },
                  ].map((preset) => (
                    <button
                      key={preset.qty}
                      type="button"
                      onClick={() => addPriceSlab(preset.qty, preset.price)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 hover:bg-indigo-100 transition-colors"
                    >
                      + Tier: Buy {preset.qty}+ @ ₹{preset.price}/ea
                    </button>
                  ))}
                </div>

                {watchPriceSlabs.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Min Quantity</th>
                          <th className="p-2.5">Unit Price</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950 font-semibold">
                        {watchPriceSlabs.map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                            <td className="p-2.5">
                              <Badge variant="outline" className="font-extrabold">≥ {s.quantity} units</Badge>
                            </td>
                            <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">₹{s.price} / unit</td>
                            <td className="p-2.5 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePriceSlab(s.id)}
                                className="h-7 w-7 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 6. Shipping & Package Dimensions */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" /> Package Dimensions & Shipping SLAs
                </CardTitle>
                <CardDescription>Enter parcel size, weight, and delivery timeline.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Package Dimensions (L × W × H) & Weight
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <Input
                        type="number"
                        placeholder="Length (15)"
                        value={dimLength}
                        onChange={(e) => setDimLength(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">Length (cm)</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Width (10)"
                        value={dimWidth}
                        onChange={(e) => setDimWidth(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">Width (cm)</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Height (2)"
                        value={dimHeight}
                        onChange={(e) => setDimHeight(e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">Height (cm)</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Weight (0.25)"
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs"
                        {...register('weight')}
                      />
                      <span className="text-[10px] text-muted-foreground ml-1">Weight (kg)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Standard Delivery SLA</Label>
                    <Input
                      defaultValue="2-4 Business Days"
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-xs"
                      onChange={(e) => setValue('shippingInfo', { ...watch('shippingInfo'), estimatedDays: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Free Delivery Minimum (₹)</Label>
                    <Input
                      type="number"
                      defaultValue={499}
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-xs text-emerald-600"
                      onChange={(e) => setValue('shippingInfo', { ...watch('shippingInfo'), freeDeliveryThreshold: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Express Courier Charge (₹)</Label>
                    <Input
                      type="number"
                      defaultValue={99}
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-xs text-indigo-600"
                      onChange={(e) => setValue('shippingInfo', { ...watch('shippingInfo'), expressCharge: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR RIGHT COLUMN (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Publish Card */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Product Controls</span>
                  <Badge variant={watch('isActive') ? "default" : "secondary"} className="text-[10px] font-extrabold">
                    {watch('isActive') ? "LIVE IN STORE" : "DRAFT"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <Label className="text-xs font-bold text-slate-900 dark:text-white">Active in Store</Label>
                    <p className="text-[10px] text-muted-foreground">Immediate customer ordering</p>
                  </div>
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <Label className="text-xs font-bold text-slate-900 dark:text-white">Featured Showcase</Label>
                    <p className="text-[10px] text-muted-foreground">Highlight on homepage</p>
                  </div>
                  <Controller
                    control={control}
                    name="isFeatured"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-500" />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <Label className="text-xs font-bold text-slate-900 dark:text-white">Custom Inscription / Text</Label>
                    <p className="text-[10px] text-muted-foreground">Allow buyer custom text</p>
                  </div>
                  <Controller
                    control={control}
                    name="textAllowed"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600" />
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 text-sm mt-2"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Save Product Changes
                </Button>
              </CardContent>
            </Card>

            {/* Promotional Badges Card */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-indigo-600" /> Promotional Badge
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <Input
                  placeholder="e.g. 🔥 HOT DEAL, ✨ NEW ARRIVAL"
                  value={watchOfferBadge || ''}
                  onChange={(e) => setValue('offerBadge', e.target.value)}
                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-xs text-indigo-600"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['🔥 BESTSELLER', '✨ NEW ARRIVAL', '⚡ FLASH SALE', '💎 PREMIUM', '🌱 ECO FRIENDLY'].map(badge => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setValue('offerBadge', badge)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400 border border-transparent"
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* GST Tax Rules Card */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" /> GST Tax Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: '18% GST (Standard)', rate: 18 },
                    { name: '12% GST', rate: 12 },
                    { name: '5% GST (Apparel)', rate: 5 },
                    { name: '0% / Exempt', rate: 0 },
                  ].map(tax => (
                    <button
                      key={tax.rate}
                      type="button"
                      onClick={() => setValue('taxSlabs', [{ id: `tax-${tax.rate}`, name: 'GST', rate: tax.rate, type: 'percentage', isInclusive: true, isActive: true }])}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {tax.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specifications Key-Value Pairs Card */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {Object.entries(watchSpecs).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase">{key}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{String(val)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpec(key)}
                      className="h-6 w-6 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center gap-1.5 pt-2">
                  <Input
                    placeholder="Key (e.g. Fabric)"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    className="h-8 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  />
                  <Input
                    placeholder="Value (e.g. 100% Cotton)"
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    className="h-8 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  />
                  <Button
                    type="button"
                    onClick={addCustomSpec}
                    disabled={!specKey || !specVal}
                    className="h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs px-3"
                  >
                    +
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectingOpen} onOpenChange={setIsRejectingOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Reject Product Submission</DialogTitle>
            <DialogDescription>
              Provide feedback for the partner seller to explain what needs correction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              rows={3}
              placeholder="e.g. Please upload higher resolution photos and clarify package dimensions..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-xl font-semibold text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectingOpen(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
