import { getAllTemplates } from '@/app/actions/design-actions';
import { TemplatesClient } from './templates-client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Design Templates | AmazoPrint',
  description: 'Explore our library of premium, print-verified design templates.',
};

export default async function TemplatesPage() {
  const templates = await getAllTemplates();
  console.log('Fetched templates count:', templates?.length || 0);

  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <TemplatesClient templates={templates} />
    </Suspense>
  );
}
