'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, RefreshCw, Trash2, FolderPlus, Image as ImageIcon, ChevronRight, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

  const [folderName, setFolderName] = useState('');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Auto-select folder if not admin
    if (!isAdmin) {
        setFileToUpload(file);
        // Direct local storage logic below
    } else {
        // For admin, we need to show the folder selection before final upload
        setFileToUpload(file);
        return;
    }

    setIsUploading(true);
    // Local storage logic for users/freelancers
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const dataUrl = event.target?.result as string;
            const localAssetsRaw = localStorage.getItem(USER_ASSETS_LOCAL_STORAGE_KEY);
            const localAssets = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
            const updatedAssets = [dataUrl, ...localAssets];
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
    reader.readAsDataURL(file);
  };

  const handleAdminUpload = async () => {
    if (!fileToUpload || !folderName) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folderName);

    try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Upload failed');
        
        onImageSelect(result.url);
        await fetchAssets();
        toast({ title: 'Upload successful', description: `${fileToUpload.name} added to '${folderName}'.` });
        setFileToUpload(null);
        setFolderName('');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Error', description: error instanceof Error ? error.message : 'Could not upload file.' });
    } finally {
        setIsUploading(false);
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
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <div>
          <h3 className="font-bold text-sm tracking-tight">{isAdmin ? 'Asset Library' : 'Local Uploads'}</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
            {folders.reduce((acc, f) => acc + f.files.length, 0)} Total Assets
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchAssets} disabled={isLoading || isUploading} className="h-8 w-8 rounded-full hover:bg-background shadow-sm border border-border/50">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Modern Upload Section */}
          <div className="space-y-4">
            {!fileToUpload ? (
              <div 
                className={cn(
                    "relative group cursor-pointer border-2 border-dashed border-border/60 rounded-xl p-8 transition-all hover:border-primary/50 hover:bg-primary/5",
                    isUploading && "pointer-events-none opacity-50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                    }}
                />
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Click to upload</p>
                        <p className="text-[11px] text-muted-foreground mt-1 px-4">Images up to 5MB are supported</p>
                    </div>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-background border flex items-center justify-center overflow-hidden">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{fileToUpload.name}</p>
                        <p className="text-[10px] text-muted-foreground">Confirm folder to upload</p>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Folder</Label>
                        <Select 
                            value={isCreatingNewFolder ? 'new' : folderName} 
                            onValueChange={(val) => {
                                if (val === 'new') {
                                    setIsCreatingNewFolder(true);
                                    setFolderName('');
                                } else {
                                    setIsCreatingNewFolder(false);
                                    setFolderName(val);
                                }
                            }}
                        >
                            <SelectTrigger className="h-9 bg-background border-border/50">
                                <SelectValue placeholder="Select folder..." />
                            </SelectTrigger>
                            <SelectContent>
                                {folders.map(f => (
                                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                                ))}
                                <SelectItem value="new" className="text-primary font-bold">
                                    <span className="flex items-center gap-2"><FolderPlus size={14}/> Create New Folder</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isCreatingNewFolder && (
                        <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">New Folder Name</Label>
                            <Input 
                                placeholder="Enter folder name..." 
                                value={folderName} 
                                onChange={(e) => setFolderName(e.target.value)}
                                className="h-9 bg-background"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => {setFileToUpload(null); setIsCreatingNewFolder(false);}}>Cancel</Button>
                    <Button 
                        size="sm" 
                        className="flex-1 h-9 shadow-lg shadow-primary/20" 
                        disabled={!folderName || isUploading}
                        onClick={handleAdminUpload}
                    >
                        {isUploading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <ChevronRight className="h-4 w-4 mr-2"/>}
                        Finish Upload
                    </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="h-px bg-border/40" />

          {/* Folder List */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                <Library size={12}/> Existing Assets
            </h4>
            
            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : folders.length > 0 ? (
                <Accordion type="multiple" defaultValue={folders.map(f => f.name)} className="w-full space-y-2 border-none">
                    {folders.map(folder => (
                        <AccordionItem value={folder.name} key={folder.name} className="border border-border/40 rounded-xl overflow-hidden bg-muted/10 px-1">
                            <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs capitalize">{folder.name}</span>
                                    <span className="text-[10px] bg-background border px-1.5 py-0.5 rounded-full font-mono">{folder.files.length}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-2 pb-3">
                                <div className="grid grid-cols-3 gap-2 pt-2">
                                    {folder.files.map((asset, index) => (
                                        <div
                                            key={`asset-${folder.name}-${index}`}
                                            className="group relative aspect-square bg-background border border-border/40 rounded-lg overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                                            onClick={() => onImageSelect(asset)}
                                        >
                                            <img
                                                src={asset}
                                                alt=""
                                                className="object-contain w-full h-full p-2 transition-transform group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            {!isAdmin && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-5 w-5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={(e) => {e.stopPropagation(); handleLocalDelete(asset);}}
                                                >
                                                    <Trash2 size={10}/>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center py-12 rounded-xl bg-muted/10 border border-dashed">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-xs text-muted-foreground">No assets found</p>
                </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Re-using Library icon for folder list
const Library = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>;
