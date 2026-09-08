'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  getFreelancerDirectSellingProducts, 
  deleteFreelancerDirectSellingProduct 
} from '@/app/actions/direct-selling-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, Edit, Trash2, IndianRupee, 
  Search, XCircle, Package, Sparkles, CheckCircle2, 
  Clock, AlertTriangle, Layers, ExternalLink,
  Tag, Flame, Store, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveImagePath, cn } from '@/lib/utils';

type DirectProduct = Awaited<ReturnType<typeof getFreelancerDirectSellingProducts>>[0];

export function FreelancerDirectSellingClient({ initialProducts }: { initialProducts: DirectProduct[] }) {
    const [products, setProducts] = useState<DirectProduct[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const { toast } = useToast();

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = (
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            const matchesStatus = statusFilter === 'all' || product.approvalStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [products, searchTerm, statusFilter]);

    const handleDelete = async (id: number) => {
        setIsDeleting(id);
        try {
            await deleteFreelancerDirectSellingProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            toast({ title: 'Product Deleted', description: 'The product was successfully removed from your store.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: error.message || 'Could not delete product.' });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-6 sm:p-8 shadow-xl shadow-amber-600/10">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                            <Store size={14} /> Freelancer Direct Selling Hub
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Sell Your Own Products Commercial</h1>
                        <p className="text-white/80 text-xs sm:text-sm font-medium max-w-2xl">
                            List customized merch, designer prints, apparel, and direct products with Amazon/Myntra/Flipkart style multi-variant stocks, price slabs, and instant checkout.
                        </p>
                    </div>

                    <Button asChild size="lg" className="rounded-2xl font-black bg-white text-slate-900 hover:bg-white/90 shadow-lg shrink-0 gap-2">
                        <Link href="/freelancer/direct-selling/new">
                            <PlusCircle size={18} className="text-amber-600" /> List New Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Total Listings</span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                            <Package size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Live & Active</span>
                            <div className="text-2xl font-black text-emerald-600 mt-1">
                                {products.filter(p => p.approvalStatus === 'approved' && p.isActive).length}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Under Review</span>
                            <div className="text-2xl font-black text-amber-600 mt-1">
                                {products.filter(p => p.approvalStatus === 'pending').length}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Low Stock Alert</span>
                            <div className="text-2xl font-black text-rose-600 mt-1">
                                {products.filter(p => (p.stockQuantity || 0) <= (p.minStockLevel || 5)).length}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                            <Flame size={20} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search product name, category, SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 rounded-xl bg-white dark:bg-slate-900 font-medium text-xs h-10"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {(['all', 'approved', 'pending', 'rejected'] as const).map(st => (
                        <Button
                            key={st}
                            variant={statusFilter === st ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(st)}
                            className={cn(
                                "rounded-xl text-xs font-extrabold capitalize h-9",
                                statusFilter === st ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-900"
                            )}
                        >
                            {st === 'all' ? 'All Products' : st}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Package size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">No Direct Selling Products Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
                            {searchTerm ? 'No products matched your search filter.' : 'You have not listed any direct commercial selling products yet. Start listing now!'}
                        </p>
                    </div>
                    <Button asChild className="rounded-xl font-bold gap-2">
                        <Link href="/freelancer/direct-selling/new">
                            <PlusCircle size={16} /> Create Your First Product
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => {
                        const image = product.imageUrls?.[0] || '/uploads/hero.png';
                        const isLowStock = (product.stockQuantity || 0) <= (product.minStockLevel || 5);

                        return (
                            <Card key={product.id} className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                                <CardHeader className="p-0 relative">
                                    <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <Image
                                            src={resolveImagePath(image)}
                                            alt={product.name}
                                            fill
                                            unoptimized
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />

                                        {/* Badges Overlay */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                            <Badge className={cn(
                                                "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-none",
                                                product.approvalStatus === 'approved' 
                                                    ? "bg-emerald-600 text-white" 
                                                    : product.approvalStatus === 'pending'
                                                        ? "bg-amber-500 text-white"
                                                        : "bg-rose-600 text-white"
                                            )}>
                                                {product.approvalStatus}
                                            </Badge>
                                            {product.offerBadge && (
                                                <Badge className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-none">
                                                    {product.offerBadge}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge variant={isLowStock ? 'destructive' : 'secondary'} className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                                                {product.stockQuantity || 0} in stock
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            <span>{product.category || 'General'}</span>
                                            {product.sku && <span className="text-slate-400 font-mono">SKU: {product.sku}</span>}
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                                            {product.name}
                                        </h3>
                                    </div>

                                    {/* Price and Stock Metrics */}
                                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Selling Price</span>
                                            <div className="text-lg font-black text-slate-900 dark:text-white flex items-center">
                                                <IndianRupee size={15} className="mr-0.5" />
                                                {product.sellingPrice}
                                            </div>
                                        </div>
                                        {product.basePrice && Number(product.basePrice) > Number(product.sellingPrice) && (
                                            <div className="text-right">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">MRP / Base</span>
                                                <div className="text-xs text-slate-400 line-through font-bold">
                                                    ₹{product.basePrice}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Configuration summary tags */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                        {Array.isArray(product.attributes) && product.attributes.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                                {product.attributes.length} Attributes
                                            </span>
                                        )}
                                        {Array.isArray(product.priceSlabs) && product.priceSlabs.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                                                {product.priceSlabs.length} Volume Slabs
                                            </span>
                                        )}
                                        {product.textAllowed && (
                                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                                Custom Text
                                            </span>
                                        )}
                                    </div>

                                    {product.rejectionReason && (
                                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs">
                                            <span className="font-extrabold block">Rejection Feedback:</span>
                                            <span className="font-medium text-[11px]">{product.rejectionReason}</span>
                                        </div>
                                    )}
                                </CardContent>

                                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Button asChild size="sm" variant="outline" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                                            <Link href={`/freelancer/direct-selling/${product.id}/edit`}>
                                                <Edit size={13} /> Edit
                                            </Link>
                                        </Button>
                                        {product.approvalStatus === 'approved' && product.isActive && (
                                            <Button asChild size="sm" variant="ghost" className="h-9 rounded-xl font-bold text-xs gap-1.5 text-primary">
                                                <Link href={`/products/direct/${product.id}`} target="_blank">
                                                    <ExternalLink size={13} /> View Live
                                                </Link>
                                            </Button>
                                        )}
                                    </div>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50">
                                                <Trash2 size={15} />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Product Listing?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete <strong>"{product.name}"</strong>? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(product.id)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
