
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FONTS = ["Big Apple NF", "Agent Orange", "Airstream", "Bevan", "Bree Serif", "Coda", "Frijole", "Fugaz One", "Jura", "Lobster", "Pacifico", "Oswald", "Raleway"];

export const TextEffectsLibrary = ({ 
    selectedEffect, 
    selectedFont, 
    onSelectEffect, 
    onSelectFont 
}: any) => {
    const [search, setSearch] = useState('');

    const effects = Array.from({ length: 60 }, (_, i) => i + 1);

    const filteredFonts = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

    return (
        <Tabs defaultValue="style" className="h-full flex flex-col">
            <div className="p-4 pb-2 space-y-3">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="style" className="flex-1">Effects</TabsTrigger>
                    <TabsTrigger value="font" className="flex-1">Fonts</TabsTrigger>
                </TabsList>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search styles..." 
                        className="pl-8 h-9" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <TabsContent value="style" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full px-4">
                    <div className="grid grid-cols-3 gap-2 pb-4">
                        {effects.map((id) => (
                            <button
                                key={id}
                                onClick={() => onSelectEffect(id)}
                                className={`group relative aspect-square rounded-xl border-2 p-2 transition-all overflow-hidden bg-white dark:bg-zinc-800 ${
                                    selectedEffect === id ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/30'
                                }`}
                            >
                                <img 
                                    src={`https://d1csarkz8obe9u.cloudfront.net/assets/texteffects/small/${id}.webp`}
                                    alt={`Style ${id}`}
                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                                    loading="lazy"
                                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                                />
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>

            <TabsContent value="font" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full px-4">
                    <div className="grid grid-cols-1 gap-1 pb-4">
                        {filteredFonts.map((font) => (
                            <button
                                key={font}
                                onClick={() => onSelectFont(font)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                    selectedFont === font ? 'bg-primary/10 border-primary/50 text-primary' : 'hover:bg-muted border-transparent'
                                }`}
                            >
                                <span className="text-base" style={{ fontFamily: font }}>{font}</span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );
};
