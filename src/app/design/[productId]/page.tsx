import { notFound } from 'next/navigation';
import { DesignEditor } from '@/components/design/design-editor';
import type { Product, DesignElement, Background, FoilType } from '@/lib/types';
import { db } from '@/db';
import { products, subProducts } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getDesign } from '@/app/actions/design-actions';
import { getSession } from '@/lib/auth';
import { getFoilTypes } from '@/app/actions/foil-actions';

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

export default async function DesignPage({ params, searchParams }: DesignPageProps) {
  const { productId: productSlug } = params;

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

  // Use explicit width/height from URL if provided, otherwise use sub-product dimensions (in mm), or fallback to a default.
  const finalWidthInMm = searchParams.width ? Number(searchParams.width) : (subProductForDims ? Number(subProductForDims.width) : 85);
  const finalHeightInMm = searchParams.height ? Number(searchParams.height) : (subProductForDims ? Number(subProductForDims.height) : 55);

  const finalWidth = Math.round(finalWidthInMm * MM_TO_PX);
  const finalHeight = Math.round(finalHeightInMm * MM_TO_PX);

  // The DesignEditor component expects a `Product` type from `@/lib/types`.
  // We construct this object using data from the database.
  const productForEditor: Product = {
    id: productData.slug,
    name: productData.name,
    description: productData.description || '',
    imageId: '', // The type expects imageId, we'll use imageUrl.
    width: finalWidth,
    height: finalHeight,
    type: productData.category || productData.name, // Use category for the AI prompt type, fallback to name.
  };


  const quantity = searchParams.quantity ? Number(searchParams.quantity) : 100;
  let totalPages = searchParams.pages ? Number(searchParams.pages) : 1;
  
  const { templateId, verificationId } = searchParams;
  let initialElements: DesignElement[] | DesignElement[][] = [];
  let initialBackground: Background | Background[] | undefined = undefined;
  let initialDesignId: number | null = null;
  let initialDesignName: string | null = null;

  const session = await getSession();
  const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer'];
  const isAdmin = !!session?.role && adminRoles.includes(session.role);
  const isFreelancer = session?.role === 'freelancer';

  if (templateId) {
    const template = await getDesign(Number(templateId));
    if (template) {
        initialElements = template.elements as DesignElement[] | DesignElement[][];
        initialBackground = template.background as Background | Background[];
        
        // Determine total pages from the loaded design data
        if (Array.isArray(initialElements) && initialElements.length > 0 && Array.isArray(initialElements[0])) {
            totalPages = initialElements.length;
        } else {
            totalPages = 1;
        }

        // Saved template dimensions are in mm, convert to px for editor
        productForEditor.width = Math.round(template.width * MM_TO_PX);
        productForEditor.height = Math.round(template.height * MM_TO_PX);
        
        // A freelancer reworking a design for verification should also be able to update it.
        const canUpdate = (session?.sub && template.userId === session.sub) || isAdmin || (isFreelancer && verificationId);
        
        if (canUpdate) {
            initialDesignId = template.id;
            initialDesignName = template.name;
        }
    }
  }

  const allFoilsData = await getFoilTypes();
  const allFoils: FoilType[] = allFoilsData.map(f => ({...f}));
  
  const availableFoils = subProductForDims?.allowedFoils
      ? allFoils.filter(f => subProductForDims.allowedFoils!.includes(f.id))
      : [];

  const spotUvAllowedForProduct = subProductForDims?.spotUvAllowed ?? false;

  return <DesignEditor 
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
        />;
}
