import { getProductBySlug } from '@/app/actions/product-actions';
import { getTemplatesForProduct } from '@/app/actions/design-actions';
import { notFound } from 'next/navigation';
import { TemplateGrid } from './template-grid';

export default async function TemplatesPage({ params }: { params: { productId: string } }) {
  const { productId: productSlug } = params;

  const product = await getProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const templates = await getTemplatesForProduct(productSlug);

  return (
    <div className="py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="space-y-4 mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">
            Choose a Template for Your {product.name}
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Select a starting point and customize it to perfection in our editor.
          </p>
        </div>
        <TemplateGrid templates={templates as any[]} product={product} />
      </div>
    </div>
  );
}
