'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMyUploads, uploadDesign, deleteUpload } from '@/app/actions/upload-actions';
import { getProducts } from '@/app/actions/product-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Loader2, UploadCloud, File, Trash2, Globe, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { resolveImagePath } from '@/lib/utils';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Upload = Awaited<ReturnType<typeof getMyUploads>>[0];
type Product = Awaited<ReturnType<typeof getProducts>>[0];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadSchema = z.object({
    name: z.string().min(3, 'Design name must be at least 3 characters.'),
    description: z.string().optional(),
    isPublic: z.boolean().default(false),
    productId: z.coerce.number().optional(),
    subProductId: z.coerce.number().optional(),
    file: z
        .custom<FileList>()
        .refine((files) => files?.length > 0, "A file is required.")
        .transform((files) => files[0]!)
        .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than 50MB.`),
    thumbnail: z
        .custom<FileList>()
        .optional()
        .transform((files) => files?.[0])
        .refine((file) => !file || file.size <= THUMBNAIL_MAX_SIZE, `Thumbnail must be less than 5MB.`),
});

type UploadFormValues = z.infer<typeof uploadSchema>;


function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function MyUploadsClient({ initialUploads }: { initialUploads: Upload[] }) {
    const [uploads, setUploads] = useState<Upload[]>(initialUploads);
    const [products, setProducts] = useState<Product[]>([]);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isUploading, startUploading] = useTransition();
    const { toast } = useToast();

    const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
        defaultValues: {
            name: '',
            description: '',
            isPublic: false,
        }
    });

    const selectedProductId = watch('productId');
    const selectedProduct = products.find(p => p.id === Number(selectedProductId));

    useEffect(() => {
        async function fetchProducts() {
            try {
                const fetchedProducts = await getProducts();
                setProducts(fetchedProducts);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load products',
                    description: 'Could not fetch product list for dropdown.',
                });
            }
        }
        fetchProducts();
    }, [toast]);
    
    useEffect(() => {
        if (selectedProductId) {
            setValue('subProductId', undefined);
        }
    }, [selectedProductId, setValue]);

    const handleUpload = async (data: UploadFormValues) => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('name', data.name);
        formData.append('isPublic', String(data.isPublic));
        if (data.description) {
            formData.append('description', data.description);
        }
        if (data.thumbnail) {
            formData.append('thumbnail', data.thumbnail);
        }
        if (data.productId) {
            formData.append('productId', String(data.productId));
        }
        if (data.subProductId) {
            formData.append('subProductId', String(data.subProductId));
        }

        startUploading(async () => {
            const result = await uploadDesign(formData);
            if (result.success) {
                toast({ title: 'Upload successful!' });
                const updatedUploads = await getMyUploads();
                setUploads(updatedUploads);
                setIsUploadDialogOpen(false);
                reset();
            } else {
                toast({ variant: 'destructive', title: 'Upload failed', description: result.error });
            }
        });
    };

    const handleDelete = (id: number) => {
        startUploading(async () => {
            try {
                await deleteUpload(id);
                setUploads(prev => prev.filter(u => u.id !== id));
                toast({ title: 'File deleted successfully.' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to delete file', description: error.message });
            }
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                    if (!open) reset();
                    setIsUploadDialogOpen(open);
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground hover:brightness-110 font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-xl shadow-lg shadow-primary/20"><UploadCloud className="mr-2 h-4 w-4" /> Upload New File</Button>
                    </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Your Design File</DialogTitle>
                                    <DialogDescription>
                                        Upload your print-ready file. Max file size: 50MB.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit(handleUpload)} id="upload-form">
                                    <div className="py-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Design Name</Label>
                                            <Input id="name" {...register('name')} placeholder="e.g. My Business Card v2" />
                                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Product (Optional)</Label>
                                            <Controller
                                                name="productId"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                                                        <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.productId && <p className="text-sm text-destructive">{errors.productId.message as string}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Product Variant (Optional)</Label>
                                            <Controller
                                                name="subProductId"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={!selectedProduct}>
                                                        <SelectTrigger><SelectValue placeholder="Select a variant..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {selectedProduct?.subProducts.map(sp => <SelectItem key={sp.id} value={String(sp.id)}>{sp.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.subProductId && <p className="text-sm text-destructive">{errors.subProductId.message as string}</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="description">Description (Optional)</Label>
                                            <Textarea id="description" {...register('description')} placeholder="Briefly describe this design..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="design-file">Design File</Label>
                                            <Input id="design-file" type="file" {...register('file')} />
                                            {errors.file && <p className="text-sm text-destructive">{errors.file.message as string}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="thumbnail-file">Thumbnail (Optional)</Label>
                                            <Input id="thumbnail-file" type="file" accept="image/png, image/jpeg, image/webp" {...register('thumbnail')} />
                                            {errors.thumbnail && <p className="text-sm text-destructive">{errors.thumbnail.message as string}</p>}
                                        </div>
                                         <div className="flex items-center space-x-2 pt-2">
                                            <Controller
                                                name="isPublic"
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch
                                                        id="isPublic"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                )}
                                            />
                                            <Label htmlFor="isPublic">Make Publicly Visible</Label>
                                        </div>
                                    </div>
                                </form>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>Cancel</Button>
                                    <Button type="submit" form="upload-form" disabled={isUploading}>
                                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Upload
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
            </div>

            {uploads.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {uploads.map(upload => {
                                const imageSrc = upload.thumbnailPath || (upload.mimeType?.startsWith('image/') ? upload.filePath : null);

                                return (
                                    <TooltipProvider key={upload.id}>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Card className="group relative border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-primary/30 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-3xl border-border/40 bg-card/80 backdrop-blur-xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="font-black">Delete this file?</AlertDialogTitle>
                                                        <AlertDialogDescription className="font-medium">
                                                            This action cannot be undone. <span className="font-bold text-foreground">'{upload.originalFilename}'</span> will be permanently deleted.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="rounded-xl border-border/50 font-bold">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(upload.id)} className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>

                                        {upload.isPublic ? (
                                            <Badge className="absolute top-3 left-3 z-20 bg-emerald-500/90 text-white border-emerald-500/20 backdrop-blur-md shadow-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                                                <Globe className="mr-1.5 h-3 w-3" /> Public
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="absolute top-3 left-3 z-20 bg-black/50 text-white backdrop-blur-md border-white/10 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 shadow-lg">
                                                <Lock className="mr-1.5 h-3 w-3" /> Private
                                            </Badge>
                                        )}

                                        <a href={resolveImagePath(upload.filePath)} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] bg-muted/20 border-b border-border/40 overflow-hidden">
                                            {imageSrc ? (
                                                <Image src={resolveImagePath(imageSrc)} alt={upload.originalFilename} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <File className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                            )}
                                        </a>
                                        <CardFooter className="p-5 flex flex-col items-start gap-2 bg-card">
                                            <p className="font-black text-sm truncate w-full group-hover:text-primary transition-colors tracking-tight" title={upload.originalFilename}>{upload.originalFilename}</p>
                                            <div className="flex justify-between items-center w-full">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">{formatBytes(upload.fileSize)}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{format(new Date(upload.createdAt), 'MMM d, yyyy')}</p>
                                            </div>
                                            {upload.product && (
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mt-1">{upload.product.name}{upload.subProduct ? ` - ${upload.subProduct.name}` : ''}</p>
                                            )}
                                        </CardFooter>
                                    </Card>
                                    </TooltipTrigger>
                                    {(upload as any).metadata?.description && (
                                        <TooltipContent>
                                            <p>{(upload as any).metadata.description}</p>
                                        </TooltipContent>
                                    )}
                                    </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
            ) : (
                <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl bg-muted/10">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <File className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black font-headline mb-2">No Files Uploaded</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-6">Upload your print-ready assets here for easy access across all your projects.</p>
                </div>
            )}
        </div>
    );
}
