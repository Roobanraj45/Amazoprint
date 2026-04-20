
import { getMyOrders } from "@/app/actions/order-actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";
import { resolveImagePath } from "@/lib/utils";
import { FileText, IndianRupee, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MyOrdersPage() {
    const orders = await getMyOrders();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">My Orders</h1>
            </div>
            
            {orders.length === 0 ? (
                <Card className="py-20 text-center border-dashed">
                    <CardContent>
                        <h3 className="text-lg font-semibold">No Orders Yet</h3>
                        <p className="text-muted-foreground mt-2 mb-4">Once you place an order, it will appear here.</p>
                         <Button asChild>
                            <Link href="/products">
                                <Package className="mr-2 h-4 w-4" />
                                Browse Products
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => {
                        const isDirectSale = !!order.directSellingProduct;
                        const productName = isDirectSale ? order.directSellingProduct.name : order.product?.name;
                        const subProductName = isDirectSale ? order.directSellingProduct.category : order.subProduct?.name;
                        const imageSrc = isDirectSale 
                            ? order.directSellingProduct.imageUrls?.[0] 
                            : (order.designUpload?.thumbnailPath 
                                || (order.designUpload?.mimeType?.startsWith('image/') ? order.designUpload.filePath : null)
                                || order.design?.thumbnailUrl);

                        return (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <div>
                                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                                            <CardDescription>Placed on {format(new Date(order.createdAt), 'PPP')}</CardDescription>
                                        </div>
                                         <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className="capitalize mt-2 sm:mt-0">{order.orderStatus}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="border-t pt-4">
                                     <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                                            {imageSrc ? <Image src={resolveImagePath(imageSrc)} alt="preview" width={64} height={64} className="object-contain" /> : <FileText className="h-8 w-8 text-muted-foreground"/>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{productName}</p>
                                            <p className="text-sm text-muted-foreground">{subProductName || ''}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/50 p-4 flex justify-end">
                                    <div className="flex items-center font-bold">
                                        Total: <IndianRupee className="h-4 w-4 ml-2" />{order.totalAmount}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

    