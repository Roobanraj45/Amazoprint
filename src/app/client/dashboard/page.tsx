import React from 'react';
import Link from 'next/link';
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
  TrendingUp,
  Package,
  Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ClientDashboard() {
  // Mock data for informative sections
  const stats = [
    { label: 'Active Projects', value: '4', change: '+1 this week', icon: <Layers className="w-5 h-5 text-primary" />, trend: 'up', bg: 'bg-primary/10' },
    { label: 'Orders in Transit', value: '2', change: 'Est. delivery Wed', icon: <Package className="w-5 h-5 text-emerald-500" />, trend: 'neutral', bg: 'bg-emerald-500/10' },
    { label: 'Design Credits', value: '120', change: 'Renewals in 5 days', icon: <CreditCard className="w-5 h-5 text-violet-500" />, trend: 'neutral', bg: 'bg-violet-500/10' },
  ];

  const recentOrders = [
    { id: '#ORD-7721', item: 'Custom Hoodie Design', status: 'In Production', date: 'Oct 24' },
    { id: '#ORD-7719', item: 'Vector Logo Pack', status: 'Completed', date: 'Oct 22' },
    { id: '#ORD-7712', item: 'Business Card Deck', status: 'Action Required', date: 'Oct 20' },
  ];

  return (
    <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Workspace Overview</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">Welcome back, Client.</h1>
          <p className="text-muted-foreground font-medium">Here is what's happening with your projects today.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-card border border-border/50 rounded-xl text-sm font-bold hover:bg-muted transition-colors shadow-sm">
            Support Ticket
          </button>
          <Link href="/products" className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Project
          </Link>
        </div>
      </header>

      {/* --- KPI STATS SECTION --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-primary/20 hover:shadow-primary/5 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} border border-white/5`}>
                  {stat.icon}
                </div>
                <Badge variant="outline" className="bg-background text-muted-foreground border-border/50 text-[10px] font-bold">
                  {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight font-headline">{stat.value}</p>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- MAIN CONTENT: ORDERS & ACTIVITY --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Orders */}
          <Card className="overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Orders</CardTitle>
                <Link href="/client/orders" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1 group">
                  View all <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground border-b border-border/40 uppercase text-[10px] tracking-widest font-black">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4 font-mono font-bold text-xs text-muted-foreground">{order.id}</td>
                        <td className="px-6 py-4 font-bold">{order.item}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                            order.status === 'Action Required' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {order.status === 'Action Required' && <AlertCircle size={12} />}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-medium text-right text-xs">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* --- GRID NAVIGATION --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Link href="/client/designs" className="group">
              <Card className="h-full border border-border/40 bg-card/40 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-start gap-6">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Palette size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xl tracking-tight">Design Library</h4>
                    <p className="text-sm font-medium text-muted-foreground">Access and edit your saved cloud templates.</p>
                  </div>
                </CardContent>
              </Card>
             </Link>
             
             <Link href="/client/contests" className="group">
              <Card className="h-full border border-border/40 bg-card/40 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:border-amber-500/40 transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-start gap-6">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Trophy size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-xl tracking-tight">My Contests</h4>
                    <p className="text-sm font-medium text-muted-foreground">Vote on designer submissions and pick winners.</p>
                  </div>
                </CardContent>
              </Card>
             </Link>
          </div>
        </div>

        {/* --- SIDEBAR: PRO SERVICES & HELP --- */}
        <aside className="space-y-6">
          <Card className="bg-zinc-950 text-white border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} strokeWidth={1} />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <CardHeader className="pt-8 relative z-10">
              <Badge variant="outline" className="w-fit bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase text-[9px] tracking-widest font-black mb-4">Pro Feature</Badge>
              <CardTitle className="text-white text-2xl font-black font-headline tracking-tight">
                Design Verification
              </CardTitle>
              <CardDescription className="text-zinc-400 font-medium">
                Avoid printing errors with a professional senior designer review before production.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm space-y-3 text-zinc-300 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div>
                  Color Profile & CMYK Audit
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div>
                  Resolution & Bleed Check
                </li>
              </ul>
            </CardContent>
            <CardFooter className="relative z-10 pb-8">
              <Link href="/client/verifications" className="w-full">
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-emerald-500/20">
                  Verify a Project
                </button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Link href="/client/payments" className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-muted hover:border-border transition-all group">
                <div className="flex items-center gap-3 font-bold">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <CreditCard size={18} />
                  </div>
                  Billing & Invoices
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/client/orders" className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-muted hover:border-border transition-all group">
                <div className="flex items-center gap-3 font-bold">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Clock size={18} />
                  </div>
                  Project History
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
