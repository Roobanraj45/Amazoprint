import Link from 'next/link';
import {
  ShoppingBag,
  KeyRound,
  Trophy,
  Users,
  ArrowRight,
  Palette,
  Sparkles,
  Activity,
  DollarSign,
  CheckCircle2,
  Settings,
  Clock,
  AlertCircle,
  Package,
  Store,
  Factory,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAdminAllOrders } from '@/app/actions/order-actions';
import { getAdminContests } from '@/app/actions/contest-actions';
import { getUsers } from '@/app/actions/user-actions';

export default async function AdminDashboard() {
  const [orders, contests, users] = await Promise.all([
    getAdminAllOrders(),
    getAdminContests(),
    getUsers(),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const activeContests = contests.filter(c => c.status === 'active').length;
  const pendingPrints = orders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'confirmed').length;

  const stats = [
    { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign />, color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20", sub: `${orders.length} transactions` },
    { label: "Contests", value: activeContests, icon: <Trophy />, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", sub: "Live events" },
    { label: "Community", value: users.length, icon: <Users />, color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", sub: "Registered users" },
    { label: "Workload", value: pendingPrints, icon: <Zap />, color: "from-rose-500 to-pink-600", shadow: "shadow-rose-500/20", sub: "Pending tasks" },
  ];

  const menuItems = [
    { href: '/admin/products', label: 'Products', icon: <ShoppingBag size={24} />, color: 'from-blue-500 to-cyan-500', description: 'Inventory & dynamic pricing.' },
    { href: '/admin/orders', label: 'Orders', icon: <Package size={24} />, color: 'from-indigo-500 to-purple-500', description: 'Customer fulfillment tracking.' },
    { href: '/admin/foils', label: 'Specialty Foils', icon: <Sparkles size={24} />, color: 'from-fuchsia-500 to-pink-500', description: 'Configure premium foil types.' },
    { href: '/admin/contests', label: 'Contests', icon: <Trophy size={24} />, color: 'from-orange-500 to-amber-500', description: 'Community design battles.' },
    { href: '/admin/users', label: 'Directory', icon: <Users size={24} />, color: 'from-emerald-500 to-teal-500', description: 'User roles and permissions.' },
    { href: '/admin/printers', label: 'Production', icon: <Factory size={24} />, color: 'from-sky-500 to-blue-500', description: 'Printer partner management.' },
    { href: '/admin/designs', label: 'Creative', icon: <Palette size={24} />, color: 'from-rose-500 to-orange-500', description: 'Asset monitoring & library.' },
    { href: '/admin/direct-selling', label: 'Shopfront', icon: <Store size={24} />, color: 'from-lime-500 to-green-500', description: 'Direct sell inventory.' },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-10 space-y-12">
        
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                <div className="space-y-4">
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-4 py-1 rounded-full animate-pulse">
                        System Online
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter">Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Center</span></h1>
                    <p className="text-slate-400 text-lg max-w-md">Real-time oversight across the ecosystem. Optimal performance detected.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Revenue Today</p>
                        <p className="text-2xl font-black text-emerald-400">₹{totalRevenue.toFixed(0)}</p>
                    </div>
                    <Button size="lg" className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/40 border-none px-8">
                        Launch Live View
                    </Button>
                </div>
            </div>
        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className={`relative overflow-hidden border-none ${stat.shadow} transition-transform hover:scale-105`}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                        {stat.icon}
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold">{stat.sub}</Badge>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black mt-1 tracking-tight">{stat.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tools Grid */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
                    <Settings className="text-blue-600" /> Infrastructure
                </h2>
                <Button variant="ghost" className="font-bold text-blue-600">View All Modules</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menuItems.map((item) => (
                <Link href={item.href} key={item.label} className="group">
                  <div className="relative h-full p-[2px] rounded-[2rem] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 group-hover:from-blue-400 group-hover:to-indigo-500 transition-all duration-500 shadow-xl group-hover:shadow-blue-500/20">
                    <div className="h-full bg-white dark:bg-slate-950 rounded-[1.9rem] p-6 transition-all">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-6 shadow-lg transform group-hover:-rotate-12 transition-transform duration-300`}>
                            {item.icon}
                        </div>
                        <h4 className="text-2xl font-black mb-2 group-hover:text-blue-600 transition-colors">{item.label}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{item.description}</p>
                        <div className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-blue-600 group-hover:gap-3 transition-all gap-1">
                            Enter Module <ArrowRight size={14} />
                        </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="px-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
                    <Activity className="text-rose-500" /> Pulse
                </h2>
            </div>

            <Card className="rounded-[2rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center gap-2">Live Activity <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"/></CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-slate-100 dark:bg-slate-800" />
                        {[
                             { action: "Contest Launch", target: "Tech Pack v2", time: "2m", color: "bg-amber-500", icon: <Trophy size={12}/> },
                             { action: "Payment In", target: "Order #8829", time: "15m", color: "bg-emerald-500", icon: <DollarSign size={12}/> },
                             { action: "Printer Auth", target: "Factory X1", time: "1h", color: "bg-blue-500", icon: <Factory size={12}/> },
                        ].map((log, idx) => (
                            <div key={idx} className="relative flex gap-6 items-center group">
                                <div className={`z-10 h-8 w-8 rounded-full ${log.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    {log.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-black">{log.action}</p>
                                        <span className="text-[10px] font-bold text-slate-400">{log.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{log.target}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="p-0">
                    <Button variant="ghost" className="w-full py-6 rounded-none font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                        Audit Logs
                    </Button>
                </CardFooter>
            </Card>

            {/* Security Footer Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/30">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <KeyRound className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70">Infrastructure</p>
                        <p className="font-black">Shield Active</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-full" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold opacity-70 italic uppercase">
                        <span>Database Sync: 100%</span>
                        <span>Backups: OK</span>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
