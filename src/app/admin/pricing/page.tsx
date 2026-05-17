'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProductsWithPricing, createPricingRule, updatePricingRule, deletePricingRule } from '@/app/actions/pricing-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, Tag, IndianRupee, Users, ShieldCheck, Plus, Upload, Image as ImageIcon, Layers, Sparkles, CheckCircle2, Package, Check, DollarSign, FileText } from 'lucide-react';
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
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4 max-w-[1600px] mx-auto">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading pricing matrix and add-on rules...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Stunning Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
                <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                                <Tag className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                                Advanced Pricing & Add-on Engine
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Sub-Product Pricing Management</h1>
                        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                            Configure dynamic quantity brackets, contest entry fees, verification charges, discount tiers, and custom add-on options for all physical variants.
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                        <Tag className="w-8 h-8 text-indigo-400" />
                    </div>
                </div>
            </div>
            
            {/* Main Pricing Matrix Container */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                            <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Products Available</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">There are currently no products configured in the system. Create products first to manage their variant pricing rules.</p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="space-y-6">
                            {products.map(product => (
                                <AccordionItem key={product.id} value={`product-${product.id}`} className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all shadow-sm">
                                    <AccordionTrigger className="p-5 hover:no-underline hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                                    {product.imageUrl?.trim() ? (
                                                        <Image src={resolveImagePath(product.imageUrl.trim())} alt={product.name} fill className="object-cover" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                                                    )}
                                                </div>
                                                <div className="text-left space-y-0.5">
                                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{product.name}</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top-level product catalog container</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="rounded-full font-extrabold text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-3 py-1 shadow-sm">
                                                {product.subProducts.length} Configured Variant{product.subProducts.length === 1 ? '' : 's'}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-955/80">
                                       <div className="space-y-6 pt-4">
                                           {product.subProducts.length === 0 ? (
                                               <p className="text-sm text-center text-muted-foreground py-6 italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50">No physical variants exist for this product. Add variants in Product Management first.</p>
                                           ) : (
                                               product.subProducts.map(sp => (
                                                    <Card key={sp.id} className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900">
                                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5">
                                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                                                        {sp.imageUrl?.trim() || product.imageUrl?.trim() ? (
                                                                            <Image src={resolveImagePath(sp.imageUrl?.trim() || product.imageUrl?.trim() || '')} alt={sp.name} fill className="object-cover" />
                                                                        ) : (
                                                                            <ImageIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                            {sp.name}
                                                                            <Badge variant="outline" className="h-5 text-[10px] font-extrabold px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                                                                {sp.width} x {sp.height} {sp.unitType || 'mm'}
                                                                            </Badge>
                                                                        </CardTitle>
                                                                        <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                            SKU: {sp.sku || 'N/A'} &bull; Base Price: ₹{sp.price}
                                                                        </CardDescription>
                                                                    </div>
                                                                </div>
                                                                <Button size="sm" className="h-9 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-4 transition-all hover:scale-[1.02] w-full sm:w-auto" onClick={() => handleOpenForm(sp, null)}>
                                                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Pricing Rule
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-6">
                                                            <PricingRulesTable rules={sp.pricingRules} onEdit={(rule) => handleOpenForm(sp, rule)} onDelete={handleDelete} />
                                                        </CardContent>
                                                    </Card>
                                               ))
                                           )}
                                       </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

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
        return (
            <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/50 gap-2">
                <Tag className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No Pricing Rules Configured</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">This variant currently relies on its default base price. Click &apos;Add Pricing Rule&apos; above to configure custom tiers or add-ons.</p>
            </div>
        );
    }
    return (
        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider py-3.5 pl-4">Rule Type</TableHead>
                        <TableHead className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider py-3.5">Bracket / Add-on Details</TableHead>
                        <TableHead className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider py-3.5">Configured Price</TableHead>
                        <TableHead className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider py-3.5">Status</TableHead>
                        <TableHead className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider py-3.5 text-right pr-4">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {rules.map(rule => (
                        <TableRow key={rule.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                            <TableCell className="pl-4 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {rule.isContest && <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm"><Users className="mr-1.5 h-3.5 w-3.5 inline-block"/>CONTEST</Badge>}
                                    {rule.isVerification && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm"><ShieldCheck className="mr-1.5 h-3.5 w-3.5 inline-block"/>VERIFICATION</Badge>}
                                    {rule.isDiscount && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm"><Tag className="mr-1.5 h-3.5 w-3.5 inline-block"/>DISCOUNT</Badge>}
                                    {rule.isAddon && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm"><Plus className="mr-1.5 h-3.5 w-3.5 inline-block"/>ADD-ON</Badge>}
                                    {!rule.isContest && !rule.isVerification && !rule.isDiscount && !rule.isAddon && <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm">STANDARD</Badge>}
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                {rule.isContest ? (
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{rule.minParticipants || '...'} &ndash; {rule.maxParticipants || '...'} Participants</span>
                                ) : rule.isAddon ? (
                                    <div className="flex items-center gap-3.5">
                                        {rule.addonImageUrl ? (
                                            <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0 bg-white">
                                                <Image src={rule.addonImageUrl} alt={rule.addonName || ''} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                                                <ImageIcon className="h-5 w-5 text-slate-400" />
                                            </div>
                                        )}
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">{rule.addonName || 'Unnamed Add-on'}</span>
                                    </div>
                                ) : (
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{rule.minQuantity || '1'} &ndash; {rule.maxQuantity || '...'} Units</span>
                                )}
                            </TableCell>
                            <TableCell className="py-4">
                                <span className="flex items-center font-extrabold text-slate-900 dark:text-white text-base">
                                    <IndianRupee className="w-4 h-4 mr-0.5 text-indigo-500" />
                                    {rule.unitPrice || rule.contestPrice || rule.discountValue || rule.designVerificationFee || rule.addonPriceAmount || '0.00'}
                                    {rule.isDiscount && rule.discountType === 'percentage' ? <span className="text-xs text-muted-foreground ml-1 font-bold">(%)</span> : null}
                                </span>
                            </TableCell>
                             <TableCell className="py-4">
                                <Badge variant={rule.isActive ? 'default' : 'secondary'} className={`h-6 text-[10px] font-extrabold px-2.5 rounded-full shadow-sm ${rule.isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    {rule.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                             </TableCell>
                            <TableCell className="text-right pr-4 py-4">
                                <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors" onClick={() => onEdit(rule)}>
                                         <Edit className="h-4 w-4"/>
                                     </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-955/30 dark:hover:text-red-400 transition-colors text-destructive">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold">Delete Pricing Rule?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm font-medium">This action will permanently delete this pricing bracket or add-on configuration. This cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => onDelete(rule.id)}>Permanently Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
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
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden">
            <DialogHeader className="p-8 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
                <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                                <Tag className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                                Rule Configuration Engine
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">{rule ? 'Edit Pricing Bracket / Add-on' : 'Create New Pricing Bracket / Add-on'}</DialogTitle>
                        <DialogDescription className="text-slate-300 text-sm mt-1">Define specific pricing scenarios, quantity thresholds, or custom physical add-on options.</DialogDescription>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                        <Tag className="w-8 h-8 text-indigo-400" />
                    </div>
                </div>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50">
                    {/* Exclusivity Type Selection Cards */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Rule Type (Mutually Exclusive)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                            {/* Contest Card */}
                            <label htmlFor="isContest" className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${isContest ? 'bg-white dark:bg-slate-900 border-purple-500 shadow-md text-purple-600 dark:text-purple-400 font-bold' : 'border-transparent hover:bg-white/50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold'}`}>
                                <Users className="w-6 h-6 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Controller name="isContest" control={control} render={({ field }) => <Switch id="isContest" checked={field.value} onCheckedChange={(val) => handleToggle('isContest', val)} className="scale-75 data-[state=checked]:bg-purple-600" />} />
                                    <span className="text-sm">Contest</span>
                                </div>
                            </label>

                            {/* Verification Card */}
                            <label htmlFor="isVerification" className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${isVerification ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-md text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent hover:bg-white/50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold'}`}>
                                <ShieldCheck className="w-6 h-6 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Controller name="isVerification" control={control} render={({ field }) => <Switch id="isVerification" checked={field.value} onCheckedChange={(val) => handleToggle('isVerification', val)} className="scale-75 data-[state=checked]:bg-blue-600" />} />
                                    <span className="text-sm">Verification</span>
                                </div>
                            </label>

                            {/* Discount Card */}
                            <label htmlFor="isDiscount" className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${isDiscount ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent hover:bg-white/50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold'}`}>
                                <Tag className="w-6 h-6 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Controller name="isDiscount" control={control} render={({ field }) => <Switch id="isDiscount" checked={field.value} onCheckedChange={(val) => handleToggle('isDiscount', val)} className="scale-75 data-[state=checked]:bg-emerald-600" />} />
                                    <span className="text-sm">Discount</span>
                                </div>
                            </label>

                            {/* Addon Card */}
                            <label htmlFor="isAddon" className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${isAddon ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-md text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:bg-white/50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold'}`}>
                                <Plus className="w-6 h-6 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Controller name="isAddon" control={control} render={({ field }) => <Switch id="isAddon" checked={field.value} onCheckedChange={(val) => handleToggle('isAddon', val)} className="scale-75 data-[state=checked]:bg-amber-600" />} />
                                    <span className="text-sm">Add-on</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Dynamic Configuration Container */}
                    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                    {isContest ? 'Contest Pricing Configuration' :
                                     isVerification ? 'Verification Fee Setup' :
                                     isDiscount ? 'Discount Tier Setup' :
                                     isAddon ? 'Add-on Option Configuration' :
                                     'Standard Quantity Bracket Configuration'}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {!isContest && !isVerification && !isDiscount && !isAddon && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Minimum Quantity</Label>
                                            <Input type="number" placeholder="1" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('minQuantity')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Maximum Quantity</Label>
                                            <Input type="number" placeholder="No limit" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('maxQuantity')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Per-Unit Price (₹)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                <Input type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('unitPrice')} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium italic mt-2">Defines the cost per single unit when a user orders within this specific quantity range.</p>
                                </div>
                            )}

                            {isContest && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Min Participants</Label>
                                            <Input type="number" placeholder="1" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('minParticipants')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Max Participants</Label>
                                            <Input type="number" placeholder="No limit" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('maxParticipants')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contest Price (₹)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                <Input type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('contestPrice')} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium italic mt-2">Applies specialized pricing when a design contest reaches this bracket of active participants.</p>
                                </div>
                            )}

                            {isVerification && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Design Verification Fee (₹)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                            <Input type="number" step="0.01" placeholder="e.g. 500.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('designVerificationFee')} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium italic mt-2">Fixed fee charged to the user for professional prepress verification of their uploaded artwork.</p>
                                </div>
                            )}

                            {isDiscount && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Minimum Quantity</Label>
                                            <Input type="number" placeholder="e.g. 100" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('minQuantity')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Maximum Quantity</Label>
                                            <Input type="number" placeholder="e.g. 500" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('maxQuantity')} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Discount Type</Label>
                                            <Controller
                                                name="discountType"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold">
                                                            <SelectValue placeholder="Select discount type..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="percentage" className="font-semibold">Percentage Discount (%)</SelectItem>
                                                            <SelectItem value="fixed" className="font-semibold">Fixed Amount Discount (₹)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Discount Value</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('discountValue')} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium italic mt-2">Applies an automatic bulk discount reduction when the user&apos;s cart matches this quantity bracket.</p>
                                </div>
                            )}

                            {isAddon && (
                                <div className="space-y-6">
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                             <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Add-on Display Name</Label>
                                             <Input placeholder="e.g. Gold Foil Stamp, Velvet Lamination" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('addonName')} />
                                         </div>
                                         <div className="space-y-2">
                                             <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Add-on Price Amount (₹)</Label>
                                             <div className="relative">
                                                 <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                 <Input type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('addonPriceAmount')} />
                                             </div>
                                         </div>
                                     </div>
                                     
                                     <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                         <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Add-on Preview Icon / Image</Label>
                                         <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                             <div className="relative h-20 w-20 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-white shadow-sm flex-shrink-0">
                                                 {addonImageUrl ? (
                                                     <Image src={addonImageUrl} alt="Add-on" fill className="object-cover" />
                                                 ) : (
                                                     <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                                 )}
                                             </div>
                                             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                                 <Dialog open={isImageBrowserOpen} onOpenChange={setIsImageBrowserOpen}>
                                                     <DialogTrigger asChild>
                                                         <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl font-semibold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors">
                                                             <PlusCircle className="mr-2 h-4 w-4" />
                                                             {addonImageUrl ? 'Change Image' : 'Select Image'}
                                                         </Button>
                                                     </DialogTrigger>
                                                     <ImageBrowserDialog 
                                                         onSelect={(url) => {
                                                             setValue('addonImageUrl', url, { shouldDirty: true, shouldValidate: true });
                                                             setIsImageBrowserOpen(false);
                                                         }} 
                                                         folder={imageFolder} 
                                                         setFolder={setImageFolder} 
                                                     />
                                                 </Dialog>
                                                 {addonImageUrl && (
                                                     <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl font-semibold text-destructive hover:bg-red-50 dark:hover:bg-red-955/30 transition-colors" onClick={() => setValue('addonImageUrl', null, { shouldDirty: true, shouldValidate: true })}>
                                                         Remove Image
                                                     </Button>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                     <p className="text-xs text-muted-foreground font-medium italic mt-2">Creates a selectable add-on card on the product configuration page with its own specialized pricing increment.</p>
                                 </div>
                             )}
                        </CardContent>
                    </Card>

                    {/* Active Status Switch */}
                    <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="isActive" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Rule is Active</Label>
                            <p className="text-xs text-muted-foreground font-medium">Enable or disable this specific pricing bracket or add-on rule instantly.</p>
                        </div>
                        <Controller name="isActive" control={control} render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600" />} />
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3 flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Save Rule Configuration
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
