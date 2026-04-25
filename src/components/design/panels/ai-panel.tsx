
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Eraser, Loader2, Image as ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { removeBackground } from '@/ai/flows/remove-background-flow';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

type AiPanelProps = {
    onImageProcessed: (src: string) => void;
}

export const AiPanel = ({ onImageProcessed }: AiPanelProps) => {
    const [isRemoving, setIsRemoving] = useState(false);
    const { toast } = useToast();

    const handleAIRemoveBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsRemoving(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataUrl = event.target?.result as string;
                const result = await removeBackground({ imageUrl: dataUrl });
                if (result.imageUrl) {
                    onImageProcessed(result.imageUrl);
                    toast({ title: 'Background Removed!' });
                }
                setIsRemoving(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast({ variant: 'destructive', title: 'AI processing failed' });
            setIsRemoving(false);
        }
    };

    return (
        <div className="p-5 space-y-6 h-full flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-pink-500/10 text-pink-600 mb-2">
                <Sparkles className="h-10 w-10"/>
            </div>
            <div className="space-y-1">
                <h3 className="font-bold text-sm">Neural Pre-Press Tools</h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    Enhance your assets with industrial-grade AI models.
                </p>
            </div>

            <div className="w-full space-y-3 pt-4">
                <Label htmlFor="ai-bg-remove" className="group relative block cursor-pointer">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl bg-background/50 hover:bg-pink-500/5 hover:border-pink-500/50 transition-all border-zinc-200 dark:border-zinc-800">
                        {isRemoving ? (
                            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                        ) : (
                            <>
                                <Eraser className="h-8 w-8 text-pink-500/50 group-hover:text-pink-500 mb-2" />
                                <span className="text-xs font-bold text-zinc-500 group-hover:text-pink-600">AI Background Removal</span>
                                <span className="text-[10px] text-zinc-400">Upload to extract subject</span>
                            </>
                        )}
                    </div>
                    <Input id="ai-bg-remove" type="file" accept="image/*" className="hidden" onChange={handleAIRemoveBg} disabled={isRemoving} />
                </Label>
            </div>

            <div className="mt-auto pb-4">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">More Tools Coming Soon</p>
            </div>
        </div>
    );
};
