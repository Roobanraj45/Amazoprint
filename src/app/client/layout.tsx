'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, ShoppingCart, PenSquare, CreditCard, LogOut, Trophy, UploadCloud, Palette, ShieldCheck, Package } from "lucide-react"
import Link from "next/link"
import { AmazoprintLogo } from "@/components/ui/logo"
import { useRouter } from "next/navigation";

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
        <div className="flex h-screen w-full bg-background">
            <Sidebar>
                <SidebarHeader>
                    <Link href="/" className="flex items-center justify-center">
                        <AmazoprintLogo />
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.href}>
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout}>
                                <LogOut />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
                    <SidebarTrigger className="md:hidden" />
                </header>
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </SidebarInset>
        </div>
    </SidebarProvider>
  )
}
