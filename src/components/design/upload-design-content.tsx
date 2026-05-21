'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductBySlug } from '@/app/actions/product-actions';
import { getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';
import { getDieCuts } from '@/app/actions/die-cut-actions';
import { getCardTextures } from '@/app/actions/card-texture-actions';
import { uploadDesign, getDesignUpload } from '@/app/actions/upload-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, UploadCloud, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, ArrowLeft, Upload, Sparkles, Package, ShieldCheck, Layers, Scissors, Stamp, Check, Ruler, FileCheck, Palette, Grid, IndianRupee, Truck, Zap, Lock, Star, Package2, LayoutTemplate, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { resolveImagePath, cn } from '@/lib/utils';
import Link from 'next/link';

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024; // 5MB

type UploadFormValues = {
    name: string;
    description?: string;
    isPublic: boolean;
    file?: any;
    thumbnail?: any;
};

export function UploadDesignContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const productIdSlug = params.productId as string;
    const subProductId = searchParams.get('subProductId');
    const quantity = searchParams.get('quantity');
    const contestId = searchParams.get('contestId');
    const templateId = searchParams.get('templateId');

    const [product, setProduct] = useState<Product | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [pricingRules, setPricingRules] = useState<any[]>([]);
    const [dieCuts, setDieCuts] = useState<any[]>([]);
    const [cardTextures, setCardTextures] = useState<any[]>([]);
    const [isUploading, startUploading] = useTransition();
    const { toast } = useToast();

    const [existingUpload, setExistingUpload] = useState<any>(null);
    const [loadingUpload, setLoadingUpload] = useState(false);

    useEffect(() => {
        getDieCuts().then(setDieCuts);
        getCardTextures().then(setCardTextures);
    }, []);

    useEffect(() => {
        if (templateId) {
            setLoadingUpload(true);
            getDesignUpload(Number(templateId))
                .then(upload => {
                    if (upload) {
                        setExistingUpload(upload);
                    }
                    setLoadingUpload(false);
                })
                .catch(err => {
                    console.error('Failed to load existing design upload', err);
                    setLoadingUpload(false);
                });
        }
    }, [templateId]);

    useEffect(() => {
        if (productIdSlug) {
            getProductBySlug(productIdSlug)
                .then(p => {
                    if (p) {
                        setProduct(p);
                        if (subProductId) {
                            getPricingRulesForSubProduct(Number(subProductId))
                                .then(rules => setPricingRules(rules))
                                .catch(() => {});
                        }
                    }
                    setLoadingProduct(false);
                })
                .catch(() => setLoadingProduct(false));
        }
    }, [productIdSlug, subProductId]);

    const dynamicUploadSchema = useMemo(() => {
        return z.object({
            name: z.string().min(3, 'Design name must be at least 3 characters.'),
            description: z.string().optional(),
            isPublic: z.boolean().default(false),
            file: z
                .custom<FileList>()
                .optional()
                .transform((files) => files && files.length > 0 ? files[0] : undefined)
                .refine(
                    (file) => {
                        if (!templateId) {
                            return !!file;
                        }
                        return true;
                    },
                    "A print-ready file is required."
                )
                .refine(
                    (file) => !file || file.size <= MAX_FILE_SIZE,
                    `File size must be less than 50MB.`
                ),
            thumbnail: z
                .custom<FileList>()
                .optional()
                .transform((files) => files?.[0])
                .refine((file) => !file || file.size <= THUMBNAIL_MAX_SIZE, `Thumbnail must be less than 5MB.`),
        });
    }, [templateId]);

    const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<UploadFormValues>({
        resolver: zodResolver(dynamicUploadSchema),
        defaultValues: { name: '', description: '', isPublic: false }
    });

    useEffect(() => {
        if (existingUpload) {
            reset({
                name: existingUpload.originalFilename || '',
                description: (existingUpload.metadata as any)?.description || '',
                isPublic: existingUpload.isPublic || false,
            });
        }
    }, [existingUpload, reset]);

    const watchFile = watch('file') as any;
    const watchThumbnail = watch('thumbnail') as any;

    const selectedFileObj = watchFile?.[0] || (watchFile instanceof File ? watchFile : null);
    const selectedThumbnailObj = watchThumbnail?.[0] || (watchThumbnail instanceof File ? watchThumbnail : null);

    if (loadingProduct || loadingUpload) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
        );
    }

    if (!product || !subProductId) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4 bg-slate-50 dark:bg-slate-950">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Product Context Missing</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center">We couldn't identify the product or dimensions for your upload. Please select a product and size before proceeding.</p>
                <Button asChild className="rounded-xl font-bold"><Link href="/products">Back to Products Directory</Link></Button>
            </div>
        );
    }
    
    const imageUrl = resolveImagePath(product.imageUrl);

    // Calculate selected customizations
    const subProduct = product?.subProducts?.find(s => s.id === Number(subProductId));
    const pages = searchParams.get('pages') || '1';
    const spotUv = searchParams.get('spotUv') === 'true';
    const dieCutId = searchParams.get('dieCut');
    const selectedDieCut = dieCuts.find(d => d.id === Number(dieCutId));
    const cardTextureId = searchParams.get('cardTexture');
    const selectedTextureObj = cardTextures.find(t => t.id === Number(cardTextureId));
    
    const addonsParam = searchParams.get('addons');
    const selectedAddonIds = addonsParam ? addonsParam.split(',').map(Number) : [];
    const selectedAddonsList = pricingRules.filter(r => selectedAddonIds.includes(r.id));

    const customWidth = searchParams.get('width');
    const customHeight = searchParams.get('height');
    
    const sizeDisplay = subProduct 
        ? (subProduct.width === 0 && subProduct.height === 0 
            ? `Custom Size: ${customWidth || ''} x ${customHeight || ''} ${subProduct.unitType}` 
            : `${subProduct.width} x ${subProduct.height} ${subProduct.unitType}`)
        : '';

    // Calculate Price Breakup
    const qty = parseInt(quantity || '500', 10);
    let basePrice = Number(subProduct?.price || 0);
    let finalPrice = basePrice;
    let discount = 0;
    let discountDescription: string | null = null;

    const standardRule = pricingRules.find(r => !r.isDiscount && !r.isContest && !r.isVerification && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (standardRule && standardRule.unitPrice) {
        basePrice = Number(standardRule.unitPrice);
        finalPrice = basePrice;
    }

    const discountRule = pricingRules.find(r => r.isDiscount && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (discountRule && discountRule.discountValue) {
        if (discountRule.discountType === 'percentage') {
            discount = basePrice * (Number(discountRule.discountValue) / 100);
            discountDescription = `${discountRule.discountValue}% off`;
        } else if (discountRule.discountType === 'fixed') {
            discount = Number(discountRule.discountValue);
            discountDescription = `₹${discountRule.discountValue} off`;
        }
        finalPrice = basePrice - discount;
    }

    let addonTotalPerUnit = 0;
    const addonBreakdown: { name: string; totalAmount: number }[] = [];

    const isDoubleSided = pages === '2';

    if (isDoubleSided && subProduct?.backSideCost) {
        const amount = Number(subProduct.backSideCost);
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: 'Double Sided Printing',
            totalAmount: amount * qty
        });
    }

    if (spotUv) {
        addonBreakdown.push({
            name: 'Spot UV',
            totalAmount: 0
        });
    }

    selectedAddonIds.forEach(id => {
        const rule = pricingRules.find(r => r.id === id); // match rule ID
        if (rule && rule.addonPriceAmount) {
            const amount = Number(rule.addonPriceAmount);
            addonTotalPerUnit += amount;
            addonBreakdown.push({
                name: rule.addonName || 'Extra Add-on',
                totalAmount: amount * qty
            });
        }
    });

    if (selectedDieCut) {
        const customPrices = (subProduct as any)?.dieCutPrices || {};
        const amount = Number(customPrices[selectedDieCut.id] || 0);
            
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: `Die Cut: ${selectedDieCut.name}`,
            totalAmount: amount * qty
        });
    }

    if (selectedTextureObj) {
        const customPrices = (subProduct as any)?.cardTexturePrices || {};
        const amount = Number(customPrices[selectedTextureObj.id] || 0);
            
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: `Card Texture: ${selectedTextureObj.name}`,
            totalAmount: amount * qty
        });
    }

    const calculatedPrice = subProduct ? {
        basePriceTotal: basePrice * qty,
        original: (basePrice + addonTotalPerUnit) * qty,
        final: (finalPrice + addonTotalPerUnit) * qty,
        discount: discount * qty,
        description: discountDescription,
        addons: addonBreakdown,
    } : null;

    const handleUpload = async (data: UploadFormValues) => {
        if (!product || !subProductId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Product context is missing. Please start from the product page.' });
            return;
        }

        const formData = new FormData();
        if (data.file) {
            formData.append('file', data.file);
        }
        formData.append('name', data.name);
        formData.append('isPublic', String(data.isPublic));
        if (data.description) formData.append('description', data.description);
        if (data.thumbnail) {
            formData.append('thumbnail', data.thumbnail);
        }
        if (templateId) {
            formData.append('uploadId', templateId);
        }
        
        if (product?.id) formData.append('productId', String(product.id));
        if (subProductId && subProductId !== 'null') formData.append('subProductId', subProductId);
        if (quantity && quantity !== 'null') formData.append('quantity', quantity);
        if (contestId && contestId !== 'null') formData.append('contestId', contestId);

        const customisation = {
            sizeDisplay,
            customWidth,
            customHeight,
            pages,
            spotUv,
            dieCut: selectedDieCut ? { id: selectedDieCut.id, name: selectedDieCut.name } : null,
            cardTexture: selectedTextureObj ? { id: selectedTextureObj.id, name: selectedTextureObj.name } : null,
            addons: selectedAddonsList.map(a => ({ id: a.id, name: a.addonName, price: a.addonPriceAmount })),
            quantity: qty,
            pricing: calculatedPrice,
            priceBreakup: calculatedPrice,
        };
        formData.append('customisation', JSON.stringify(customisation));

        startUploading(async () => {
            const result = await uploadDesign(formData);
            if (result.success) {
                if (result.redirectTo) {
                    router.push(result.redirectTo);
                } else {
                    toast({ title: 'Upload successful!', description: "Your design has been saved." });
                    router.push('/client/my-uploads');
                }
            } else {
                toast({ variant: 'destructive', title: 'Upload failed', description: result.error });
            }
        });
    };

    return (
        <main className="flex-grow pt-24 sm:pt-28 pb-12 sm:pb-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white print:hidden">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 space-y-8">
                
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
                    <span>›</span>
                    <Link href="/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Products</Link>
                    <span>›</span>
                    <Link href={`/products#${product.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{product.name}</Link>
                    {subProduct && (
                        <>
                            <span>›</span>
                            <span className="text-slate-900 dark:text-white font-bold">{subProduct.name}</span>
                        </>
                    )}
                </nav>

                {/* MAIN SPLIT SECTION: Left (Images & Customizations) | Right (Upload Form & Price Box) */}
                <form onSubmit={handleSubmit(handleUpload)}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* LEFT COLUMN: Media Viewer & Customizations Matrix */}
                        <div className="lg:col-span-6 space-y-6">
                            {/* Main Product Image Viewer */}
                            <div className="aspect-[4/3] relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md group flex items-center justify-center">
                                {imageUrl ? (
                                    <Image 
                                        src={imageUrl} 
                                        alt={product.name} 
                                        fill 
                                        className="object-contain p-8 transition-transform duration-700 group-hover:scale-105" 
                                        priority 
                                    />
                                ) : (
                                    <LayoutTemplate className="h-20 w-20 text-slate-300 dark:text-slate-700" />
                                )}
                                <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all hover:scale-110">
                                    <Search className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Configuration Specs Matrix */}
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-tight border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <Sparkles className="w-4 h-4 animate-pulse" /> Selected Customizations Summary
                                </div>

                                {/* 1. Dimensions */}
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">1.</span> Configured Dimensions
                                    </Label>
                                    <div className="py-2.5 px-4 rounded-2xl border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold text-center shadow ring-2 ring-slate-900/10 dark:ring-white/10">
                                        {sizeDisplay}
                                    </div>
                                </div>

                                {/* 2. Paper & Finishes */}
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">2.</span> Paper Stock & Finishes
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        <div className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold text-center flex items-center justify-center shadow-sm">
                                            {subProduct?.name}
                                        </div>
                                        {spotUv && (
                                            <div className="py-2.5 px-3 rounded-2xl border border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow ring-2 ring-amber-500/20">
                                                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" /> Spot UV
                                            </div>
                                        )}
                                        {selectedAddonsList.map(addon => (
                                            <div key={addon.id} className="py-2.5 px-3 rounded-2xl border border-indigo-600 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow ring-2 ring-indigo-600/20 truncate">
                                                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" /> <span className="truncate">{addon.addonName || 'Add-on'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Card Shape & Die-Cut */}
                                {selectedDieCut && (
                                    <div className="space-y-2.5">
                                        <Label className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">3.</span> Card Shape & Die-Cut
                                        </Label>
                                        <div className="py-2.5 px-4 rounded-2xl border border-indigo-600 bg-indigo-600/5 ring-2 ring-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2">
                                            <Scissors className="w-4 h-4" /> {selectedDieCut.name}
                                        </div>
                                    </div>
                                )}

                                {/* 4. Texture & Tactile Finish */}
                                {selectedTextureObj && (
                                    <div className="space-y-2.5">
                                        <Label className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold">4.</span> Texture & Tactile Finish
                                        </Label>
                                        <div className="py-2.5 px-4 rounded-2xl border border-amber-600 bg-amber-600/5 ring-2 ring-amber-600/20 text-amber-600 dark:text-amber-400 text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2">
                                            <Stamp className="w-4 h-4" /> {selectedTextureObj.name}
                                        </div>
                                    </div>
                                )}

                                {/* 5. Printing Sides & Volume */}
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">5.</span> Printing Sides & Volume
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-sm">
                                            <Layers className="w-4 h-4 text-indigo-500" />
                                            <span>{quantity || '500'} Units</span>
                                        </div>
                                        <div className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-sm">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                            <span>{pages === '2' ? 'Front & Back' : 'Front Only'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Product Title, Upload Form & Price Box */}
                        <div className="lg:col-span-6 space-y-6">
                            {/* Product Title & Reviews Header */}
                            <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                        {subProduct?.name || product.name}
                                    </h1>
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 pt-0.5">
                                        <Package className="w-3.5 h-3.5 inline-block" /> {product.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center text-amber-500 gap-0.5">
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        <Star className="w-4 h-4 fill-amber-500" />
                                    </div>
                                    <span className="text-slate-900 dark:text-white ml-1">4.8</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-medium">(245 Reviews)</span>
                                </div>
                            </div>

                            {/* Artwork Upload Zones & Metadata Container */}
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-tight border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <Upload className="w-4 h-4 animate-pulse" /> Upload Your Artwork & Details
                                </div>
                                
                                {/* 1. Primary Design Artwork */}
                                <div className="space-y-2">
                                    <Label htmlFor="design-file" className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center justify-between uppercase tracking-tight">
                                        <span>1. Primary Design Artwork <span className="text-red-500 dark:text-red-400">*</span></span>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">PDF, AI, PSD, PNG, JPG (Max 50MB)</span>
                                    </Label>

                                    <div className="relative group">
                                        <label htmlFor="design-file" className={cn(
                                            "flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-sm",
                                            selectedFileObj 
                                                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10" 
                                                : existingUpload
                                                    ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/10"
                                                    : errors.file 
                                                        ? "border-red-500/50 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10" 
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-indigo-500/50"
                                        )}>
                                            <div className="flex flex-col items-center justify-center p-6 text-center z-10 w-full">
                                                {selectedFileObj ? (
                                                    <div className="flex flex-col items-center gap-3 w-full animate-in fade-in-50 duration-300">
                                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                                            <CheckCircle2 className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex flex-col items-center max-w-full px-4 space-y-1">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-[360px]">{selectedFileObj.name}</p>
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB • Ready for production</p>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 underline decoration-dotted mt-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Click or drag to replace file</span>
                                                    </div>
                                                ) : existingUpload ? (
                                                    <div className="flex flex-col items-center gap-3 w-full animate-in fade-in-50 duration-300">
                                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                                                            <FileCheck className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex flex-col items-center max-w-full px-4 space-y-1">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-[360px]">{existingUpload.originalFilename}</p>
                                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{(existingUpload.fileSize / (1024 * 1024)).toFixed(2)} MB • Existing submission file</p>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 underline decoration-dotted mt-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Click or drag to replace file</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all duration-300 shadow-sm">
                                                            <UploadCloud className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex flex-col items-center space-y-1">
                                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200"><span className="text-indigo-600 dark:text-indigo-400 font-bold">Click to browse</span> or drag and drop</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">Ensure your artwork is high resolution (300 DPI) and includes required bleed margins.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <Input id="design-file" type="file" className="hidden" {...register('file')} />
                                        </label>
                                    </div>
                                    {errors.file && <p className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.file.message as string}</p>}
                                </div>

                                {/* 2. Preview Thumbnail */}
                                <div className="space-y-2">
                                    <Label htmlFor="thumbnail-file" className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center justify-between uppercase tracking-tight">
                                        <span>2. Preview Thumbnail <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span></span>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">PNG, JPG, WEBP (Max 5MB)</span>
                                    </Label>

                                    <div className="relative group">
                                        <label htmlFor="thumbnail-file" className={cn(
                                            "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-sm",
                                            selectedThumbnailObj 
                                                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10" 
                                                : existingUpload?.thumbnailPath
                                                    ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/10"
                                                    : errors.thumbnail 
                                                        ? "border-red-500/50 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10" 
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                                        )}>
                                            <div className="flex flex-col items-center justify-center p-4 text-center z-10 w-full">
                                                {selectedThumbnailObj ? (
                                                    <div className="flex flex-col items-center gap-2 w-full animate-in fade-in-50 duration-300">
                                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col items-center max-w-full px-4 space-y-0.5">
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-[320px]">{selectedThumbnailObj.name}</p>
                                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{(selectedThumbnailObj.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
                                                        </div>
                                                    </div>
                                                ) : existingUpload?.thumbnailPath ? (
                                                    <div className="flex items-center gap-4 w-full px-6 animate-in fade-in-50 duration-300">
                                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                                                            <Image 
                                                                src={resolveImagePath(existingUpload.thumbnailPath)} 
                                                                alt="Current thumbnail" 
                                                                fill 
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-start space-y-0.5 min-w-0 text-left">
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white">Existing Preview Thumbnail</p>
                                                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Click or drag to replace</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                                            <ImageIcon className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Upload a visual mockup or thumbnail for easy identification</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Input id="thumbnail-file" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" {...register('thumbnail')} />
                                        </label>
                                    </div>
                                    {errors.thumbnail && <p className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.thumbnail.message as string}</p>}
                                </div>

                                {/* 3. Design Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">3. Design Title <span className="text-red-500 dark:text-red-400">*</span></Label>
                                    <Input 
                                        id="name" 
                                        {...register('name')} 
                                        placeholder="e.g., Corporate Business Card - Fall Edition" 
                                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-indigo-500 h-11 rounded-2xl text-sm shadow-sm" 
                                    />
                                    {errors.name && <p className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.name.message}</p>}
                                </div>

                                {/* 4. Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight">4. Project Notes & Instructions <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span></Label>
                                    <Textarea 
                                        id="description" 
                                        {...register('description')} 
                                        placeholder="Add any specific printing instructions, paper stock preferences, or finish details..." 
                                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-indigo-500 min-h-[100px] rounded-2xl text-sm resize-none shadow-sm p-4" 
                                    />
                                </div>

                                {/* 5. Public Showcase */}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex flex-col space-y-0.5">
                                        <Label htmlFor="isPublic" className="text-xs font-bold text-slate-900 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 uppercase tracking-tight">
                                            <Grid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Public Showcase
                                        </Label>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Allow this design to be featured in the community gallery</p>
                                    </div>
                                    <Controller
                                        name="isPublic"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                id="isPublic"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-indigo-600 scale-105"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Price Box Container */}
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
                                {!contestId && (
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Estimated Price</p>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                                                    <IndianRupee className="mr-0.5 stroke-[2.5]" size={24} />
                                                    {calculatedPrice ? calculatedPrice.final.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '...'}
                                                </span>
                                                {calculatedPrice && calculatedPrice.discount > 0 && (
                                                    <>
                                                        <span className="text-base font-bold text-slate-400 dark:text-slate-500 line-through">
                                                            ₹{calculatedPrice.original.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200 dark:border-pink-800 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight">
                                                            {calculatedPrice.description}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 py-2 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Ships in 2-3 Business Days
                                        </div>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                {!contestId && calculatedPrice && (
                                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price Breakdown</p>
                                        <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            <div className="flex justify-between items-center py-1">
                                                <span>Base Product ({quantity || '500'} Cards)</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    ₹{(calculatedPrice.basePriceTotal ?? calculatedPrice.original ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            {calculatedPrice.discount > 0 && (
                                                <div className="flex justify-between items-center py-1 text-pink-600 dark:text-pink-400">
                                                    <span>Volume Discount ({calculatedPrice.description})</span>
                                                    <span className="font-bold">-₹{calculatedPrice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                            {calculatedPrice.addons.map((addon, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/60">
                                                    <span>{addon.name}</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {addon.totalAmount > 0 ? `₹${addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Free'}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
                                                <span>Total Estimated Price</span>
                                                <span>₹{calculatedPrice.final.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Big CTA Button */}
                                <Button 
                                    type="submit" 
                                    disabled={isUploading} 
                                    className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold shadow hover:shadow-md hover:-translate-y-0.5 transition-all text-sm gap-2 group"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading Artwork...</>
                                    ) : (
                                        <><Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> {contestId ? 'Upload Artwork & Submit Entry' : 'Upload Artwork & Proceed to Order'}</>
                                    )}
                                </Button>

                                <div className="text-center pt-1">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Files are securely transferred and stored with enterprise-grade encryption.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* MIDDLE BANNER: Trust Badges Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6 px-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Free Shipping</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">On all orders over ₹5000</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">100% Satisfaction</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">Quality is our priority</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Fast Turnaround</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">Get your prints on time</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm shrink-0">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Secure Payment</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">Safe & secure checkout</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
