'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFoilTypes, createFoilType, updateFoilType, deleteFoilType } from '@/app/actions/foil-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, Sparkles, CheckCircle2, Palette, Layers, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Schema without allowedSubProductIds
const foilTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  colorCode: z.string().default('#FFD700'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FoilType = Awaited<ReturnType<typeof getFoilTypes>>[0];

export default function FoilsPage() {
  const [foilTypes, setFoilTypes] = useState<FoilType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingFoil, setEditingFoil] = useState<FoilType | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const foils = await getFoilTypes();
      setFoilTypes(foils);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load foil data.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSubmit = async (data: z.infer<typeof foilTypeSchema>) => {
    try {
      if (editingFoil) {
        await updateFoilType(editingFoil.id, data);
        toast({ title: 'Success', description: 'Foil type updated.' });
      } else {
        await createFoilType(data);
        toast({ title: 'Success', description: 'Foil type created.' });
      }
      setFormOpen(false);
      setEditingFoil(null);
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFoilType(id);
      toast({ title: "Success", description: "Foil type deleted." });
      await loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
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
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Specialized Foil Engine
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Foil Type Management</h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Create, configure, and manage premium metallic foil colors, custom hex representations, and physical print availability for specialty finishing options.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Dialog open={isFormOpen} onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditingFoil(null);
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-12 rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-6 transition-all hover:scale-[1.02] w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Foil Type
                </Button>
              </DialogTrigger>
              <FoilForm
                onSubmit={handleFormSubmit}
                foil={editingFoil}
                onClose={() => setFormOpen(false)}
              />
            </Dialog>
          </div>
        </div>
      </div>

      {isLoading ? (
          <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading foil specifications...</p>
          </div>
        ) : foilTypes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {foilTypes.map((foil) => (
                <Card key={foil.id} className="group border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
                    <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row justify-between items-start gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                        <div>
                            <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{foil.name}</CardTitle>
                            <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Slug: {foil.slug}</CardDescription>
                        </div>
                        <Badge variant={foil.isActive ? 'default' : 'secondary'} className={`h-6 text-[10px] font-extrabold px-2.5 rounded-full shadow-sm ${foil.isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {foil.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div 
                              className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden" 
                              style={{ backgroundColor: foil.colorCode || '#FFD700' }} 
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/30 pointer-events-none" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hex Color Code</p>
                                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white uppercase">{foil.colorCode || '#FFD700'}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-3">
                                {foil.description?.trim() ? foil.description : <span className="italic text-slate-400 dark:text-slate-600">No description provided for this foil type.</span>}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 font-bold transition-colors" onClick={() => { setEditingFoil(foil); setFormOpen(true); }}>
                            <Edit className="h-4 w-4 mr-1.5" /> Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-955/30 dark:hover:text-red-400 text-destructive font-bold transition-colors">
                                <Trash2 className="h-4 w-4 mr-1.5 text-destructive" /> Delete
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold">Delete Foil Type?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium">This action will permanently delete this metallic foil color specification. This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDelete(foil.id)}>Permanently Delete</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center px-4 gap-4">
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                  <Sparkles className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Foil Types Configured</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">There are currently no metallic foil specifications available in the system. Click &apos;Add Foil Type&apos; above to create your first specialty finish.</p>
          </div>
        )}
    </div>
  );
}

function FoilForm({ onSubmit, foil, onClose }: {
  onSubmit: (data: z.infer<typeof foilTypeSchema>) => void;
  foil: FoilType | null;
  onClose: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<z.infer<typeof foilTypeSchema>>({
    resolver: zodResolver(foilTypeSchema),
    defaultValues: {
      name: '',
      slug: '',
      colorCode: '#FFD700',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (foil) {
      reset({
        name: foil.name,
        slug: foil.slug,
        colorCode: foil.colorCode || '#FFD700',
        description: foil.description || '',
        isActive: foil.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        slug: '',
        colorCode: '#FFD700',
        description: '',
        isActive: true,
      });
    }
  }, [foil, reset]);

  return (
    <DialogContent className="sm:max-w-2xl p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden">
      <DialogHeader className="p-8 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                        <Palette className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                        Foil Specification Engine
                    </Badge>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">{foil ? 'Edit Metallic Foil Type' : 'Create Metallic Foil Type'}</DialogTitle>
                <DialogDescription className="text-slate-300 text-sm mt-1">Configure specialty foil display names, URL slugs, and precise hex color representations.</DialogDescription>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
        </div>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Foil Display Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Premium Gold Foil" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" />
              {errors.name && <p className="text-destructive text-xs font-bold mt-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">URL Slug</Label>
              <Input id="slug" {...register('slug')} placeholder="e.g. premium-gold-foil" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" />
              {errors.slug && <p className="text-destructive text-xs font-bold mt-1">{errors.slug.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="colorCode" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hex Color Code Representation</Label>
            <Controller
              name="colorCode"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0 h-12 w-16">
                      <Input 
                        type="color" 
                        className="absolute inset-0 p-0 h-full w-24 cursor-pointer border-0 bg-transparent -ml-2 -mt-2" 
                        value={field.value} 
                        onChange={(e) => field.onChange(e.target.value)} 
                      />
                  </div>
                  <Input 
                    placeholder="#FFD700" 
                    value={field.value} 
                    onChange={(e) => field.onChange(e.target.value)} 
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-mono font-extrabold text-base uppercase"
                  />
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground font-medium italic mt-1">Select or type the precise hex color code used to render this foil preview in the customer design studio.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Foil Description</Label>
            <Textarea 
              id="description" 
              {...register('description')} 
              placeholder="Provide details about the foil material, reflectivity, recommended print applications, or care instructions..."
              className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-4"
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Status</Label>
                <p className="text-xs text-muted-foreground font-medium">Allow customers to choose this foil type during customization.</p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch 
                  id="isActive" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              )}
            />
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {foil ? 'Update' : 'Create'} Foil Type
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
