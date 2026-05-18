'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Scissors, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DieCutsPage from '@/app/admin/die-cuts/page';
import FoilsPage from '@/app/admin/foils/page';
import CardTexturesPage from '@/app/admin/card-textures/page';

export default function AddonsPage() {
    const [activeTab, setActiveTab] = useState('diecuts');

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Master Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                            Unified Add-on Engine
                        </Badge>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Product Add-ons & Finishing</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Configure premium specialty finishing options, physical die-cut templates, tactile card textures, and metallic foil color rules across the product catalog.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="diecuts" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="grid w-full max-w-2xl grid-cols-3 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl shadow-inner mx-auto md:mx-0">
                    <TabsTrigger value="diecuts" className="rounded-xl font-extrabold text-xs py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md transition-all flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Die-Cut Shapes
                    </TabsTrigger>
                    <TabsTrigger value="foils" className="rounded-xl font-extrabold text-xs py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md transition-all flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        Specialty Foils
                    </TabsTrigger>
                    <TabsTrigger value="textures" className="rounded-xl font-extrabold text-xs py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-md transition-all flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Card Textures
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="diecuts" className="mt-0 focus-visible:outline-none">
                    <div className="bg-slate-50/50 dark:bg-zinc-950/50 rounded-3xl p-2 sm:p-4 border border-slate-200/60 dark:border-zinc-800/60">
                        <DieCutsPage />
                    </div>
                </TabsContent>

                <TabsContent value="foils" className="mt-0 focus-visible:outline-none">
                    <div className="bg-slate-50/50 dark:bg-zinc-950/50 rounded-3xl p-2 sm:p-4 border border-slate-200/60 dark:border-zinc-800/60">
                        <FoilsPage />
                    </div>
                </TabsContent>

                <TabsContent value="textures" className="mt-0 focus-visible:outline-none">
                    <div className="bg-slate-50/50 dark:bg-zinc-950/50 rounded-3xl p-2 sm:p-4 border border-slate-200/60 dark:border-zinc-800/60">
                        <CardTexturesPage />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
