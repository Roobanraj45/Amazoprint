import { getMyOrders } from "@/app/actions/order-actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";
import { resolveImagePath } from "@/lib/utils";
import { FileText, IndianRupee, Package, Clock, ShieldCheck, Search, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default async function MyOrdersPage() {
    const orders = await getMyOrders();

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Order History</Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Orders</h1>
                    <p className="text-muted-foreground font-medium">Track and manage your recent print productions.</p>
                </div>
                {orders.length > 0 && (
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search order ID..." className="pl-9 bg-card border-border/50 focus-visible:ring-primary/20 rounded-xl" />
                        </div>
                        <Button variant="outline" className="bg-card border-border/50 rounded-xl px-4">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                    </div>
                )}
            </header>
            
            {orders.length === 0 ? (
                <Card className="py-32 text-center border-dashed border-border/60 bg-muted/10 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Package className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black font-headline">No Orders Yet</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">Once you place your first industrial print order, it will appear here for tracking.</p>
                        </div>
                         <Button asChild size="lg" className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 mt-4 font-bold tracking-widest uppercase text-xs">
                            <Link href="/products">
                                <Package className="mr-2 h-4 w-4" />
                                Browse Catalog
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
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
                            <Card key={order.id} className="overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-primary/30 hover:shadow-2xl transition-all duration-300 group">
                                <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-background rounded-xl border border-border/50 shadow-sm">
                                                <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-black tracking-tight">Order #{order.id}</CardTitle>
                                                <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-xs">
                                                    <Clock className="w-3 h-3" /> Placed {format(new Date(order.createdAt), 'PPP')}
                                                </CardDescription>
                                            </div>
                                        </div>
                                         <Badge className={`capitalize px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                            order.orderStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                                            'bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20'
                                         }`}>
                                            {order.orderStatus}
                                         </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                        <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border/50 overflow-hidden relative group-hover:border-primary/20 transition-colors">
                                            {imageSrc ? (
                                                <Image src={resolveImagePath(imageSrc)} alt="preview" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <FileText className="h-8 w-8 text-muted-foreground/50"/>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="font-black text-xl tracking-tight">{productName}</p>
                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{subProductName || 'Custom Print'}</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <Badge variant="outline" className="bg-background font-bold text-[10px] uppercase tracking-widest">Qty: {order.quantity}</Badge>
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                    <ShieldCheck className="w-3 h-3" /> Verified Quality
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right sm:text-right mt-4 sm:mt-0 bg-background/50 p-4 rounded-2xl border border-border/40">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Amount</p>
                                            <p className="text-2xl font-black tracking-tighter flex items-center justify-end text-primary">
                                                <IndianRupee className="h-5 w-5 mr-0.5" />{order.totalAmount}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/10 p-4 border-t border-border/40 flex justify-between items-center">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking Available
                                    </p>
                                    <Button variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-widest hover:text-primary">
                                        View Details <ArrowRight className="w-3 h-3 ml-2" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}