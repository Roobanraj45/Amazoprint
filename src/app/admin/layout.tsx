'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar"
import { LogOut, KeyRound, ShoppingBag, Home, Trophy, Users, Palette, Sparkles, Store, Package, DollarSign, Factory, ShieldCheck, Search } from "lucide-react"
import Link from "next/link"
import { AmazoprintLogo } from '@/components/ui/logo';
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getSession } from '@/app/actions/user-actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Session = Awaited<ReturnType<typeof getSession>>;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = React.useState<Session | null>(null);
    const [loadingSession, setLoadingSession] = React.useState(true);

    React.useEffect(() => {
        getSession().then(s => {
            setSession(s);
            setLoadingSession(false);
        });
    }, []);

    const menuItems = [
        { href: "/admin/dashboard", label: "Dashboard", icon: <Home size={18} />, color: "group-hover:text-blue-500" },
        { href: "/admin/products", label: "Products", icon: <ShoppingBag size={18} />, color: "group-hover:text-cyan-500" },
        { href: "/admin/pricing", label: "Pricing", icon: <DollarSign size={18} />, color: "group-hover:text-emerald-500" },
        { href: "/admin/direct-selling", label: "Direct Selling", icon: <Store size={18} />, color: "group-hover:text-lime-500" },
        { href: "/admin/orders", label: "Orders", icon: <Package size={18} />, color: "group-hover:text-indigo-500" },
        { href: "/admin/foils", label: "Foils", icon: <Sparkles size={18} />, color: "group-hover:text-fuchsia-500" },
        { href: "/admin/contests", label: "Contests", icon: <Trophy size={18} />, color: "group-hover:text-orange-500" },
        { href: "/admin/users", label: "Users", icon: <Users size={18} />, color: "group-hover:text-sky-500" },
        { href: "/admin/printers", label: "Printers", icon: <Factory size={18} />, color: "group-hover:text-blue-600" },
        { href: "/admin/designs", label: "Designs", icon: <Palette size={18} />, color: "group-hover:text-rose-500" },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-zinc-950 overflow-hidden">
                <Sidebar collapsible="icon" className="border-r border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                    <SidebarHeader className="h-16 border-b border-slate-200/60 dark:border-zinc-800/60">
                        <Link href="/admin/dashboard" className="flex items-center justify-center h-full p-2 gap-2">
                            <AmazoprintLogo />
                            <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Admin</span>
                        </Link>
                    </SidebarHeader>
                    
                    <SidebarContent className="px-3 pt-2 flex-1 space-y-1">
                        <div className="px-4 mb-2 group-data-[collapsible=icon]:hidden">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management</span>
                        </div>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const isActive = item.href === '/admin/dashboard'
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href);
                                return (
                                    <SidebarMenuItem key={item.label}>
                                        <SidebarMenuButton 
                                            asChild 
                                            className={cn(
                                                "h-11 transition-all duration-200 rounded-xl group px-3",
                                                isActive 
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:text-white" 
                                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 dark:text-slate-400"
                                            )}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.href} className="flex items-center gap-3">
                                                <div className={cn(
                                                    "transition-transform group-hover:scale-110",
                                                    !isActive && item.color
                                                )}>
                                                    {item.icon}
                                                </div>
                                                <span className="font-bold text-sm tracking-tight group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                {isActive && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse group-data-[collapsible=icon]:hidden" />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="p-3 border-t border-slate-200/60 dark:border-zinc-800/60 mt-auto bg-slate-50/50 dark:bg-zinc-900/30">
                        <SidebarMenu className="space-y-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    asChild
                                    className={cn(
                                        "h-11 rounded-xl transition-all",
                                        pathname === "/admin/change-password" ? "bg-slate-200 dark:bg-zinc-800" : "text-slate-500 hover:bg-slate-200/50"
                                    )}
                                >
                                    <Link href="/admin/change-password">
                                        <ShieldCheck size={18} className="text-slate-500" />
                                        <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">Security Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    onClick={handleLogout} 
                                    className="h-11 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 font-bold"
                                >
                                    <LogOut size={18} />
                                    <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="bg-transparent overflow-hidden flex flex-col">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-zinc-800/60">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="h-9 w-9" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-muted/50"
                                />
                            </div>
                            {loadingSession ? (
                                <Skeleton className="h-10 w-10 rounded-full" />
                            ) : session ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" className="relative h-10 w-10 rounded-full">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>{session.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{session.name}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/admin/change-password')}>Security</DropdownMenuItem>
                                        <DropdownMenuItem>Support</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">Logout</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : null}
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto no-scrollbar p-6">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}