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
  ExternalLink
} from 'lucide-react';

export default function ClientDashboard() {
  // Mock data for informative sections
  const stats = [
    { label: 'Active Projects', value: '4', change: '+1 this week', icon: <PenSquare className="text-blue-600" /> },
    { label: 'Orders in Transit', value: '2', change: 'Est. delivery Wed', icon: <ShoppingCart className="text-emerald-600" /> },
    { label: 'Design Credits', value: '120', change: 'Renewals in 5 days', icon: <CreditCard className="text-purple-600" /> },
  ];

  const recentOrders = [
    { id: '#ORD-7721', item: 'Custom Hoodie Design', status: 'In Production', date: 'Oct 24' },
    { id: '#ORD-7719', item: 'Vector Logo Pack', status: 'Completed', date: 'Oct 22' },
    { id: '#ORD-7712', item: 'Business Card Deck', status: 'Action Required', date: 'Oct 20' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER SECTION --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Workspace</h1>
            <p className="text-slate-500 font-medium">Manage your creative pipeline and orders.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              Support
            </button>
            <Link href="/products" className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20">
              <Plus size={18} /> New Project
            </Link>
          </div>
        </header>

        {/* --- KPI STATS SECTION --- */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm ring-1 ring-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- MAIN CONTENT: ORDERS & ACTIVITY --- */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-white border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <Link href="/client/orders" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    View all <ExternalLink size={14} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                        <th className="px-6 py-3 font-medium">Order ID</th>
                        <th className="px-6 py-3 font-medium">Item</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-xs">{order.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-700">{order.item}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                              order.status === 'Action Required' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status === 'Action Required' && <AlertCircle size={12} />}
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* --- GRID NAVIGATION --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Link href="/client/designs" className="group">
                <Card className="hover:border-primary/50 transition-all hover:shadow-md">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Palette size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Design Library</h4>
                      <p className="text-sm text-slate-500">Access and edit your saved templates.</p>
                    </div>
                  </CardContent>
                </Card>
               </Link>
               
               <Link href="/client/contests" className="group">
                <Card className="hover:border-primary/50 transition-all hover:shadow-md">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">My Contests</h4>
                      <p className="text-sm text-slate-500">Vote on submissions and pick winners.</p>
                    </div>
                  </CardContent>
                </Card>
               </Link>
            </div>
          </div>

          {/* --- SIDEBAR: PRO SERVICES & HELP --- */}
          <aside className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={120} strokeWidth={1} />
              </div>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  Pro Verification
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Avoid printing errors with a professional file review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" /> Color Profile Audit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" /> Resolution Check
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/client/verifications" className="w-full">
                  <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition-all">
                    Verify My Design
                  </button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Quick Tools</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Link href="/client/payments" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-slate-400" />
                    Billing & Invoices
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </Link>
                <Link href="/client/orders" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-slate-400" />
                    Project History
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </Link>
              </CardContent>
            </Card>
          </aside>

        </div>
      </div>
    </div>
  );
}
