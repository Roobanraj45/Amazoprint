'use client';
import { useState, useEffect } from 'react';
import { getRevenueReport } from '@/app/actions/report-actions';
import { getContestReport } from '@/app/actions/report-actions';
import { getOrdersReport } from '@/app/actions/report-actions';
import { getVerificationReport } from '@/app/actions/report-actions';
import { getUserReport } from '@/app/actions/report-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IndianRupee, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Loader2, BarChart3, Trophy, Package, ShieldCheck, Users, RefreshCw } from 'lucide-react';

function fmt(n: number) { return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtN(n: number) { return n.toLocaleString('en-IN'); }

function StatCard({ title, value, sub, icon, color }: { title: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/40">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReconcBanner({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'}`}>
      {ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

function Breakdown({ rows, keyLabel, countLabel, amountLabel }: { rows: any[]; keyLabel: string; countLabel?: string; amountLabel?: string }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
          <Badge variant="outline" className="capitalize">{r[keyLabel] || 'N/A'}</Badge>
          <div className="flex items-center gap-4 text-sm">
            {countLabel && <span className="text-muted-foreground">{fmtN(Number(r[countLabel]))} orders</span>}
            {amountLabel && <span className="font-bold flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{fmt(Number(r[amountLabel]))}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('revenue');

  const [revData, setRevData] = useState<any>(null);
  const [contestData, setContestData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [verifData, setVerifData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  const [revStatus, setRevStatus] = useState('all');
  const [revMethod, setRevMethod] = useState('all');
  const [contestStatus, setContestStatus] = useState('all');
  const [orderStatus, setOrderStatus] = useState('all');
  const [verifStatus, setVerifStatus] = useState('all');

  async function loadAll() {
    setLoading(true);
    try {
      const [r, c, o, v, u] = await Promise.all([
        getRevenueReport({ startDate, endDate, orderStatus: revStatus, paymentMethod: revMethod }),
        getContestReport({ startDate, endDate, status: contestStatus }),
        getOrdersReport({ startDate, endDate, orderStatus }),
        getVerificationReport({ startDate, endDate, status: verifStatus }),
        getUserReport({ startDate, endDate }),
      ]);
      setRevData(r); setContestData(c); setOrdersData(o); setVerifData(v); setUserData(u);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Reports & Reconciliation</h1>
          <p className="text-muted-foreground text-sm mt-1">All numbers are cross-linked — reconciliation is built-in.</p>
        </div>
        <Button onClick={loadAll} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Global Date Filter */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">From Date</Label>
              <Input type="date" className="h-9 w-40" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">To Date</Label>
              <Input type="date" className="h-9 w-40" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={loadAll} disabled={loading} variant="outline" size="sm">Apply Filters</Button>
            <Button onClick={() => { setStartDate(''); setEndDate(''); }} variant="ghost" size="sm">Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-background border w-full justify-start gap-1 flex-wrap h-auto p-1">
          <TabsTrigger value="revenue" className="gap-1.5"><IndianRupee className="w-3.5 h-3.5" />Revenue</TabsTrigger>
          <TabsTrigger value="contests" className="gap-1.5"><Trophy className="w-3.5 h-3.5" />Contests</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><Package className="w-3.5 h-3.5" />Orders</TabsTrigger>
          <TabsTrigger value="verifications" className="gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Verifications</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
        </TabsList>

        {/* ── REVENUE TAB ── */}
        <TabsContent value="revenue" className="space-y-6 mt-4">
          <div className="flex flex-wrap gap-3">
            <Select value={revStatus} onValueChange={setRevStatus}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Order Status" /></SelectTrigger>
              <SelectContent>
                {['all','pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={revMethod} onValueChange={setRevMethod}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Payment Method" /></SelectTrigger>
              <SelectContent>
                {['all','razorpay','Contest Prepaid','cash'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Methods' : s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {loading || !revData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Order Revenue" value={`₹${fmt(revData.totalOrderRevenue.total)}`} sub={`${fmtN(revData.totalOrderRevenue.count)} paid orders`} icon={<IndianRupee className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Payments Captured" value={`₹${fmt(revData.capturedPayments.total)}`} sub={`${fmtN(revData.capturedPayments.count)} transactions`} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-950" />
                <StatCard title="Contest Revenue" value={`₹${fmt(revData.contestPayments.total)}`} sub={`${fmtN(revData.contestPayments.count)} contest payments`} icon={<Trophy className="w-5 h-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-950" />
                <StatCard title="Refunded / Failed" value={`₹${fmt(revData.refundedPayments.total + revData.failedPayments.total)}`} sub={`${fmtN(revData.refundedPayments.count + revData.failedPayments.count)} transactions`} icon={<TrendingDown className="w-5 h-5 text-rose-600" />} color="bg-rose-100 dark:bg-rose-950" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">Orders by Status</CardTitle></CardHeader>
                  <CardContent><Breakdown rows={revData.orderStatusBreakdown} keyLabel="status" countLabel="count" amountLabel="total" /></CardContent>
                </Card>
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">By Payment Method</CardTitle></CardHeader>
                  <CardContent><Breakdown rows={revData.paymentMethodBreakdown} keyLabel="method" countLabel="count" amountLabel="total" /></CardContent>
                </Card>
              </div>
              <ReconcBanner
                ok={Math.abs(revData.reconciliation.diff) < 1}
                message={Math.abs(revData.reconciliation.diff) < 1
                  ? `✓ Reconciled — Order Revenue (₹${fmt(revData.reconciliation.orderRevenue)}) matches Payments Captured (₹${fmt(revData.reconciliation.paymentsCollected)})`
                  : `⚠ Gap of ₹${fmt(Math.abs(revData.reconciliation.diff))} between order revenue and captured payments — review pending/failed transactions.`}
              />
            </>
          )}
        </TabsContent>

        {/* ── CONTESTS TAB ── */}
        <TabsContent value="contests" className="space-y-6 mt-4">
          <Select value={contestStatus} onValueChange={setContestStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {['all','active','completed','cancelled'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
            </SelectContent>
          </Select>
          {loading || !contestData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Contests" value={fmtN(contestData.totalContests)} sub="All time" icon={<Trophy className="w-5 h-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-950" />
                <StatCard title="Total Participants" value={fmtN(contestData.totalParticipants)} sub={`${fmtN(contestData.uniqueFreelancers)} unique freelancers`} icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-950" />
                <StatCard title="Prize Awarded" value={`₹${fmt(contestData.prizeAwarded.total)}`} sub={`${fmtN(contestData.prizeAwarded.count)} winners`} icon={<IndianRupee className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Payments Collected" value={`₹${fmt(contestData.paymentsCollected.total)}`} sub={`${fmtN(contestData.paymentsCollected.count)} transactions`} icon={<BarChart3 className="w-5 h-5 text-violet-600" />} color="bg-violet-100 dark:bg-violet-950" />
              </div>
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">Contests by Status</CardTitle></CardHeader>
                <CardContent><Breakdown rows={contestData.statusBreakdown} keyLabel="status" countLabel="count" amountLabel="totalPrize" /></CardContent>
              </Card>
              <ReconcBanner
                ok={contestData.reconciliation.platformNet >= 0}
                message={contestData.reconciliation.platformNet >= 0
                  ? `✓ Platform Net: ₹${fmt(contestData.reconciliation.platformNet)} (Collected ₹${fmt(contestData.reconciliation.paymentsCollected)} − Awarded ₹${fmt(contestData.reconciliation.prizeAwarded)})`
                  : `⚠ Prize awarded (₹${fmt(contestData.reconciliation.prizeAwarded)}) exceeds payments collected (₹${fmt(contestData.reconciliation.paymentsCollected)}). Review contest payouts.`}
              />
            </>
          )}
        </TabsContent>

        {/* ── ORDERS TAB ── */}
        <TabsContent value="orders" className="space-y-6 mt-4">
          <Select value={orderStatus} onValueChange={setOrderStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {['all','pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
            </SelectContent>
          </Select>
          {loading || !ordersData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Orders" value={fmtN(ordersData.totals.count)} icon={<Package className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-950" />
                <StatCard title="Total Revenue" value={`₹${fmt(ordersData.totals.total)}`} icon={<IndianRupee className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Regular Orders" value={fmtN(ordersData.regularOrders.count)} sub={`₹${fmt(ordersData.regularOrders.total)}`} icon={<Package className="w-5 h-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-950" />
                <StatCard title="Contest Orders" value={fmtN(ordersData.contestOrders.count)} sub={`₹${fmt(ordersData.contestOrders.total)}`} icon={<Trophy className="w-5 h-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-950" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">By Order Status</CardTitle></CardHeader>
                  <CardContent><Breakdown rows={ordersData.statusBreakdown} keyLabel="status" countLabel="count" amountLabel="total" /></CardContent>
                </Card>
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">By Payment Status</CardTitle></CardHeader>
                  <CardContent><Breakdown rows={ordersData.paymentStatusBreakdown} keyLabel="status" countLabel="count" amountLabel="total" /></CardContent>
                </Card>
              </div>
              <ReconcBanner
                ok={ordersData.reconciliation.isBalanced && ordersData.reconciliation.totalOrders === ordersData.reconciliation.regularPlusContest}
                message={ordersData.reconciliation.isBalanced && ordersData.reconciliation.totalOrders === ordersData.reconciliation.regularPlusContest
                  ? `✓ Reconciled — Total Orders (${fmtN(ordersData.reconciliation.totalOrders)}) = Status Sum (${fmtN(ordersData.reconciliation.statusSum)}) = Regular (${fmtN(ordersData.regularOrders.count)}) + Contest (${fmtN(ordersData.contestOrders.count)})`
                  : `⚠ Order count mismatch detected — Total: ${fmtN(ordersData.reconciliation.totalOrders)}, Status Sum: ${fmtN(ordersData.reconciliation.statusSum)}, Regular+Contest: ${fmtN(ordersData.reconciliation.regularPlusContest)}`}
              />
            </>
          )}
        </TabsContent>

        {/* ── VERIFICATIONS TAB ── */}
        <TabsContent value="verifications" className="space-y-6 mt-4">
          <Select value={verifStatus} onValueChange={setVerifStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {['all','pending','assigned','completed','cancelled'].map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
            </SelectContent>
          </Select>
          {loading || !verifData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Verifications" value={fmtN(verifData.totals.count)} icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-950" />
                <StatCard title="Completed" value={fmtN(verifData.completed.count)} sub={`₹${fmt(verifData.completed.totalFees)} in fees`} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Pending / Assigned" value={fmtN(verifData.pending + verifData.assigned)} icon={<Loader2 className="w-5 h-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-950" />
                <StatCard title="Cancelled" value={fmtN(verifData.cancelled)} icon={<AlertCircle className="w-5 h-5 text-rose-600" />} color="bg-rose-100 dark:bg-rose-950" />
              </div>
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">By Status</CardTitle></CardHeader>
                <CardContent><Breakdown rows={verifData.statusBreakdown} keyLabel="status" countLabel="count" amountLabel="totalFees" /></CardContent>
              </Card>
              <ReconcBanner
                ok={verifData.reconciliation.isBalanced}
                message={verifData.reconciliation.isBalanced
                  ? `✓ Reconciled — Total (${fmtN(verifData.reconciliation.totalCount)}) = Pending + Assigned + Completed + Cancelled (${fmtN(verifData.reconciliation.statusSum)}). Fees from completed: ₹${fmt(verifData.reconciliation.feesFromCompleted)}`
                  : `⚠ Count mismatch — Total: ${fmtN(verifData.reconciliation.totalCount)}, Status Sum: ${fmtN(verifData.reconciliation.statusSum)}`}
              />
            </>
          )}
        </TabsContent>

        {/* ── USERS TAB ── */}
        <TabsContent value="users" className="space-y-6 mt-4">
          {loading || !userData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Clients" value={fmtN(userData.totalClients)} sub={`${fmtN(userData.activeClients)} active`} icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-950" />
                <StatCard title="Total Freelancers" value={fmtN(userData.totalFreelancers)} sub={`${fmtN(userData.activeFreelancers)} active`} icon={<Users className="w-5 h-5 text-violet-600" />} color="bg-violet-100 dark:bg-violet-950" />
                <StatCard title="New This Month" value={fmtN(userData.newClientsThisMonth + userData.newFreelancersThisMonth)} sub={`${fmtN(userData.newClientsThisMonth)} clients, ${fmtN(userData.newFreelancersThisMonth)} freelancers`} icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Contest Freelancers" value={fmtN(userData.participatingFreelancers)} sub={`${fmtN(userData.winningFreelancers)} have won`} icon={<Trophy className="w-5 h-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-950" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/40 md:col-span-2">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">Platform Overview</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Total Registered Users', value: userData.reconciliation.totalUsers },
                      { label: 'Active Users', value: userData.reconciliation.activeUsers },
                      { label: 'Inactive Users', value: userData.reconciliation.inactiveUsers },
                      { label: 'Freelancers Who Participated in Contests', value: userData.participatingFreelancers },
                      { label: 'Freelancers Who Have Won Contests', value: userData.winningFreelancers },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{r.label}</span>
                        <span className="font-black text-lg">{fmtN(r.value)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border/40">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">Engagement Rate</CardTitle></CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {[
                      { label: 'Contest Participation', rate: userData.totalFreelancers > 0 ? Math.round((userData.participatingFreelancers / userData.totalFreelancers) * 100) : 0, color: 'bg-violet-500' },
                      { label: 'Win Rate (of participants)', rate: userData.participatingFreelancers > 0 ? Math.round((userData.winningFreelancers / userData.participatingFreelancers) * 100) : 0, color: 'bg-amber-500' },
                      { label: 'Active Rate (all users)', rate: userData.reconciliation.totalUsers > 0 ? Math.round((userData.reconciliation.activeUsers / userData.reconciliation.totalUsers) * 100) : 0, color: 'bg-emerald-500' },
                    ].map((r, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold"><span>{r.label}</span><span>{r.rate}%</span></div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.rate}%` }} /></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <ReconcBanner
                ok={userData.reconciliation.totalUsers === userData.totalClients + userData.totalFreelancers}
                message={`✓ Total Users (${fmtN(userData.reconciliation.totalUsers)}) = Clients (${fmtN(userData.totalClients)}) + Freelancers (${fmtN(userData.totalFreelancers)}). Active: ${fmtN(userData.reconciliation.activeUsers)}, Inactive: ${fmtN(userData.reconciliation.inactiveUsers)}`}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
