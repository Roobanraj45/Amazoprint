'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, Percent, Landmark, TrendingUp, LogOut } from "lucide-react"
import Link from "next/link"
import { AmazoprintLogo } from "@/components/ui/logo"
import { useRouter } from "next/navigation";

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const menuItems = [
    { href: "/accounts/dashboard", label: "Dashboard", icon: <Home /> },
    { href: "/accounts/commission", label: "Commission", icon: <Percent /> },
    { href: "/accounts/settlements", label: "Settlements", icon: <Landmark /> },
    { href: "/accounts/tracking", label: "Financial Tracking", icon: <TrendingUp /> },
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
                    <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                        <AmazoprintLogo isSimple />
                        <span className="group-data-[collapsible=icon]:hidden">AP Team</span>
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
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </SidebarInset>
        </div>
    </SidebarProvider>
  )
}
