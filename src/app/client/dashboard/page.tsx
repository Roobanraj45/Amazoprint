import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/app/actions/user-actions';
import { getMyOrders } from '@/app/actions/order-actions';
import { db } from '@/db';
import { orders, designs } from '@/db/schema';
import { and, eq, count, inArray, notInArray } from 'drizzle-orm';
import { resolveImagePath } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Palette,
  ShoppingCart,
  PenSquare,
  CreditCard,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ExternalLink,
  Package,
  Layers,
  FileText,
  Download,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function getStatusStyles(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    case 'shipped':
    case 'ready_to_ship':
      return 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20';
    case 'processing':
    case 'confirmed':
    case 'quality_check':
      return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
    case 'under_verification':
      return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    case 'cancelled':
    case 'refunded':
      return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20';
  }
}

export default async function ClientDashboard() {
  const session = await getSession();
  if (!session?.sub) {
    redirect('/login');
  }

  // Live Stats Queries
  const [activeProjectsResult] = await db.select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, session.sub),
        notInArray(orders.orderStatus, ['delivered', 'cancelled', 'refunded'])
      )
    );
  const activeProjectsCount = activeProjectsResult?.count || 0;

  const [transitOrdersResult] = await db.select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, session.sub),
        inArray(orders.orderStatus, ['ready_to_ship', 'shipped'])
      )
    );
  const transitOrdersCount = transitOrdersResult?.count || 0;

  const [designsCountResult] = await db.select({ count: count() })
    .from(designs)
    .where(eq(designs.userId, session.sub));
  const designsCount = designsCountResult?.count || 0;

  // Recent 5 Orders
  const { orders: userOrders } = await getMyOrders(1, 5);

  const stats = [
    { 
      label: 'Active Projects', 
      value: activeProjectsCount.toString(), 
      change: activeProjectsCount > 0 ? `${activeProjectsCount} ongoing production` : 'No active orders', 
      icon: <Layers className="w-5 h-5 text-blue-500 dark:text-blue-400" />, 
      bg: 'bg-blue-500/10 border-blue-500/20',
      glow: 'shadow-blue-500/5'
    },
    { 
      label: 'Orders in Transit', 
      value: transitOrdersCount.toString(), 
      change: transitOrdersCount > 0 ? `${transitOrdersCount} shipped` : 'No shipments in transit', 
      icon: <Package className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, 
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      glow: 'shadow-emerald-500/5'
    },
    { 
      label: 'Saved Designs', 
      value: designsCount.toString(), 
      change: `${designsCount} templates in library`, 
      icon: <Palette className="w-5 h-5 text-violet-500 dark:text-violet-400" />, 
      bg: 'bg-violet-500/10 border-violet-500/20',
      glow: 'shadow-violet-500/5'
    },
  ];

  return (
    <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER BANNER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 md:p-8 shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase text-[9px] tracking-widest font-black py-1 px-3 rounded-full">
              <Sparkles className="w-3 h-3 mr-1 inline" /> Client Workspace
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight font-headline">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">{session.name || 'Client'}</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl">
              Track your commercial print runs, edit custom designs, and request expert layout verification from your dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button asChild variant="outline" className="flex-1 md:flex-none border-white/20 hover:bg-white/10 hover:text-white bg-white/5 text-white backdrop-blur-sm rounded-xl h-11 px-5 font-bold text-sm">
              <Link href="/client/messages">Support Desk</Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white border-none rounded-xl h-11 px-6 font-bold text-sm shadow-xl shadow-blue-600/30 group">
              <Link href="/products" className="flex items-center justify-center gap-2">
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Project
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* --- KPI STATS SECTION --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-border/40 bg-card/45 backdrop-blur-sm shadow-xl hover:border-primary/20 hover:scale-[1.01] hover:shadow-2xl transition-all duration-350 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <Badge variant="outline" className="bg-background text-muted-foreground border-border/50 text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-4xl font-black tracking-tight font-headline mb-1 text-foreground">{stat.value}</p>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: ORDERS & SERVICES --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Orders */}
          <Card className="overflow-hidden border border-border/40 bg-card/45 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground">Recent Orders</CardTitle>
                  <CardDescription className="text-xs font-semibold text-muted-foreground">Live status of your recent printing projects</CardDescription>
                </div>
                <Link href="/client/orders" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1 group">
                  View all <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {userOrders.length === 0 ? (
                <div className="py-20 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-foreground">No Orders Placed Yet</h3>
                  <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto mt-2">
                    Start designing custom prints or purchase ready products to kick off production.
                  </p>
                  <Button asChild className="mt-6 rounded-xl font-bold bg-primary hover:brightness-110 px-6 shadow-md shadow-primary/20 text-xs uppercase tracking-widest">
                    <Link href="/products">Browse Print Catalog</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground border-b border-border/40 uppercase text-[9px] tracking-widest font-black">
                          <th className="px-6 py-4">Preview</th>
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {userOrders.map((order) => {
                          const isDirectSale = !!order.directSellingProduct;
                          const productName = isDirectSale ? order.directSellingProduct.name : order.product?.name;
                          const subProductName = isDirectSale ? order.directSellingProduct.category : order.subProduct?.name;
                          const imageSrc = isDirectSale 
                            ? order.directSellingProduct.imageUrls?.[0] 
                            : (order.designUpload?.thumbnailPath 
                                || (order.designUpload?.mimeType?.startsWith('image/') ? order.designUpload.filePath : null)
                                || order.design?.thumbnailUrl);

                          return (
                            <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center border border-border/50 overflow-hidden relative shadow-sm group-hover:scale-105 transition-transform duration-300">
                                  {imageSrc ? (
                                    <Image src={resolveImagePath(imageSrc)} alt="preview" fill className="object-cover" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground/50"/>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-xs text-muted-foreground">#ORD-{order.id}</td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{productName}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{subProductName || 'Custom Print'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.orderStatus || '')}`}>
                                  {order.orderStatus === 'under_verification' && <AlertCircle size={10} />}
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-foreground">
                                ₹{parseFloat(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" title="Invoice">
                                    <Link href={`/client/orders/${order.id}/invoice`} target="_blank">
                                      <Download size={14} />
                                    </Link>
                                  </Button>
                                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" title="Details">
                                    <Link href={`/client/orders/${order.id}`}>
                                      <ChevronRight size={16} />
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stack Cards View */}
                  <div className="md:hidden divide-y divide-border/30">
                    {userOrders.map((order) => {
                      const isDirectSale = !!order.directSellingProduct;
                      const productName = isDirectSale ? order.directSellingProduct.name : order.product?.name;
                      const subProductName = isDirectSale ? order.directSellingProduct.category : order.subProduct?.name;
                      const imageSrc = isDirectSale 
                        ? order.directSellingProduct.imageUrls?.[0] 
                        : (order.designUpload?.thumbnailPath 
                            || (order.designUpload?.mimeType?.startsWith('image/') ? order.designUpload.filePath : null)
                            || order.design?.thumbnailUrl);

                      return (
                        <div key={order.id} className="p-4 flex flex-col gap-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-3">
                              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center border border-border/50 overflow-hidden relative shadow-sm flex-shrink-0">
                                {imageSrc ? (
                                  <Image src={resolveImagePath(imageSrc)} alt="preview" fill className="object-cover" />
                                ) : (
                                  <FileText className="h-6 w-6 text-muted-foreground/50"/>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground leading-tight line-clamp-1">{productName}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{subProductName || 'Custom Print'}</p>
                                <p className="text-[11px] font-mono text-muted-foreground/80 mt-1">#ORD-{order.id}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusStyles(order.orderStatus || '')}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-border/20 pt-3">
                            <div className="text-xs font-bold text-foreground">
                              Total: <span className="text-primary font-black ml-1">₹{parseFloat(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold px-3 border-border/60 hover:bg-muted text-foreground">
                                <Link href={`/client/orders/${order.id}/invoice`} target="_blank">
                                  <Download className="w-3.5 h-3.5 mr-1" /> Invoice
                                </Link>
                              </Button>
                              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold px-3 border-border/60 hover:bg-muted text-foreground">
                                <Link href={`/client/orders/${order.id}`}>
                                  Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Grid Quick Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/client/designs" className="group">
              <Card className="h-full border border-border/40 bg-card/45 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-300">
                <CardContent className="p-6 md:p-8 flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
                    <Palette size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Design Library</h4>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">Manage and customize your saved layout templates.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/client/contests" className="group">
              <Card className="h-full border border-border/40 bg-card/45 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-amber-500/30 hover:scale-[1.01] transition-all duration-300">
                <CardContent className="p-6 md:p-8 flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors flex-shrink-0">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight text-foreground group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Creative Quests</h4>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">Launch design quests and pick winner submissions.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* --- RIGHT: SIDEBAR SERVICES --- */}
        <aside className="space-y-6">
          {/* Design Verification Promo */}
          <Card className="bg-zinc-950 text-white border-none shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={140} strokeWidth={1} />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <CardHeader className="pt-8 relative z-10">
              <Badge variant="outline" className="w-fit bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase text-[8px] tracking-widest font-black mb-3 px-2 py-0.5 rounded">Pro Support</Badge>
              <CardTitle className="text-white text-xl md:text-2xl font-black font-headline tracking-tight">
                Design Pre-Flight Verification
              </CardTitle>
              <CardDescription className="text-zinc-400 font-medium text-xs md:text-sm mt-1">
                Avoid printing mistakes with a certified professional designer review before production.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <ul className="text-xs space-y-2.5 text-zinc-300 font-semibold">
                <li className="flex items-center gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={10} className="text-emerald-400" /></div>
                  CMYK & Color Profile Verification
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={10} className="text-emerald-400" /></div>
                  Image Resolution (300 DPI) & Bleed Check
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={10} className="text-emerald-400" /></div>
                  Font Embedding & Vector Layout Check
                </li>
              </ul>
            </CardContent>
            <CardFooter className="relative z-10 pb-8 pt-2">
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all shadow-lg shadow-emerald-500/20">
                <Link href="/client/verifications">
                  Verify a Project Now
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Tools */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Workspace Tools</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Link href="/client/payments" className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-background/50 hover:bg-muted hover:border-border transition-all group">
                <div className="flex items-center gap-3 font-bold text-sm text-foreground">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors flex-shrink-0">
                    <CreditCard size={16} />
                  </div>
                  Payments & Invoices
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </Link>
              
              <Link href="/client/orders" className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-background/50 hover:bg-muted hover:border-border transition-all group">
                <div className="flex items-center gap-3 font-bold text-sm text-foreground">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors flex-shrink-0">
                    <Clock size={16} />
                  </div>
                  Print Order History
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
