import { getAdminOrderDetails } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IndianRupee, User, Package, Truck, CreditCard, Hash, FileText, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { resolveImagePath } from "@/lib/utils";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { Product, DesignElement, Background, Guide, RenderData } from "@/lib/types";
import { PrintPreviewButton } from "./PrintPreviewButton";
import { Button } from "@/components/ui/button";

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export default async function AdminOrderDetailsPage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const order = await getAdminOrderDetails(orderId);

    if (!order) {
        notFound();
    }

    const isDirectSale = !!order.directSellingProduct;
    const isDesignOrder = !!order.design;
    const isUploadOrder = !!order.designUpload;

    const productName = isDirectSale ? order.directSellingProduct.name : (order.product?.name || 'Custom Product');
    const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Size');
    
    const shippingAddress = order.shippingAddress as any;
    const billingAddress = order.billingAddress as any || shippingAddress;

    let designPreviewNode: React.ReactNode = <FileText className="h-16 w-16 text-muted-foreground"/>;
    if (isDesignOrder) {
        const design = order.design;
        const widthInPx = Math.round(design.width * MM_TO_PX);
        const heightInPx = Math.round(design.height * MM_TO_PX);

        const productForCanvas: Product = {
            id: design.productSlug, name: design.name, description: '', imageId: '',
            width: widthInPx, height: heightInPx, type: '',
        };
        const elements: DesignElement[] = (Array.isArray(design.elements) && Array.isArray(design.elements[0])) ? design.elements[0] as DesignElement[] : design.elements as DesignElement[];
        const background: Background = (Array.isArray(design.background)) ? design.background[0] as Background : design.background as Background;

        const previewScale = 192 / widthInPx;

        designPreviewNode = (
            <div style={{ width: 192, height: heightInPx * previewScale, overflow: 'hidden' }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }}>
                    <DesignCanvas
                        product={productForCanvas}
                        elements={elements}
                        background={background}
                        showRulers={false} showGrid={false} gridSize={20} guides={[]}
                        showPrintGuidelines={false} bleed={0} safetyMargin={0}
                        viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                    />
                </div>
            </div>
        )
    } else if (isUploadOrder) {
        const imageSrc = order.designUpload.thumbnailPath || (order.designUpload.mimeType?.startsWith('image/') ? order.designUpload.filePath : null);
        designPreviewNode = imageSrc ? <Image src={resolveImagePath(imageSrc)} alt="upload preview" layout="fill" className="object-contain" /> : <FileText className="h-16 w-16 text-muted-foreground"/>;
    } else if (isDirectSale) {
        const imageSrc = order.directSellingProduct.imageUrls?.[0];
        designPreviewNode = imageSrc ? <Image src={resolveImagePath(imageSrc)} alt="product image" layout="fill" className="object-cover" /> : <FileText className="h-16 w-16 text-muted-foreground"/>;
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Order #{order.id}</h1>
                    <p className="text-muted-foreground">
                        Placed on {format(new Date(order.createdAt), 'PPP p')}
                    </p>
                </div>
                <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className="capitalize text-base px-4 py-1">
                    {order.orderStatus}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Order Item Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="w-full md:w-48 h-48 bg-muted rounded-md flex items-center justify-center flex-shrink-0 p-2 relative overflow-hidden">
                                    {designPreviewNode}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="font-semibold text-lg">{productName}</p>
                                        <p className="text-muted-foreground">{subProductName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Quantity</p>
                                            <p className="font-medium">{order.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Unit Price</p>
                                            <p className="font-medium flex items-center"><IndianRupee size={12} className="mr-0.5" />{order.unitPrice}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground">Total Amount</p>
                                            <p className="font-bold text-lg flex items-center"><IndianRupee size={16} className="mr-0.5" />{order.totalAmount}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        {isDesignOrder && <PrintPreviewButton order={order} />}
                                        {isUploadOrder && (
                                            <Button asChild variant="secondary">
                                                <a href={resolveImagePath(order.designUpload.filePath)} download>
                                                    <Download className="mr-2 h-4 w-4"/> Download Original File
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Shipping Address</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1 text-muted-foreground">
                                <p className="font-semibold text-foreground">{shippingAddress.name}</p>
                                <p>{shippingAddress.addressLine1}</p>
                                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                                <p>{shippingAddress.country}</p>
                                <p>Phone: {shippingAddress.phone}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Billing Address</CardTitle>
                            </CardHeader>
                             <CardContent className="text-sm space-y-1 text-muted-foreground">
                                <p className="font-semibold text-foreground">{billingAddress.name}</p>
                                <p>{billingAddress.addressLine1}</p>
                                {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.zip}</p>
                                <p>{billingAddress.country}</p>
                                <p>Phone: {billingAddress.phone}</p>
                            </CardContent>
                        </Card>
                     </div>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarFallback>{order.user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{order.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{order.user.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" /> Payment & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment Status:</span>
                                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} className="capitalize">{order.paymentStatus}</Badge>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment Method:</span>
                                <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
