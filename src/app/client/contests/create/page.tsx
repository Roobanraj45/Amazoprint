'use client';
import { useState, useEffect, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts } from '@/app/actions/product-actions';
import { createContest } from '@/app/actions/contest-actions';
import { getContestPricingRules } from '@/app/actions/pricing-actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, Trophy, Pencil, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Product = Awaited<ReturnType<typeof getProducts>>[0];
type ContestPricingRule = Awaited<ReturnType<typeof getContestPricingRules>>[0];

const contestFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  productId: z.coerce.number().min(1, 'Product is required'),
  subProductId: z.coerce.number({invalid_type_error: "Product variant is required"}).min(1, 'Product variant is required'),
  prizeAmount: z.coerce.number().min(1, 'Prize amount must be positive'),
  pricingRuleId: z.coerce.number().min(1, 'Please select a contest tier'),
  endDate: z.coerce.date().refine(date => date > new Date(), { message: "End date must be in the future" }),
});

type ContestFormValues = z.infer<typeof contestFormSchema>;

function CreateContestContent() {
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
  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

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
        setValue('pricingRuleId', undefined, { shouldValidate: true });
    }
  }, [selectedProductId, setValue, subProductIdFromUrl]);

  useEffect(() => {
    if (selectedSubProductId) {
        setLoadingPricing(true);
        getContestPricingRules(selectedSubProductId)
            .then(rules => {
                setContestPricingRules(rules);
                setValue('pricingRuleId', undefined, { shouldValidate: true });
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

  const howItWorks = [
    { icon: Pencil, title: 'Write Your Brief', description: 'Describe your vision, what you need, and the prize you\'re offering.'},
    { icon: Lightbulb, title: 'Receive Designs', description: 'Our community of designers submits their creative concepts for your review.'},
    { icon: Trophy, title: 'Pick a Winner', description: 'Choose your favorite design, award the prize, and receive the print-ready files.'},
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center pt-8">
            <h1 className="text-4xl font-bold tracking-tight">Launch a Design Contest</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
              Tap into our community of talented designers to get the perfect design for your product.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
            {howItWorks.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20 mb-3">
                        <step.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
            ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contest Details</CardTitle>
            <CardDescription>Fill out the form below. Fields marked with an asterisk are required.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(handleCreateContest)}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Contest Title*</Label>
                    <Input id="title" placeholder="e.g., Logo for a new Cafe" {...register('title')} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe what you're looking for in the design..." {...register('description')} rows={5}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Product*</Label>
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
                        {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Product Variant*</Label>
                        <Controller
                            name="subProductId"
                            control={control}
                            render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={!selectedProduct}>
                                <SelectTrigger><SelectValue placeholder="Select a variant..." /></SelectTrigger>
                                <SelectContent>
                                {selectedProduct?.subProducts.map(sp => <SelectItem key={sp.id} value={String(sp.id)}>{sp.name} ({sp.width}x{sp.height} mm)</SelectItem>)}
                                </SelectContent>
                            </Select>
                            )}
                        />
                        {errors.subProductId && <p className="text-sm text-destructive">{errors.subProductId.message}</p>}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Contest Tier*</Label>
                        <Controller
                            name="pricingRuleId"
                            control={control}
                            render={({ field }) => (
                            <Select
                                onValueChange={field.onChange}
                                value={field.value ? String(field.value) : ""}
                                disabled={!selectedSubProductId || loadingPricing || contestPricingRules.length === 0}
                            >
                                <SelectTrigger>
                                <SelectValue placeholder="Select participants tier..." />
                                </SelectTrigger>
                                <SelectContent>
                                {loadingPricing ? (
                                    <SelectItem value="loading" disabled>Loading tiers...</SelectItem>
                                ) : (
                                    contestPricingRules.map(rule => (
                                    <SelectItem key={rule.id} value={String(rule.id)}>
                                        {rule.minParticipants}-{rule.maxParticipants} Participants (Fee: ₹{rule.contestPrice})
                                    </SelectItem>
                                    ))
                                )}
                                {!loadingPricing && contestPricingRules.length === 0 && <SelectItem value="no-rules" disabled>No contest tiers for this variant.</SelectItem>}
                                </SelectContent>
                            </Select>
                            )}
                        />
                        {errors.pricingRuleId && <p className="text-sm text-destructive">{errors.pricingRuleId.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prizeAmount">Prize Amount (₹)*</Label>
                        <Input id="prizeAmount" type="number" placeholder="e.g., 5000" {...register('prizeAmount')} />
                        {errors.prizeAmount && <p className="text-sm text-destructive">{errors.prizeAmount.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>End Date*</Label>
                    <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                    {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proceed to Payment
              </Button>
            </CardFooter>
          </form>
        </Card>
    </div>
  );
}

export default function CreateContestPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
      <CreateContestContent />
    </Suspense>
  );
}
