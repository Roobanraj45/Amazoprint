'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, CheckSquare, ArrowRight, PenSquare, Wallet, Clock, Star, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function FreelancerDashboard() {
  const stats = [
    { label: 'Total Earnings', value: '₹12,450', icon: <Wallet className="text-emerald-500 w-6 h-6" />, change: "+12%", trend: "up" },
    { label: 'Active Contests', value: '3', icon: <Clock className="text-blue-500 w-6 h-6" />, change: "+1", trend: "up" },
    { label: 'Designs Won', value: '12', icon: <Trophy className="text-amber-500 w-6 h-6" />, change: "+2", trend: "up" },
    { label: 'Avg. Rating', value: '4.9', icon: <Star className="text-violet-500 w-6 h-6" />, change: "Top 5%", trend: "neutral" },
  ];

  const menuItems = [
    { 
      href: '/contests', 
      label: 'Browse Contests', 
      icon: <Trophy />, 
      description: 'Explore open briefs and compete for prizes.',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]'
    },
    { 
      href: '/freelancer/contests', 
      label: 'My Contests', 
      icon: <CheckSquare />, 
      description: 'Track your submissions and feedback.',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]'
    },
    { 
      href: '/freelancer/verifications', 
      label: 'Verification Jobs', 
      icon: <ShieldCheck />, 
      description: 'Review designs and earn rewards.',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]'
    },
    { 
      href: '/freelancer/designs', 
      label: 'My Designs', 
      icon: <PenSquare />, 
      description: 'Manage your saved drafts and final works.',
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/20 group-hover:border-violet-500/50 group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]'
    },
  ];

  const FADE_UP = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const STAGGER = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-4 md:p-8 lg:p-10">
      {/* Header Section */}
      <motion.div 
        initial="hidden" animate="visible" variants={FADE_UP}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40 relative"
      >
        <div className="space-y-2 relative z-10">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Freelancer Workspace</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline">Creative <span className="text-primary">Studio</span></h1>
          <p className="text-muted-foreground font-medium text-lg max-w-xl">
            Welcome back! You have <span className="text-foreground font-bold">2 new notifications</span> regarding your recent contest submissions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
          <Button size="lg" asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold tracking-widest uppercase text-xs px-8">
            <Link href="/products">
              Start Designing
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div initial="hidden" animate="visible" variants={STAGGER} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div key={stat.label} variants={FADE_UP}>
            <Card className="border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden relative group">
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-background/50 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md">
                    {stat.icon}
                  </div>
                  {stat.change && (
                    <Badge variant="secondary" className={`bg-background/50 backdrop-blur-md border border-border/50 font-bold text-[10px] ${
                      stat.trend === 'up' ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}>
                      {stat.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black font-headline tracking-tight">Quick Actions</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-border/80 to-transparent" />
        </div>
        
        <motion.div initial="hidden" animate="visible" variants={STAGGER} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, idx) => (
            <motion.div key={item.label} variants={FADE_UP}>
              <Link href={item.href} className="group block h-full outline-none">
                <Card className={`h-full border border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-background/40 to-transparent z-0" />
                  <div className="flex p-8 items-start gap-6 relative z-10">
                    <div className={`p-4 rounded-2xl shrink-0 transition-all duration-500 border ${item.color}`}>
                      {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
                    </div>
                    <div className="space-y-2 flex-1 pt-1">
                      <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {item.label}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </div>
                    <div className="ml-auto self-center p-3 rounded-full bg-background/50 border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 group-hover:border-primary/30 group-hover:text-primary">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
