
import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Trophy, 
  CheckSquare, 
  ArrowRight, 
  PenSquare, 
  Wallet, 
  Clock, 
  Star,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FreelancerDashboard() {
  // Mock data - in a real app, fetch these from your database
  const stats = [
    { label: 'Total Earnings', value: '₹12,450', icon: <Wallet className="text-green-500" /> },
    { label: 'Active Contests', value: '3', icon: <Clock className="text-blue-500" /> },
    { label: 'Designs Won', value: '12', icon: <Trophy className="text-yellow-500" /> },
    { label: 'Avg. Rating', value: '4.9', icon: <Star className="text-purple-500" /> },
  ];

  const menuItems = [
    { 
      href: '/contests', 
      label: 'Browse Contests', 
      icon: <Trophy />, 
      description: 'Explore open briefs and compete for prizes.',
      color: 'bg-yellow-500/10 text-yellow-600'
    },
    { 
      href: '/freelancer/contests', 
      label: 'My Contests', 
      icon: <CheckSquare />, 
      description: 'Track your submissions and feedback.',
      color: 'bg-blue-500/10 text-blue-600'
    },
    { 
      href: '/freelancer/verifications', 
      label: 'Verification Jobs', 
      icon: <ShieldCheck />, 
      description: 'Review designs and earn rewards.',
      color: 'bg-red-500/10 text-red-600'
    },
    { 
      href: '/freelancer/designs', 
      label: 'My Designs', 
      icon: <PenSquare />, 
      description: 'Manage your saved drafts and final works.',
      color: 'bg-green-500/10 text-green-600'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Freelancer Workspace</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back! You have <span className="text-foreground font-medium">2 new notifications</span> today.
          </p>
        </div>
        <Button asChild>
          <Link href="/products">
            Start New Design
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-background rounded-xl shadow-sm">
                {React.cloneElement(stat.icon as React.ReactElement, { size: 20 })}
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link href={item.href} key={item.label} className="group">
              <Card className="h-full border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-xl bg-card overflow-hidden">
                <div className="flex p-6 items-start gap-5">
                  <div className={`p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300 ${item.color}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {item.label}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </div>
                  <div className="ml-auto self-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="text-primary" size={24} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
