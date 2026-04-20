

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Folder = {
  name: string;
  files: string[];
};

type AssetLibraryProps = {
  onImageSelect: (src: string) => void;
  isAdmin?: boolean;
};

const USER_ASSETS_LOCAL_STORAGE_KEY = 'amazoprint_user_assets_v2';

export function AssetLibrary({ onImageSelect, isAdmin = false }: AssetLibraryProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    if (isAdmin) {
      try {
        const response = await fetch('/api/uploads/list');
        const data = await response.json();
        if (data.success) {
          setFolders(data.folders);
        } else {
          throw new Error(data.error || 'Failed to fetch assets');
        }
      } catch (error) {
        console.error("Failed to load user assets", error);
        toast({
          variant: 'destructive',
          title: 'Loading Error',
          description: 'Could not load uploaded assets.',
        });
        setFolders([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fetch from local storage for non-admins
      try {
        const localAssetsRaw = localStorage.getItem(USER_ASSETS_LOCAL_STORAGE_KEY);
        const localAssets = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
        if (localAssets.length > 0) {
          setFolders([{ name: 'My Local Uploads', files: localAssets }]);
        } else {
          setFolders([]);
        }
      } catch (error) {
          console.error("Failed to load user assets from localStorage", error);
          toast({ variant: 'destructive', title: 'Loading Error', description: 'Could not load your local assets.' });
          setFolders([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [toast, isAdmin]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFileUpload = async () => {
    if (!fileToUpload) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }
    setIsUploading(true);
    setIsUploadDialogOpen(false);

    if (isAdmin) {
      if (!folderName) {
        toast({ variant: 'destructive', title: 'Folder name is required for admins' });
        setIsUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', folderName);

      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Upload failed');
        
        onImageSelect(result.url);
        await fetchAssets();
        toast({ title: 'Upload successful', description: `${fileToUpload.name} has been added to the '${folderName}' folder.` });
      } catch (error) {
        console.error('Upload error:', error);
        toast({ variant: 'destructive', title: 'Upload Error', description: error instanceof Error ? error.message : 'Could not upload file. Please try again.' });
      } finally {
        setIsUploading(false);
        setFileToUpload(null);
        setFolderName('');
      }
    } else {
      // Local storage logic for users/freelancers
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const dataUrl = event.target?.result as string;
          const localAssetsRaw = localStorage.getItem(USER_ASSETS_LOCAL_STORAGE_KEY);
          const localAssets = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
          const updatedAssets = [dataUrl, ...localAssets]; // Add to beginning
          localStorage.setItem(USER_ASSETS_LOCAL_STORAGE_KEY, JSON.stringify(updatedAssets));

          setFolders([{ name: 'My Local Uploads', files: updatedAssets }]);
          onImageSelect(dataUrl);
          toast({ title: 'Image Added Locally' });
        } catch (e) {
          toast({ variant: 'destructive', title: 'Failed to save locally', description: 'Your browser storage might be full.' });
        } finally {
          setIsUploading(false);
          setFileToUpload(null);
        }
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
        setIsUploading(false);
      };
      reader.readAsDataURL(fileToUpload);
    }
  };

  const handleLocalDelete = (assetUrl: string) => {
    if (isAdmin) return;
    try {
        const localAssetsRaw = localStorage.getItem(USER_ASSETS_LOCAL_STORAGE_KEY);
        const localAssets: string[] = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
        const updatedAssets = localAssets.filter(url => url !== assetUrl);
        localStorage.setItem(USER_ASSETS_LOCAL_STORAGE_KEY, JSON.stringify(updatedAssets));

        if(updatedAssets.length > 0) {
            setFolders([{ name: 'My Local Uploads', files: updatedAssets }]);
        } else {
            setFolders([]);
        }
        toast({ title: 'Image removed from local library.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Could not remove image.' });
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium px-2">{isAdmin ? 'Asset Library' : 'Local Uploads'}</h3>
        <div className="flex items-center gap-1">
            <AlertDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Upload Asset">
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Upload New Asset</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isAdmin
                          ? "Choose a folder and select a file to upload to the server."
                          : "Select an image to add to your local library for this session."
                        }
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        {isAdmin && (
                            <div className="space-y-2">
                                <Label htmlFor="folder-name">Folder Name</Label>
                                <Input
                                    id="folder-name"
                                    placeholder="e.g., logos, backgrounds"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                />
                            </div>
                        )}
                         <div className="space-y-2">
                            <Label htmlFor="file-upload">File</Label>
                            <Input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFileUpload} disabled={(!fileToUpload || (isAdmin && !folderName)) || isUploading}>
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={fetchAssets} disabled={isLoading || isUploading} className="h-7 w-7" title="Refresh Assets">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>
      <ScrollArea className="h-full max-h-[60vh] pr-4 -mr-4">
        {isLoading && (
          <div className="space-y-2 pr-4">
            <div className="flex justify-between items-center h-10 px-2 bg-muted rounded-md animate-pulse" />
            <div className="flex justify-between items-center h-10 px-2 bg-muted rounded-md animate-pulse" />
            <div className="flex justify-between items-center h-10 px-2 bg-muted rounded-md animate-pulse" />
          </div>
        )}
        {!isLoading && folders.length > 0 && (
          <Accordion type="multiple" defaultValue={isAdmin ? folders.map(f => f.name) : ['My Local Uploads']} className="w-full">
            {folders.map(folder => (
              <AccordionItem value={folder.name} key={folder.name}>
                <AccordionTrigger className="capitalize">{folder.name} ({folder.files.length})</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-3 gap-2">
                    {folder.files.map((asset, index) => (
                      <div
                        key={`asset-${folder.name}-${index}`}
                        className="cursor-pointer group relative aspect-square bg-muted rounded-md p-2 hover:bg-accent flex items-center justify-center"
                        title={!isAdmin ? 'Click to add to canvas' : (asset.split('/').pop() || `Asset ${index + 1}`)}
                      >
                         <div className="w-full h-full" onClick={() => onImageSelect(asset)}>
                            <img
                                src={asset}
                                alt={!isAdmin ? `Local asset ${index + 1}` : (asset.split('/').pop() || `Asset ${index + 1}`)}
                                className="object-contain w-full h-full"
                                loading="lazy"
                            />
                        </div>
                        {!isAdmin && (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {e.stopPropagation(); handleLocalDelete(asset);}}
                            >
                                <Trash2 size={12}/>
                            </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        {!isLoading && folders.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground col-span-full">
            Upload your first asset to get started.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
