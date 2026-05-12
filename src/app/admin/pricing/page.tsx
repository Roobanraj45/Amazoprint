'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductsWithPricing, createPricingRule, updatePricingRule, deletePricingRule } from '@/app/actions/pricing-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, Tag, IndianRupee, Users, ShieldCheck, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn, resolveImagePath } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogClose } from '@radix-ui/react-dialog';

const pricingRuleSchema = z.object({
  minQuantity: z.coerce.number().optional().nullable(),
  maxQuantity: z.coerce.number().optional().nullable(),
  unitPrice: z.coerce.number().optional().nullable(),
  minParticipants: z.coerce.number().optional().nullable(),
  maxParticipants: z.coerce.number().optional().nullable(),
  contestPrice: z.coerce.number().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  discountValue: z.coerce.number().optional().nullable(),
  designVerificationFee: z.coerce.number().optional().nullable(),
  isContest: z.boolean().default(false),
  isVerification: z.boolean().default(false),
  isDiscount: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // Add-on fields
  addonPriceAmount: z.coerce.number().optional().nullable(),
  addonName: z.string().optional().nullable(),
  addonImageUrl: z.string().optional().nullable(),
  isAddon: z.boolean().default(false),
});

type ProductData = Awaited<ReturnType<typeof getProductsWithPricing>>[0];
type SubProductData = ProductData['subProducts'][0];
type PricingRule = SubProductData['pricingRules'][0];
type PricingFormValues = z.infer<typeof pricingRuleSchema>;

export default function PricingPage() {
    const [products, setProducts] = useState<ProductData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
    const [activeSubProduct, setActiveSubProduct] = useState<SubProductData | null>(null);
    const { toast } = useToast();
    
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getProductsWithPricing();
            setProducts(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load pricing data.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenForm = (subProduct: SubProductData, rule: PricingRule | null) => {
        setActiveSubProduct(subProduct);
        setEditingRule(rule);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingRule(null);
        setActiveSubProduct(null);
    }
    
    const handleFormSubmit = async (data: PricingFormValues) => {
        if (!activeSubProduct) return;
        
        try {
            const payload = { ...data, subProductId: activeSubProduct.id };
            if (editingRule) {
                await updatePricingRule(editingRule.id, payload);
                toast({ title: 'Success', description: 'Pricing rule updated.' });
            } else {
                await createPricingRule(payload);
                toast({ title: 'Success', description: 'Pricing rule created.' });
            }
            handleCloseForm();
            await loadData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const handleDelete = async (id: number) => {
        try {
            await deletePricingRule(id);
            toast({ title: 'Success', description: 'Pricing rule deleted.' });
            await loadData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Sub-Product Pricing Management</h1>
            </div>
            
            <Accordion type="multiple" className="space-y-4">
                {products.map(product => (
                    <AccordionItem key={product.id} value={`product-${product.id}`} className="border rounded-lg bg-card overflow-hidden">
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold">{product.name}</h3>
                                <Badge variant="outline">{product.subProducts.length} variants</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                           <div className="space-y-4">
                               {product.subProducts.map(sp => (
                                    <Card key={sp.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <Image src={resolveImagePath(sp.imageUrl || product.imageUrl)} alt={sp.name} width={40} height={40} className="rounded-md object-cover bg-muted" />
                                                    <div>
                                                        <CardTitle className="text-base">{sp.name}</CardTitle>
                                                        <CardDescription>{sp.width}mm x {sp.height}mm</CardDescription>
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={() => handleOpenForm(sp, null)}><PlusCircle className="mr-2 h-4 w-4"/> Add Rule</Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <PricingRulesTable rules={sp.pricingRules} onEdit={(rule) => handleOpenForm(sp, rule)} onDelete={handleDelete} />
                                        </CardContent>
                                    </Card>
                               ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <PricingRuleForm 
                    onSubmit={handleFormSubmit}
                    rule={editingRule}
                    onClose={handleCloseForm}
                />
            </Dialog>
        </div>
    );
}

function PricingRulesTable({ rules, onEdit, onDelete }: { rules: PricingRule[], onEdit: (rule: PricingRule) => void, onDelete: (id: number) => void}) {
    if (rules.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-4">No pricing rules defined for this variant yet.</p>
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Range/Details</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rules.map(rule => (
                    <TableRow key={rule.id}>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {rule.isContest && <Badge variant="secondary"><Users className="mr-1 h-3 w-3"/>Contest</Badge>}
                                {rule.isVerification && <Badge variant="secondary"><ShieldCheck className="mr-1 h-3 w-3"/>Verification</Badge>}
                                {rule.isDiscount && <Badge variant="secondary"><Tag className="mr-1 h-3 w-3"/>Discount</Badge>}
                                {rule.isAddon && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200"><Plus className="mr-1 h-3 w-3"/>Add-on</Badge>}
                                {!rule.isContest && !rule.isVerification && !rule.isDiscount && !rule.isAddon && <Badge>Standard</Badge>}
                            </div>
                        </TableCell>
                        <TableCell>
                            {rule.isContest ? `${rule.minParticipants || '...'} - ${rule.maxParticipants || '...'}` : 
                             rule.isAddon ? (
                                <div className="flex items-center gap-3">
                                    {rule.addonImageUrl && (
                                        <div className="relative h-10 w-10 rounded overflow-hidden border">
                                            <Image src={rule.addonImageUrl} alt={rule.addonName || ''} fill className="object-cover" />
                                        </div>
                                    )}
                                    <span className="font-medium">{rule.addonName || 'Unnamed Add-on'}</span>
                                </div>
                             ) :
                             `${rule.minQuantity || '1'} - ${rule.maxQuantity || '...'}`}
                        </TableCell>
                        <TableCell>
                            <span className="flex items-center font-semibold"><IndianRupee size={12}/>{rule.unitPrice || rule.contestPrice || rule.discountValue || rule.designVerificationFee || rule.addonPriceAmount || 'N/A'}</span>
                        </TableCell>
                         <TableCell>
                            <Badge variant={rule.isActive ? 'default' : 'destructive'}>{rule.isActive ? 'Active' : 'Inactive'}</Badge>
                         </TableCell>
                        <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}><Edit className="h-4 w-4"/></Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the pricing rule.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(rule.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function PricingRuleForm({ onSubmit, rule, onClose }: { onSubmit: (data: PricingFormValues) => void, rule: PricingRule | null, onClose: () => void }) {
    const { register, handleSubmit, formState: { isSubmitting }, reset, control, watch, setValue } = useForm<PricingFormValues>({
        resolver: zodResolver(pricingRuleSchema),
    });

    const isContest = watch('isContest');
    const isVerification = watch('isVerification');
    const isDiscount = watch('isDiscount');
    const isAddon = watch('isAddon');
    const addonImageUrl = watch('addonImageUrl');

    const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
    const [imageFolder, setImageFolder] = useState('addons');

    // Handle mutual exclusivity with a single source of truth logic
    const handleToggle = (name: 'isContest' | 'isVerification' | 'isDiscount' | 'isAddon', checked: boolean) => {
        if (checked) {
            // If turning one ON, turn all others OFF
            setValue('isContest', false);
            setValue('isVerification', false);
            setValue('isDiscount', false);
            setValue('isAddon', false);
            setValue(name, true);
        } else {
            // If turning OFF, just turn it OFF
            setValue(name, false);
        }
    };

    useEffect(() => {
        if (rule) {
            reset({ 
                ...rule, 
                unitPrice: rule.unitPrice ? Number(rule.unitPrice) : null, 
                contestPrice: rule.contestPrice ? Number(rule.contestPrice) : null, 
                discountValue: rule.discountValue ? Number(rule.discountValue) : null, 
                designVerificationFee: rule.designVerificationFee ? Number(rule.designVerificationFee) : null,
                addonPriceAmount: rule.addonPriceAmount ? Number(rule.addonPriceAmount) : null,
                addonName: rule.addonName || null,
                addonImageUrl: rule.addonImageUrl || null
            });
        } else {
            reset({
                minQuantity: 1, maxQuantity: null, unitPrice: null, minParticipants: null, maxParticipants: null,
                contestPrice: null, discountType: null, discountValue: null, designVerificationFee: null,
                isContest: false, isVerification: false, isDiscount: false, isAddon: false, isActive: true,
                addonPriceAmount: null, addonName: null, addonImageUrl: null
            });
        }
    }, [rule, reset]);

    return (
        <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{rule ? 'Edit' : 'Add'} Pricing Rule</DialogTitle>
                <DialogDescription>Define a specific pricing scenario. Selecting one type will disable others.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-1">
                <div className="space-y-6 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                            <Controller name="isContest" control={control} render={({ field }) => <Switch id="isContest" checked={field.value} onCheckedChange={(val) => handleToggle('isContest', val)} />} />
                            <Label htmlFor="isContest">Contest</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller name="isVerification" control={control} render={({ field }) => <Switch id="isVerification" checked={field.value} onCheckedChange={(val) => handleToggle('isVerification', val)} />} />
                            <Label htmlFor="isVerification">Verification</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller name="isDiscount" control={control} render={({ field }) => <Switch id="isDiscount" checked={field.value} onCheckedChange={(val) => handleToggle('isDiscount', val)} />} />
                            <Label htmlFor="isDiscount">Discount</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller name="isAddon" control={control} render={({ field }) => <Switch id="isAddon" checked={field.value} onCheckedChange={(val) => handleToggle('isAddon', val)} />} />
                            <Label htmlFor="isAddon">Add-on</Label>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {!isContest && !isVerification && !isDiscount && !isAddon && (
                                <div className="space-y-4">
                                    <Label className="font-bold">Standard Pricing</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5"><Label>Min Qty</Label><Input type="number" {...register('minQuantity')} /></div>
                                        <div className="space-y-1.5"><Label>Max Qty</Label><Input type="number" {...register('maxQuantity')} /></div>
                                        <div className="space-y-1.5"><Label>Unit Price</Label><Input type="number" step="0.01" {...register('unitPrice')} /></div>
                                    </div>
                                </div>
                            )}

                            {isContest && (
                                <div className="space-y-4">
                                    <Label className="font-bold">Contest Pricing</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5"><Label>Min Participants</Label><Input type="number" {...register('minParticipants')} /></div>
                                        <div className="space-y-1.5"><Label>Max Participants</Label><Input type="number" {...register('maxParticipants')} /></div>
                                        <div className="space-y-1.5"><Label>Contest Price</Label><Input type="number" step="0.01" {...register('contestPrice')} /></div>
                                    </div>
                                </div>
                            )}

                            {isVerification && (
                                <div className="space-y-4">
                                    <Label className="font-bold">Verification Fee</Label>
                                    <Input type="number" step="0.01" {...register('designVerificationFee')} placeholder="e.g., 500.00" />
                                </div>
                            )}

                            {isDiscount && (
                                <div className="space-y-4">
                                    <Label className="font-bold">Discount Pricing</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5"><Label>Min Qty</Label><Input type="number" {...register('minQuantity')} placeholder="e.g., 100"/></div>
                                        <div className="space-y-1.5"><Label>Max Qty</Label><Input type="number" {...register('maxQuantity')} placeholder="e.g., 500" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Discount Type</Label>
                                            <Controller
                                                name="discountType"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-1.5"><Label>Discount Value</Label><Input type="number" step="0.01" {...register('discountValue')} /></div>
                                    </div>
                                </div>
                            )}

                            {isAddon && (
                                <div className="space-y-4">
                                     <Label className="font-bold">Add-on Price & Image</Label>
                                     <div className="grid grid-cols-1 gap-4">
                                         <div className="space-y-1.5"><Label>Add-on Name</Label><Input placeholder="e.g. Gold Foil, Premium Lamination" {...register('addonName')} /></div>
                                         <div className="space-y-1.5"><Label>Price Amount (₹)</Label><Input type="number" step="0.01" {...register('addonPriceAmount')} /></div>
                                         
                                         <div className="space-y-2">
                                             <Label>Add-on Image</Label>
                                             <div className="flex items-center gap-4">
                                                 <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                                                     {addonImageUrl ? (
                                                         <Image src={addonImageUrl} alt="Add-on" fill className="object-cover" />
                                                     ) : (
                                                         <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                                     )}
                                                 </div>
                                                 <div className="flex flex-col gap-2">
                                                     <Dialog open={isImageBrowserOpen} onOpenChange={setIsImageBrowserOpen}>
                                                         <Button type="button" variant="outline" size="sm" onClick={() => setIsImageBrowserOpen(true)}>
                                                             <PlusCircle className="mr-2 h-4 w-4" />
                                                             {addonImageUrl ? 'Change Image' : 'Select Image'}
                                                         </Button>
                                                         <ImageBrowserDialog 
                                                             onSelect={(url) => {
                                                                 setValue('addonImageUrl', url);
                                                                 setIsImageBrowserOpen(false);
                                                             }} 
                                                             folder={imageFolder} 
                                                             setFolder={setImageFolder} 
                                                         />
                                                     </Dialog>
                                                     {addonImageUrl && (
                                                         <Button type="button" variant="ghost" size="sm" className="text-destructive h-8" onClick={() => setValue('addonImageUrl', null)}>
                                                             Remove Image
                                                         </Button>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </CardContent>
                    </Card>
                    <div className="flex items-center space-x-2 pt-2"><Controller name="isActive" control={control} render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="isActive">Rule is Active</Label></div>
                </div>
                </ScrollArea>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Rule
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

interface Folder {
  name: string;
  files: string[];
}

function ImageBrowserDialog({ onSelect, folder, setFolder }: { onSelect: (url: string) => void, folder: string, setFolder: (folder: string) => void }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/uploads/list');
      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
        if (data.folders.length > 0 && !folder) {
          setFolder(data.folders[0].name);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch assets');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Loading Error',
        description: 'Could not load uploaded assets.',
      });
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, folder, setFolder]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);
  
  const handleFileUpload = async () => {
    if (!fileToUpload) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }
    if (!folder) {
        toast({ variant: 'destructive', title: 'Folder name is required' });
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folder);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      onSelect(result.url); // Select the newly uploaded image
      await fetchAssets(); // Refresh the list
      toast({ title: 'Image uploaded successfully.' });
      setFileToUpload(null); // Reset file input
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Image Library</DialogTitle>
          <DialogDescription>Select an existing image or upload a new one.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex min-h-0">
          <Tabs defaultValue="browse" className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Existing</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>
            <TabsContent value="browse" className="flex-1 overflow-auto mt-2">
              {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No images found.</div>
                ) : (
                  <div className="flex h-full">
                      <ScrollArea className="w-48 border-r">
                          <div className="p-2">
                              {folders.map(f => (
                                <Button 
                                  key={f.name} 
                                  variant={folder === f.name ? 'secondary' : 'ghost'} 
                                  className="w-full justify-start capitalize"
                                  onClick={() => setFolder(f.name)}
                                >
                                  {f.name}
                                </Button>
                              ))}
                          </div>
                      </ScrollArea>
                      <ScrollArea className="flex-1 p-4">
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                              {folders.find(f => f.name === folder)?.files.map((fileUrl) => (
                                <DialogClose asChild key={fileUrl}>
                                  <button onClick={() => onSelect(fileUrl)} className="aspect-square relative rounded-md overflow-hidden ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                      <Image src={fileUrl} alt="" fill className="object-cover" />
                                  </button>
                                </DialogClose>
                              ))}
                          </div>
                      </ScrollArea>
                  </div>
              )}
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="folder-name-upload">Folder Name</Label>
                      <p className="text-sm text-muted-foreground">The current folder is <span className="font-semibold capitalize">{folder || 'N/A'}</span>. You can create a new folder by typing its name below.</p>
                      <Input
                          id="folder-name-upload"
                          placeholder="e.g., products, banners"
                          value={folder}
                          onChange={(e) => setFolder(e.target.value)}
                      />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="file-upload-dialog">File</Label>
                      <Input
                          id="file-upload-dialog"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                      />
                  </div>
                  <Button onClick={handleFileUpload} disabled={!fileToUpload || !folder || isUploading}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload and Select
                  </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </DialogContent>
  )
}
