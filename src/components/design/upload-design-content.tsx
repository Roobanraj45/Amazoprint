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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { resolveImagePath } from '@/lib/utils';
import Link from 'next/link';

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024;

const uploadSchema = z.object({
    name: z.string().min(3, 'Design name must be at least 3 characters.'),
    description: z.string().optional(),
    isPublic: z.boolean().default(false),
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

    const { register, handleSubmit, control, formState: { errors } } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
        defaultValues: { name: '', description: '', isPublic: false }
    });

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
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!product || !subProductId) {
        return <div className="flex h-full flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <p className="text-muted-foreground">Please select a product and size before uploading.</p>
            <Button asChild variant="link"><Link href="/products">Go to products</Link></Button>
        </div>
    }
    
    const imageUrl = resolveImagePath(product.imageUrl);

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                     {imageUrl ? (
                        <Image src={imageUrl} alt={product.name} width={80} height={80} className="object-contain rounded-md" />
                    ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                </div>
                <CardTitle>Upload Your Design</CardTitle>
                <CardDescription>
                    Provide your print-ready file for the <span className="font-semibold text-foreground">{product.name}</span>.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(handleUpload)}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Design Name</Label>
                        <Input id="name" {...register('name')} placeholder="e.g. My Business Card v2" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" {...register('description')} placeholder="Briefly describe this design..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="design-file">Design File</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="design-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">Print-ready file (MAX. 50MB)</p>
                                </div>
                                <Input id="design-file" type="file" className="hidden" {...register('file')} />
                            </label>
                        </div>
                        {errors.file && <p className="text-sm text-destructive mt-2">{errors.file.message as string}</p>}
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
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload & Proceed to Order
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
