'use client';

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { 
  CircleDollarSign, 
  Check, 
  Loader2, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  History,
  X,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getSubscriptionPlans,
  subscribePrinter,
  getActivePrinterSubscription,
  getPrinterSubscriptionHistory,
  cancelActiveSubscription
} from '@/app/actions/subscription-actions';

interface Plan {
  id: number;
  name: string;
  price: string;
  durationType: 'monthly' | 'yearly' | 'lifetime';
  description: string | null;
  features: string[] | null;
  isActive: boolean;
  createdAt: Date;
}

interface Subscription {
  id: number;
  printerId: string;
  planId: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date | null;
  paymentStatus: string | null;
  paymentId: string | null;
  createdAt: Date;
  plan: Plan;
}

export default function PrinterSubscriptionsPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Razorpay script injection
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, fetchedActive, fetchedHistory] = await Promise.all([
        getSubscriptionPlans(false),
        getActivePrinterSubscription(),
        getPrinterSubscriptionHistory()
      ]);
      setPlans(fetchedPlans as Plan[]);
      setActiveSub(fetchedActive as unknown as Subscription);
      setHistory(fetchedHistory as unknown as Subscription[]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading plans',
        description: error.message || 'Could not fetch subscription details.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCheckout = (plan: Plan) => {
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      toast({
        variant: 'destructive',
        title: 'Payment Gateway Offline',
        description: 'Razorpay SDK is loading. Please try again in a moment.'
      });
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
      amount: Math.round(parseFloat(plan.price) * 100), // paise
      currency: 'INR',
      name: 'Amazoprint',
      description: `Subscription Upgrade: ${plan.name}`,
      handler: function (response: any) {
        startTransition(async () => {
          try {
            await subscribePrinter(plan.id, response.razorpay_payment_id);
            toast({
              title: 'Subscription Successful!',
              description: `You are now subscribed to the "${plan.name}" tier.`,
            });
            await fetchData();
          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: error.message || 'Payment capture failed.'
            });
          }
        });
      },
      prefill: {
        name: 'Printer Hub Partner',
        email: 'printer@amazoprint.com',
      },
      theme: {
        color: '#000000',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleCancelSubscription = () => {
    if (!confirm('Are you sure you want to cancel your premium subscription?')) return;
    startTransition(async () => {
      try {
        await cancelActiveSubscription();
        toast({
          title: 'Subscription Cancelled',
          description: 'Your premium membership has been cancelled successfully.',
        });
        await fetchData();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Cancellation Failed',
          description: error.message || 'Could not cancel subscription.'
        });
      }
    });
  };

  const daysRemaining = activeSub?.endDate 
    ? differenceInDays(new Date(activeSub.endDate), new Date()) 
    : null;

  return (
    <div className="max-w-[1100px] mx-auto p-6 lg:p-10 space-y-12 text-slate-900 dark:text-zinc-100 selection:bg-zinc-200">
      
      {/* Vercel-style Clean Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] tracking-[0.15em] font-black uppercase text-indigo-600 dark:text-indigo-400">PARTNER HUB UPGRADES</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            Upgrade your printing press membership tier to receive higher priority jobs, reduced platform commissions, and dedicated system tools.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[25vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-xs text-slate-400 font-medium">Fetching accounts details...</p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* Active Subscription Status Banner */}
          {activeSub ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">ACTIVE MEMBERSHIP</span>
                </div>
                <h3 className="text-xl font-bold">{activeSub.plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Enrolled on <strong className="text-slate-800 dark:text-zinc-200">{format(new Date(activeSub.startDate), 'MMMM d, yyyy')}</strong>. 
                  {activeSub.endDate ? (
                    <> Renews on <strong className="text-slate-800 dark:text-zinc-200">{format(new Date(activeSub.endDate), 'MMMM d, yyyy')}</strong>.</>
                  ) : (
                    " You have lifetime membership benefits."
                  )}
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RECURRING RATE</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  ₹{parseFloat(activeSub.plan.price).toFixed(2)}
                  <span className="text-xs font-semibold text-slate-400 capitalize"> / {activeSub.plan.durationType}</span>
                </p>
                {daysRemaining !== null && (
                  <Badge variant="outline" className="text-[9px] font-bold py-0 bg-rose-50 text-rose-600 border-rose-100">
                    {daysRemaining} days remaining in cycle
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-2.5">
              <h3 className="text-base font-bold">Standard Free Tier</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Your press is using the standard billing package. Upgrade to a premium tier below to lower job routing commissions and prioritize order matching.
              </p>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold tracking-tight text-center md:text-left">Select a plan tier</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrent = activeSub?.planId === plan.id;
                return (
                  <div 
                    key={plan.id}
                    className={`border rounded-2xl p-6 flex flex-col justify-between bg-white dark:bg-zinc-950 transition-all ${
                      isCurrent 
                        ? 'border-zinc-950 dark:border-white ring-1 ring-zinc-950 dark:ring-white shadow-sm' 
                        : 'border-zinc-200/80 dark:border-zinc-850 hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                          {plan.description && <p className="text-[11px] text-slate-500 mt-1">{plan.description}</p>}
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded px-2 py-0.5 tracking-wider">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="pt-2">
                        <span className="text-2xl font-bold">₹{parseFloat(plan.price).toFixed(2)}</span>
                        <span className="text-xs font-semibold text-slate-400 capitalize"> / {plan.durationType}</span>
                      </div>

                      <ul className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-2.5">
                        {plan.features?.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                            <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        )) || <li className="text-xs text-slate-400 italic">Standard billing tier benefits</li>}
                      </ul>
                    </div>

                    <div className="pt-6">
                      <Button 
                        onClick={() => handleOpenCheckout(plan)}
                        disabled={isCurrent || !!activeSub}
                        className={`w-full rounded-xl font-bold h-10 transition-all ${
                          isCurrent
                            ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-default border border-zinc-200 dark:border-zinc-800'
                            : !!activeSub
                            ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-800 opacity-60'
                            : 'bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-sm'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : activeSub ? 'Plan Locked' : 'Select Plan'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing History */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight">Invoice History</h2>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
              {history.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-xs italic">No subscription logs found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                      <TableHead className="font-bold text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider py-4 pl-6">Subscription Plan</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider py-4">Start Date</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider py-4">Expiration</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider py-4">Status</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider py-4">Payment ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((sub) => (
                      <TableRow key={sub.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                        <TableCell className="font-bold py-4 pl-6">
                          <div>
                            <p className="text-xs font-bold">{sub.plan?.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">₹{parseFloat(sub.plan?.price || '0').toFixed(2)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-zinc-400 py-4 font-semibold">
                          {format(new Date(sub.startDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-zinc-400 py-4 font-semibold">
                          {sub.endDate ? (
                            format(new Date(sub.endDate), 'MMM d, yyyy')
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400">Lifetime</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                            sub.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-400 py-4">
                          {sub.paymentId || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

        </div>
      )}



    </div>
  );
}
