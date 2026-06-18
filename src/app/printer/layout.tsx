'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, List, Briefcase, CircleDollarSign, Wallet, LogOut, Search, Bell, Factory, Package, Settings, Clock, Sparkles, FileText, CreditCard, BarChart3, MessageSquare } from "lucide-react"
import Link from "next/link"
import { AmazoprintLogo } from "@/components/ui/logo"
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getUnreadMessageCount } from "@/app/actions/message-actions";

export default function PrinterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = React.useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.permission === 'default' && Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const checkUnread = () => {
      getUnreadMessageCount().then(count => {
        setUnreadCount(count);
        if (count > prevCountRef.current) {
          // Play audio chime
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
            audio.volume = 0.45;
            audio.play();
          } catch (e) {
            console.log('Audio playback blocked');
          }

          // Native Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Chat Message', {
              body: 'You have new messages from Amazoprint Support.',
              icon: '/favicon.ico',
            });
          }
        }
        prevCountRef.current = count;
      }).catch(err => console.error(err));
    };

    checkUnread();
    const interval = setInterval(checkUnread, 8000);
    return () => clearInterval(interval);
  }, [pathname]);
  
  const menuItems = [
    { href: "/printer/dashboard", label: "Dashboard", icon: <Home size={16} />, color: "text-blue-500" },
    { href: "/printer/orders", label: "Order Queue", icon: <Package size={16} />, color: "text-amber-500" },
    { href: "/printer/shipments", label: "Shipping", icon: <Factory size={16} />, color: "text-cyan-500" },
    { href: "/printer/invoices", label: "Invoices", icon: <FileText size={16} />, color: "text-violet-500" },
    { href: "/printer/messages", label: "Admin Chat", icon: <MessageSquare size={16} />, color: "text-emerald-500" },
    { href: "/printer/reports", label: "Reports", icon: <BarChart3 size={16} />, color: "text-indigo-500" },
    { href: "/printer/design-options", label: "Design Update", icon: <Sparkles size={16} />, color: "text-indigo-500" },
    { href: "/printer/price-list", label: "Price List", icon: <List size={16} />, color: "text-emerald-500" },
    { href: "/printer/bank-details", label: "Bank Details", icon: <CreditCard size={16} />, color: "text-slate-500" },
    { href: "/printer/subscriptions", label: "Premium Subscription", icon: <CircleDollarSign size={16} />, color: "text-rose-500" },
  ];
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <SidebarProvider className="print:!bg-white print:!min-h-0 print:!block print:!w-full print:!overflow-visible">
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-foreground selection:bg-primary/10 selection:text-primary font-sans print:!h-auto print:!w-full print:!bg-white print:!text-black print:!block print:!overflow-visible print:!p-0 print:!m-0">
            <Sidebar className="w-56 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl print:!hidden">
                <SidebarHeader className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-zinc-800/50 px-4">
                    <Link href="/" className="w-full flex items-center justify-center transition-transform hover:scale-[1.02]">
                        <AmazoprintLogo variant="sidebar" className="w-full h-auto" />
                    </Link>
                </SidebarHeader>
                <SidebarContent className="px-2 py-4">
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hub Management</p>
                    </div>
                    <SidebarMenu className="gap-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/printer/dashboard" && pathname.startsWith(item.href));
                            return (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton 
                                        asChild 
                                        className={cn(
                                            "h-9 transition-all duration-200 rounded-lg group px-2",
                                            isActive 
                                                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 hover:text-white" 
                                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 dark:text-slate-400"
                                        )}
                                    >
                                        <Link href={item.href} className="flex items-center gap-2">
                                            <div className={cn(
                                                "transition-transform group-hover:scale-110",
                                                !isActive && item.color
                                            )}>
                                                {item.icon}
                                            </div>
                                            <span className="font-bold text-[11px] tracking-tight">{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarHeader className="p-2 border-t border-slate-100 dark:border-zinc-800/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                onClick={handleLogout} 
                                className="rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 text-slate-400 transition-colors h-9 px-2"
                            >
                                <LogOut size={16} />
                                <span className="font-bold text-[11px]">Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
            </Sidebar>

            <SidebarInset className="bg-transparent flex flex-col flex-1 overflow-hidden relative print:!p-0 print:!m-0 print:!overflow-visible print:!w-full print:!block print:!bg-white print:!shadow-none print:!border-none">
                {/* Background Ambient Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 print:hidden" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none -z-10 print:hidden" />
 
                <header className="flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-card/60 backdrop-blur-xl px-6 lg:px-10 z-10 sticky top-0 print:hidden">
                    <div className="flex items-center gap-4 flex-1">
                      <SidebarTrigger className="md:hidden text-muted-foreground hover:text-foreground transition-colors" />
                      <div className="relative hidden sm:block max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search jobs, orders, or logs..." className="pl-9 bg-muted/50 border-transparent focus-visible:ring-primary/20 focus-visible:border-primary/50 rounded-xl h-10 w-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <Clock size={12} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Hub Online</span>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-card" />
                      </button>
                      <div className="h-8 w-[1px] bg-border/50 mx-2 hidden sm:block" />
                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="hidden sm:block text-right">
                          <p className="text-sm font-bold leading-none mb-1 group-hover:text-primary transition-colors">Printer Hub</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none">Production</p>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-border/50 group-hover:border-primary/50 transition-colors">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">PH</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                </header>
 
                <main className="flex-1 overflow-auto relative print:!overflow-visible print:!p-0 print:!m-0 print:!block print:!w-full print:!bg-white print:!shadow-none print:!border-none">
                    <div className="min-h-full">
                      {children}
                    </div>
                </main>
                {pathname !== '/printer/messages' && (
                    <Link
                        href="/printer/messages"
                        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/35 transition-all duration-300 hover:scale-105 hover:bg-slate-800 active:scale-95 group print:hidden"
                    >
                        <MessageSquare className="h-6 w-6 transition-transform group-hover:rotate-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-4 ring-zinc-50 dark:ring-zinc-950 animate-bounce">
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                )}
            </SidebarInset>
        </div>
    </SidebarProvider>
  )
}
