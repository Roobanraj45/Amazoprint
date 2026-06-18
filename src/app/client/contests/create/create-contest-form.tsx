'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts } from '@/app/actions/product-actions';
import { getContestPricingRules, getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';
import { getDieCuts } from '@/app/actions/die-cut-actions';
import { getCardTextures } from '@/app/actions/card-texture-actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    CalendarIcon, Loader2, Trophy, Pencil, Lightbulb, CreditCard, Sparkles, 
    Rocket, ShieldCheck, CheckCircle2, AlertCircle, Coins, Award, 
    Package, Layers, Scissors, Stamp, FileText, Search, LayoutTemplate,
    Upload, X, UserCheck, Mail, Phone, ExternalLink, Globe, Briefcase, Clock, User
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn, resolveImagePath } from '@/lib/utils';
import { processDummyPayment } from '@/app/actions/payment-actions';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { getFreelancers, getFreelancerById } from '@/app/actions/contest-actions';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Background, Guide } from '@/lib/types';
import type { Product as DesignProduct } from '@/lib/types';

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

type Product = Awaited<ReturnType<typeof getProducts>>[0];
type ContestPricingRule = Awaited<ReturnType<typeof getContestPricingRules>>[0];

const contestFormSchema = z.object({
  title: z.string().min(1, 'Contest title is required'),
  description: z.string().optional(),
  productId: z.coerce.number().min(1, 'Product is required'),
  subProductId: z.coerce.number({invalid_type_error: "Product variant is required"}).min(1, 'Product variant is required'),
  prizeAmount: z.coerce.number().min(1, 'Prize amount must be positive'),
  pricingRuleId: z.coerce.number().optional().nullable(),
  endDate: z.coerce.date().refine(date => date > new Date(), { message: "End date must be in the future" }),
  imageUrl: z.string().optional(),
  contestType: z.enum(['tier', 'individual']).default('tier'),
  assignedFreelancerId: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.contestType === 'tier' && !data.pricingRuleId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a contest tier',
      path: ['pricingRuleId'],
    });
  }
  if (data.contestType === 'individual' && !data.assignedFreelancerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a freelancer',
      path: ['assignedFreelancerId'],
    });
  }
});

type ContestFormValues = z.infer<typeof contestFormSchema>;

export interface FreelancerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  hourlyRate?: number | null;
  portfolioUrl?: string | null;
  bio?: string | null;
  availabilityStatus?: string | null;
  designs?: {
    id: number;
    name: string;
    thumbnailUrl: string | null;
    productSlug: string;
    width: number;
    height: number;
    elements: any;
    background: any;
    guides?: any;
  }[] | null;
}

export function CreateContestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contestPricingRules, setContestPricingRules] = useState<ContestPricingRule[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Customization mappings
  const [dieCuts, setDieCuts] = useState<any[]>([]);
  const [cardTextures, setCardTextures] = useState<any[]>([]);
  const [customPricingRules, setCustomPricingRules] = useState<any[]>([]);

  const productIdFromUrl = searchParams.get('productId');
  const subProductIdFromUrl = searchParams.get('subProductId');
  const freelancerIdFromUrl = searchParams.get('freelancerId') || searchParams.get('designerId') || searchParams.get('designer');

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<ContestFormValues>({
    resolver: zodResolver(contestFormSchema),
    defaultValues: {
      productId: productIdFromUrl ? Number(productIdFromUrl) : undefined,
      subProductId: subProductIdFromUrl ? Number(subProductIdFromUrl) : undefined,
      contestType: freelancerIdFromUrl ? 'individual' : 'tier',
      pricingRuleId: undefined,
      assignedFreelancerId: freelancerIdFromUrl || undefined,
    }
  });

  const selectedProductId = watch('productId');
  const selectedSubProductId = watch('subProductId');
  const selectedPricingRuleId = watch('pricingRuleId');
  const watchPrizeAmount = watch('prizeAmount');
  const watchContestType = watch('contestType');
  const watchAssignedFreelancerId = watch('assignedFreelancerId');
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [selectedFreelancerObj, setSelectedFreelancerObj] = useState<FreelancerProfile | null>(null);
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore draft form fields from sessionStorage on mount
  useEffect(() => {
    const draft = sessionStorage.getItem('create_contest_form_draft');
    if (draft) {
      try {
        const values = JSON.parse(draft);
        if (values.title) setValue('title', values.title, { shouldValidate: true });
        if (values.description) setValue('description', values.description, { shouldValidate: true });
        if (values.productId) setValue('productId', values.productId, { shouldValidate: true });
        if (values.subProductId) setValue('subProductId', values.subProductId, { shouldValidate: true });
        if (values.prizeAmount) setValue('prizeAmount', values.prizeAmount, { shouldValidate: true });
        if (values.pricingRuleId) setValue('pricingRuleId', values.pricingRuleId, { shouldValidate: true });
        if (values.contestType) setValue('contestType', values.contestType, { shouldValidate: true });
        if (values.imageUrl) setValue('imageUrl', values.imageUrl, { shouldValidate: true });
        if (values.endDate) {
          setValue('endDate', new Date(values.endDate), { shouldValidate: true });
        }
      } catch (e) {
        console.error('Failed to restore form draft:', e);
      }
      sessionStorage.removeItem('create_contest_form_draft');
    }
  }, [setValue]);

  // Load initial freelancer details if designer is passed in URL query params
  useEffect(() => {
    if (freelancerIdFromUrl) {
      getFreelancerById(freelancerIdFromUrl)
        .then(freelancer => {
          if (freelancer) {
            setSelectedFreelancerObj(freelancer);
            setValue('assignedFreelancerId', freelancer.id, { shouldValidate: true });
          }
        })
        .catch(console.error);
    }
  }, [freelancerIdFromUrl, setValue]);

  const handleBrowseDesigners = () => {
    const currentValues = {
      title: watch('title'),
      description: watch('description'),
      productId: watch('productId'),
      subProductId: watch('subProductId'),
      prizeAmount: watch('prizeAmount'),
      pricingRuleId: watch('pricingRuleId'),
      endDate: watch('endDate'),
      imageUrl: watch('imageUrl'),
      contestType: watch('contestType'),
    };
    sessionStorage.setItem('create_contest_form_draft', JSON.stringify(currentValues));

    const currentParams = new URLSearchParams(window.location.search);
    router.push(`/client/contests/create/select-designer?${currentParams.toString()}`);
  };

  const watchImageUrl = watch('imageUrl');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const contestImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'contests');

    try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Upload failed');
        setValue('imageUrl', result.url, { shouldValidate: true });
        toast({ title: 'Image uploaded successfully.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
        setIsUploadingImage(false);
        if (contestImageInputRef.current) contestImageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setValue('imageUrl', '', { shouldValidate: true });
  };

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));
  const selectedRuleObj = contestPricingRules.find(r => r.id === Number(selectedPricingRuleId));

  useEffect(() => {
    async function loadProducts() {
      const prods = await getProducts();
      setProducts(prods);
    }
    loadProducts();
    getDieCuts().then(setDieCuts);
    getCardTextures().then(setCardTextures);
  }, []);

  useEffect(() => {
    const trimmed = freelancerSearch.trim();
    if (trimmed.length >= 3) {
      setLoadingFreelancers(true);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        getFreelancers(trimmed)
          .then(setFreelancers)
          .catch(console.error)
          .finally(() => setLoadingFreelancers(false));
      }, 300);
    } else {
      setFreelancers([]);
      setLoadingFreelancers(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [freelancerSearch]);

  useEffect(() => {
    if (selectedProductId) {
        setValue('subProductId', subProductIdFromUrl && Number(productIdFromUrl) === Number(selectedProductId) ? Number(subProductIdFromUrl) : undefined, { shouldValidate: true });
        setContestPricingRules([]);
        setValue('pricingRuleId', undefined as any, { shouldValidate: true });
    }
  }, [selectedProductId, setValue, subProductIdFromUrl, productIdFromUrl]);

  useEffect(() => {
    if (selectedSubProductId) {
        setLoadingPricing(true);
        getContestPricingRules(selectedSubProductId)
            .then(rules => {
                setContestPricingRules(rules);
                setValue('pricingRuleId', undefined as any, { shouldValidate: true });
            })
            .finally(() => setLoadingPricing(false));

        getPricingRulesForSubProduct(Number(selectedSubProductId))
            .then(rules => setCustomPricingRules(rules))
            .catch(() => {});
    } else {
        setContestPricingRules([]);
        setCustomPricingRules([]);
    }
  }, [selectedSubProductId, setValue]);

  // Read search parameters for initial configuration values
  const quantity = searchParams.get('quantity') || '500';
  const pages = searchParams.get('pages') || '1';
  const spotUv = searchParams.get('spotUv') === 'true';
  const dieCutId = searchParams.get('dieCut');
  const selectedDieCut = dieCuts.find(d => d.id === Number(dieCutId));
  const cardTextureId = searchParams.get('cardTexture');
  const selectedTextureObj = cardTextures.find(t => t.id === Number(cardTextureId));
  
  const addonsParam = searchParams.get('addons');
  const selectedAddonIds = addonsParam ? addonsParam.split(',').map(Number) : [];
  const selectedAddonsList = customPricingRules.filter(r => selectedAddonIds.includes(r.id));

  const customWidth = searchParams.get('width');
  const customHeight = searchParams.get('height');
  
  const subProductObj = selectedProduct?.subProducts?.find(s => s.id === Number(selectedSubProductId));
  
  const sizeDisplay = subProductObj 
      ? (subProductObj.width === 0 && subProductObj.height === 0 
          ? `Custom Size: ${customWidth || ''} x ${customHeight || ''} ${subProductObj.unitType}` 
          : `${subProductObj.width} x ${subProductObj.height} ${subProductObj.unitType}`)
      : '';

  // Customization pricing calculations matching start-design-content.tsx
  const calculatedCustomisationPrice = useMemo(() => {
    if (!subProductObj || customPricingRules.length === 0) return null;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) return null;

    let basePrice = Number(subProductObj.price || 0);
    let finalPrice = basePrice;
    let discount = 0;

    const standardRule = customPricingRules.find(r => !r.isDiscount && !r.isContest && !r.isVerification && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (standardRule && standardRule.unitPrice) {
        basePrice = Number(standardRule.unitPrice);
        finalPrice = basePrice;
    }

    const discountRule = customPricingRules.find(r => r.isDiscount && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (discountRule && discountRule.discountValue) {
        if (discountRule.discountType === 'percentage') {
            discount = basePrice * (Number(discountRule.discountValue) / 100);
        } else if (discountRule.discountType === 'fixed') {
            discount = Number(discountRule.discountValue);
        }
        finalPrice = basePrice - discount;
    }

    let addonTotalPerUnit = 0;
    const addonBreakdown: { name: string; totalAmount: number }[] = [];

    const isDoubleSided = pages === '2';

    if (isDoubleSided && subProductObj.backSideCost) {
        const amount = Number(subProductObj.backSideCost);
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: 'Double Sided Printing',
            totalAmount: amount * qty
        });
    }

    if (spotUv) {
        addonBreakdown.push({
            name: 'Spot UV Finish',
            totalAmount: 0
        });
    }

    selectedAddonIds.forEach(id => {
        const rule = customPricingRules.find(r => r.id === id);
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
        const customPrices = (subProductObj as any).dieCutPrices || {};
        const amount = Number(customPrices[selectedDieCut.id] || 0);
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: `Die Cut: ${selectedDieCut.name}`,
            totalAmount: amount * qty
        });
    }

    if (selectedTextureObj) {
        const customPrices = (subProductObj as any).cardTexturePrices || {};
        const amount = Number(customPrices[selectedTextureObj.id] || 0);
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: `Card Texture: ${selectedTextureObj.name}`,
            totalAmount: amount * qty
        });
    }

    const printBaseCost = finalPrice * qty;
    const addonsCost = addonTotalPerUnit * qty;
    const totalCost = printBaseCost + addonsCost;

    return {
        printBaseCost,
        addonsCost,
        addonBreakdown,
        totalCost,
    };
  }, [subProductObj, customPricingRules, quantity, pages, spotUv, selectedAddonIds, selectedDieCut, selectedTextureObj]);

  const customisation = {
      sizeDisplay,
      customWidth,
      customHeight,
      pages,
      spotUv,
      dieCut: selectedDieCut ? { id: selectedDieCut.id, name: selectedDieCut.name } : null,
      cardTexture: selectedTextureObj ? { id: selectedTextureObj.id, name: selectedTextureObj.name } : null,
      addons: selectedAddonsList.map(a => ({ id: a.id, name: a.addonName, price: a.addonPriceAmount })),
      quantity: quantity,
  };

  const handleCreateContest = async (data: ContestFormValues) => {
    setIsLoading(true);
    try {
      const isIndividual = data.contestType === 'individual';
      const entryFee = isIndividual ? 0 : Number(contestPricingRules.find(r => r.id === data.pricingRuleId)?.contestPrice || 0);
      const maxParticipants = isIndividual ? 1 : (contestPricingRules.find(r => r.id === data.pricingRuleId)?.maxParticipants || 1);

      if (!isIndividual) {
        const selectedRule = contestPricingRules.find(r => r.id === data.pricingRuleId);
        if (!selectedRule || !selectedRule.contestPrice) {
            throw new Error("Invalid pricing rule or price not found.");
        }
      }

      const specsCost = calculatedCustomisationPrice?.totalCost || 0;
      const totalAmount = specsCost + entryFee + Number(data.prizeAmount || 0);

      const contestData = {
          ...data,
          entryFee,
          maxFreelancers: maxParticipants,
          customisation: {
              ...customisation,
              specsCost,
              specsBreakdown: calculatedCustomisationPrice?.addonBreakdown || [],
              printBaseCost: calculatedCustomisationPrice?.printBaseCost || 0,
          },
      };
      // @ts-ignore
      delete contestData.pricingRuleId;
      
      const items = [
          { name: `Specifications Printing Cost`, quantity: 1, price: specsCost },
          { name: `Winner Prize Escrow`, quantity: 1, price: Number(data.prizeAmount || 0) }
      ];
      if (entryFee > 0) {
          items.push({ name: `Platform Entry Fee`, quantity: 1, price: entryFee });
      }

      const payload = {
        orderData: { contestData },
        amount: totalAmount,
        items,
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
            const isIndividual = data.contestType === 'individual';
            const entryFee = isIndividual ? 0 : Number(contestPricingRules.find(r => r.id === data.pricingRuleId)?.contestPrice || 0);
            const maxParticipants = isIndividual ? 1 : (contestPricingRules.find(r => r.id === data.pricingRuleId)?.maxParticipants || 1);

            if (!isIndividual) {
                const selectedRule = contestPricingRules.find(r => r.id === data.pricingRuleId);
                if (!selectedRule || !selectedRule.contestPrice) {
                    throw new Error("Invalid pricing rule or price not found.");
                }
            }

            const specsCost = calculatedCustomisationPrice?.totalCost || 0;
            const totalAmount = specsCost + entryFee + Number(data.prizeAmount || 0);

            const contestData = {
                ...data,
                entryFee,
                maxFreelancers: maxParticipants,
                customisation: {
                    ...customisation,
                    specsCost,
                    specsBreakdown: calculatedCustomisationPrice?.addonBreakdown || [],
                    printBaseCost: calculatedCustomisationPrice?.printBaseCost || 0,
                },
            };
            // @ts-ignore
            delete contestData.pricingRuleId;

            const result = await processDummyPayment({
                amount: totalAmount,
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 relative">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-[128px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none -z-10" />

        {/* Hero Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-5 py-2 rounded-full text-xs font-extrabold tracking-wider inline-flex items-center gap-2 shadow-sm">
                <Trophy className="w-4 h-4 animate-bounce" /> Premium Crowdsourced Design
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                Launch a Design Contest
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
                Harness the collective creativity of our global community. Get dozens of bespoke concepts tailored exactly to your unique product customizations.
            </p>
        </div>

        {/* How It Works Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, index) => (
                <div key={index} className="bg-card/40 backdrop-blur-xl border border-border/60 p-6 rounded-3xl shadow-sm hover:shadow-lg hover:border-rose-500/30 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-rose-500/20 transition-all duration-300 shadow-inner">
                        <step.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{step.description}</p>
                </div>
            ))}
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Configuration Specs Summary */}
            <div className="lg:col-span-6 space-y-6">
                {/* Main Product Image Viewer */}
                <div className="aspect-[4/3] relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md group flex items-center justify-center">
                    {selectedProduct?.imageUrl ? (
                        <Image 
                            src={resolveImagePath(selectedProduct.imageUrl)} 
                            alt={selectedProduct.name} 
                            fill 
                            className="object-contain p-8 transition-transform duration-700 group-hover:scale-105" 
                            priority 
                        />
                    ) : (
                        <LayoutTemplate className="h-20 w-20 text-slate-300 dark:text-slate-700" />
                    )}
                    <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-300">
                        <Search className="w-5 h-5" />
                    </div>
                </div>

                {/* Specs Matrix */}
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-tight border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Sparkles className="w-4 h-4 animate-pulse" /> Selected Customizations Summary
                    </div>

                    {/* 1. Dimensions */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">1.</span> Configured Dimensions
                        </Label>
                        <div className="py-2.5 px-4 rounded-2xl border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold text-center shadow-sm">
                            {sizeDisplay || 'Custom Dimensions / Product Size'}
                        </div>
                    </div>

                    {/* 2. Paper & Finishes */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">2.</span> Paper Stock & Finishes
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold text-center flex items-center justify-center shadow-sm">
                                {subProductObj?.name || 'Selected Variant'}
                            </div>
                            {spotUv && (
                                <div className="py-2.5 px-3 rounded-2xl border border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow ring-2 ring-amber-500/20">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Spot UV
                                </div>
                            )}
                            {selectedAddonsList.map(addon => (
                                <div key={addon.id} className="py-2.5 px-3 rounded-2xl border border-indigo-600 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow ring-2 ring-indigo-600/20 truncate">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> <span className="truncate">{addon.addonName || 'Add-on'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Card Shape & Die-Cut */}
                    {selectedDieCut && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">3.</span> Card Shape & Die-Cut
                            </Label>
                            <div className="py-2.5 px-4 rounded-2xl border border-indigo-600 bg-indigo-600/5 ring-2 ring-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2">
                                <Scissors className="w-4 h-4" /> {selectedDieCut.name}
                            </div>
                        </div>
                    )}

                    {/* 4. Texture & Tactile Finish */}
                    {selectedTextureObj && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                                <span className="text-amber-600 dark:text-amber-400 font-bold">4.</span> Texture & Tactile Finish
                            </Label>
                            <div className="py-2.5 px-4 rounded-2xl border border-amber-600 bg-amber-600/5 ring-2 ring-amber-600/20 text-amber-600 dark:text-amber-400 text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2">
                                <Stamp className="w-4 h-4" /> {selectedTextureObj.name}
                            </div>
                        </div>
                    )}

                    {/* 5. Printing Sides & Volume */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">5.</span> Printing Sides & Volume
                        </Label>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm">
                                <Layers className="w-4 h-4 text-indigo-500" />
                                <span>{quantity} Units</span>
                            </div>
                            <div className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <span>{pages === '2' ? 'Front & Back' : 'Front Only'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cost Breakdown of Selected Specifications */}
                    {calculatedCustomisationPrice && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5" /> Initial Specifications Cost
                            </div>
                            <div className="space-y-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                <div className="flex justify-between">
                                    <span>Base Printing ({quantity} units)</span>
                                    <span className="font-bold text-slate-900 dark:text-white">₹{calculatedCustomisationPrice.printBaseCost.toFixed(2)}</span>
                                </div>
                                {calculatedCustomisationPrice.addonBreakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-500 dark:text-slate-400 pl-2">
                                        <span>+ {item.name}</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">₹{item.totalAmount.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 font-black text-slate-900 dark:text-white text-xs">
                                    <span>Specifications Total</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">₹{calculatedCustomisationPrice.totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Form Card */}
            <div className="lg:col-span-6 bg-card border border-border shadow-xl rounded-3xl overflow-hidden relative">
                {/* Form Header banner */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-sm shrink-0">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-foreground tracking-tight">Contest Specifications</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Specify your contest details and budget parameters.</p>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit(handleCreateContest)} className="p-6 space-y-6">
                    {/* Section 1: Project Basics */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold text-foreground flex items-center justify-between tracking-tight">
                                <span>Contest Title <span className="text-rose-500">*</span></span>
                            </Label>
                            <Input 
                                id="title" 
                                placeholder="e.g., Minimalist & Elegant Business Card Design" 
                                className="h-11 rounded-2xl bg-background/80 border-border text-foreground font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-rose-500 text-xs shadow-sm"
                                {...register('title')} 
                            />
                            {errors.title && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-foreground flex items-center justify-between tracking-tight">
                                <span>Design Brief & Instructions <span className="text-muted-foreground font-normal">(Optional)</span></span>
                            </Label>
                            <Textarea 
                                id="description" 
                                placeholder="Provide detailed instructions, preferred color palettes, style guidelines, etc." 
                                className="min-h-[100px] rounded-2xl bg-background/80 border-border text-foreground font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-rose-500 text-xs shadow-sm resize-none p-4"
                                {...register('description')} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground flex items-center justify-between tracking-tight">
                                <span>Reference Image or Logo <span className="text-muted-foreground font-normal">(Optional)</span></span>
                            </Label>
                            
                            {watchImageUrl ? (
                                <div className="relative aspect-[16/10] max-w-sm rounded-2xl overflow-hidden border border-border shadow-sm bg-muted/30 flex items-center justify-center group">
                                    <Image 
                                        src={resolveImagePath(watchImageUrl)} 
                                        alt="Contest reference" 
                                        fill 
                                        className="object-contain p-2" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive" 
                                            size="icon"
                                            className="h-8 w-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                                            onClick={handleRemoveImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-28 rounded-2xl border-2 border-dashed border-border cursor-pointer bg-background/50 hover:bg-rose-500/5 hover:border-rose-500/50 text-muted-foreground hover:text-rose-500 transition-all shadow-sm">
                                    {isUploadingImage ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                                    ) : (
                                        <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                                    )}
                                    <span className="text-xs font-bold mt-1 text-center">Upload Reference Image</span>
                                    <input 
                                        type="file" 
                                        ref={contestImageInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        disabled={isUploadingImage} 
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Product Selects */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground tracking-tight">Target Product <span className="text-rose-500">*</span></Label>
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={true}>
                                        <SelectTrigger className="h-11 rounded-2xl bg-background/80 border-border font-bold text-xs shadow-sm focus:ring-rose-500 disabled:opacity-50">
                                            <SelectValue placeholder="Select a product..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border bg-card shadow-lg">
                                            {products.map(p => <SelectItem key={p.id} value={String(p.id)} className="font-semibold text-xs py-2">{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.productId && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.productId.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground tracking-tight">Product Variant <span className="text-rose-500">*</span></Label>
                            <Controller
                                name="subProductId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={true}>
                                        <SelectTrigger className="h-11 rounded-2xl bg-background/80 border-border font-bold text-xs shadow-sm focus:ring-rose-500 disabled:opacity-50">
                                            <SelectValue placeholder="Select a variant..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border bg-card shadow-lg">
                                            {selectedProduct?.subProducts.map(sp => (
                                                <SelectItem key={sp.id} value={String(sp.id)} className="font-semibold text-xs py-2">
                                                    {sp.name} ({sp.width}x{sp.height} mm)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.subProductId && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.subProductId.message}</p>}
                        </div>
                    </div>

                    {/* Section 2.5: Contest Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground tracking-tight">Distribution Method <span className="text-rose-500">*</span></Label>
                        <Controller
                            name="contestType"
                            control={control}
                            render={({ field }) => (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            field.onChange('tier');
                                            setValue('assignedFreelancerId', null);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 text-center gap-1",
                                            field.value === 'tier'
                                                ? "border-rose-500 bg-rose-500/5 text-rose-500 shadow-sm ring-2 ring-rose-500/10"
                                                : "border-border bg-background/50 hover:bg-muted/50 text-muted-foreground"
                                        )}
                                    >
                                        <Trophy className="w-4 h-4 text-rose-500" />
                                        <span className="text-xs font-bold">Tier Based</span>
                                        <span className="text-[9px] opacity-75 font-semibold">Open to matching tier designers</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            field.onChange('individual');
                                            setValue('pricingRuleId', null);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 text-center gap-1",
                                            field.value === 'individual'
                                                ? "border-rose-500 bg-rose-500/5 text-rose-500 shadow-sm ring-2 ring-rose-500/10"
                                                : "border-border bg-background/50 hover:bg-muted/50 text-muted-foreground"
                                        )}
                                    >
                                        <UserCheck className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-bold">Individual Freelancer</span>
                                        <span className="text-[9px] opacity-75 font-semibold">Assigned to one designer (₹0 Fee)</span>
                                    </button>
                                </div>
                            )}
                        />
                    </div>

                    {/* Section 3: Tier/Freelancer & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {watchContestType === 'tier' ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-foreground tracking-tight">Contest Tier <span className="text-rose-500">*</span></Label>
                                <Controller
                                    name="pricingRuleId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                                            value={field.value ? String(field.value) : ""}
                                            disabled={!selectedSubProductId || loadingPricing || contestPricingRules.length === 0}
                                        >
                                            <SelectTrigger className="h-11 rounded-2xl bg-background/80 border-border font-bold text-xs shadow-sm focus:ring-rose-500 disabled:opacity-50">
                                                <SelectValue placeholder="Select participant tier..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border bg-card shadow-lg">
                                                {loadingPricing ? (
                                                    <SelectItem value="loading" disabled className="py-2 text-xs font-semibold">Loading tiers...</SelectItem>
                                                ) : (
                                                    contestPricingRules.map(rule => (
                                                        <SelectItem key={rule.id} value={String(rule.id)} className="font-semibold text-xs py-2">
                                                            {rule.minParticipants}-{rule.maxParticipants} Designers (₹{rule.contestPrice})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.pricingRuleId && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.pricingRuleId.message}</p>}
                            </div>
                        ) : (
                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs font-bold text-foreground tracking-tight">Assigned Freelancer <span className="text-rose-500">*</span></Label>
                                <Controller
                                    name="assignedFreelancerId"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="space-y-3">
                                            {selectedFreelancerObj ? (
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-inner gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-indigo-500/20">
                                                            {selectedFreelancerObj.profileImage ? (
                                                                <Image 
                                                                    src={resolveImagePath(selectedFreelancerObj.profileImage)} 
                                                                    alt={selectedFreelancerObj.name} 
                                                                    width={48} 
                                                                    height={48} 
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <User className="w-6 h-6 text-indigo-500" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="text-sm font-black text-foreground">{selectedFreelancerObj.name}</h4>
                                                                <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold capitalize">
                                                                    {selectedFreelancerObj.availabilityStatus || 'available'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {selectedFreelancerObj.email}
                                                            </p>
                                                            {selectedFreelancerObj.skills && selectedFreelancerObj.skills.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {selectedFreelancerObj.skills.slice(0, 3).map((skill, idx) => (
                                                                        <Badge key={idx} variant="secondary" className="text-[8px] py-0 px-1 font-semibold">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                    {selectedFreelancerObj.skills.length > 3 && (
                                                                        <span className="text-[8px] text-muted-foreground font-bold">+{selectedFreelancerObj.skills.length - 3} more</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleBrowseDesigners}
                                                            className="rounded-xl font-bold text-xs"
                                                        >
                                                            Change Designer
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                field.onChange(null);
                                                                setSelectedFreelancerObj(null);
                                                            }}
                                                            className="rounded-xl font-bold text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    onClick={handleBrowseDesigners}
                                                    className="border-2 border-dashed border-border hover:border-indigo-500 hover:bg-indigo-500/5 rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 space-y-3 group"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-indigo-500/10 text-muted-foreground group-hover:text-indigo-500 flex items-center justify-center mx-auto transition-all duration-300">
                                                        <UserCheck className="w-6 h-6" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-extrabold text-foreground">No Freelancer Selected</h4>
                                                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                                            Assign an individual designer to your contest. Click to browse our catalog of elite freelancers.
                                                        </p>
                                                    </div>
                                                    <Button type="button" size="sm" className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                                                        Browse Designers Portfolio
                                                    </Button>
                                                </div>
                                            )}
                                            {/* Keep value bound to react-hook-form */}
                                            <input type="hidden" value={field.value || ""} />
                                        </div>
                                    )}
                                />
                                {errors.assignedFreelancerId && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.assignedFreelancerId.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="prizeAmount" className="text-xs font-bold text-foreground tracking-tight">Winner Prize (₹) <span className="text-rose-500">*</span></Label>
                            <Controller
                                name="prizeAmount"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} 
                                        value={field.value ? String(field.value) : ""}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl bg-background/80 border-border text-foreground font-extrabold text-xs shadow-sm focus:ring-rose-500">
                                            <SelectValue placeholder="Select prize amount..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border bg-card shadow-lg p-2 max-h-[220px] overflow-y-auto">
                                            {Array.from({ length: 20 }, (_, i) => (i + 1) * 50).map(amount => (
                                                <SelectItem key={amount} value={String(amount)} className="font-semibold text-xs py-2">
                                                    ₹{amount}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.prizeAmount && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.prizeAmount.message}</p>}
                        </div>
                    </div>

                    {/* Section 4: End Date */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground tracking-tight">Contest End Date <span className="text-rose-500">*</span></Label>
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => {
                                const stringValue = field.value
                                    ? new Date(field.value).toISOString().split('T')[0]
                                    : '';
                                return (
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500 pointer-events-none z-10" />
                                        <input
                                            type="date"
                                            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-background/80 border border-border text-foreground font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs shadow-sm transition-all"
                                            value={stringValue}
                                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Natively restrict to tomorrow or later
                                            onChange={(e) => {
                                                const val = e.target.value ? new Date(e.target.value) : undefined;
                                                field.onChange(val);
                                            }}
                                        />
                                    </div>
                                );
                            }}
                        />
                        {errors.endDate && <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.endDate.message}</p>}
                    </div>

                    {/* Selected Budget Breakdown Summary */}
                    {(selectedRuleObj || watchContestType === 'individual') && (
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-3 shadow-inner">
                            <h4 className="text-[10px] font-extrabold text-rose-500 tracking-wider flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5" /> Budget Breakdown
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div className="space-y-0.5 bg-background/60 p-2.5 rounded-xl border border-border/60">
                                    <p className="text-[9px] font-bold text-muted-foreground">Specifications Cost</p>
                                    <p className="text-xs font-black text-foreground">₹{(calculatedCustomisationPrice?.totalCost || 0).toFixed(2)}</p>
                                </div>
                                <div className="space-y-0.5 bg-background/60 p-2.5 rounded-xl border border-border/60">
                                    <p className="text-[9px] font-bold text-muted-foreground">Platform Fee</p>
                                    <p className="text-xs font-black text-foreground">₹{watchContestType === 'individual' ? '0.00' : Number(selectedRuleObj?.contestPrice || 0).toFixed(2)}</p>
                                </div>
                                <div className="space-y-0.5 bg-background/60 p-2.5 rounded-xl border border-border/60">
                                    <p className="text-[9px] font-bold text-rose-500">Winner Prize</p>
                                    <p className="text-xs font-black text-rose-500">₹{Number(watchPrizeAmount || 0).toFixed(2)}</p>
                                </div>
                                <div className="space-y-0.5 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                                    <p className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Grand Total</p>
                                    <p className="text-xs font-black text-indigo-600">₹{((calculatedCustomisationPrice?.totalCost || 0) + (watchContestType === 'individual' ? 0 : Number(selectedRuleObj?.contestPrice || 0)) + Number(watchPrizeAmount || 0)).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-border flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Escrow protection holds designer award funds safely.</span>
                        </div>

                        <div className="w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    disabled={isLoading} 
                                    onClick={handleDummyPayment}
                                    className="h-12 rounded-2xl border-2 border-dashed border-rose-500/50 hover:bg-rose-500/5 text-rose-500 font-extrabold text-xs shadow-sm transition-all"
                                >
                                    <CreditCard className="w-4 h-4 mr-2" /> Dummy Payment (Fast)
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/20 transition-all"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                    ) : (
                                        <><Rocket className="w-4 h-4 mr-2" /> Proceed to Payment</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}
