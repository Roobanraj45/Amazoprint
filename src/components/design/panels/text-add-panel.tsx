'use client';

import React from 'react';
import type { DesignElement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Type, ChevronRight } from 'lucide-react';

type TextAddPanelProps = {
    onAddText: (options: Partial<DesignElement>) => void;
    onAddGroupedElements: (elements: Partial<DesignElement>[]) => void;
};

export const TextAddPanel = ({ onAddText, onAddGroupedElements }: TextAddPanelProps) => {
    
    return (
        <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden">
            <div className="p-5 space-y-4 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <Type className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick Add</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <button
                        onClick={() => onAddText({ content: 'Add a heading', fontSize: 48, fontWeight: 'bold', fontFamily: 'Oswald' })}
                        className="group flex items-center justify-between w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                    >
                        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Oswald' }}>Add heading</span>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                    <button
                        onClick={() => onAddText({ content: 'Add a subheading', fontSize: 32, fontFamily: 'Raleway' })}
                        className="group flex items-center justify-between w-full p-3 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all shadow-sm"
                    >
                        <span className="text-md font-semibold" style={{ fontFamily: 'Raleway' }}>Add subheading</span>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                    <button
                        onClick={() => onAddText({ content: 'Add body text', fontSize: 16, fontFamily: 'Inter' })}
                        className="group flex items-center justify-between w-full p-3 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all shadow-sm"
                    >
                        <span className="text-sm" style={{ fontFamily: 'Inter' }}>Add body text</span>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};
