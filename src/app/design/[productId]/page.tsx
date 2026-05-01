import { notFound } from 'next/navigation';
import { DesignEditor } from '@/components/design/design-editor';
import type { Product, DesignElement, Background, FoilType } from '@/lib/types';
import { db } from '@/db';
import { products, subProducts } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getDesign } from '@/app/actions/design-actions';
import { getSession } from '@/lib/auth';
import { getFoilTypes } from '@/app/actions/foil-actions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

type DesignPageProps = {
  params: {
    productId: string; // This is the product slug
  };
  searchParams: {
    quantity?: string;
    width?: string;
    height?: string;
    templateId?: string;
    subProductId?: string;
    contestId?: string;
    pages?: string;
    verificationId?: string;
  };
};

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export default async function DesignPage({ params, searchParams: searchParamsPromise }: DesignPageProps) {
  const { productId: productSlug } = await params;
  const searchParams = await searchParamsPromise;

  // Fetch product from DB using slug
  const productData = await db.query.products.findFirst({
    where: eq(products.slug, productSlug),
  });

  if (!productData) {
    notFound();
  }

  let subProductForDims = null;
  // If a specific sub-product is requested (e.g., from a contest), use it.
  if (searchParams.subProductId) {
    subProductForDims = await db.query.subProducts.findFirst({
      where: eq(subProducts.id, Number(searchParams.subProductId))
    });
  } else {
    // Otherwise, use the first available sub-product for this product as a default.
    subProductForDims = await db.query.subProducts.findFirst({
      where: eq(subProducts.productId, productData.id),
      orderBy: [asc(subProducts.id)],
    });
  }

  // Determine unit conversion factor
  const unitType = subProductForDims?.unitType || 'mm';
  let unitToPx = MM_TO_PX;
  if (unitType === 'inch') unitToPx = DPI;
  else if (unitType === 'ft') unitToPx = DPI * 12;

  // Use explicit width/height from URL if provided, otherwise use sub-product dimensions, or fallback to a default.
  const finalWidthUnits = searchParams.width ? Number(searchParams.width) : (subProductForDims ? Number(subProductForDims.width) : 85);
  const finalHeightUnits = searchParams.height ? Number(searchParams.height) : (subProductForDims ? Number(subProductForDims.height) : 55);

  const finalWidth = Math.round(finalWidthUnits * unitToPx);
  const finalHeight = Math.round(finalHeightUnits * unitToPx);

  // The DesignEditor component expects a `Product` type from `@/lib/types`.
  const productForEditor: Product = {
    id: productData.slug,
    name: productData.name,
    description: productData.description || '',
    imageId: '', 
    width: finalWidth,
    height: finalHeight,
    type: productData.category || productData.name, 
  };


  const quantity = searchParams.quantity ? Number(searchParams.quantity) : 100;
  let totalPages = searchParams.pages ? Number(searchParams.pages) : 1;
  
  const { templateId, verificationId, contestId } = searchParams;
  let initialElements: DesignElement[] | DesignElement[][] = [];
  let initialBackground: Background | Background[] | undefined = undefined;
  let initialDesignId: number | null = null;
  let initialDesignName: string | null = null;
  let isAuthorizedToUpdate = false;

  const session = await getSession();
  const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
  const isAdmin = !!session?.role && adminRoles.includes(session.role);
  const isFreelancer = session?.role === 'freelancer';

  let template = null;
  if (templateId) {
    template = await getDesign(Number(templateId));
    if (template) {
        initialElements = template.elements as DesignElement[] | DesignElement[][];
        initialBackground = template.background as Background | Background[];
        
        if (Array.isArray(initialElements) && initialElements.length > 0 && Array.isArray(initialElements[0])) {
            totalPages = initialElements.length;
        } else {
            totalPages = 1;
        }

        productForEditor.width = Math.round(template.width * unitToPx);
        productForEditor.height = Math.round(template.height * unitToPx);
        
        isAuthorizedToUpdate = (session?.sub && template.userId === session.sub) || isAdmin || (isFreelancer && (verificationId || contestId));
        
        initialDesignName = template.name;
        if (isAuthorizedToUpdate) {
            initialDesignId = template.id;
        }
    }
  }

  const allFoilsData = await getFoilTypes();
  const allFoils: FoilType[] = allFoilsData.map(f => ({...f}));
  
  const availableFoils = subProductForDims?.allowedFoils
      ? allFoils.filter(f => subProductForDims.allowedFoils!.includes(f.id))
      : [];

  const spotUvAllowedForProduct = subProductForDims?.spotUvAllowed ?? false;

  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>}>
        <DesignEditor 
            product={productForEditor} 
            quantity={quantity} 
            totalPages={totalPages}
            initialElements={initialElements}
            initialBackground={initialBackground}
            initialDesignId={initialDesignId}
            initialDesignName={initialDesignName}
            isAdmin={isAdmin}
            allFoils={allFoils}
            availableFoils={availableFoils}
            spotUvAllowed={spotUvAllowedForProduct}
            verificationId={verificationId}
            contestId={contestId}
            currentUserId={session?.sub}
            initialUnit={unitType as any}
            initialDesign={template}
        />
    </Suspense>
  );
}
