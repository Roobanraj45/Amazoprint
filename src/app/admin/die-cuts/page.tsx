
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDieCuts, createDieCut, updateDieCut, deleteDieCut } from '@/app/actions/die-cut-actions';
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
import { Loader2, PlusCircle, Edit, Trash2, ImageIcon, Library, Upload, Sparkles, CheckCircle2, Scissors, Layers, Tag, FolderOpen, FileImage, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { resolveImagePath } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogClose } from '@/components/ui/dialog';

const dieCutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, 'Amount must be positive').default(0),
  isActive: z.boolean().default(true),
});

type DieCut = Awaited<ReturnType<typeof getDieCuts>>[0];

export default function DieCutsPage() {
  const [dieCuts, setDieCuts] = useState<DieCut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDieCut, setEditingDieCut] = useState<DieCut | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDieCuts();
      setDieCuts(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load die cut specifications.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSubmit = async (data: z.infer<typeof dieCutSchema>) => {
    try {
      if (editingDieCut) {
        await updateDieCut(editingDieCut.id, data);
        toast({ title: 'Success', description: 'Die cut updated.' });
      } else {
        await createDieCut(data);
        toast({ title: 'Success', description: 'Die cut created.' });
      }
      setFormOpen(false);
      setEditingDieCut(null);
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDieCut(id);
      toast({ title: "Success", description: "Die cut deleted." });
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
                <Scissors className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                Precision Die-Cut Engine
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Die Cut Shape Management</h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Create, organize, and configure custom physical shape outlines, SVG/PNG templates, and pricing add-on rules for specialty die-cut cards.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Dialog open={isFormOpen} onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditingDieCut(null);
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-12 rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-6 transition-all hover:scale-[1.02] w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Die Cut Shape
                </Button>
              </DialogTrigger>
              <DieCutForm
                onSubmit={handleFormSubmit}
                dieCut={editingDieCut}
                onClose={() => setFormOpen(false)}
              />
            </Dialog>
          </div>
        </div>
      </div>

      {isLoading ? (
          <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading die cut shape templates...</p>
          </div>
        ) : dieCuts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {dieCuts.map((dc) => (
                <Card key={dc.id} className="group border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
                    <div className="aspect-square relative bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 p-6 group-hover:bg-indigo-50/20 dark:group-hover:bg-indigo-950/20 transition-colors flex items-center justify-center overflow-hidden">
                        {dc.imageUrl ? (
                            <Image src={resolveImagePath(dc.imageUrl)} alt={dc.name} fill className="object-contain p-6 filter drop-shadow-md group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-600">No Shape Image</span>
                            </div>
                        )}
                        <Badge variant={dc.isActive ? 'default' : 'secondary'} className={`absolute top-3 right-3 h-5 text-[9px] font-extrabold px-2 rounded-full shadow-sm ${dc.isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {dc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <CardHeader className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                            <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{dc.name}</CardTitle>
                            <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">Slug: {dc.slug}</CardDescription>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Premium Add-on</span>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold text-xs px-2.5 py-0.5 rounded-xl shadow-sm">
                                ₹{Number(dc.amount).toFixed(2)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 font-bold text-xs transition-colors" onClick={() => { setEditingDieCut(dc); setFormOpen(true); }}>
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-955/30 dark:hover:text-red-400 text-destructive font-bold text-xs transition-colors">
                                <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Delete
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold">Delete Die Cut Shape?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium">This action will permanently delete this die-cut shape specification and its associated pricing rules. This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDelete(dc.id)}>Permanently Delete</AlertDialogAction>
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
                  <Scissors className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Die Cut Shapes Configured</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">There are currently no custom die-cut shape outlines available in the system. Click &apos;Add Die Cut Shape&apos; above to create your first template.</p>
          </div>
        )}
    </div>
  );
}

function DieCutForm({ onSubmit, dieCut, onClose }: {
  onSubmit: (data: z.infer<typeof dieCutSchema>) => void;
  dieCut: DieCut | null;
  onClose: () => void;
}) {
  const [isImageBrowserOpen, setImageBrowserOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('die-cuts');

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, setValue, watch } = useForm<z.infer<typeof dieCutSchema>>({
    resolver: zodResolver(dieCutSchema),
    defaultValues: {
      name: '',
      slug: '',
      imageUrl: '',
      description: '',
      amount: 0,
      isActive: true,
    },
  });

  const imageUrl = watch('imageUrl');

  useEffect(() => {
    if (dieCut) {
      reset({
        name: dieCut.name,
        slug: dieCut.slug,
        imageUrl: dieCut.imageUrl || '',
        description: dieCut.description || '',
        amount: Number(dieCut.amount || 0),
        isActive: dieCut.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        slug: '',
        imageUrl: '',
        description: '',
        amount: 0,
        isActive: true,
      });
    }
  }, [dieCut, reset]);

  return (
    <DialogContent className="sm:max-w-2xl p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <DialogHeader className="p-8 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                        <Scissors className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                        Die-Cut Specification Engine
                    </Badge>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">{dieCut ? 'Edit Die Cut Shape' : 'Create Die Cut Shape'}</DialogTitle>
                <DialogDescription className="text-slate-300 text-sm mt-1">Configure shape display names, URL slugs, pricing surcharges, and template preview imagery.</DialogDescription>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                <Scissors className="w-8 h-8 text-indigo-400" />
            </div>
        </div>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Shape Display Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Rounded Rectangle, Circle" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" />
              {errors.name && <p className="text-destructive text-xs font-bold mt-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">URL Slug</Label>
              <Input id="slug" {...register('slug')} placeholder="e.g. rounded-rectangle" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" />
              {errors.slug && <p className="text-destructive text-xs font-bold mt-1">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Premium Surcharge / Add-on Fee per Card (₹)</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" />
            </div>
            {errors.amount && <p className="text-destructive text-xs font-bold mt-1">{errors.amount.message}</p>}
          </div>
          
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Shape Outline Template (PNG/SVG)</Label>
            <div className="flex gap-3">
                <Input {...register('imageUrl')} placeholder="/uploads/die-cuts/shape.png" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold flex-1" />
                <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors flex-shrink-0">
                            <Library className="mr-2 h-4 w-4" />
                            Browse Library
                        </Button>
                    </DialogTrigger>
                    <ImageBrowserDialog 
                        folder={currentFolder} 
                        setFolder={setCurrentFolder} 
                        onSelect={(url) => {
                            setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
                            setImageBrowserOpen(false);
                        }}
                    />
                </Dialog>
            </div>
            {imageUrl ? (
                <div className="mt-4 relative h-40 w-40 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner mx-auto p-4 flex items-center justify-center">
                    <Image src={resolveImagePath(imageUrl)} alt="Die Cut Preview" fill className="object-contain p-4 filter drop-shadow-md" />
                </div>
            ) : (
                <div className="mt-4 h-40 w-40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 mx-auto flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600 shadow-inner">
                    <FileImage className="h-8 w-8" />
                    <span className="text-xs font-medium">No Image Selected</span>
                </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Shape Description</Label>
            <Textarea 
              id="description" 
              {...register('description')} 
              placeholder="Provide details about the die-cut dimensions, corner radiuses, suitable paper weights, or design bleed guidelines..."
              className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-4"
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Status</Label>
                <p className="text-xs text-muted-foreground font-medium">Allow customers to select this die-cut shape during card customization.</p>
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
            {dieCut ? 'Update' : 'Create'} Die Cut Shape
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

type Folder = {
    name: string;
    files: string[];
};
  
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
      <DialogContent className="max-w-5xl h-[85vh] p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
            <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Library className="w-5 h-5 text-indigo-400" />
                        Asset & Template Library
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 text-xs mt-1">Select an existing template shape from your cloud library or upload a new vector/raster asset.</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          <div className="flex-1 flex min-h-0 overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
            <Tabs defaultValue="browse" className="w-full flex flex-col min-h-0 overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-0 mx-6 mt-4 max-w-[calc(100%-3rem)] flex-shrink-0 shadow-inner">
                <TabsTrigger value="browse" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Browse Existing Assets</TabsTrigger>
                <TabsTrigger value="upload" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all">Upload New Asset</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="flex-1 min-h-0 overflow-hidden mt-4">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading library folders...</span>
                    </div>
                  ) : folders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
                        <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">No Library Assets Found</span>
                        <p className="text-xs text-muted-foreground max-w-sm">Your asset library is currently empty. Switch to the &apos;Upload New Asset&apos; tab above to upload your first template.</p>
                    </div>
                  ) : (
                    <div className="flex h-full border-t border-slate-200 dark:border-slate-800">
                        <ScrollArea className="w-60 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
                            <div className="p-3 space-y-1">
                                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1">Storage Folders</p>
                                {folders.map(f => (
                                  <Button 
                                    key={f.name} 
                                    variant={folder === f.name ? 'secondary' : 'ghost'} 
                                    className={`w-full justify-start capitalize h-10 px-3 rounded-xl font-bold text-xs transition-all ${folder === f.name ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    onClick={() => setFolder(f.name)}
                                  >
                                    <FolderOpen className={`w-4 h-4 mr-2 ${folder === f.name ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                    <span className="truncate">{f.name}</span>
                                    <Badge variant="secondary" className={`ml-auto text-[10px] px-1.5 py-0.2 rounded-md ${folder === f.name ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                        {f.files.length}
                                    </Badge>
                                  </Button>
                                ))}
                            </div>
                        </ScrollArea>
                        <ScrollArea className="flex-1 p-6 bg-white dark:bg-slate-900">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                {folders.find(f => f.name === folder)?.files.map((fileUrl) => (
                                  <DialogClose asChild key={fileUrl}>
                                    <button onClick={() => onSelect(fileUrl)} className="group aspect-square relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-3 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                        <Image src={fileUrl} alt="Library Asset" fill className="object-contain p-4 filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                                            <Badge variant="secondary" className="bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                                                SELECT
                                            </Badge>
                                        </div>
                                    </button>
                                  </DialogClose>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="flex-1 overflow-y-auto mt-4 px-6 py-4">
                 <div className="max-w-xl mx-auto space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name-upload" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Storage Folder</Label>
                        <p className="text-xs text-muted-foreground font-medium">The currently selected destination folder is <span className="font-extrabold text-indigo-600 dark:text-indigo-400 capitalize">{folder || 'N/A'}</span>. Create a new folder by typing a custom name below.</p>
                        <Input
                            id="folder-name-upload"
                            placeholder="e.g. die-cuts, shapes, custom-templates"
                            value={folder}
                            onChange={(e) => setFolder(e.target.value)}
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold mt-2"
                        />
                    </div>
                      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Label htmlFor="file-upload-dialog" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select File to Upload</Label>
                        <div className="relative">
                            <Input
                                id="file-upload-dialog"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold pt-2.5 cursor-pointer"
                            />
                        </div>
                        {fileToUpload && (
                            <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" /> Selected: {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>
                    <Button onClick={handleFileUpload} disabled={!fileToUpload || !folder || isUploading} className="w-full h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 mt-4">
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading & Processing Asset...' : 'Upload Asset and Select Automatically'}
                    </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
      </DialogContent>
    )
}
