import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { List, Briefcase, CircleDollarSign, Wallet, ArrowRight } from 'lucide-react';
import React from 'react';

export default function PrinterDashboard() {
  const menuItems = [
    {
        href: '/printer/jobs/available',
        label: 'Available Jobs',
        icon: <List size={24} />,
        description: 'Find new jobs to print.',
    },
    {
        href: '/printer/jobs/assigned',
        label: 'Assigned Jobs',
        icon: <Briefcase size={24} />,
        description: 'View your current jobs.',
    },
    {
        href: '/printer/earnings',
        label: 'Earnings',
        icon: <CircleDollarSign size={24} />,
        description: 'Track your earnings.',
    },
    {
        href: '/printer/wallet',
        label: 'Wallet',
        icon: <Wallet size={24} />,
        description: 'Manage your earnings & withdrawals.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Printer Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Let's get printing.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.label} className="group block">
            <Card className="relative h-full overflow-hidden rounded-xl bg-card transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 border border-border/50 hover:border-primary/50">
              <div className="absolute -right-8 -top-8 text-primary/5 group-hover:text-primary/10 group-hover:scale-125 transition-transform duration-500 ease-out">
                {React.cloneElement(item.icon, { size: 96, strokeWidth: 1, fill: 'currentColor' })}
              </div>
              <CardHeader>
                <CardTitle>{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
              <CardFooter className="pt-4">
                  <div className="text-primary font-semibold text-sm flex items-center gap-2">
                      Go to {item.label} <ArrowRight size={16} />
                  </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
