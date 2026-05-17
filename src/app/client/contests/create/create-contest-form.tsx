'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts } from '@/app/actions/product-actions';
import { getContestPricingRules } from '@/app/actions/pricing-actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, Trophy, Pencil, Lightbulb, CreditCard, Sparkles, Users, Rocket, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Coins, Award, Package, Layers } from 'lucide-react';
import { processDummyPayment } from '@/app/actions/payment-actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type Product = Awaited<ReturnType<typeof getProducts>>[0];
type ContestPricingRule = Awaited<ReturnType<typeof getContestPricingRules>>[0];

const contestFormSchema = z.object({
  title: z.string().min(1, 'Contest title is required'),
  description: z.string().optional(),
  productId: z.coerce.number().min(1, 'Product is required'),
  subProductId: z.coerce.number({invalid_type_error: "Product variant is required"}).min(1, 'Product variant is required'),
  prizeAmount: z.coerce.number().min(1, 'Prize amount must be positive'),
  pricingRuleId: z.coerce.number().min(1, 'Please select a contest tier'),
  endDate: z.coerce.date().refine(date => date > new Date(), { message: "End date must be in the future" }),
});

type ContestFormValues = z.infer<typeof contestFormSchema>;

export function CreateContestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contestPricingRules, setContestPricingRules] = useState<ContestPricingRule[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const productIdFromUrl = searchParams.get('productId');
  const subProductIdFromUrl = searchParams.get('subProductId');

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<ContestFormValues>({
    resolver: zodResolver(contestFormSchema),
    defaultValues: {
      productId: productIdFromUrl ? Number(productIdFromUrl) : undefined,
      subProductId: subProductIdFromUrl ? Number(subProductIdFromUrl) : undefined
    }
  });

  const selectedProductId = watch('productId');
  const selectedSubProductId = watch('subProductId');
  const selectedPricingRuleId = watch('pricingRuleId');
  const watchPrizeAmount = watch('prizeAmount');

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));
  const selectedRuleObj = contestPricingRules.find(r => r.id === Number(selectedPricingRuleId));

  useEffect(() => {
    async function loadProducts() {
      const prods = await getProducts();
      setProducts(prods);
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
        setValue('subProductId', subProductIdFromUrl ? Number(subProductIdFromUrl) : undefined, { shouldValidate: true });
        setContestPricingRules([]);
        setValue('pricingRuleId', undefined as any, { shouldValidate: true });
    }
  }, [selectedProductId, setValue, subProductIdFromUrl]);

  useEffect(() => {
    if (selectedSubProductId) {
        setLoadingPricing(true);
        getContestPricingRules(selectedSubProductId)
            .then(rules => {
                setContestPricingRules(rules);
                setValue('pricingRuleId', undefined as any, { shouldValidate: true });
            })
            .finally(() => setLoadingPricing(false));
    } else {
        setContestPricingRules([]);
    }
  }, [selectedSubProductId, setValue]);

  const handleCreateContest = async (data: ContestFormValues) => {
    setIsLoading(true);
    try {
      const selectedRule = contestPricingRules.find(r => r.id === data.pricingRuleId);
      if (!selectedRule || !selectedRule.contestPrice) {
          throw new Error("Invalid pricing rule or price not found.");
      }

      const contestData = {
          ...data,
          entryFee: Number(selectedRule.contestPrice),
          maxFreelancers: selectedRule.maxParticipants,
      };
      // @ts-ignore
      delete contestData.pricingRuleId;
      
      const payload = {
        orderData: { contestData },
        amount: Number(selectedRule.contestPrice),
        items: [{ name: `Contest Entry: ${data.title}`, quantity: 1 }],
      }

      const encodedData = btoa(encodeURIComponent(JSON.stringify(payload)));
      router.push(`/payment?orderType=contest&orderData=${encodedData}`);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setIsLoading(false);
    }
  };

  const handleDummyPayment = async () => {
    handleSubmit(async (data: ContestFormValues) => {
        setIsLoading(true);
        try {
            const selectedRule = contestPricingRules.find(r => r.id === data.pricingRuleId);
            if (!selectedRule || !selectedRule.contestPrice) {
                throw new Error("Invalid pricing rule or price not found.");
            }

            const contestData = {
                ...data,
                entryFee: Number(selectedRule.contestPrice),
                maxFreelancers: selectedRule.maxParticipants,
            };
            // @ts-ignore
            delete contestData.pricingRuleId;

            const result = await processDummyPayment({
                amount: Number(selectedRule.contestPrice),
                orderType: 'contest',
                orderData: { contestData }
            });

            if (result.success) {
                toast({ title: 'Contest Launched!', description: 'Your design contest has been created successfully.' });
                router.push('/client/contests');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Dummy payment failed.' });
        } finally {
            setIsLoading(false);
        }
    })();
  };

  const howItWorks = [
    { icon: Pencil, title: '1. Write Your Brief', description: 'Detail your exact requirements, brand guidelines, and the prize amount you wish to award.'},
    { icon: Lightbulb, title: '2. Receive Concepts', description: 'Our elite global community of professional designers will submit custom concepts for your review.'},
    { icon: Trophy, title: '3. Award the Winner', description: 'Select the winning design, release the prize, and receive production-ready artwork files.'},
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 relative">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-[128px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none -z-10" />

        {/* Hero Header */}
        <div className="text-center pt-6 space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest inline-flex items-center gap-2 shadow-sm">
                <Trophy className="w-4 h-4 animate-bounce" /> Premium Crowdsourced Design
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                Launch a Design Contest
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                Harness the collective creativity of top-tier professional graphic designers. Get dozens of bespoke concepts tailored exactly to your vision.
            </p>
        </div>

        {/* How It Works Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {howItWorks.map((step, index) => (
                <div key={index} className="bg-card/40 backdrop-blur-xl border border-border/60 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-rose-500/30 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300 shadow-inner">
                        <step.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-extrabold text-foreground tracking-tight mb-2">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">{step.description}</p>
                </div>
            ))}
        </div>

        {/* Main Form Card */}
        <div className="bg-card/60 backdrop-blur-2xl border border-border/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden relative z-10">
            {/* Form Banner */}
            <div className="bg-muted/40 p-6 sm:p-8 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-4 z-10">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-md shrink-0">
                        <Award className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Contest Specifications</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Configure your project requirements, product dimensions, and prize tiers.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-background/60 border border-border px-4 py-2 rounded-xl z-10 self-start sm:self-center">
                    <Sparkles className="w-4 h-4 text-rose-500" /> 100% Satisfaction Guarantee
                </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit(handleCreateContest)} className="p-6 sm:p-10 space-y-8">
                {/* Section 1: Project Basics */}
                <div className="space-y-6">
                    <h3 className="text-sm font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                        <Pencil className="w-4 h-4" /> 1. Project Overview
                    </h3>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-bold text-foreground flex items-center justify-between">
                            <span>Contest Title <span className="text-rose-500">*</span></span>
                            <span className="text-xs font-medium text-muted-foreground">Make it descriptive and exciting</span>
                        </Label>
                        <Input 
                            id="title" 
                            placeholder="e.g., Minimalist & Elegant Business Card for Luxury Hotel" 
                            className="h-12 rounded-xl bg-background/80 border-border text-foreground font-medium placeholder:text-muted-foreground/60 focus-visible:ring-rose-500 text-sm shadow-sm"
                            {...register('title')} 
                        />
                        {errors.title && <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-bold text-foreground flex items-center justify-between">
                            <span>Design Brief & Instructions <span className="text-muted-foreground font-normal">(Optional)</span></span>
                            <span className="text-xs font-medium text-muted-foreground">Include brand colors, target audience, and style preferences</span>
                        </Label>
                        <Textarea 
                            id="description" 
                            placeholder="Provide detailed instructions, preferred color palettes, typography styles, or examples of designs you love..." 
                            className="min-h-[140px] rounded-xl bg-background/80 border-border text-foreground font-medium placeholder:text-muted-foreground/60 focus-visible:ring-rose-500 text-sm shadow-sm resize-none p-4"
                            {...register('description')} 
                        />
                    </div>
                </div>

                {/* Section 2: Product & Dimensions */}
                <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                        <Package className="w-4 h-4" /> 2. Target Product & Variant
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">Target Product <span className="text-rose-500">*</span></Label>
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                                        <SelectTrigger className="h-12 rounded-xl bg-background/80 border-border font-bold text-sm shadow-sm focus:ring-rose-500">
                                            <SelectValue placeholder="Select a product..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border bg-card shadow-lg">
                                            {products.map(p => <SelectItem key={p.id} value={String(p.id)} className="font-semibold py-2.5">{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.productId && <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.productId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">Product Variant & Dimensions <span className="text-rose-500">*</span></Label>
                            <Controller
                                name="subProductId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={!selectedProduct}>
                                        <SelectTrigger className="h-12 rounded-xl bg-background/80 border-border font-bold text-sm shadow-sm focus:ring-rose-500 disabled:opacity-50">
                                            <SelectValue placeholder="Select a variant..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border bg-card shadow-lg">
                                            {selectedProduct?.subProducts.map(sp => (
                                                <SelectItem key={sp.id} value={String(sp.id)} className="font-semibold py-2.5">
                                                    {sp.name} ({sp.width}x{sp.height} mm)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.subProductId && <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.subProductId.message}</p>}
                        </div>
                    </div>
                </div>
                
                {/* Section 3: Contest Tier & Prizes */}
                <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                        <Trophy className="w-4 h-4" /> 3. Prize Tier & Duration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-foreground">Contest Tier (Freelancers Limit) <span className="text-rose-500">*</span></Label>
                            <Controller
                                name="pricingRuleId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ? String(field.value) : ""}
                                        disabled={!selectedSubProductId || loadingPricing || contestPricingRules.length === 0}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-background/80 border-border font-bold text-sm shadow-sm focus:ring-rose-500 disabled:opacity-50">
                                            <SelectValue placeholder="Select participants tier..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border bg-card shadow-lg">
                                            {loadingPricing ? (
                                                <SelectItem value="loading" disabled className="py-2.5 font-semibold">Loading tiers...</SelectItem>
                                            ) : (
                                                contestPricingRules.map(rule => (
                                                    <SelectItem key={rule.id} value={String(rule.id)} className="font-semibold py-2.5">
                                                        {rule.minParticipants}-{rule.maxParticipants} Participants (Fee: ₹{rule.contestPrice})
                                                    </SelectItem>
                                                ))
                                            )}
                                            {!loadingPricing && contestPricingRules.length === 0 && (
                                                <SelectItem value="no-rules" disabled className="py-2.5 font-semibold">No contest tiers for this variant.</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.pricingRuleId && <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.pricingRuleId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prizeAmount" className="text-sm font-bold text-foreground">Winner Prize Amount (₹) <span className="text-rose-500">*</span></Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-muted-foreground">₹</span>
                                <Input 
                                    id="prizeAmount" 
                                    type="number" 
                                    placeholder="e.g., 5000" 
                                    className="h-12 rounded-xl bg-background/80 border-border text-foreground font-bold pl-8 placeholder:text-muted-foreground/60 focus-visible:ring-rose-500 text-sm shadow-sm"
                                    {...register('prizeAmount')} 
                                />
                            </div>
                            {errors.prizeAmount && <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.prizeAmount.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-foreground">Contest End Date <span className="text-rose-500">*</span></Label>
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full h-12 rounded-xl bg-background/80 border-border justify-start text-left font-bold text-sm shadow-sm hover:bg-background/90", !field.value && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-3 h-5 w-5 text-rose-500" />
                                            {field.value ? format(field.value, "PPP") : <span>Select end date (Must be in the future)</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-border bg-card shadow-xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                            className="p-3"
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.endDate && <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.endDate.message}</p>}
                    </div>

                    {/* Tier Summary Breakdown Card */}
                    {selectedRuleObj && (
                        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4 animate-in fade-in-50 duration-300 shadow-inner">
                            <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Coins className="w-4 h-4" /> Selected Tier Summary & Budget Breakdown
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left pt-1">
                                <div className="space-y-1 bg-background/60 p-4 rounded-xl border border-border/60">
                                    <p className="text-xs font-semibold text-muted-foreground">Platform Entry Fee</p>
                                    <p className="text-lg font-black text-foreground">₹{selectedRuleObj.contestPrice}</p>
                                </div>
                                <div className="space-y-1 bg-background/60 p-4 rounded-xl border border-border/60">
                                    <p className="text-xs font-semibold text-muted-foreground">Expected Submissions</p>
                                    <p className="text-lg font-black text-foreground">{selectedRuleObj.minParticipants} - {selectedRuleObj.maxParticipants} Designers</p>
                                </div>
                                <div className="space-y-1 bg-background/60 p-4 rounded-xl border border-border/60">
                                    <p className="text-xs font-semibold text-muted-foreground">Winner Prize Allocation</p>
                                    <p className="text-lg font-black text-rose-500">₹{watchPrizeAmount || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Funds are held securely in escrow until you approve the winning design.</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button 
                            type="button" 
                            variant="outline" 
                            disabled={isLoading} 
                            onClick={handleDummyPayment}
                            className="w-full sm:w-auto min-w-[180px] h-14 rounded-xl border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 font-extrabold text-sm shadow-sm transition-all duration-300"
                        >
                            <CreditCard className="w-4 h-4 mr-2" /> Dummy PG (Fast)
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full sm:w-auto min-w-[220px] h-14 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-base shadow-xl shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-300 group"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                            ) : (
                                <><Rocket className="w-5 h-5 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Proceed to Payment</>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
}
