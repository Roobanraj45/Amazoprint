'use client';

import React from 'react';
import { AssetLibrary } from '../asset-library';

type UploadPanelProps = {
    onImageSelect: (src: string) => void;
    isAdmin?: boolean;
}

export const UploadPanel = ({ onImageSelect, isAdmin }: UploadPanelProps) => {
    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <div className="p-4 border-b bg-muted/10">
                <h2 className="text-lg font-bold tracking-tight">Upload Center</h2>
                <p className="text-xs text-muted-foreground">Manage and upload your design assets.</p>
            </div>
            <div className="flex-1 min-h-0">
                <AssetLibrary onImageSelect={onImageSelect} isAdmin={isAdmin} />
            </div>
        </div>
    );
};
