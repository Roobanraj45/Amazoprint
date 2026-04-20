import { Suspense } from 'react';
import { StartDesignContent } from '@/components/design/start-design-content';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function StartDesignPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
        <StartDesignContent />
      </Suspense>
    </div>
  );
}
