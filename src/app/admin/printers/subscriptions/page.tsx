'use client';

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Plus, 
  Loader2, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  User, 
  Pencil,
  Trash2,
  X,
  PlusCircle,
  Coins
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createSubscriptionPlan,
  toggleSubscriptionPlan,
  getSubscriptionPlans,
  getAdminSubscriptions,
  getAdminSubscriptionsReport,
  updateSubscriptionPlan,
  deleteSubscriptionPlan
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
  printer: {
    id: string;
    name: string | null;
    companyName: string | null;
    email: string;
  };
}

interface Report {
  activeSubscribersCount: number;
  planBreakdown: Array<{
    planName: string;
    durationType: string;
    count: number;
    totalRevenue: string;
  }>;
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationType, setDurationType] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [description, setDescription] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, fetchedSubs, fetchedReport] = await Promise.all([
        getSubscriptionPlans(true),
        getAdminSubscriptions(),
        getAdminSubscriptionsReport()
      ]);
      setPlans(fetchedPlans as Plan[]);
      setSubscriptions(fetchedSubs as unknown as Subscription[]);
      setReport(fetchedReport);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading subscriptions',
        description: error.message || 'An error occurred while loading data.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in the plan name and price.'
      });
      return;
    }

    startTransition(async () => {
      try {
        const features = featuresStr
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0);

        if (editingPlan) {
          await updateSubscriptionPlan(editingPlan.id, {
            name,
            price,
            durationType,
            description: description || undefined,
            features
          });
          toast({
            title: 'Plan Updated Successfully',
            description: `The plan "${name}" has been updated.`
          });
          setEditingPlan(null);
        } else {
          await createSubscriptionPlan({
            name,
            price,
            durationType,
            description: description || undefined,
            features
          });
          toast({
            title: 'Plan Created Successfully',
            description: `The plan "${name}" has been created.`
          });
        }

        // Reset form
        setName('');
        setPrice('');
        setDurationType('monthly');
        setDescription('');
        setFeaturesStr('');

        // Refresh data
        await fetchData();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error saving plan',
          description: error.message || 'Could not save the plan.'
        });
      }
    });
  };

  const handleStartEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setDurationType(plan.durationType);
    setDescription(plan.description || '');
    setFeaturesStr(plan.features?.join(', ') || '');
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setName('');
    setPrice('');
    setDurationType('monthly');
    setDescription('');
    setFeaturesStr('');
  };

  const handleDeletePlan = (planId: number) => {
    if (!confirm('Are you sure you want to delete this subscription plan? This will also remove any active subscriptions associated with it.')) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteSubscriptionPlan(planId);
        toast({
          title: 'Plan Deleted',
          description: 'The subscription plan was successfully deleted.'
        });
        await fetchData();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error deleting plan',
          description: error.message || 'Could not delete plan.'
        });
      }
    });
  };

  const handleTogglePlan = (planId: number, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleSubscriptionPlan(planId, !currentStatus);
        toast({
          title: 'Plan Updated',
          description: `The plan has been ${!currentStatus ? 'activated' : 'deactivated'}.`
        });
        await fetchData();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error updating plan status',
          description: error.message || 'Could not update status.'
        });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">Active</span>;
      case 'expired':
        return <span className="inline-flex items-center text-[10px] font-extrabold text-slate-400 bg-slate-50 dark:bg-zinc-900/50 px-2 py-0.5 rounded">Expired</span>;
      default:
        return <span className="inline-flex items-center text-[10px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">{status}</span>;
    }
  };

  const totalRevenue = report?.planBreakdown.reduce((sum, item) => sum + parseFloat(item.totalRevenue), 0) || 0;

  return (
    <div className="max-w-[1500px] mx-auto p-6 lg:p-10 space-y-10 text-slate-900 dark:text-zinc-100 selection:bg-zinc-200">
      
      {/* Vercel-style clean header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse" />
            <span className="text-[10px] tracking-[0.15em] font-black uppercase text-slate-450">ADMIN OPERATIONS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hub Subscription Settings</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-2xl">
            Configure partner pricing tiers, manage parameters, and audit printer partner premium subscriptions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[35vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-xs text-slate-400 font-medium">Fetching dashboard metrics...</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-zinc-250/60 dark:border-zinc-800/80 p-6 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Active Subscribers</span>
              <p className="text-3xl font-bold mt-2">{report?.activeSubscribersCount || 0}</p>
            </div>
            <div className="border border-zinc-250/60 dark:border-zinc-800/80 p-6 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Estimated Revenue</span>
              <p className="text-3xl font-bold mt-2">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="border border-zinc-250/60 dark:border-zinc-800/80 p-6 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Total Tiers</span>
              <p className="text-3xl font-bold mt-2">{plans.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left side Form */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
                <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    {editingPlan ? 'Edit Billing Package' : 'New Billing Package'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmitPlan} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Name</label>
                      <Input
                        placeholder="e.g. Standard, Pro Partner"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Interval</label>
                        <Select 
                          value={durationType} 
                          onValueChange={(val: any) => setDurationType(val)}
                        >
                          <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent">
                            <SelectValue placeholder="Cycle" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="lifetime">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                      <Input
                        placeholder="Benefits summary..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included benefits (comma separated)</label>
                      <textarea
                        placeholder="feature 1, feature 2"
                        value={featuresStr}
                        onChange={(e) => setFeaturesStr(e.target.value)}
                        rows={3}
                        className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      {editingPlan && (
                        <Button
                          type="button"
                          onClick={handleCancelEdit}
                          variant="outline"
                          className="w-1/3 rounded-xl border-zinc-200 text-slate-600 font-semibold"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button 
                        type="submit" 
                        className={`rounded-xl font-bold ${editingPlan ? 'w-2/2 flex-1 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' : 'w-full bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'}`}
                        disabled={isPending}
                      >
                        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                        {editingPlan ? 'Save' : 'Create Plan'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Metrics List */}
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
                <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <CardTitle className="text-xs font-bold text-slate-450 uppercase tracking-widest">Active Plan Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {report?.planBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-450 italic">No subscribers yet.</p>
                  ) : (
                    report?.planBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.planName}</p>
                          <p className="text-[9px] font-semibold text-slate-400 capitalize">{item.durationType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">{item.count} Active</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">₹{parseFloat(item.totalRevenue).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right side configured plans and sub list */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Active Tiers list */}
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <CardTitle className="text-sm font-bold">Billing Packages</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {plans.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">No plans configured.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4 pl-6">Plan</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Price</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Billing Cycle</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Benefits</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4 text-center">Status</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((plan) => (
                          <TableRow key={plan.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/15 transition-colors">
                            <TableCell className="font-bold py-4 pl-6">
                              <div>
                                <p className="text-xs font-bold">{plan.name}</p>
                                {plan.description && <p className="text-[10px] text-slate-400 mt-0.5">{plan.description}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-xs">₹{parseFloat(plan.price).toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-slate-500 capitalize">{plan.durationType}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="flex flex-wrap gap-1">
                                {plan.features?.map((f, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[9px] font-bold px-1.5 py-0 rounded bg-zinc-50/50 text-slate-600">
                                    {f}
                                  </Badge>
                                )) || <span className="text-[10px] text-slate-400 italic">None</span>}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex justify-center items-center gap-2">
                                <span className="text-[10px] font-semibold text-slate-400">{plan.isActive ? 'Active' : 'Inactive'}</span>
                                <Switch
                                  checked={plan.isActive}
                                  onCheckedChange={() => handleTogglePlan(plan.id, plan.isActive)}
                                  disabled={isPending}
                                  className="scale-75"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 border-zinc-200 hover:bg-zinc-50"
                                  onClick={() => handleStartEdit(plan)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 border-red-100 text-red-500 hover:bg-red-50"
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Subscribed partner audit list */}
              <Card className="border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <CardTitle className="text-sm font-bold">Partner Sign-Ups</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {subscriptions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">No sign-ups found.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4 pl-6">Printer Hub</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Selected Plan</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Start Date</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Expiration</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Payment ID</TableHead>
                          <TableHead className="font-bold text-[10px] text-slate-400 uppercase py-4">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => (
                          <TableRow key={sub.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/15 transition-colors">
                            <TableCell className="font-bold py-4 pl-6">
                              <div>
                                <p className="text-xs font-bold">{sub.printer?.companyName || sub.printer?.name || 'Printer Hub'}</p>
                                <p className="text-[10px] text-slate-450 mt-0.5">{sub.printer?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <span className="text-xs font-bold">{sub.plan?.name}</span>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">₹{parseFloat(sub.plan?.price || '0').toFixed(2)}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 py-4 font-semibold">
                              {format(new Date(sub.startDate), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 py-4 font-semibold">
                              {sub.endDate ? (
                                format(new Date(sub.endDate), 'MMM d, yyyy')
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">Lifetime</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-slate-400 py-4">
                              {sub.paymentId || 'N/A'}
                            </TableCell>
                            <TableCell className="py-4">
                              {getStatusBadge(sub.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
