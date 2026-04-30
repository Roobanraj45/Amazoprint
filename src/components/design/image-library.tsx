import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type ImageLibraryProps = {
  onImageSelect: (src: string) => void;
  isAdmin?: boolean;
};

const USER_ASSETS_LOCAL_STORAGE_KEY = 'amazoprint_user_assets_v2';

export function ImageLibrary({ onImageSelect, isAdmin = false }: ImageLibraryProps) {
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const fetchServerImages = async () => {
    try {
      const response = await fetch('/api/uploads/list');
      const data = await response.json();
      if (data.success) {
        const photosFolder = data.folders.find((f: any) => f.name.toLowerCase() === 'photos');
        if (photosFolder) {
          setServerImages(photosFolder.files);
        }
      }
    } catch (error) {
      console.error("Failed to fetch server images", error);
    }
  };

  const loadLocalImages = useCallback(() => {
    try {
      const saved = localStorage.getItem(USER_ASSETS_LOCAL_STORAGE_KEY);
      if (saved) {
        setLocalImages(JSON.parse(saved));
      } else {
        setLocalImages([]);
      }
    } catch (e) {
      console.error("Failed to load local images", e);
    }
  }, []);

  useEffect(() => {
    fetchServerImages();
    loadLocalImages();

    window.addEventListener('amazoprint_assets_updated', loadLocalImages);
    return () => window.removeEventListener('amazoprint_assets_updated', loadLocalImages);
  }, [isAdmin, loadLocalImages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isAdmin) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'photos');
      
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
          onImageSelect(result.url);
          fetchServerImages(); // Refresh the list
          toast({ title: "Image uploaded to server" });
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Upload failed", description: error instanceof Error ? error.message : "Could not upload to server" });
      } finally {
        setIsUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const dataUrl = event.target?.result as string;
          const updated = [dataUrl, ...localImages];
          setLocalImages(updated);
          localStorage.setItem(USER_ASSETS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
          onImageSelect(dataUrl);
          toast({ title: "Image saved locally" });
        } catch (e) {
          toast({ variant: "destructive", title: "Storage full", description: "Could not save image locally." });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleRemoveLocal = (url: string) => {
    const updated = localImages.filter(img => img !== url);
    setLocalImages(updated);
    localStorage.setItem(USER_ASSETS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
    toast({ title: "Image removed from local library" });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 grid grid-cols-2 gap-4">
        <Label className="cursor-pointer aspect-square relative flex flex-col items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent text-foreground border-2 border-dashed">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="mt-2 text-xs font-bold text-center text-muted-foreground group-hover:text-primary">
            {isAdmin ? 'Upload to Server' : 'Upload Image'}
          </span>
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </Label>

        {/* Local Images (Users & Admins) */}
        {localImages.map((src, index) => (
          <div
            key={`local-${index}`}
            className="cursor-pointer aspect-square relative overflow-hidden rounded-md group bg-muted border border-border/20 shadow-sm"
            onClick={() => onImageSelect(src)}
          >
            <img
              src={src}
              alt=""
              className="object-contain w-full h-full p-1 transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleRemoveLocal(src); }}
            >
                <Trash2 size={12} />
            </Button>
          </div>
        ))}

        {/* Server Images (Photos folder) */}
        {serverImages.map((url, index) => (
          <div
            key={`server-${index}`}
            className="cursor-pointer aspect-square relative overflow-hidden rounded-md group bg-muted border border-border/20 shadow-sm"
            onClick={() => onImageSelect(url)}
          >
             <Image
              src={url}
              alt=""
              fill
              className="object-contain p-1 transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-colors" />
          </div>
        ))}

        {/* Predefined Library */}
        {PlaceHolderImages.map((img) => (
          <div
            key={img.id}
            className="cursor-pointer aspect-square relative overflow-hidden rounded-md group shadow-sm border border-border/20"
            onClick={() => onImageSelect(img.imageUrl)}
          >
            <Image
              src={img.imageUrl}
              alt={img.description}
              fill
              className="object-contain p-1 transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
