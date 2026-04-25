
'use client';

import React from 'react';
import { AssetLibrary } from '../asset-library';

type UploadPanelProps = {
    onImageSelect: (src: string) => void;
    isAdmin?: boolean;
}

export const UploadPanel = ({ onImageSelect, isAdmin }: UploadPanelProps) => {
    return (
        <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden">
            <div className="flex-1 overflow-auto">
                <AssetLibrary onImageSelect={onImageSelect} isAdmin={isAdmin} />
            </div>
        </div>
    );
};
