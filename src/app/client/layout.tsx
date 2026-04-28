'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, ShoppingCart, PenSquare, CreditCard, LogOut, Trophy, UploadCloud, Palette, ShieldCheck, Package, Bell, Search } from "lucide-react"
import Link from "next/link"
import { AmazoprintLogo } from "@/components/ui/logo"
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const menuItems = [
    { href: "/client/dashboard", label: "Dashboard", icon: <Home /> },
    { href: "/products", label: "Products", icon: <Palette /> },
    { href: "/client/orders", label: "My Orders", icon: <Package /> },
    { href: "/client/designs", label: "My Designs", icon: <PenSquare /> },
    { href: "/client/contests", label: "My Contests", icon: <Trophy /> },
    { href: "/client/my-uploads", label: "My Uploads", icon: <UploadCloud /> },
    { href: "/client/verifications", label: "Verification", icon: <ShieldCheck /> },
    { href: "/client/payments", label: "Payments", icon: <CreditCard /> },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <SidebarProvider>
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-foreground selection:bg-primary/10 selection:text-primary">
            <Sidebar className="border-r border-border/40 bg-card/50 backdrop-blur-xl">
                <SidebarHeader className="p-6">
                    <Link href="/" className="flex items-center justify-start transition-transform hover:scale-105">
                        <AmazoprintLogo />
                    </Link>
                </SidebarHeader>
                <SidebarContent className="px-4">
                    <SidebarMenu className="gap-2">
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all group data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-bold h-11">
                                    <Link href={item.href} className="flex items-center gap-3 px-3">
                                        <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                          {item.icon}
                                        </div>
                                        <span className="font-medium tracking-tight text-sm">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarHeader className="p-4 mt-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout} className="rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors h-11">
                                <LogOut className="w-5 h-5" />
                                <span className="font-semibold text-sm">Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
            </Sidebar>

            <SidebarInset className="bg-transparent flex flex-col flex-1 overflow-hidden relative">
                {/* Background Ambient Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

                <header className="flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-card/60 backdrop-blur-xl px-6 lg:px-10 z-10 sticky top-0">
                    <div className="flex items-center gap-4 flex-1">
                      <SidebarTrigger className="md:hidden text-muted-foreground hover:text-foreground transition-colors" />
                      <div className="relative hidden sm:block max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search projects, orders, or files..." className="pl-9 bg-muted/50 border-transparent focus-visible:ring-primary/20 focus-visible:border-primary/50 rounded-xl h-10 w-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-card" />
                      </button>
                      <div className="h-8 w-[1px] bg-border/50 mx-2 hidden sm:block" />
                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="hidden sm:block text-right">
                          <p className="text-sm font-bold leading-none mb-1 group-hover:text-primary transition-colors">Client Pro</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none">Enterprise</p>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-border/50 group-hover:border-primary/50 transition-colors">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">CP</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto relative z-0">
                    <div className="min-h-full">
                      {children}
                    </div>
                </main>
            </SidebarInset>
        </div>
    </SidebarProvider>
  )
}
