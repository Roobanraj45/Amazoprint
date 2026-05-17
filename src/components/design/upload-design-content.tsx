'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductBySlug } from '@/app/actions/product-actions';
import { uploadDesign } from '@/app/actions/upload-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, UploadCloud, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, ArrowLeft, Upload, Sparkles, Package, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { resolveImagePath, cn } from '@/lib/utils';
import Link from 'next/link';

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadSchema = z.object({
    name: z.string().min(3, 'Design name must be at least 3 characters.'),
    description: z.string().optional(),
    isPublic: z.boolean().default(false),
    file: z
        .custom<FileList>()
        .refine((files) => files?.length > 0, "A print-ready file is required.")
        .transform((files) => files[0]!)
        .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than 50MB.`),
    thumbnail: z
        .custom<FileList>()
        .optional()
        .transform((files) => files?.[0])
        .refine((file) => !file || file.size <= THUMBNAIL_MAX_SIZE, `Thumbnail must be less than 5MB.`),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadDesignContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const productIdSlug = params.productId as string;
    const subProductId = searchParams.get('subProductId');
    const quantity = searchParams.get('quantity');

    const [product, setProduct] = useState<Product | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [isUploading, startUploading] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        if (productIdSlug) {
            getProductBySlug(productIdSlug)
                .then(p => {
                    if (p) setProduct(p);
                    setLoadingProduct(false);
                })
                .catch(() => setLoadingProduct(false));
        }
    }, [productIdSlug]);

    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
        defaultValues: { name: '', description: '', isPublic: false }
    });

    const watchFile = watch('file') as any;
    const watchThumbnail = watch('thumbnail') as any;

    const selectedFileObj = watchFile?.[0] || (watchFile instanceof File ? watchFile : null);
    const selectedThumbnailObj = watchThumbnail?.[0] || (watchThumbnail instanceof File ? watchThumbnail : null);

    const handleUpload = async (data: UploadFormValues) => {
        if (!product || !subProductId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Product context is missing. Please start from the product page.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('name', data.name);
        formData.append('isPublic', String(data.isPublic));
        if (data.description) formData.append('description', data.description);
        if (data.thumbnail) formData.append('thumbnail', data.thumbnail);
        
        formData.append('productId', String(product.id));
        formData.append('subProductId', subProductId);
        if (quantity) formData.append('quantity', quantity);

        startUploading(async () => {
            const result = await uploadDesign(formData);
            if (result.success) {
                if (result.redirectTo) {
                    router.push(result.redirectTo);
                } else {
                    toast({ title: 'Upload successful!', description: "Your design has been added to 'My Uploads'." });
                    router.push('/client/my-uploads');
                }
            } else {
                toast({ variant: 'destructive', title: 'Upload failed', description: result.error });
            }
        });
    };
    
    if (loadingProduct) {
        return (
            <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-sm font-medium text-slate-400 animate-pulse">Preparing upload environment...</p>
            </div>
        );
    }

    if (!product || !subProductId) {
        return (
            <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/10">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Product Context Missing</h1>
                <p className="text-slate-400 max-w-md mb-8">We couldn't identify the product or dimensions for your upload. Please select a product and size before proceeding.</p>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-indigo-600/25 transition-all">
                    <Link href="/products"><ArrowLeft className="w-5 h-5 mr-2" /> Explore Products</Link>
                </Button>
            </div>
        );
    }
    
    const imageUrl = resolveImagePath(product.imageUrl);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden print:hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[128px] pointer-events-none" />

            <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden relative z-10 flex flex-col">
                {/* Header Banner */}
                <div className="border-b border-slate-800/80 bg-slate-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
                        <div className="h-20 w-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner shrink-0 relative overflow-hidden group">
                            {imageUrl ? (
                                <Image src={imageUrl} alt={product.name} fill className="object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <Package className="h-10 w-10 text-slate-400 group-hover:scale-110 transition-transform duration-500" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Direct Upload
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                                    {quantity} Units
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{product.name}</h1>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Submit your custom print-ready artwork files for production</p>
                        </div>
                    </div>

                    <Button asChild variant="ghost" size="sm" className="z-10 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 rounded-xl px-4 py-2 self-start sm:self-center">
                        <Link href={`/products/${product.slug}`}><ArrowLeft className="w-4 h-4 mr-2" /> Change Product</Link>
                    </Button>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit(handleUpload)} className="flex-1 p-6 sm:p-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: File Upload Zones */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="design-file" className="text-sm font-bold text-slate-200 flex items-center justify-between">
                                    <span>1. Primary Design Artwork <span className="text-red-400">*</span></span>
                                    <span className="text-xs font-medium text-slate-400">PDF, AI, PSD, PNG, JPG (Max 50MB)</span>
                                </Label>

                                <div className="relative group">
                                    <label htmlFor="design-file" className={cn(
                                        "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-sm",
                                        selectedFileObj 
                                            ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10" 
                                            : errors.file 
                                                ? "border-red-500/50 bg-red-500/5 hover:bg-red-500/10" 
                                                : "border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 hover:border-indigo-500/50"
                                    )}>
                                        <div className="flex flex-col items-center justify-center p-6 text-center z-10 w-full">
                                            {selectedFileObj ? (
                                                <div className="flex flex-col items-center gap-3 w-full animate-in fade-in-50 duration-300">
                                                    <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                                        <CheckCircle2 className="w-8 h-8" />
                                                    </div>
                                                    <div className="flex flex-col items-center max-w-full px-4">
                                                        <p className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-[360px]">{selectedFileObj.name}</p>
                                                        <p className="text-xs text-emerald-400 font-medium mt-0.5">{(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB • Ready for production</p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-400 underline decoration-dotted mt-1 hover:text-slate-200 transition-colors">Click or drag to replace file</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 shadow-lg shadow-indigo-500/5">
                                                        <UploadCloud className="w-8 h-8" />
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <p className="text-sm font-semibold text-slate-200"><span className="text-indigo-400 font-bold">Click to browse</span> or drag and drop</p>
                                                        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Ensure your artwork is high resolution (300 DPI) and includes required bleed margins.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <Input id="design-file" type="file" className="hidden" {...register('file')} />
                                    </label>
                                </div>
                                {errors.file && <p className="text-xs font-semibold text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.file.message as string}</p>}
                            </div>

                            {/* Thumbnail Upload Zone */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="thumbnail-file" className="text-sm font-bold text-slate-200 flex items-center justify-between">
                                    <span>2. Preview Thumbnail <span className="text-slate-500 font-normal">(Optional)</span></span>
                                    <span className="text-xs font-medium text-slate-400">PNG, JPG, WEBP (Max 5MB)</span>
                                </Label>

                                <div className="relative group">
                                    <label htmlFor="thumbnail-file" className={cn(
                                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-sm",
                                        selectedThumbnailObj 
                                            ? "border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10" 
                                            : errors.thumbnail 
                                                ? "border-red-500/50 bg-red-500/5 hover:bg-red-500/10" 
                                                : "border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600"
                                    )}>
                                        <div className="flex flex-col items-center justify-center p-4 text-center z-10 w-full">
                                            {selectedThumbnailObj ? (
                                                <div className="flex flex-col items-center gap-2 w-full animate-in fade-in-50 duration-300">
                                                    <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 shadow-md">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col items-center max-w-full px-4">
                                                        <p className="text-xs font-bold text-white truncate max-w-[240px] sm:max-w-[320px]">{selectedThumbnailObj.name}</p>
                                                        <p className="text-[10px] text-indigo-400 font-medium">{(selectedThumbnailObj.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-110 transition-all duration-300">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-300">Upload a visual mockup or thumbnail for easy identification</p>
                                                </div>
                                            )}
                                        </div>
                                        <Input id="thumbnail-file" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" {...register('thumbnail')} />
                                    </label>
                                </div>
                                {errors.thumbnail && <p className="text-xs font-semibold text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.thumbnail.message as string}</p>}
                            </div>
                        </div>

                        {/* Right Column: Design Metadata & Settings */}
                        <div className="lg:col-span-5 flex flex-col gap-6 bg-slate-800/30 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-sm self-start w-full">
                            <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" /> Artwork Specifications
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold text-slate-200">Design Title <span className="text-red-400">*</span></Label>
                                <Input 
                                    id="name" 
                                    {...register('name')} 
                                    placeholder="e.g., Corporate Business Card - Fall Edition" 
                                    className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-12 rounded-xl text-sm" 
                                />
                                {errors.name && <p className="text-xs font-semibold text-red-400 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-bold text-slate-200">Project Notes & Instructions <span className="text-slate-500 font-normal">(Optional)</span></Label>
                                <Textarea 
                                    id="description" 
                                    {...register('description')} 
                                    placeholder="Add any specific printing instructions, paper stock preferences, or finish details..." 
                                    className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 min-h-[120px] rounded-xl text-sm resize-none" 
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border">
                                <div className="flex flex-col">
                                    <Label htmlFor="isPublic" className="text-sm font-bold text-slate-200 cursor-pointer">Public Showcase</Label>
                                    <p className="text-xs text-slate-400 mt-0.5">Allow this design to be featured in the community gallery</p>
                                </div>
                                <Controller
                                    name="isPublic"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            id="isPublic"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-indigo-600"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer / Submit Section */}
                    <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Files are securely transferred and stored with enterprise-grade encryption.</span>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isUploading} 
                            className="w-full sm:w-auto min-w-[240px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 text-base group"
                        >
                            {isUploading ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading Artwork...</>
                            ) : (
                                <><Upload className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" /> Upload & Proceed to Order</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
