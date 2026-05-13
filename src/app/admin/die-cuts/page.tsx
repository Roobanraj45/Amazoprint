
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDieCuts, createDieCut, updateDieCut, deleteDieCut } from '@/app/actions/die-cut-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, ImageIcon, Library, Upload } from 'lucide-react';
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Die Cuts</h1>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDieCut(null);
        }}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Die Cut</Button>
          </DialogTrigger>
          <DieCutForm
            onSubmit={handleFormSubmit}
            dieCut={editingDieCut}
            onClose={() => setFormOpen(false)}
          />
        </Dialog>
      </div>

      {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {dieCuts.map((dc) => (
                <Card key={dc.id} className="overflow-hidden group">
                    <div className="aspect-square relative bg-white dark:bg-zinc-900 border-b p-4 group-hover:bg-slate-50 transition-colors">
                        {dc.imageUrl ? (
                            <Image src={resolveImagePath(dc.imageUrl)} alt={dc.name} fill className="object-contain p-2" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <CardHeader className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{dc.name}</CardTitle>
                                <CardDescription>{dc.slug}</CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDieCut(dc); setFormOpen(true); }}>
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
                                        <AlertDialogDescription>This will permanently delete the die cut.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(dc.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600">₹{Number(dc.amount).toFixed(2)} / card</span>
                            <Badge variant={dc.isActive ? 'default' : 'destructive'} className="text-[10px] h-4">
                                {dc.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>
            ))}
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
    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{dieCut ? 'Edit' : 'Add'} Die Cut</DialogTitle>
        <DialogDescription>Configure the die cut template details.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="Circle" />
              {errors.name && <p className="text-destructive text-sm font-medium">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} placeholder="circle-cut" />
              {errors.slug && <p className="text-destructive text-sm font-medium">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount per card (₹)</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
            {errors.amount && <p className="text-destructive text-sm font-medium">{errors.amount.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Image URL</Label>
            <div className="flex gap-2">
                <Input {...register('imageUrl')} placeholder="/uploads/die-cuts/circle.png" />
                <Dialog open={isImageBrowserOpen} onOpenChange={setImageBrowserOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                            <Library className="mr-2 h-4 w-4" />
                            Browse
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
            {imageUrl && (
                <div className="mt-2 relative h-32 w-32 rounded-md overflow-hidden bg-muted border mx-auto">
                    <Image src={resolveImagePath(imageUrl)} alt="Preview" fill className="object-contain" />
                </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...register('description')} 
              placeholder="Optional description..."
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
            {dieCut ? 'Update' : 'Create'} Die Cut
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
                                        <Image src={fileUrl} alt="" fill className="object-contain p-1" />
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
