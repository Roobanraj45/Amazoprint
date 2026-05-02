'use client';

import React from 'react';
import type { DesignElement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Type, ChevronRight } from 'lucide-react';
import { TextEffectsLibrary } from './text-effects-library';

type TextAddPanelProps = {
    onAddText: (options: Partial<DesignElement>) => void;
    onAddGroupedElements: (elements: Partial<DesignElement>[]) => void;
    onAddFancyText: (options: NonNullable<DesignElement['fancyTextData']>) => void;
};

export const TextAddPanel = ({ onAddText, onAddGroupedElements, onAddFancyText }: TextAddPanelProps) => {
    
    return (
        <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden">
            <div className="p-3 space-y-3 shrink-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <Type className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Typography Presets</span>
                </div>
                
                <div className="space-y-2.5">
                    {/* Headings */}
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => onAddText({ content: 'Heading 1', fontSize: 48, fontWeight: 'bold', fontFamily: 'Oswald' })}
                            className="flex flex-col items-center justify-center py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all"
                        >
                            <span className="text-[13px] font-black" style={{ fontFamily: 'Oswald' }}>H1</span>
                            <span className="text-[7px] text-zinc-400 font-medium">48px</span>
                        </button>
                        <button
                            onClick={() => onAddText({ content: 'Heading 2', fontSize: 36, fontWeight: 'bold', fontFamily: 'Oswald' })}
                            className="flex flex-col items-center justify-center py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all"
                        >
                            <span className="text-[12px] font-black" style={{ fontFamily: 'Oswald' }}>H2</span>
                            <span className="text-[7px] text-zinc-400 font-medium">36px</span>
                        </button>
                        <button
                            onClick={() => onAddText({ content: 'Heading 3', fontSize: 24, fontWeight: 'bold', fontFamily: 'Oswald' })}
                            className="flex flex-col items-center justify-center py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all"
                        >
                            <span className="text-[11px] font-black" style={{ fontFamily: 'Oswald' }}>H3</span>
                            <span className="text-[7px] text-zinc-400 font-medium">24px</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 gap-1">
                        <button
                            onClick={() => onAddText({ content: 'Add subheading', fontSize: 18, fontFamily: 'Raleway', fontWeight: 'semibold' })}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all"
                        >
                            <span className="text-[10px] font-bold" style={{ fontFamily: 'Raleway' }}>Subheading</span>
                            <span className="text-[7px] text-zinc-400">18px</span>
                        </button>
                        <button
                            onClick={() => onAddText({ content: 'Add body text', fontSize: 14, fontFamily: 'Inter' })}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all"
                        >
                            <span className="text-[10px]" style={{ fontFamily: 'Inter' }}>Body text</span>
                            <span className="text-[7px] text-zinc-400">14px</span>
                        </button>
                        <button
                            onClick={() => onAddText({ content: 'Add small text', fontSize: 10, fontFamily: 'Inter' })}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all"
                        >
                            <span className="text-[9px] text-zinc-500" style={{ fontFamily: 'Inter' }}>Small text</span>
                            <span className="text-[7px] text-zinc-400">10px</span>
                        </button>
                    </div>
                </div>
            </div>
            <Separator className="opacity-50" />
            <TextEffectsLibrary onAddFancyText={onAddFancyText} />
        </div>
    );
};
