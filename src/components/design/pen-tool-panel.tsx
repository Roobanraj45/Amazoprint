'use client';

import { PenTool, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PenToolPanel({ onFinish }: { onFinish: () => void }) {
    return (
        <div className="p-4 space-y-4 text-center h-full flex flex-col items-center justify-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-2">
                <PenTool className="h-8 w-8"/>
            </div>
            <div className="space-y-1">
                <h3 className="font-bold text-sm">Pen tool active</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                    Click to add points. Click and drag to create curves. Click the first point to close the path.
                </p>
            </div>
            <Button onClick={onFinish} className="w-full mt-4" variant="default">
                <CheckSquare className="mr-2 h-4 w-4" />
                Finish path
            </Button>
            <p className="text-[10px] text-muted-foreground font-bold mt-4">
                Esc to cancel path
            </p>
        </div>
    );
}
