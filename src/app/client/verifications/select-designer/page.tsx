import { Suspense } from 'react';
import SelectDesignerContent from './select-designer-content';
import { Loader2 } from 'lucide-react';

export default function SelectDesignerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-2 font-bold">Loading Directory...</p>
      </div>
    }>
      <SelectDesignerContent />
    </Suspense>
  );
}
