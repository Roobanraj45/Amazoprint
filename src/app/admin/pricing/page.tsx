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
import { Loader2, PlusCircle, Edit, Trash2, Tag, IndianRupee, Users, ShieldCheck, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn, resolveImagePath } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
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

            <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
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
                             rule.isAddon ? <span className="font-medium">{rule.addonName || 'Unnamed Add-on'}</span> :
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

    // Handle mutual exclusivity
    useEffect(() => {
        if (isAddon) {
            setValue('isContest', false);
            setValue('isVerification', false);
            setValue('isDiscount', false);
        }
    }, [isAddon, setValue]);

    useEffect(() => {
        if (isContest || isVerification || isDiscount) {
            setValue('isAddon', false);
        }
    }, [isContest, isVerification, isDiscount, setValue]);

    useEffect(() => {
        if (rule) {
            reset({ 
                ...rule, 
                unitPrice: rule.unitPrice ? Number(rule.unitPrice) : null, 
                contestPrice: rule.contestPrice ? Number(rule.contestPrice) : null, 
                discountValue: rule.discountValue ? Number(rule.discountValue) : null, 
                designVerificationFee: rule.designVerificationFee ? Number(rule.designVerificationFee) : null,
                addonPriceAmount: rule.addonPriceAmount ? Number(rule.addonPriceAmount) : null,
                addonName: rule.addonName || null
            });
        } else {
            reset({
                minQuantity: 1, maxQuantity: null, unitPrice: null, minParticipants: null, maxParticipants: null,
                contestPrice: null, discountType: null, discountValue: null, designVerificationFee: null,
                isContest: false, isVerification: false, isDiscount: false, isAddon: false, isActive: true,
                addonPriceAmount: null, addonName: null
            });
        }
    }, [rule, reset]);

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{rule ? 'Edit' : 'Add'} Pricing Rule</DialogTitle>
                <DialogDescription>Define a specific pricing scenario. Selecting one type will disable others.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <ScrollArea className="max-h-[60vh] p-1">
                <div className="space-y-6 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                            <Controller name="isContest" control={control} render={({ field }) => <Switch id="isContest" checked={field.value} onCheckedChange={field.onChange} disabled={isAddon} />} />
                            <Label htmlFor="isContest" className={cn(isAddon && "opacity-50")}>Contest</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller name="isVerification" control={control} render={({ field }) => <Switch id="isVerification" checked={field.value} onCheckedChange={field.onChange} disabled={isAddon} />} />
                            <Label htmlFor="isVerification" className={cn(isAddon && "opacity-50")}>Verification</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller name="isDiscount" control={control} render={({ field }) => <Switch id="isDiscount" checked={field.value} onCheckedChange={field.onChange} disabled={isAddon} />} />
                            <Label htmlFor="isDiscount" className={cn(isAddon && "opacity-50")}>Discount</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller name="isAddon" control={control} render={({ field }) => <Switch id="isAddon" checked={field.value} onCheckedChange={field.onChange} disabled={isContest || isVerification || isDiscount} />} />
                            <Label htmlFor="isAddon" className={cn((isContest || isVerification || isDiscount) && "opacity-50")}>Add-on</Label>
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
                                    <Label className="font-bold">Add-on Price</Label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5"><Label>Add-on Name</Label><Input placeholder="e.g. Gold Foil, Premium Lamination" {...register('addonName')} /></div>
                                        <div className="space-y-1.5"><Label>Price Amount (₹)</Label><Input type="number" step="0.01" {...register('addonPriceAmount')} /></div>
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
