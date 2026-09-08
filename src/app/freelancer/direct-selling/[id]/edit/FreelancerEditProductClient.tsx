'use client';

import React, { useState, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateFreelancerDirectSellingProduct } from '@/app/actions/direct-selling-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Eye, Zap, Store
} from 'lucide-react';

const taxSlabSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tax name is required'),
  rate: z.coerce.number().min(0, 'Tax rate must be non-negative'),
  type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  isInclusive: z.boolean().optional().default(false),
  isActive: z.boolean().default(true),
});

const priceSlabSchema = z.object({
  id: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true),
});

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  sku: z.string().optional(),
  hsnCode: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().optional().default(0),
  minStockLevel: z.coerce.number().int().optional().default(5),
  weight: z.coerce.number().optional(),
  sizes: z.any().optional(),
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
  shippingInfo: z.any().optional().default({}),
  textAllowed: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function FreelancerEditProductClient({ product }: { product: any }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(product.imageUrls || []);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Normalize attributes
    const [attributes, setAttributes] = useState<any[]>(() => {
        if (Array.isArray(product.attributes) && product.attributes.length > 0) return product.attributes;
        if (Array.isArray(product.sizes) && product.sizes.length > 0) {
            return [{
                id: 'attr-sizes',
                name: 'Size',
                type: 'button',
                options: product.sizes.map((s: any, idx: number) => ({
                    id: s.id || `opt-${idx}`,
                    name: typeof s === 'string' ? s : s.name,
                    priceAdjustment: s.price !== undefined ? (Number(s.price) - Number(product.sellingPrice || 0)) : 0,
                    stock: s.stock || 50,
                    isActive: s.isActive !== false,
                }))
            }];
        }
        return [];
    });

    const [priceSlabs, setPriceSlabs] = useState<any[]>(product.priceSlabs || []);
    const [taxSlabs, setTaxSlabs] = useState<any[]>(product.taxSlabs || []);
    const [shippingInfo, setShippingInfo] = useState<any>(product.shippingInfo || {});
    const [specs, setSpecs] = useState<any>(product.specifications || {});

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: product.name || '',
            slug: product.slug || '',
            description: product.description || '',
            category: product.category || 'Apparel & Merch',
            sellingPrice: Number(product.sellingPrice || 0),
            costPrice: Number(product.costPrice || 0),
            stockQuantity: Number(product.stockQuantity || 0),
            minStockLevel: Number(product.minStockLevel || 5),
            sku: product.sku || '',
            hsnCode: product.hsnCode || '',
            isFeatured: product.isFeatured || false,
            isActive: product.isActive || true,
            textAllowed: product.textAllowed || false,
            offerBadge: product.offerBadge || '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        }
    });

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'direct-selling');

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            
            const updated = [...imageUrls, data.url];
            setImageUrls(updated);
            setValue('imageUrls', updated.join(', '));
            toast({ title: 'Image uploaded successfully' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (url: string) => {
        const updated = imageUrls.filter(u => u !== url);
        setImageUrls(updated);
        setValue('imageUrls', updated.join(', '));
    };

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const payload: any = {
                ...data,
                imageUrls: imageUrls.join(', '),
                attributes: attributes,
                priceSlabs: priceSlabs,
                taxSlabs: taxSlabs,
                shippingInfo: shippingInfo,
                specifications: specs,
                sizes: [],
                variations: [],
            };

            await updateFreelancerDirectSellingProduct(product.id, payload);
            toast({ title: 'Product Updated!', description: 'Your updates were saved and submitted for review.' });
            router.push('/freelancer/direct-selling');
            router.refresh();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Could not update product.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-24">
            {/* Sticky Header Bar */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold gap-1.5">
                            <Link href="/freelancer/direct-selling">
                                <ArrowLeft size={16} /> Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Store size={20} className="text-amber-500" /> Edit Listing: {product.name}
                            </h1>
                            <p className="text-[11px] text-muted-foreground font-medium">Ecommerce Multivariant & Stock Management</p>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSubmit(onSubmit)} 
                        disabled={isSaving}
                        className="rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 px-6 gap-2"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* 1. General Product Identity */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-black flex items-center gap-2">
                            <Package size={18} className="text-primary" /> 01. General Product Information
                        </CardTitle>
                        <CardDescription className="text-xs">Storefront catalog name and categories</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Product Name *</Label>
                                <Input {...register('name')} className="rounded-xl" />
                                {errors.name && <p className="text-xs text-rose-500 font-bold">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">URL Slug *</Label>
                                <Input {...register('slug')} className="rounded-xl font-mono text-xs" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Category</Label>
                                <Input {...register('category')} className="rounded-xl" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Master SKU</Label>
                                <Input {...register('sku')} className="rounded-xl font-mono text-xs" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">HSN / SAC Code</Label>
                                <Input {...register('hsnCode')} className="rounded-xl font-mono text-xs" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider">Description</Label>
                            <Textarea {...register('description')} rows={4} className="rounded-xl" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Media Gallery */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-black flex items-center gap-2">
                            <ImageIcon size={18} className="text-amber-500" /> 02. Product Image Gallery
                        </CardTitle>
                        <CardDescription className="text-xs">Product mockups and variation preview photos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {imageUrls.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                                    <Image src={resolveImagePath(url)} alt={`Image ${idx + 1}`} fill className="object-cover" />
                                    {idx === 0 && (
                                        <Badge className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0">MAIN</Badge>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(url)}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-500 transition-colors"
                            >
                                {isUploading ? <Loader2 size={20} className="animate-spin text-amber-500" /> : <Upload size={20} />}
                                <span className="text-[10px] font-bold">Add Photo</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Pricing, Taxes & Stock */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-black flex items-center gap-2">
                            <DollarSign size={18} className="text-emerald-500" /> 03. Pricing & Master Stock
                        </CardTitle>
                        <CardDescription className="text-xs">Selling rate, strikethrough MRP, and overall inventory</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Selling Price (₹) *</Label>
                                <Input type="number" step="0.01" {...register('sellingPrice')} className="rounded-xl font-black text-base" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">MRP / Base Price (₹)</Label>
                                <Input type="number" step="0.01" {...register('costPrice')} className="rounded-xl" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Total Stock Units</Label>
                                <Input type="number" {...register('stockQuantity')} className="rounded-xl font-bold" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase tracking-wider">Low Stock Threshold</Label>
                                <Input type="number" {...register('minStockLevel')} className="rounded-xl" />
                            </div>
                        </div>

                        {/* Text Customization Toggle */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-black uppercase tracking-wider">Allow Buyer Custom Text / Inscription</Label>
                                <p className="text-[11px] text-muted-foreground">Prompt the customer to type custom names or quotes during checkout</p>
                            </div>
                            <Controller
                                name="textAllowed"
                                control={control}
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Attributes & Options */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <Layers size={18} className="text-indigo-500" /> 04. Attributes & Variations (Colors, Sizes, Styles)
                            </CardTitle>
                            <CardDescription className="text-xs">Swatches, button pickers, and per-variant stock tracking</CardDescription>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setAttributes(prev => [
                                    ...prev,
                                    {
                                        id: `attr-${Date.now()}`,
                                        name: 'New Attribute',
                                        type: 'button',
                                        options: [{ id: `opt-${Date.now()}`, name: 'Option 1', priceAdjustment: 0, stock: 20, isActive: true }]
                                    }
                                ]);
                            }}
                            className="rounded-xl font-bold text-xs gap-1.5"
                        >
                            <Plus size={14} /> Add Attribute
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {attributes.map((attr, attrIdx) => (
                            <div key={attr.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Input
                                            value={attr.name}
                                            onChange={e => {
                                                const updated = [...attributes];
                                                updated[attrIdx].name = e.target.value;
                                                setAttributes(updated);
                                            }}
                                            className="h-9 font-black text-xs rounded-xl w-48 bg-white dark:bg-slate-900"
                                            placeholder="e.g. Color, Size, Style"
                                        />
                                        <select
                                            value={attr.type || 'button'}
                                            onChange={e => {
                                                const updated = [...attributes];
                                                updated[attrIdx].type = e.target.value;
                                                setAttributes(updated);
                                            }}
                                            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                                        >
                                            <option value="color">Color Swatch (Hex)</option>
                                            <option value="button">Button / Pill Option</option>
                                            <option value="select">Dropdown Select</option>
                                        </select>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setAttributes(prev => prev.filter((_, i) => i !== attrIdx))}
                                        className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:text-rose-600"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>

                                {/* Options list */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground grid grid-cols-12 gap-2 px-2">
                                        <span className="col-span-3">Option Name</span>
                                        {attr.type === 'color' && <span className="col-span-3">Hex Color Code</span>}
                                        <span className={attr.type === 'color' ? "col-span-3" : "col-span-4"}>Price Diff (₹)</span>
                                        <span className={attr.type === 'color' ? "col-span-2" : "col-span-3"}>Stock</span>
                                        <span className="col-span-1 text-center">Del</span>
                                    </div>

                                    {attr.options.map((opt: any, optIdx: number) => (
                                        <div key={opt.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                            <div className="col-span-3">
                                                <Input
                                                    value={opt.name}
                                                    onChange={e => {
                                                        const updated = [...attributes];
                                                        updated[attrIdx].options[optIdx].name = e.target.value;
                                                        setAttributes(updated);
                                                    }}
                                                    className="h-8 text-xs font-bold rounded-lg"
                                                />
                                            </div>

                                            {attr.type === 'color' && (
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={opt.value || '#000000'}
                                                        onChange={e => {
                                                            const updated = [...attributes];
                                                            updated[attrIdx].options[optIdx].value = e.target.value;
                                                            setAttributes(updated);
                                                        }}
                                                        className="w-7 h-7 rounded-lg border border-black/10 cursor-pointer p-0 shrink-0"
                                                    />
                                                    <Input
                                                        value={opt.value || '#000000'}
                                                        onChange={e => {
                                                            const updated = [...attributes];
                                                            updated[attrIdx].options[optIdx].value = e.target.value;
                                                            setAttributes(updated);
                                                        }}
                                                        className="h-8 text-xs font-mono rounded-lg"
                                                    />
                                                </div>
                                            )}

                                            <div className={attr.type === 'color' ? "col-span-3" : "col-span-4"}>
                                                <Input
                                                    type="number"
                                                    value={opt.priceAdjustment || 0}
                                                    onChange={e => {
                                                        const updated = [...attributes];
                                                        updated[attrIdx].options[optIdx].priceAdjustment = Number(e.target.value);
                                                        setAttributes(updated);
                                                    }}
                                                    className="h-8 text-xs font-semibold rounded-lg"
                                                />
                                            </div>

                                            <div className={attr.type === 'color' ? "col-span-2" : "col-span-3"}>
                                                <Input
                                                    type="number"
                                                    value={opt.stock || 0}
                                                    onChange={e => {
                                                        const updated = [...attributes];
                                                        updated[attrIdx].options[optIdx].stock = Number(e.target.value);
                                                        setAttributes(updated);
                                                    }}
                                                    className="h-8 text-xs font-bold rounded-lg"
                                                />
                                            </div>

                                            <div className="col-span-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...attributes];
                                                        updated[attrIdx].options = updated[attrIdx].options.filter((_: any, idx: number) => idx !== optIdx);
                                                        setAttributes(updated);
                                                    }}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            const updated = [...attributes];
                                            updated[attrIdx].options.push({
                                                id: `opt-${Date.now()}`,
                                                name: `Option ${updated[attrIdx].options.length + 1}`,
                                                value: attr.type === 'color' ? '#000000' : undefined,
                                                priceAdjustment: 0,
                                                stock: 20,
                                                isActive: true
                                            });
                                            setAttributes(updated);
                                        }}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 h-8 gap-1"
                                    >
                                        <Plus size={12} /> Add Option to {attr.name}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 5. Volume / B2B Price Slabs */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <Coins size={18} className="text-amber-500" /> 05. Volume Discount Packages & Bulk Slabs
                            </CardTitle>
                            <CardDescription className="text-xs">Quantity price tiers for bulk buyers</CardDescription>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setPriceSlabs(prev => [
                                    ...prev,
                                    { id: `slab-${Date.now()}`, quantity: 100, price: 7500, isActive: true }
                                ]);
                            }}
                            className="rounded-xl font-bold text-xs gap-1.5"
                        >
                            <Plus size={14} /> Add Volume Slab
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {priceSlabs.map((slab, idx) => (
                                <div key={slab.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 relative group">
                                    <button
                                        type="button"
                                        onClick={() => setPriceSlabs(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider">Quantity (Pcs)</Label>
                                        <Input
                                            type="number"
                                            value={slab.quantity}
                                            onChange={e => {
                                                const updated = [...priceSlabs];
                                                updated[idx].quantity = Number(e.target.value);
                                                setPriceSlabs(updated);
                                            }}
                                            className="h-8 text-xs font-black rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider">Package Total (₹)</Label>
                                        <Input
                                            type="number"
                                            value={slab.price}
                                            onChange={e => {
                                                const updated = [...priceSlabs];
                                                updated[idx].price = Number(e.target.value);
                                                setPriceSlabs(updated);
                                            }}
                                            className="h-8 text-xs font-black rounded-lg"
                                        />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-semibold">
                                        ₹{(slab.price / (slab.quantity || 1)).toFixed(2)} / pc effective
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Action CTA */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Button asChild variant="outline" className="rounded-xl font-bold">
                        <Link href="/freelancer/direct-selling">Cancel</Link>
                    </Button>
                    <Button 
                        onClick={handleSubmit(onSubmit)} 
                        disabled={isSaving}
                        className="rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 px-8 h-12 gap-2"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Save & Update Product
                    </Button>
                </div>
            </div>
        </div>
    );
}
