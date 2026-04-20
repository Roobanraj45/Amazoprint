'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type ImageLibraryProps = {
  onImageSelect: (src: string) => void;
};

export function ImageLibrary({ onImageSelect }: ImageLibraryProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelect(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow uploading the same file again
    e.target.value = '';
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 grid grid-cols-2 gap-4">
        <Label className="cursor-pointer aspect-square relative flex flex-col items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent text-foreground border-2 border-dashed">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="mt-2 text-sm text-center text-muted-foreground">
            Upload Image
          </span>
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </Label>

        {PlaceHolderImages.map((img) => (
          <div
            key={img.id}
            className="cursor-pointer aspect-square relative overflow-hidden rounded-md group"
            onClick={() => onImageSelect(img.imageUrl)}
          >
            <Image
              src={img.imageUrl}
              alt={img.description}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              data-ai-hint={img.imageHint}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
