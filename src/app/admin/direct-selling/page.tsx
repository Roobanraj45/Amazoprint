'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  getDirectSellingProducts, 
  createDirectSellingProduct, 
  updateDirectSellingProduct, 
  deleteDirectSellingProduct,
  approveDirectSellingProduct,
  rejectDirectSellingProduct
} from '@/app/actions/direct-selling-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, PlusCircle, Edit, Trash2, IndianRupee, Image as ImageIcon, 
  Upload, X, Search, Filter, XCircle, Package, Sparkles, CheckCircle2, 
  DollarSign, SlidersHorizontal, Layers, Clock, Factory, ShieldCheck, 
  Check, MessageSquare, AlertCircle, Store, Percent, Receipt, Coins, Plus,
  Truck, Tag, Flame, Zap, HelpCircle, FileText, Gift
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveImagePath, cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  name: z.string().min(1, 'Name is required'),
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
  dimensions: jsonFromString.optional(),
  sizes: z.any().optional(),
  taxSlabs: z.array(taxSlabSchema).optional().default([]),
  priceSlabs: z.array(priceSlabSchema).optional().default([]),
  offers: z.array(z.any()).optional().default([]),
  offerBadge: z.string().optional().nullable(),
  specifications: z.any().optional().default({}),
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: jsonFromString.optional(),
  shippingInfo: z.any().optional().default({}),
  textAllowed: z.boolean().default(false),
});

type Product = Awaited<ReturnType<typeof getDirectSellingProducts>>[0];

// --- Image Manager Component ---
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
        <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Images</Label>
            <div className="p-3 sm:p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {urls.map((url, idx) => (
                        <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                            <Image src={resolveImagePath(url)} alt={`Product image ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            {idx === 0 && (
                                <Badge variant="secondary" className="absolute top-2 left-2 bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm pointer-events-none z-10">
                                    MAIN
                                </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="destructive" size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                                    onClick={() => handleDelete(url)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                     <label className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm p-2 text-center">
                        {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" /> : <Upload className="h-6 w-6 mb-1" />}
                        <span className="text-[11px] font-bold mt-1">Upload Image</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>
            </div>
             <p className="text-xs text-muted-foreground font-medium italic">The first image uploaded will automatically serve as the primary product catalog showcase image.</p>
        </div>
    );
}

// --- Size & Pricing / Stock Manager ---
export interface SizeOption {
    id: string;
    name: string;
    price?: number;
    basePrice?: number;
    stock?: number;
    sku?: string;
    isActive?: boolean;
}

function SizePricingManager({ value, onChange, defaultPrice }: { value?: any; onChange: (val: SizeOption[]) => void; defaultPrice?: number }) {
    const [inputName, setInputName] = useState('');
    const [inputPrice, setInputPrice] = useState<string>('');
    const [inputBasePrice, setInputBasePrice] = useState<string>('');
    const [inputStock, setInputStock] = useState<string>('');

    const sizes: SizeOption[] = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value.map((s: any, idx: number) => {
                if (typeof s === 'string') {
                    return { id: `sz-${idx}-${Date.now()}`, name: s, isActive: true };
                }
                return {
                    id: s.id || `sz-${idx}-${Date.now()}`,
                    name: s.name || s.size || `Size ${idx + 1}`,
                    price: s.price !== undefined && s.price !== null && s.price !== '' ? Number(s.price) : undefined,
                    basePrice: s.basePrice !== undefined && s.basePrice !== null && s.basePrice !== '' ? Number(s.basePrice) : undefined,
                    stock: s.stock !== undefined && s.stock !== null && s.stock !== '' ? Number(s.stock) : undefined,
                    sku: s.sku || '',
                    isActive: s.isActive !== false,
                };
            });
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map((s: any, idx: number) => typeof s === 'string' ? { id: `sz-${idx}`, name: s, isActive: true } : { ...s, id: s.id || `sz-${idx}` });
                }
            } catch {
                return value.split(',').map((s, idx) => ({ id: `sz-${idx}`, name: s.trim(), isActive: true })).filter(s => s.name);
            }
        }
        return [];
    }, [value]);

    const addSize = (nameToAdd: string, p?: number, bp?: number, st?: number) => {
        const trimmed = nameToAdd.trim();
        if (!trimmed) return;
        if (!sizes.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
            const newEntry: SizeOption = {
                id: `sz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: trimmed,
                price: p !== undefined && !isNaN(p) ? p : undefined,
                basePrice: bp !== undefined && !isNaN(bp) ? bp : undefined,
                stock: st !== undefined && !isNaN(st) ? st : undefined,
                sku: '',
                isActive: true,
            };
            onChange([...sizes, newEntry]);
        }
        setInputName('');
        setInputPrice('');
        setInputBasePrice('');
        setInputStock('');
    };

    const updateSize = (idx: number, field: keyof SizeOption, val: any) => {
        const updated = [...sizes];
        updated[idx] = { ...updated[idx], [field]: val };
        onChange(updated);
    };

    const removeSize = (idToRemove: string) => {
        onChange(sizes.filter(s => s.id !== idToRemove));
    };

    const PRESETS = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'A5', 'A4', 'A3', '12x18', '4x6', '5x7', '8x10'];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Size-Wise Pricing & Inventory ({sizes.length} Options)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Set unique selling price, MRP, and stock count for each product size variation.</p>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {sizes.filter(s => s.isActive !== false).length} Active
                </span>
            </div>

            {/* Quick Presets */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Add Presets:</span>
                {PRESETS.map((preset) => {
                    const isAdded = sizes.some(s => s.name.toLowerCase() === preset.toLowerCase());
                    return (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => {
                                if (!isAdded) addSize(preset);
                            }}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border",
                                isAdded
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm cursor-default"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-600"
                            )}
                        >
                            {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                        </button>
                    );
                })}
            </div>

            {/* List of Configured Sizes */}
            {sizes.length > 0 && (
                <div className="space-y-2.5">
                    {sizes.map((sz, idx) => (
                        <div key={sz.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-bold">
                                        {idx + 1}
                                    </span>
                                    {sz.name}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <Label className="text-[10px] font-bold text-slate-400">Active</Label>
                                        <Switch
                                            checked={sz.isActive !== false}
                                            onCheckedChange={(val) => updateSize(idx, 'isActive', val)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSize(sz.id)}
                                        className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                <div className="space-y-1 sm:col-span-1">
                                    <Label className="text-[10px] font-bold text-slate-500">Size Name</Label>
                                    <Input
                                        value={sz.name}
                                        onChange={(e) => updateSize(idx, 'name', e.target.value)}
                                        className="h-8 text-xs font-bold rounded-lg"
                                        placeholder="e.g. XL"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-500">Selling Price (₹)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={sz.price !== undefined ? sz.price : ''}
                                        onChange={(e) => updateSize(idx, 'price', e.target.value === '' ? undefined : Number(e.target.value))}
                                        className="h-8 text-xs font-bold rounded-lg text-emerald-600 dark:text-emerald-400"
                                        placeholder={defaultPrice ? `₹${defaultPrice}` : '0.00'}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-500">MRP / Base (₹)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={sz.basePrice !== undefined ? sz.basePrice : ''}
                                        onChange={(e) => updateSize(idx, 'basePrice', e.target.value === '' ? undefined : Number(e.target.value))}
                                        className="h-8 text-xs font-bold rounded-lg text-slate-400"
                                        placeholder="Strikethrough"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-500">Stock Qty</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={sz.stock !== undefined ? sz.stock : ''}
                                        onChange={(e) => updateSize(idx, 'stock', e.target.value === '' ? undefined : Number(e.target.value))}
                                        className="h-8 text-xs font-bold rounded-lg"
                                        placeholder="Available"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-500">Variant SKU</Label>
                                    <Input
                                        value={sz.sku || ''}
                                        onChange={(e) => updateSize(idx, 'sku', e.target.value)}
                                        className="h-8 text-xs font-mono font-bold rounded-lg uppercase"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Custom Size Inputs */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input
                        placeholder="Size Name (e.g. 12x18, XXL)"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 font-bold"
                    />
                    <Input
                        type="number"
                        placeholder="Selling Price ₹"
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                    />
                    <Input
                        type="number"
                        placeholder="MRP / Base Price ₹"
                        value={inputBasePrice}
                        onChange={(e) => setInputBasePrice(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                    />
                    <Input
                        type="number"
                        placeholder="Stock Quantity"
                        value={inputStock}
                        onChange={(e) => setInputStock(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                    />
                </div>
                <div className="flex justify-end">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            const p = inputPrice ? Number(inputPrice) : undefined;
                            const bp = inputBasePrice ? Number(inputBasePrice) : undefined;
                            const st = inputStock ? Number(inputStock) : undefined;
                            addSize(inputName, p, bp, st);
                        }}
                        disabled={!inputName.trim()}
                        className="h-8 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <PlusCircle size={14} className="mr-1.5" /> Add Size Variation
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Delivery Options Manager ---
function DeliveryOptionsManager({ value, onChange }: { value?: any; onChange: (val: any) => void }) {
    const data = useMemo(() => {
        if (!value) return {};
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return {}; }
        }
        return value;
    }, [value]);

    const update = (field: string, val: any) => {
        onChange({ ...data, [field]: val });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Estimated Delivery</Label>
                    <Input
                        placeholder="e.g. 2-4 Business Days"
                        value={data.estimatedDays || ''}
                        onChange={(e) => update('estimatedDays', e.target.value)}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                        {['1-2 Days', '2-4 Days', '3-5 Days', 'Same Day'].map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => update('estimatedDays', chip)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Standard Shipping Fee (₹)</Label>
                    <Input
                        type="number"
                        min="0"
                        placeholder="0 (Free Delivery)"
                        value={data.deliveryCharge !== undefined ? data.deliveryCharge : ''}
                        onChange={(e) => update('deliveryCharge', e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                    <span className="text-[10px] text-muted-foreground">Leave 0 for Free Delivery.</span>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Free Shipping Above (₹)</Label>
                    <Input
                        type="number"
                        min="0"
                        placeholder="499"
                        value={data.freeDeliveryThreshold !== undefined ? data.freeDeliveryThreshold : ''}
                        onChange={(e) => update('freeDeliveryThreshold', e.target.value === '' ? '' : Number(e.target.value))}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                    <span className="text-[10px] text-muted-foreground">Free shipping threshold for cart total.</span>
                </div>
            </div>

            {/* Express Delivery */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" /> Express Delivery Option
                        </Label>
                        <p className="text-[11px] text-muted-foreground">Offer priority high-speed courier dispatch to customers.</p>
                    </div>
                    <Switch
                        checked={data.expressDeliveryAvailable ?? false}
                        onCheckedChange={(val) => update('expressDeliveryAvailable', val)}
                    />
                </div>

                {data.expressDeliveryAvailable && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Express Delivery Time</Label>
                            <Input
                                placeholder="e.g. 24 Hours / 1-2 Days"
                                value={data.expressDays || ''}
                                onChange={(e) => update('expressDays', e.target.value)}
                                className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Express Fee (₹)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="99"
                                value={data.expressCharge !== undefined ? data.expressCharge : ''}
                                onChange={(e) => update('expressCharge', e.target.value === '' ? '' : Number(e.target.value))}
                                className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Cash on Delivery, Dispatch, Return */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Cash on Delivery</Label>
                        <p className="text-[10px] text-muted-foreground">Enable COD orders</p>
                    </div>
                    <Switch
                        checked={data.codAvailable ?? true}
                        onCheckedChange={(val) => update('codAvailable', val)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dispatch Turnaround</Label>
                    <Input
                        placeholder="e.g. Ships within 24 hours"
                        value={data.dispatchTime || ''}
                        onChange={(e) => update('dispatchTime', e.target.value)}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Return / Replacement Policy</Label>
                    <Input
                        placeholder="e.g. 7 Days Replacement Guarantee"
                        value={data.returnPolicy || ''}
                        onChange={(e) => update('returnPolicy', e.target.value)}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                </div>
            </div>
        </div>
    );
}

// --- Offers & Deals Manager ---
function OffersManager({
    offerBadge,
    onOfferBadgeChange,
    offers,
    onOffersChange
}: {
    offerBadge?: string | null;
    onOfferBadgeChange: (val: string) => void;
    offers?: any[];
    onOffersChange: (val: any[]) => void;
}) {
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const offerList = Array.isArray(offers) ? offers : [];

    const addOffer = (title: string, desc?: string) => {
        if (!title.trim()) return;
        const newOffer = {
            id: `offer-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            title: title.trim(),
            description: desc?.trim() || '',
        };
        onOffersChange([...offerList, newOffer]);
        setNewTitle('');
        setNewDesc('');
    };

    const removeOffer = (id: string) => {
        onOffersChange(offerList.filter(o => o.id !== id));
    };

    const BADGE_PRESETS = [
        '🔥 LIMITED TIME DEAL',
        '⚡ FLASH SALE - 20% OFF',
        'FESTIVE COMBO OFFER',
        'SPECIAL LAUNCH PRICE',
        'BUY 2 SAVE EXTRA',
        'BESTSELLER DEAL',
    ];

    const OFFER_PRESETS = [
        { title: '🏷️ Bank Offer', desc: '5% Instant Discount up to ₹100 on UPI orders' },
        { title: '🎁 Bulk Purchase Deal', desc: 'Automatic package slab rate applied on volume orders' },
        { title: '🚚 Free Express Shipping', desc: 'Complimentary shipping on orders over ₹499' },
        { title: '🛡️ 100% Quality Assurance', desc: 'Safe bubble packaging with transit damage replacement' },
    ];

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Deal Highlight Tag / Badge
                </Label>
                <Input
                    placeholder="e.g. 🔥 LIMITED TIME DEAL, ⚡ 20% OFF TODAY"
                    value={offerBadge || ''}
                    onChange={(e) => onOfferBadgeChange(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-bold text-rose-600 dark:text-rose-400"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {BADGE_PRESETS.map((badge) => (
                        <button
                            key={badge}
                            type="button"
                            onClick={() => onOfferBadgeChange(badge)}
                            className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors"
                        >
                            {badge}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        Active Promotional Perks & Coupons ({offerList.length})
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Displayed on the product detail page</span>
                </div>

                {offerList.length > 0 && (
                    <div className="space-y-2">
                        {offerList.map((o: any) => (
                            <div key={o.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-slate-900 dark:text-white block">{o.title}</span>
                                    {o.description && <span className="text-[11px] text-slate-500 font-medium block">{o.description}</span>}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOffer(o.id)}
                                    className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                            placeholder="Offer Title (e.g. 🏷️ Extra ₹50 Off)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold"
                        />
                        <Input
                            placeholder="Offer Description (e.g. Valid on UPI / Card payments)"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => addOffer(newTitle, newDesc)}
                            disabled={!newTitle.trim()}
                            className="h-8 px-3 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Offer Perk
                        </Button>
                    </div>
                </div>

                <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Add Perks:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {OFFER_PRESETS.map((preset) => (
                            <button
                                key={preset.title}
                                type="button"
                                onClick={() => addOffer(preset.title, preset.desc)}
                                className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors"
                            >
                                + {preset.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Product Specifications & Operational Parameters Manager ---
function SpecificationsManager({ value, onChange }: { value?: any; onChange: (val: any) => void }) {
    const data = useMemo(() => {
        if (!value) return {};
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return {}; }
        }
        return value;
    }, [value]);

    const update = (field: string, val: any) => {
        onChange({ ...data, [field]: val });
    };

    return (
        <div className="space-y-5">
            {/* Technical / Material Attributes */}
            <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> Material & Print Attributes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Material / Paper GSM</Label>
                        <Input
                            placeholder="e.g. 350 GSM Heavy Art Card"
                            value={data.material || ''}
                            onChange={(e) => update('material', e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Surface Finish</Label>
                        <Input
                            placeholder="e.g. Matte Lamination / UV Gloss"
                            value={data.finish || ''}
                            onChange={(e) => update('finish', e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Print Method</Label>
                        <Input
                            placeholder="e.g. Digital Offset / UV Flatbed"
                            value={data.printType || ''}
                            onChange={(e) => update('printType', e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                </div>
            </div>

            {/* Dimensions, Brand, Origin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Display Dimensions</Label>
                    <Input
                        placeholder="e.g. 21 x 29.7 cm (A4) / 12x18 inch"
                        value={data.dimensionsFormatted || ''}
                        onChange={(e) => update('dimensionsFormatted', e.target.value)}
                        className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Brand / Maker</Label>
                    <Input
                        placeholder="e.g. AmazoPrint Premium"
                        value={data.brand || ''}
                        onChange={(e) => update('brand', e.target.value)}
                        className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Country of Origin</Label>
                    <Input
                        placeholder="e.g. Made in India"
                        value={data.originCountry || ''}
                        onChange={(e) => update('originCountry', e.target.value)}
                        className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                    />
                </div>
            </div>

            {/* Operational Parameters */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Operational & Production Controls
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Min Order Qty (MOQ)</Label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={data.minOrderQuantity || ''}
                            onChange={(e) => update('minOrderQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Max Order Qty</Label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="1000"
                            value={data.maxOrderQuantity || ''}
                            onChange={(e) => update('maxOrderQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Production Lead Time</Label>
                        <Input
                            placeholder="e.g. 1-2 Business Days"
                            value={data.leadTime || ''}
                            onChange={(e) => update('leadTime', e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Print Quality Warranty</Label>
                        <Input
                            placeholder="e.g. 100% Print Perfection Guarantee"
                            value={data.warranty || ''}
                            onChange={(e) => update('warranty', e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Care & Handling Instructions</Label>
                        <Input
                            placeholder="e.g. Store flat in dry place, avoid moisture"
                            value={data.careInstructions || ''}
                            onChange={(e) => update('careInstructions', e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---
export default function DirectSellingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Rejection Dialog State
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'admin' | 'printer'>('all');

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

  // Derived metrics
  const totalCount = products.length;
  const adminCount = products.filter(p => p.addedBy === 'admin').length;
  const printerCount = products.filter(p => p.addedBy === 'printer').length;
  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = products.filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = products.filter(p => p.approvalStatus === 'rejected').length;

  // Derived filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.printer?.fullName && p.printer.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.printer?.companyName && p.printer.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || p.approvalStatus === statusFilter;
      const matchesSource = sourceFilter === 'all' || p.addedBy === sourceFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesSource;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, sourceFilter]);

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

  const handleApprove = async (id: number) => {
    try {
      await approveDirectSellingProduct(id);
      toast({ 
        title: 'Product Approved', 
        description: 'Product is now approved and live in the store catalog.' 
      });
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Approval Failed', description: error.message });
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingProduct) return;
    if (!rejectionReason.trim()) {
      toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for rejection.' });
      return;
    }

    setIsRejecting(true);
    try {
      await rejectDirectSellingProduct(rejectingProduct.id, rejectionReason.trim());
      toast({ 
        title: 'Product Rejected', 
        description: 'Product status set to rejected with feedback sent to the printer.' 
      });
      setRejectingProduct(null);
      setRejectionReason('');
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
      setIsRejecting(false);
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
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
            <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
            <XCircle size={11} className="text-rose-600 dark:text-rose-400" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap animate-pulse">
            <Clock size={11} className="text-amber-600 dark:text-amber-400" />
            Pending Approval
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 w-full overflow-hidden">
      {/* Stunning Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                <Package className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Direct Selling Inventory Engine
              </Badge>
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-amber-950 font-extrabold text-xs px-3 py-1 rounded-full animate-bounce">
                  {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">Direct Selling Management</h1>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
              Create, organize, review partner submissions, approve direct physical inventory, and manage stock thresholds.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Dialog open={isFormOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingProduct(null); }}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-11 sm:h-12 rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-5 sm:px-6 transition-all hover:scale-[1.02] w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Direct Product
                </Button>
              </DialogTrigger>
              <ProductForm onSubmit={handleFormSubmit} product={editingProduct} onClose={() => setFormOpen(false)} />
            </Dialog>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-indigo-500/40 transition-colors" onClick={() => { setStatusFilter('all'); setSourceFilter('all'); }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Products</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Package size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setStatusFilter('pending')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-blue-500/40 transition-colors" onClick={() => setSourceFilter('printer')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Printer Partners</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{printerCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Factory size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-indigo-500/40 transition-colors" onClick={() => setSourceFilter('admin')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Admin Catalog</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{adminCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar - Fully Responsive Stack */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-4">
        {/* Top row: Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'All Products' : tab}
              {tab === 'pending' && pendingCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom row: Search + Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by title, SKU, category, or printer..." 
              className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <Select value={sourceFilter} onValueChange={(val: any) => setSourceFilter(val)}>
              <SelectTrigger className="w-full sm:w-[140px] h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-semibold text-xs">All Sources</SelectItem>
                <SelectItem value="admin" className="font-semibold text-xs">Admin Created</SelectItem>
                <SelectItem value="printer" className="font-semibold text-xs">Printer Created</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold text-xs">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="font-semibold text-xs">
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-11 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0" 
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); setSourceFilter('all'); }}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading direct selling inventory...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={`group border rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full ${product.approvalStatus === 'pending' ? 'border-amber-400/80 dark:border-amber-500/50 ring-2 ring-amber-400/20' : 'border-slate-200/80 dark:border-slate-800/80'}`}>
                <div className="flex-1 flex flex-col">
                  <CardHeader className="p-0 relative flex-shrink-0">
                      <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950 relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                          {product.imageUrls?.[0] ? (
                              <Image src={resolveImagePath(product.imageUrls[0])} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2">
                                  <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">No Image</span>
                              </div>
                          )}
                      </div>
                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
                          {getStatusBadge(product.approvalStatus)}
                          {product.isActive ? (
                            <Badge className="bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-800/80 text-slate-300 font-bold text-[9px] px-2 py-0.5 rounded-md backdrop-blur-md">
                              Inactive
                            </Badge>
                          )}
                      </div>

                      {/* Creator / Printer attribution badge */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 max-w-[60%]">
                          {product.addedBy === 'printer' && product.printer ? (
                            <Badge variant="secondary" className="bg-blue-600/95 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md backdrop-blur-md flex items-center gap-1 truncate">
                              <Factory size={10} className="shrink-0" />
                              <span className="truncate">{product.printer.companyName || product.printer.fullName}</span>
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-900/80 text-slate-200 border border-slate-700 font-bold text-[9px] px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1">
                              <ShieldCheck size={10} className="text-indigo-400 shrink-0" />
                              Admin
                            </Badge>
                          )}
                          {product.isFeatured && (
                            <Badge variant="secondary" className="bg-amber-400 text-amber-950 font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 self-start">
                              <Sparkles className="w-2.5 h-2.5" /> Featured
                            </Badge>
                          )}
                      </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">{product.category || 'Uncategorized'}</p>
                          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 mt-1 min-h-[2.5rem] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {product.name}
                          </CardTitle>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {/* Printer Info snippet if added by printer */}
                        {product.addedBy === 'printer' && product.printer && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                              <span className="font-medium text-[11px] shrink-0">Partner:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{product.printer.fullName}</span>
                            </div>
                          </div>
                        )}

                        {/* Rejection Note if rejected */}
                        {product.approvalStatus === 'rejected' && product.rejectionReason && (
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                            <span className="font-bold">Reason: </span>
                            <span className="line-clamp-2">{product.rejectionReason}</span>
                          </div>
                        )}

                        {/* Badges: Deal, Sizes, Delivery, GST and Price Slabs */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(product as any).offerBadge && (
                            <Badge className="text-[9px] font-black bg-rose-500 hover:bg-rose-600 text-white px-1.5 py-0 h-4 shadow-sm">
                              {(product as any).offerBadge}
                            </Badge>
                          )}
                          {((product.sizes as any) && (product.sizes as any).length > 0) && (
                            <Badge variant="outline" className="text-[9px] font-black border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30 px-1.5 py-0 h-4">
                              {(product.sizes as any).length} Sizes
                            </Badge>
                          )}
                          {(product as any).shippingInfo?.deliveryCharge === 0 && (
                            <Badge variant="outline" className="text-[9px] font-black border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 px-1.5 py-0 h-4 flex items-center gap-0.5">
                              <Truck className="w-2.5 h-2.5" /> Free Delivery
                            </Badge>
                          )}
                          {(product as any).taxSlabs?.filter((t: any) => t.isActive).map((t: any) => (
                            <Badge key={t.id || t.name} variant="outline" className="text-[9px] font-black border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 px-1.5 py-0 h-4">
                              {t.name} {t.rate}%
                            </Badge>
                          ))}
                          {(product as any).priceSlabs?.filter((s: any) => s.isActive).length > 0 && (
                            <Badge variant="outline" className="text-[9px] font-black border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 px-1.5 py-0 h-4">
                              {(product as any).priceSlabs.filter((s: any) => s.isActive).length} Slabs
                            </Badge>
                          )}
                        </div>

                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center">
                                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 mr-0.5 text-indigo-500" />
                                {product.sellingPrice}
                            </span>
                            <Badge variant={product.stockQuantity > (product.minStockLevel || 0) ? 'secondary' : 'destructive'} className={`h-5 sm:h-6 text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 rounded-lg shadow-sm ${product.stockQuantity > (product.minStockLevel || 0) ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' : 'bg-red-500 text-white'}`}>
                                {product.stockQuantity} in stock
                            </Badge>
                        </div>
                      </div>
                  </CardContent>
                </div>

                <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 flex-shrink-0 mt-auto">
                  {/* Approval Action Bar for Pending Products */}
                  {product.approvalStatus === 'pending' && (
                    <div className="flex items-center gap-1.5 w-full">
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 sm:h-9 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        onClick={() => handleApprove(product.id)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 sm:h-9 px-2.5 rounded-xl text-xs font-bold border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => { setRejectingProduct(product); setRejectionReason(''); }}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 w-full">
                    <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 text-xs font-bold transition-colors" onClick={() => { setEditingProduct(product); setFormOpen(true); }}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-destructive text-xs font-bold transition-colors">
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl max-w-md mx-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg sm:text-xl font-bold">Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm font-medium">This action will permanently delete this direct selling product and its associated media. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="h-9 sm:h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="h-9 sm:h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDelete(product.id)}>Permanently Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center px-4 gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">No Products Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">No direct selling inventory matches your current search query or filter selection.</p>
            <Button variant="outline" className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 shadow-sm mt-1 text-xs" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); setSourceFilter('all'); }}>
                Clear All Filters
            </Button>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingProduct} onOpenChange={(open) => { if (!open) setRejectingProduct(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6 bg-background border-slate-200 dark:border-slate-800 shadow-2xl mx-4">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Rejection Feedback
              </Badge>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold">Reject Product Submission</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Provide feedback for &ldquo;{rejectingProduct?.name}&rdquo;. The printer partner will see this reason so they can make corrections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Reason for Rejection *
              </Label>
              <Textarea 
                id="reason"
                placeholder="e.g. Please provide higher resolution product images and specify the exact material dimensions..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold p-3 text-xs sm:text-sm focus-visible:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Please upload higher resolution images.',
                'Invalid pricing tier or dimensions.',
                'Incomplete description or specifications.',
                'Duplicate item already in catalog.'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setRejectionReason(suggestion)}
                  className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800" 
              onClick={() => setRejectingProduct(null)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              disabled={isRejecting || !rejectionReason.trim()} 
              className="h-10 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 px-5"
              onClick={handleRejectSubmit}
            >
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Product Form Component ---
function ProductForm({ onSubmit, product, onClose }: { onSubmit: (data: any) => void; product: Product | null; onClose: () => void; }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxSlabs: [],
      priceSlabs: [],
      hsnCode: '',
      sizes: [],
      offers: [],
      offerBadge: '',
      specifications: {},
      shippingInfo: {},
    },
  });

  const taxSlabs = watch('taxSlabs') || [];
  const priceSlabs = watch('priceSlabs') || [];
  const baseSellingPrice = watch('sellingPrice') || 0;

  useEffect(() => {
    if (product) {
        let normalizedSizes: any[] = [];
        if (product.sizes) {
            if (Array.isArray(product.sizes)) {
                normalizedSizes = product.sizes.map((s: any, idx: number) => {
                    if (typeof s === 'string') {
                        return { id: `sz-${idx}-${Date.now()}`, name: s, isActive: true };
                    }
                    return {
                        id: s.id || `sz-${idx}-${Date.now()}`,
                        name: s.name || s.size || `Size ${idx + 1}`,
                        price: s.price !== undefined && s.price !== null && s.price !== '' ? Number(s.price) : undefined,
                        basePrice: s.basePrice !== undefined && s.basePrice !== null && s.basePrice !== '' ? Number(s.basePrice) : undefined,
                        stock: s.stock !== undefined && s.stock !== null && s.stock !== '' ? Number(s.stock) : undefined,
                        sku: s.sku || '',
                        isActive: s.isActive !== false,
                    };
                });
            } else if (typeof product.sizes === 'string') {
                try {
                    const parsed = JSON.parse(product.sizes);
                    if (Array.isArray(parsed)) {
                        normalizedSizes = parsed.map((s: any, idx: number) => typeof s === 'string' ? { id: `sz-${idx}`, name: s, isActive: true } : { ...s, id: s.id || `sz-${idx}` });
                    }
                } catch {
                    normalizedSizes = product.sizes.split(',').map((s: string, idx: number) => ({ id: `sz-${idx}`, name: s.trim(), isActive: true })).filter(s => s.name);
                }
            }
        }

        reset({
            ...product,
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
            weight: Number(product.weight),
            imageUrls: product.imageUrls?.join(', ') || '',
            tags: product.tags?.join(', ') || '',
            sizes: normalizedSizes,
            hsnCode: (product as any).hsnCode || '',
            taxSlabs: (product as any).taxSlabs || [],
            priceSlabs: (product as any).priceSlabs || [],
            offers: (product as any).offers || [],
            offerBadge: (product as any).offerBadge || '',
            specifications: (product as any).specifications || {
                brand: 'AmazoPrint Premium',
                originCountry: 'Made in India',
                minOrderQuantity: 1,
                leadTime: '1-2 Business Days',
                warranty: '100% Print Perfection Guarantee',
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
            dimensions: product.dimensions ? JSON.stringify(product.dimensions, null, 2) : '',
            supplierInfo: product.supplierInfo ? JSON.stringify(product.supplierInfo, null, 2) : '',
            textAllowed: !!product.textAllowed,
            isActive: product.isActive ?? true,
        });
    } else {
      reset({ 
        name: '', slug: '', description: '', category: '', costPrice: 0, sellingPrice: 0, sku: '', hsnCode: '', 
        taxSlabs: [], priceSlabs: [], stockQuantity: 0, minStockLevel: 5, weight: 0, dimensions: '', 
        sizes: [], 
        offers: [], 
        offerBadge: '', 
        specifications: {
            brand: 'AmazoPrint Premium',
            originCountry: 'Made in India',
            minOrderQuantity: 1,
            leadTime: '1-2 Business Days',
            warranty: '100% Print Perfection Guarantee',
        }, 
        shippingInfo: {
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
        imageUrls: '', tags: '', isFeatured: false, isActive: true, supplierInfo: '', textAllowed: false 
      });
    }
  }, [product, reset]);

  return (
    <DialogContent className="sm:max-w-4xl h-[92vh] flex flex-col p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden mx-2 sm:mx-auto">
      <DialogHeader className="p-5 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                        <Package className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                        Direct Selling Engine
                    </Badge>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">{product ? 'Edit Direct Selling Product' : 'Create Direct Selling Product'}</DialogTitle>
                <DialogDescription className="text-slate-300 text-xs sm:text-sm mt-1">Configure size variations, pricing tiers, delivery options, promotional offers, and specifications.</DialogDescription>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                <Package className="w-7 h-7 text-indigo-400" />
            </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 sm:px-8 mt-4 flex-shrink-0">
            <TabsList className="flex overflow-x-auto sm:grid sm:grid-cols-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-full shadow-inner">
              <TabsTrigger value="basic" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Identity</TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Pricing & Sizes</TabsTrigger>
              <TabsTrigger value="delivery" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Delivery Options</TabsTrigger>
              <TabsTrigger value="offers" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Offers & Deals</TabsTrigger>
              <TabsTrigger value="specs" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Specifications</TabsTrigger>
              <TabsTrigger value="media" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Media & Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
              {/* TAB 1: BASIC IDENTITY */}
              <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            General Product Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Name</Label>
                                <Input id="name" placeholder="e.g. Premium Executive Pen" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('name')} />
                                {errors.name && <p className="text-xs font-bold text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">URL Slug</Label>
                                <Input id="slug" placeholder="e.g. premium-executive-pen" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('slug')} />
                                {errors.slug && <p className="text-xs font-bold text-destructive mt-1">{errors.slug.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</Label>
                                <Input id="category" placeholder="e.g. Stationery, Accessories" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('category')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Base SKU</Label>
                                <Input id="sku" placeholder="e.g. PEN-EXEC-001" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold uppercase" {...register('sku')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Description</Label>
                            <Textarea id="description" placeholder="Provide a detailed, compelling description of the product features, materials, and benefits..." className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-4" {...register('description')} rows={4} />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: PRICING, SLABS & SIZE VARIATIONS */}
              <TabsContent value="pricing" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Base Pricing Matrix & Inventory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="costPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cost Price (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="costPrice" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('costPrice')} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Base Selling Price (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="sellingPrice" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('sellingPrice')} />
                                </div>
                                {errors.sellingPrice && <p className="text-xs font-bold text-destructive mt-1">{errors.sellingPrice.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="stockQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Overall Stock Quantity</Label>
                                <Input id="stockQuantity" type="number" placeholder="0" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('stockQuantity')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Minimum Stock Alert Threshold</Label>
                                <Input id="minStockLevel" type="number" placeholder="5" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('minStockLevel')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="hsnCode" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">HSN / SAC Code</Label>
                                <Input id="hsnCode" placeholder="e.g. 49111090" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs font-bold" {...register('hsnCode')} />
                            </div>
                        </div>

                        {/* Tax & GST Slabs */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        Tax & GST Slabs ({taxSlabs.filter((t: any) => t.isActive).length} Active)
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">Configure GST rates applied automatically at checkout.</p>
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
                                    className="h-8 rounded-xl text-xs font-bold border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 shrink-0"
                                >
                                    <Plus className="mr-1 h-3 w-3" /> Add Tax Slab
                                </Button>
                            </div>

                            <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                    <Receipt className="w-3.5 h-3.5 text-emerald-500" /> Quick Add Tax:
                                </span>
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
                                        className="h-6 px-2 text-[10px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600"
                                    >
                                        +{preset.name}
                                    </Button>
                                ))}
                            </div>

                            {taxSlabs.length > 0 && (
                                <div className="space-y-2.5">
                                    {taxSlabs.map((taxItem: any, idx: number) => (
                                        <div key={taxItem.id || idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Slab #{idx + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-[10px] font-bold text-slate-500">Active</Label>
                                                    <Switch
                                                        checked={taxItem.isActive ?? true}
                                                        onCheckedChange={(val) => {
                                                            const updated = [...taxSlabs];
                                                            updated[idx].isActive = val;
                                                            setValue('taxSlabs', updated, { shouldDirty: true });
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setValue('taxSlabs', taxSlabs.filter((_: any, i: number) => i !== idx), { shouldDirty: true });
                                                        }}
                                                        className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <Input
                                                    placeholder="Tax Name"
                                                    value={taxItem.name}
                                                    onChange={(e) => {
                                                        const updated = [...taxSlabs];
                                                        updated[idx].name = e.target.value;
                                                        setValue('taxSlabs', updated, { shouldDirty: true });
                                                    }}
                                                    className="h-8 text-xs font-semibold rounded-lg"
                                                />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Rate %"
                                                    value={taxItem.rate}
                                                    onChange={(e) => {
                                                        const updated = [...taxSlabs];
                                                        updated[idx].rate = parseFloat(e.target.value) || 0;
                                                        setValue('taxSlabs', updated, { shouldDirty: true });
                                                    }}
                                                    className="h-8 text-xs font-bold rounded-lg"
                                                />
                                                <div className="flex items-center justify-between px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                                    <span className="text-[10px] font-bold text-slate-500">Inclusive</span>
                                                    <Switch
                                                        checked={taxItem.isInclusive ?? false}
                                                        onCheckedChange={(val) => {
                                                            const updated = [...taxSlabs];
                                                            updated[idx].isInclusive = val;
                                                            setValue('taxSlabs', updated, { shouldDirty: true });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quantity Price Slabs */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Coins className="w-4 h-4 text-amber-500" />
                                        Quantity Price Slabs ({priceSlabs.filter((s: any) => s.isActive).length} Active)
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">Offer bulk package discounts for orders at specific quantities.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setValue('priceSlabs', [
                                            ...priceSlabs,
                                            { id: `slab-${Date.now()}`, quantity: 5, price: 500, isActive: true }
                                        ], { shouldDirty: true });
                                    }}
                                    className="h-8 rounded-xl text-xs font-bold border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 shrink-0"
                                >
                                    <Plus className="mr-1 h-3 w-3" /> Add Quantity Slab
                                </Button>
                            </div>

                            {priceSlabs.length > 0 && (
                                <div className="space-y-2.5">
                                    {priceSlabs.map((slabItem: any, idx: number) => {
                                        const qty = Number(slabItem.quantity) || 1;
                                        const prc = Number(slabItem.price) || 0;
                                        const unitRate = (prc / qty).toFixed(2);
                                        return (
                                            <div key={slabItem.id || idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">Package #{idx + 1}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-[10px] font-bold text-slate-500">Active</Label>
                                                        <Switch
                                                            checked={slabItem.isActive ?? true}
                                                            onCheckedChange={(val) => {
                                                                const updated = [...priceSlabs];
                                                                updated[idx].isActive = val;
                                                                setValue('priceSlabs', updated, { shouldDirty: true });
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setValue('priceSlabs', priceSlabs.filter((_: any, i: number) => i !== idx), { shouldDirty: true });
                                                            }}
                                                            className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        placeholder="Qty"
                                                        value={slabItem.quantity}
                                                        onChange={(e) => {
                                                            const updated = [...priceSlabs];
                                                            updated[idx].quantity = parseInt(e.target.value) || 1;
                                                            setValue('priceSlabs', updated, { shouldDirty: true });
                                                        }}
                                                        className="h-8 rounded-lg text-xs font-bold"
                                                    />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        placeholder="Price ₹"
                                                        value={slabItem.price}
                                                        onChange={(e) => {
                                                            const updated = [...priceSlabs];
                                                            updated[idx].price = parseFloat(e.target.value) || 0;
                                                            setValue('priceSlabs', updated, { shouldDirty: true });
                                                        }}
                                                        className="h-8 rounded-lg text-xs font-bold"
                                                    />
                                                    <div className="flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-500">
                                                        ₹{unitRate}/unit
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Size-Wise Pricing & Stock */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Controller
                                name="sizes"
                                control={control}
                                render={({ field }) => (
                                    <SizePricingManager value={field.value} onChange={field.onChange} defaultPrice={Number(baseSellingPrice)} />
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: DELIVERY OPTIONS */}
              <TabsContent value="delivery" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Delivery, Shipping Rates & Returns Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <Controller
                            name="shippingInfo"
                            control={control}
                            render={({ field }) => (
                                <DeliveryOptionsManager value={field.value} onChange={field.onChange} />
                            )}
                        />
                    </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: OFFERS & PROMOTIONAL DEALS */}
              <TabsContent value="offers" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Gift className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Promotional Deals, Badges & Customer Perks
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <OffersManager
                            offerBadge={watch('offerBadge')}
                            onOfferBadgeChange={(val) => setValue('offerBadge', val, { shouldDirty: true })}
                            offers={watch('offers')}
                            onOffersChange={(val) => setValue('offers', val, { shouldDirty: true })}
                        />
                    </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 5: SPECIFICATIONS & OPERATIONAL CONTROLS */}
              <TabsContent value="specs" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Technical Specifications & Operational Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <Controller
                            name="specifications"
                            control={control}
                            render={({ field }) => (
                                <SpecificationsManager value={field.value} onChange={field.onChange} />
                            )}
                        />
                    </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 6: MEDIA, WEIGHT & META SETTINGS */}
              <TabsContent value="media" className="space-y-4 sm:space-y-6 mt-0">
                 <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                     <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                         <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                             Media Gallery & Visibility Controls
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                         <Controller
                            name="imageUrls"
                            control={control}
                            render={({ field }) => (
                                <ImageManager value={field.value} onChange={field.onChange} />
                            )}
                        />
                        {errors.imageUrls && <p className="text-xs font-bold text-destructive mt-1">{errors.imageUrls.message}</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Physical Weight (kg)</Label>
                                <Input id="weight" type="number" step="0.01" placeholder="e.g. 0.5" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('weight')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Search Keywords / Tags</Label>
                                <Input id="tags" {...register('tags')} placeholder="e.g. premium, gift, executive" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold text-xs" />
                            </div>
                        </div>

                        {/* Customer Engraving & Text Customization */}
                        <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm gap-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="textAllowed" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Enable Custom Text Inputs</Label>
                                <p className="text-xs text-muted-foreground font-medium">Permit buyers to supply custom text, names, or messages to be printed or engraved on this product during checkout.</p>
                            </div>
                            <Controller 
                              name="textAllowed" 
                              control={control} 
                              render={({ field }) => (
                                <Switch id="textAllowed" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600 shrink-0" />
                              )} 
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isFeatured" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Featured Product</Label>
                                    <p className="text-[11px] text-muted-foreground font-medium">Highlight on the home catalog.</p>
                                </div>
                                <Controller name="isFeatured" control={control} render={({ field }) => <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-500 shrink-0" />} />
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product is Active</Label>
                                    <p className="text-[11px] text-muted-foreground font-medium">Allow customers to view and buy.</p>
                                </div>
                                <Controller name="isActive" control={control} render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600 shrink-0" />} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
          <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Save Direct Product
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}