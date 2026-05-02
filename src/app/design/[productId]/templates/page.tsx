import { getProductBySlug } from '@/app/actions/product-actions';
import { getTemplatesForProduct } from '@/app/actions/design-actions';
import { notFound } from 'next/navigation';
import { TemplateGrid } from './template-grid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TemplatesPage({ 
  params,
  searchParams: searchParamsPromise 
}: { 
  params: { productId: string },
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { productId: productSlug } = params;
  const searchParams = await searchParamsPromise;

  const product = await getProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const templates = await getTemplatesForProduct(productSlug);

    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950">
      {/* Immersive Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Design Studio
            </div>
            
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] md:leading-[0.9] text-zinc-900 dark:text-zinc-50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Premium Templates for <br />
                <span className="text-primary italic font-serif lowercase">{product.name}</span>
              </h1>
              <p className="mx-auto max-w-[600px] text-zinc-500 md:text-lg font-medium animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                Elevate your brand with our professionally crafted {product.name.toLowerCase()} layouts. 
                Choose a foundation and start your creative journey.
              </p>
            </div>

            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
               <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Explore Collection</span>
               <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 pb-24">
        <TemplateGrid templates={templates as any[]} product={product} searchParams={searchParams} />
      </div>
    </div>
}
