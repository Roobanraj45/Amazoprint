'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageLibrary } from '../image-library';
import { ShapeLibrary, allShapes } from '../shape-library';
import { EmojiLibrary, emojiCategories } from '../emoji-library';
import { AssetLibrary } from '../asset-library';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

type MediaPanelProps = {
    onImageSelect: (src: string) => void;
    onAddShape: (shapeType: string) => void;
    onEmojiSelect: (emoji: string) => void;
    onAddSvgShape?: (src: string) => void;
    isAdmin?: boolean;
}

export const MediaPanel = ({ onImageSelect, onAddShape, onEmojiSelect, onAddSvgShape, isAdmin }: MediaPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localAssets, setLocalAssets] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      try {
        const localAssetsRaw = localStorage.getItem('amazoprint_user_assets_v2');
        const assets = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
        setLocalAssets(assets);
      } catch (e) {
        console.error("Could not load local assets for search:", e);
      }
    }
  }, [isAdmin]);

  const searchResults = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return null;

    const photos = PlaceHolderImages.filter(
      (img) =>
        img.description.toLowerCase().includes(term) ||
        img.imageHint.toLowerCase().includes(term)
    );

    const shapes = allShapes.filter((shape) =>
      shape.name.toLowerCase().replace(/-/g, ' ').includes(term)
    );

    const emojis = Object.values(emojiCategories)
      .flat()
      .filter((emoji) => emoji.name.toLowerCase().includes(term));
      
    const assets = localAssets.filter((_, index) => 
        `user upload ${index + 1}`.includes(term)
    );

    const hasResults = photos.length > 0 || shapes.length > 0 || emojis.length > 0 || assets.length > 0;

    return { photos, shapes, emojis, assets, hasResults };
  }, [searchTerm, localAssets]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-muted/30">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search all media..."
            className="pl-10 h-10 bg-background border-border/60 rounded-xl text-sm shadow-sm focus-visible:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {searchResults ? (
        <ScrollArea className="flex-1">
          {searchResults.hasResults ? (
            <div className="p-4 space-y-6">
              {searchResults.photos.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground px-1 mb-2 block">Photos</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {searchResults.photos.map(img => (
                      <div key={img.id} className="cursor-pointer aspect-square relative overflow-hidden rounded-md group" onClick={() => onImageSelect(img.imageUrl)}>
                        <Image src={img.imageUrl} alt={img.description} fill className="object-cover" data-ai-hint={img.imageHint} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.shapes.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground px-1 mb-2 block">Shapes</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {searchResults.shapes.map(shape => (
                      <div key={shape.name} title={shape.name} className="cursor-pointer aspect-square relative flex items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent text-foreground" onClick={() => onAddShape(shape.name)}>
                        {shape.icon}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.emojis.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground px-1 mb-2 block">Emojis</Label>
                  <div className="grid grid-cols-8 gap-1">
                    {searchResults.emojis.map(emoji => (
                      <div key={emoji.char} className="cursor-pointer text-2xl flex items-center justify-center aspect-square rounded-md hover:bg-accent" onClick={() => onEmojiSelect(emoji.char)} title={emoji.name}>
                        {emoji.char}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.assets.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-muted-foreground px-1 mb-2 block">My uploads</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {searchResults.assets.map((asset, index) => (
                      <div key={`search-asset-${index}`} className="cursor-pointer aspect-square relative overflow-hidden rounded-md group bg-muted hover:bg-accent" onClick={() => onImageSelect(asset)}>
                        <Image src={asset} alt={`User asset ${index + 1}`} fill className="object-contain p-2"/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">No results found for "{searchTerm}".</div>
          )}
        </ScrollArea>
      ) : (
        <Tabs defaultValue="photos" className="flex-1 flex flex-col min-h-0 bg-background">
          <div className="p-4 pb-2">
            <TabsList className="h-11 grid w-full grid-cols-4 bg-muted/40 border border-border/20 rounded-2xl p-1.5 shadow-inner">
              <TabsTrigger value="photos" className="text-[11px] font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Photos</TabsTrigger>
              <TabsTrigger value="shapes" className="text-[11px] font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Shapes</TabsTrigger>
              <TabsTrigger value="emojis" className="text-[11px] font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Emojis</TabsTrigger>
              <TabsTrigger value="assets" className="text-[11px] font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Assets</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="photos" className="flex-1 overflow-hidden mt-0 min-h-0 border-t border-border/20">
            <ImageLibrary onImageSelect={onImageSelect} />
          </TabsContent>
          <TabsContent value="shapes" className="flex-1 overflow-hidden mt-0 min-h-0 border-t border-border/20">
            <ShapeLibrary onAddShape={onAddShape} onAddImage={onImageSelect} onAddSvgShape={onAddSvgShape} />
          </TabsContent>
          <TabsContent value="emojis" className="flex-1 overflow-hidden mt-0 min-h-0 border-t border-border/20">
            <EmojiLibrary onEmojiSelect={onEmojiSelect} />
          </TabsContent>
          <TabsContent value="assets" className="flex-1 overflow-hidden mt-0 min-h-0 border-t border-border/20">
            <AssetLibrary onImageSelect={onImageSelect} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
