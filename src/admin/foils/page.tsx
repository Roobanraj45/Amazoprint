'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFoilTypes, createFoilType, updateFoilType, deleteFoilType } from '@/app/actions/foil-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Foil Types</h1>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingFoil(null);
        }}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Foil Type</Button>
          </DialogTrigger>
          <FoilForm
            onSubmit={handleFormSubmit}
            foil={editingFoil}
            onClose={() => setFormOpen(false)}
          />
        </Dialog>
      </div>

      {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foilTypes.map((foil) => (
                <Card key={foil.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{foil.name}</CardTitle>
                                <CardDescription>{foil.slug}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingFoil(foil); setFormOpen(true); }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the foil type.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(foil.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div 
                                className="w-5 h-5 rounded-full border shadow-sm" 
                                style={{ backgroundColor: foil.colorCode || 'transparent' }} 
                                />
                                <span className="font-mono text-xs uppercase">{foil.colorCode}</span>
                            </div>
                             <Badge variant={foil.isActive ? 'default' : 'destructive'}>
                                {foil.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                       </div>
                    </CardContent>
                </Card>
            ))}
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
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{foil ? 'Edit' : 'Add'} Foil Type</DialogTitle>
        <DialogDescription>Fill in the details for this foil type.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="Gold Foil" />
              {errors.name && <p className="text-destructive text-sm font-medium">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} placeholder="gold-foil" />
              {errors.slug && <p className="text-destructive text-sm font-medium">{errors.slug.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="colorCode">Color Code</Label>
            <Controller
              name="colorCode"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Input 
                    type="color" 
                    className="p-1 h-10 w-14 cursor-pointer" 
                    value={field.value} 
                    onChange={(e) => field.onChange(e.target.value)} 
                  />
                  <Input 
                    placeholder="#FFD700" 
                    value={field.value} 
                    onChange={(e) => field.onChange(e.target.value)} 
                    className="uppercase font-mono"
                  />
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...register('description')} 
              placeholder="Optional description of the foil..."
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch 
                  id="isActive" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
            <Label htmlFor="isActive">Active Status</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {foil ? 'Update' : 'Create'} Foil Type
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
