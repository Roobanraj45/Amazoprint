'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  getCustomAddons, 
  createCustomAddon, 
  updateCustomAddon, 
  deleteCustomAddon 
} from '@/app/actions/custom-addon-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Library, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Tag, 
  FileImage, 
  Search,
  Check,
  Zap,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { resolveImagePath, cn } from '@/lib/utils';
import { MediaLibraryDialog } from '@/components/admin/media-library-dialog';

const customAddonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be positive').default(0),
  pricingType: z.enum(['per_unit', 'fixed']).default('per_unit'),
  isActive: z.boolean().default(true),
});

type CustomAddon = Awaited<ReturnType<typeof getCustomAddons>>[0];

export default function CustomAddonsPage() {
  const [addons, setAddons] = useState<CustomAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<CustomAddon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomAddons();
      setAddons(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load custom add-ons.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSubmit = async (data: z.infer<typeof customAddonSchema>) => {
    try {
      if (editingAddon) {
        await updateCustomAddon(editingAddon.id, data);
        toast({ title: 'Success', description: `Add-on "${data.name}" updated successfully.` });
      } else {
        await createCustomAddon(data);
        toast({ title: 'Success', description: `Add-on "${data.name}" created successfully.` });
      }
      setFormOpen(false);
      setEditingAddon(null);
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Operation failed.' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCustomAddon(id);
      toast({ title: "Success", description: "Custom add-on deleted successfully." });
      await loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const filteredAddons = addons.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse text-purple-400" />
                Dynamic Custom Add-ons Engine
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Custom Product Add-ons</h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-2 leading-relaxed">
              Create and configure bespoke finishing options, accessories, and specialty services (e.g., Lamination, Edge Coloring, Velvet Touch, Rush Processing) that can be mapped to any product variant with multi-selection on the storefront design page.
            </p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingAddon(null);
          }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingAddon(null)} 
                className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Custom Add-on
              </Button>
            </DialogTrigger>
            <CustomAddonForm 
              onSubmit={handleFormSubmit} 
              addon={editingAddon} 
              onClose={() => { setFormOpen(false); setEditingAddon(null); }} 
            />
          </Dialog>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search custom add-ons..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-semibold"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Total Configured:</span>
          <Badge variant="secondary" className="font-extrabold text-xs px-2.5 py-0.5 rounded-lg">
            {addons.length}
          </Badge>
        </div>
      </div>

      {/* Grid of Add-ons */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Loading custom add-ons catalog...</p>
        </div>
      ) : filteredAddons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAddons.map((ca) => (
            <Card key={ca.id} className="group overflow-hidden rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Visual Thumbnail */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
                  {ca.imageUrl ? (
                    <Image 
                      src={resolveImagePath(ca.imageUrl)} 
                      alt={ca.name} 
                      fill 
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <Badge className={cn("text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm", ca.isActive ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                      {ca.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Pricing Type Badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md", ca.pricingType === 'fixed' ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30")}>
                      {ca.pricingType === 'fixed' ? 'Fixed Flat Fee' : 'Per Unit Rate'}
                    </Badge>
                  </div>
                </div>

                {/* Card Content */}
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {ca.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono text-slate-400 mt-0.5">
                        slug: {ca.slug}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 font-black text-sm px-2.5 py-1 rounded-xl shrink-0">
                      ₹{Number(ca.price).toFixed(2)}
                      <span className="text-[10px] font-medium text-slate-400 ml-1">
                        {ca.pricingType === 'fixed' ? 'flat' : '/unit'}
                      </span>
                    </Badge>
                  </div>

                  {ca.description ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ca.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No description configured.</p>
                  )}
                </CardHeader>
              </div>

              {/* Card Footer Actions */}
              <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 font-bold text-xs transition-colors" 
                  onClick={() => { setEditingAddon(ca); setFormOpen(true); }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-destructive font-bold text-xs transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold">Delete Custom Add-on?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm font-medium">
                        Are you sure you want to remove &quot;{ca.name}&quot;? If this add-on is mapped to any products, it will be unlinked.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" 
                        onClick={() => handleDelete(ca.id)}
                      >
                        Permanently Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs text-center px-4 gap-4">
          <div className="h-20 w-20 rounded-full bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center border border-purple-200 dark:border-purple-800 shadow-inner">
            <Sparkles className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Custom Add-ons Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {searchQuery ? 'No custom add-ons matched your search criteria.' : 'Create your first custom add-on option to allow customers to choose specialty finishes, coatings, or accessories.'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => { setEditingAddon(null); setFormOpen(true); }}
              className="mt-2 h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Your First Add-on
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function CustomAddonForm({ onSubmit, addon, onClose }: {
  onSubmit: (data: z.infer<typeof customAddonSchema>) => void;
  addon: CustomAddon | null;
  onClose: () => void;
}) {
  const [isMediaBrowserOpen, setMediaBrowserOpen] = useState(false);
  const [mediaFolder, setMediaFolder] = useState('custom-addons');

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, setValue, watch } = useForm<z.infer<typeof customAddonSchema>>({
    resolver: zodResolver(customAddonSchema),
    defaultValues: {
      name: '',
      slug: '',
      imageUrl: '',
      description: '',
      price: 0,
      pricingType: 'per_unit',
      isActive: true,
    },
  });

  const imageUrl = watch('imageUrl');
  const pricingType = watch('pricingType');

  useEffect(() => {
    if (addon) {
      reset({
        name: addon.name,
        slug: addon.slug,
        imageUrl: addon.imageUrl || '',
        description: addon.description || '',
        price: Number(addon.price || 0),
        pricingType: (addon.pricingType as 'per_unit' | 'fixed') || 'per_unit',
        isActive: addon.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        slug: '',
        imageUrl: '',
        description: '',
        price: 0,
        pricingType: 'per_unit',
        isActive: true,
      });
    }
  }, [addon, reset]);

  // Auto-generate slug when name changes if adding new
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val, { shouldValidate: true });
    if (!addon) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh]">
      <DialogHeader className="p-8 pb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline-block text-purple-400" />
                Custom Add-on Configuration
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">
              {addon ? 'Edit Custom Add-on' : 'Create Custom Add-on'}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs mt-1">
              Set name, slug, pricing calculation model, and presentation imagery.
            </DialogDescription>
          </div>
          <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
            <Sparkles className="w-7 h-7 text-purple-400" />
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 overflow-y-auto flex-1">
          {/* Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="addon-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Add-on Name *
              </Label>
              <Input 
                id="addon-name" 
                {...register('name')} 
                onChange={handleNameChange}
                placeholder="e.g. Velvet Soft-Touch Lamination" 
                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold text-sm" 
              />
              {errors.name && <p className="text-destructive text-xs font-bold">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="addon-slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                URL Identifier / Slug *
              </Label>
              <Input 
                id="addon-slug" 
                {...register('slug')} 
                placeholder="e.g. velvet-soft-touch" 
                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold text-sm" 
              />
              {errors.slug && <p className="text-destructive text-xs font-bold">{errors.slug.message}</p>}
            </div>
          </div>

          {/* Pricing Model & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Pricing Calculation Model
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('pricingType', 'per_unit')}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    pricingType === 'per_unit' 
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600/20" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Per Unit Rate
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Multiplied by order quantity (e.g. ₹0.50 × 500)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('pricingType', 'fixed')}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    pricingType === 'fixed' 
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-600/20" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Fixed Flat Fee
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    One-time order flat rate regardless of quantity
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addon-price" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Default Rate Amount (₹) *
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <Input 
                  id="addon-price" 
                  type="number" 
                  step="0.01" 
                  {...register('price')} 
                  placeholder="0.00" 
                  className="pl-8 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-black text-sm" 
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Can be overridden per specific product variant later.
              </p>
              {errors.price && <p className="text-destructive text-xs font-bold">{errors.price.message}</p>}
            </div>
          </div>

          {/* Image Upload / Media Library */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Icon / Preview Graphic
            </Label>
            <div className="flex gap-2">
              <Input 
                {...register('imageUrl')} 
                placeholder="https://... or /uploads/..." 
                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold text-sm flex-1" 
              />
              <Dialog open={isMediaBrowserOpen} onOpenChange={setMediaBrowserOpen}>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-purple-50 hover:text-purple-600 transition-colors shrink-0"
                  >
                    <Library className="mr-2 h-4 w-4" />
                    Cloud Assets
                  </Button>
                </DialogTrigger>
                <MediaLibraryDialog 
                  folder={mediaFolder} 
                  setFolder={setMediaFolder} 
                  onSelect={(url) => {
                    setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                    setMediaBrowserOpen(false);
                  }}
                />
              </Dialog>
            </div>

            {imageUrl ? (
              <div className="relative h-28 w-28 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner p-2 flex items-center justify-center">
                <Image src={resolveImagePath(imageUrl)} alt="Preview" fill className="object-contain p-2" />
              </div>
            ) : (
              <div className="h-24 w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                <FileImage className="w-5 h-5 text-slate-300" />
                Optional: Upload an icon or finish preview image (Firebase auto-compressed &lt; 1 MB)
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="addon-desc" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Description & Customer Instructions
            </Label>
            <Textarea 
              id="addon-desc" 
              {...register('description')} 
              placeholder="Explain what this add-on offers, benefits to the customer, bleed requirements, or processing time..." 
              className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-sm p-3.5" 
              rows={3}
            />
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs">
            <div className="space-y-0.5">
              <Label htmlFor="addon-active" className="text-sm font-bold text-slate-900 dark:text-white">Active Status</Label>
              <p className="text-xs text-muted-foreground">When disabled, this add-on cannot be mapped or selected by customers.</p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch 
                  id="addon-active" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              )}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex items-center justify-end gap-3 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl font-bold">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {addon ? 'Update Add-on' : 'Create Add-on'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
