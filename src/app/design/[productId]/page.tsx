import { notFound } from 'next/navigation';
import { DesignEditor } from '@/components/design/design-editor';
import type { Product, DesignElement, Background, FoilType } from '@/lib/types';
import { db } from '@/db';
import { products, subProducts, dieCuts, cardTextures, orders, designVerifications, designs } from '@/db/schema';
import { eq, asc, and, notInArray, isNotNull, inArray } from 'drizzle-orm';
import { getDesign } from '@/app/actions/design-actions';
import { getSession } from '@/lib/auth';
import { getFoilTypes } from '@/app/actions/foil-actions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';

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
    readonly?: string;
    spotUv?: string;
    addons?: string;
    dieCut?: string;
    cardTexture?: string;
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
  let finalWidthUnits = searchParams.width ? Number(searchParams.width) : (subProductForDims ? Number(subProductForDims.width) : 85);
  let finalHeightUnits = searchParams.height ? Number(searchParams.height) : (subProductForDims ? Number(subProductForDims.height) : 55);

  // If sub-product is 0x0 (custom) and no URL params provided, use a default starting size
  if (finalWidthUnits === 0) finalWidthUnits = 85;
  if (finalHeightUnits === 0) finalHeightUnits = 55;

  const finalWidth = Math.round(finalWidthUnits * unitToPx);
  const finalHeight = Math.round(finalHeightUnits * unitToPx);

  // The DesignEditor component expects a `Product` type from `@/lib/types`.
  const productForEditor: Product & { price?: string } = {
    id: productData.slug,
    name: productData.name,
    description: productData.description || '',
    imageId: '',
    width: finalWidth,
    height: finalHeight,
    type: productData.category || productData.name,
    productId: productData.id,
    subProductId: subProductForDims?.id,
    backSideCost: subProductForDims?.backSideCost,
    dieCutPrices: subProductForDims?.dieCutPrices,
    cardTexturePrices: subProductForDims?.cardTexturePrices,
    price: subProductForDims?.price,
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

  let isServerReadonly = searchParams.readonly === 'true';

  let template = null;

  // Handle design duplication for freelancer verifications to avoid overwriting client master copy
  if (verificationId) {
    const verification = await db.query.designVerifications.findFirst({
      where: eq(designVerifications.id, Number(verificationId)),
      with: {
        order: true
      }
    });

    if (verification) {
      const currentVerificationDesign = await db.query.designs.findFirst({
        where: eq(designs.id, verification.designId)
      });

      if (currentVerificationDesign) {
        if (currentVerificationDesign.userId === session?.sub || isAdmin) {
          // Freelancer already has their duplicate copy, or user is admin previewing
          template = currentVerificationDesign;
        } else if (session?.sub && isFreelancer) {
          // Design belongs to client (or someone else), duplicate it for the freelancer!
          const [duplicateDesign] = await db.insert(designs).values({
            name: `${currentVerificationDesign.name} (Verified Copy)`,
            productSlug: currentVerificationDesign.productSlug,
            width: currentVerificationDesign.width,
            height: currentVerificationDesign.height,
            elements: currentVerificationDesign.elements,
            background: currentVerificationDesign.background,
            guides: currentVerificationDesign.guides,
            userId: session.sub, // Owned by freelancer
            productId: currentVerificationDesign.productId,
            subProductId: currentVerificationDesign.subProductId,
            customisation: currentVerificationDesign.customisation,
          }).returning();

          // Update the verification record to point to this new duplicate design
          await db.update(designVerifications).set({
            designId: duplicateDesign.id,
            updatedAt: new Date()
          }).where(eq(designVerifications.id, verification.id));

          template = duplicateDesign;
        } else {
          // Fallback if not authenticated or not a freelancer
          template = currentVerificationDesign;
        }
      }
    }
  } else if (templateId) {
    template = await getDesign(Number(templateId));
  }

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

    // Check if the current user is the assigned freelancer for this verification
    let isAssignedFreelancer = false;
    if (session?.sub && isFreelancer && verificationId) {
      const verificationCheck = await db.query.designVerifications.findFirst({
        where: and(
          eq(designVerifications.id, Number(verificationId)),
          eq(designVerifications.freelancerId, session.sub),
          inArray(designVerifications.status, ['assigned', 'pending'])
        )
      });
      if (verificationCheck) {
        isAssignedFreelancer = true;
      }
    }

    isAuthorizedToUpdate = (session?.sub && template.userId === session.sub) || isAdmin || (isFreelancer && (verificationId || contestId)) || isAssignedFreelancer;

    initialDesignName = template.name;
    if (isAuthorizedToUpdate) {
      initialDesignId = template.id;
    }

    // --- SERVER-SIDE LOCK ENFORCEMENT ---
    // Check if there is any active order associated with this design
    const activeOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.designId, template.id),
        notInArray(orders.orderStatus, ['completed', 'delivered', 'cancelled', 'refunded'])
      )
    });

    // Check if there is an active freelancer verification assigned for this design
    const hasVerification = await db.query.designVerifications.findFirst({
      where: and(
        eq(designVerifications.designId, template.id),
        eq(designVerifications.status, 'assigned'),
        isNotNull(designVerifications.freelancerId)
      )
    });

    if (activeOrder && !isAdmin && !hasVerification) {
      isServerReadonly = true;
    }
  }

  const allFoilsData = await getFoilTypes();
  const allFoils: FoilType[] = allFoilsData.map(f => ({ ...f }));

  const availableFoils = subProductForDims?.allowedFoils
    ? allFoils.filter(f => subProductForDims.allowedFoils!.includes(f.id))
    : [];

  const spotUvAllowedForProduct = subProductForDims?.spotUvAllowed ?? false;
  const spotUvRequested = searchParams.spotUv === 'true';
  const selectedAddons = searchParams.addons ? searchParams.addons.split(',').map(Number) : [];
  const selectedDie = searchParams.dieCut ? Number(searchParams.dieCut) : null;

  const pricingRules = subProductForDims ? await getPricingRulesForSubProduct(subProductForDims.id) : [];
  const allDieCuts = await db.query.dieCuts.findMany({
    where: eq(dieCuts.isActive, true)
  }); 
  const selectedTexture = searchParams.cardTexture ? Number(searchParams.cardTexture) : null;
  const allCardTextures = await db.query.cardTextures.findMany({
    where: eq(cardTextures.isActive, true)
  });

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
        spotUv={spotUvRequested}
        selectedAddons={selectedAddons}
        selectedDie={selectedDie}
        selectedTexture={selectedTexture}
        pricingRules={pricingRules}
        dieCuts={allDieCuts}
        cardTextures={allCardTextures}
        verificationId={verificationId}
        contestId={contestId}
        currentUserId={session?.sub}
        initialUnit={unitType as any}
        initialDesign={template}
        isReadonly={isServerReadonly}
      />
    </Suspense>
  );
}
