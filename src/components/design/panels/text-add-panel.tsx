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
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <div className="p-6 space-y-6 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Type className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[12px] font-black tracking-tight text-foreground leading-none">Add text</p>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1 leading-none tracking-tight">Quick typography presets</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={() => onAddText({ content: 'Add a heading', fontSize: 48, fontWeight: 'bold', fontFamily: 'Oswald' })}
                        className="group flex items-center justify-between w-full p-5 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
                    >
                        <span className="text-2xl font-black tracking-tight text-foreground" style={{ fontFamily: 'Oswald' }}>Add heading</span>
                        <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                    <button
                        onClick={() => onAddText({ content: 'Add a subheading', fontSize: 32, fontFamily: 'Raleway' })}
                        className="group flex items-center justify-between w-full p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
                    >
                        <span className="text-lg font-bold text-foreground/80" style={{ fontFamily: 'Raleway' }}>Add subheading</span>
                        <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                    <button
                        onClick={() => onAddText({ content: 'Add body text', fontSize: 16, fontFamily: 'Inter' })}
                        className="group flex items-center justify-between w-full p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
                    >
                        <span className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'Inter' }}>Add body text</span>
                        <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
