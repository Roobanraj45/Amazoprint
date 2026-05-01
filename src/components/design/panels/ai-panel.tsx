'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Eraser, Loader2, MessageSquare, Send, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { removeBackground } from '@imgly/background-removal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type AiPanelProps = {
    onImageProcessed: (src: string) => void;
    product?: any;
    canvasWidth?: number;
    canvasHeight?: number;
    onAddElements?: (elements: any[]) => void;
    currentElements?: any[];
}

export const AiPanel = ({ onImageProcessed, product, canvasWidth, canvasHeight, onAddElements, currentElements }: AiPanelProps) => {
    const [isRemoving, setIsRemoving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const { toast } = useToast();

    const handleAIRemoveBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsRemoving(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const dataUrl = event.target?.result as string;
                    const blob = await removeBackground(dataUrl);
                    const outReader = new FileReader();
                    outReader.onload = () => {
                        const processedDataUrl = outReader.result as string;
                        
                        // Save to local storage so it appears in "Uploads" and "Photos"
                        try {
                            const USER_ASSETS_LOCAL_STORAGE_KEY = 'amazoprint_user_assets_v2';
                            const localAssetsRaw = localStorage.getItem(USER_ASSETS_LOCAL_STORAGE_KEY);
                            const localAssets = localAssetsRaw ? JSON.parse(localAssetsRaw) : [];
                            const updatedAssets = [processedDataUrl, ...localAssets];
                            localStorage.setItem(USER_ASSETS_LOCAL_STORAGE_KEY, JSON.stringify(updatedAssets));
                            
                            // Notify other components (like ImageLibrary) to refresh
                            window.dispatchEvent(new Event('amazoprint_assets_updated'));
                        } catch (e) {
                            console.error("Failed to save AI processed image to local storage", e);
                        }

                        onImageProcessed(processedDataUrl);
                        toast({ 
                            title: 'Background removed!',
                            description: "Your image has been saved to 'Uploads' for future use.",
                        });
                        
                        // Trigger one-time animation to highlight the Uploads tab
                        window.dispatchEvent(new CustomEvent('amazoprint_highlight_tab', { detail: 'upload' }));
                        
                        setIsRemoving(false);
                    };
                    outReader.readAsDataURL(blob);
                } catch (err) {
                    toast({ variant: 'destructive', title: 'AI processing failed' });
                    setIsRemoving(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast({ variant: 'destructive', title: 'AI processing failed' });
            setIsRemoving(false);
        }
    };
    
    const handleGenerateDesign = async () => {
        if (!prompt.trim()) return;
        
        setIsGenerating(true);
        
        try {
            const response = await fetch('/api/ai/generate-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    product,
                    width: canvasWidth,
                    height: canvasHeight,
                    currentElements: currentElements
                })
            });
            
            const result = await response.json();
            if (result.success && result.elements) {
                if (onAddElements) {
                    onAddElements(result.elements);
                }
                toast({ title: "Design generated successfully!" });
                setIsChatOpen(false);
                setPrompt('');
            } else {
                throw new Error(result.error || "Failed to generate design");
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            toast({ variant: 'destructive', title: "Generation failed", description: "Could not create your design at this moment." });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-3 h-full flex flex-col items-center">
            <div className="w-full flex flex-col items-center justify-center text-center space-y-4 pt-4">
                <div className="w-full space-y-3 pt-2">
                    {/* Background Remover */}
                    <Label htmlFor="ai-bg-remove" className="group relative block cursor-pointer">
                        <div className={cn(
                            "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl bg-background/50 transition-all duration-300",
                            "hover:bg-primary/5 hover:border-primary/50 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md",
                            isRemoving && "opacity-50 pointer-events-none"
                        )}>
                            {isRemoving ? (
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            ) : (
                                <>
                                    <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all mb-1.5">
                                        <Eraser className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-600 group-hover:text-primary transition-colors uppercase tracking-wider">Remove Background</span>
                                    <span className="text-[9px] font-bold text-zinc-400 mt-0.5">Upload to extract subject</span>
                                </>
                            )}
                        </div>
                        <Input id="ai-bg-remove" type="file" accept="image/*" className="hidden" onChange={handleAIRemoveBg} disabled={isRemoving} />
                    </Label>
 
                    {/* AI Designer */}
                    <div 
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl bg-background/50 transition-all duration-300 cursor-pointer group",
                            "hover:bg-purple-500/5 hover:border-purple-500/50 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md"
                        )}
                        onClick={() => setIsChatOpen(true)}
                    >
                        <div className="p-1.5 rounded-lg bg-purple-500/5 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all mb-1.5">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 group-hover:text-purple-600 transition-colors uppercase tracking-wider">Let AI design for you</span>
                        <span className="text-[9px] font-bold text-zinc-400 mt-0.5">Describe what you want to create</span>
                    </div>
                </div>
            </div>
 
            <div className="mt-auto pb-4">
                <div className="px-4 py-2 rounded-full bg-zinc-50 border border-zinc-100 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amazoprint AI</p>
                </div>
            </div>

            {/* Floating Chat Modal */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Amazoprint AI</DialogTitle>
                    </DialogHeader>
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 text-white relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                            onClick={() => setIsChatOpen(false)}
                        >
                            <X size={20} />
                        </Button>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Amazoprint AI</h2>
                                <p className="text-xs text-white/70 font-medium">I'm here to help you create stunning designs.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white space-y-4">
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs leading-relaxed text-zinc-600">
                            Hi there! 👋 I can help you with layout, color schemes, or generating specific design elements. What do you have in mind today?
                        </div>

                        <div className="relative">
                            <textarea
                                className="w-full h-32 p-4 text-sm bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none placeholder:text-zinc-400 font-medium"
                                placeholder="E.g., Create a professional business card for a coffee shop using warm colors and modern typography..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400 px-2">{prompt.length} chars</span>
                                <Button 
                                    size="sm" 
                                    className="bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg shadow-purple-500/30 gap-2 px-4 h-9"
                                    onClick={handleGenerateDesign}
                                    disabled={isGenerating || !prompt.trim()}
                                >
                                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    {isGenerating ? 'Generating...' : 'Generate'}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                "Minimalist Business Card",
                                "Vibrant Poster Design",
                                "Eco-friendly Packaging",
                                "Tech Product Flyer"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    className="text-[10px] font-bold text-zinc-500 bg-zinc-100/50 hover:bg-purple-50 hover:text-purple-600 py-2 px-3 rounded-lg text-left transition-colors border border-transparent hover:border-purple-200"
                                    onClick={() => setPrompt(suggestion)}
                                >
                                    + {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
