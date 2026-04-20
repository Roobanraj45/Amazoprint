
'use client';

import { PenTool, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PenToolPanel({ onFinish }: { onFinish: () => void }) {
    return (
        <div className="p-4 space-y-4 text-center">
            <div className="flex justify-center">
                <PenTool className="h-10 w-10 text-muted-foreground"/>
            </div>
            <h3 className="font-medium">Pen Tool</h3>
            <p className="text-xs text-muted-foreground">
                Click to create points. Click and drag to create curves. Press Escape or click below to finish the path.
            </p>
            <Button onClick={onFinish} className="w-full">
                <CheckSquare className="mr-2 h-4 w-4" />
                Finish Path
            </Button>
        </div>
    );
}
