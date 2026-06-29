'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getRevenueReport, getContestReport, getOrdersReport, getVerificationReport, getUserReport, getAdminPayoutReport, getPaymentGatewayReport, getProfitReport } from '@/app/actions/report-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IndianRupee, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Loader2, BarChart3, Trophy, Package, ShieldCheck, Users, RefreshCw, CreditCard } from 'lucide-react';

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
  const [payoutData, setPayoutData] = useState<any>(null);
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);

  const [revStatus, setRevStatus] = useState('all');
  const [revMethod, setRevMethod] = useState('all');
  const [contestStatus, setContestStatus] = useState('all');
  const [orderStatus, setOrderStatus] = useState('all');
  const [verifStatus, setVerifStatus] = useState('all');
  const [payoutPrinter, setPayoutPrinter] = useState('all');
  const [payoutStatus, setPayoutStatus] = useState('all');
  const [gatewayProvider, setGatewayProvider] = useState('all');
  const [gatewayStatus, setGatewayStatus] = useState('all');
  const [onlyDiscrepancies, setOnlyDiscrepancies] = useState(false);

  const [profitOrderStatus, setProfitOrderStatus] = useState('all');
  const [profitPaymentStatus, setProfitPaymentStatus] = useState('all');
  const [profitSearchQuery, setProfitSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profitPage, setProfitPage] = useState(1);

  async function loadAll() {
    setLoading(true);
    try {
      const [r, c, o, v, u, p, g, pr] = await Promise.all([
        getRevenueReport({ startDate, endDate, orderStatus: revStatus, paymentMethod: revMethod }),
        getContestReport({ startDate, endDate, status: contestStatus }),
        getOrdersReport({ startDate, endDate, orderStatus }),
        getVerificationReport({ startDate, endDate, status: verifStatus }),
        getUserReport({ startDate, endDate }),
        getAdminPayoutReport({ startDate, endDate, printerId: payoutPrinter, payoutStatus }),
        getPaymentGatewayReport({ startDate, endDate, provider: gatewayProvider, status: gatewayStatus, onlyDiscrepancies }),
        getProfitReport({ startDate, endDate, orderStatus: profitOrderStatus, paymentStatus: profitPaymentStatus, searchQuery: profitSearchQuery, page: profitPage, limit: 20 }),
      ]);
      setRevData(r); setContestData(c); setOrdersData(o); setVerifData(v); setUserData(u); setPayoutData(p); setGatewayData(g); setProfitData(pr);
    } finally { setLoading(false); }
  }

  async function loadProfit() {
    setLoading(true);
    try {
      const data = await getProfitReport({
        startDate,
        endDate,
        orderStatus: profitOrderStatus,
        paymentStatus: profitPaymentStatus,
        searchQuery: profitSearchQuery,
        page: profitPage,
        limit: 20
      });
      setProfitData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Reload payouts specifically when filter changing
  useEffect(() => {
    if (payoutData !== null) {
      setLoading(true);
      getAdminPayoutReport({ startDate, endDate, printerId: payoutPrinter, payoutStatus }).then(data => {
        setPayoutData(data);
        setLoading(false);
      });
    }
  }, [payoutPrinter, payoutStatus]);

  // Reload gateway transactions specifically when filter changing
  useEffect(() => {
    if (gatewayData !== null) {
      setLoading(true);
      getPaymentGatewayReport({ startDate, endDate, provider: gatewayProvider, status: gatewayStatus, onlyDiscrepancies }).then(data => {
        setGatewayData(data);
        setLoading(false);
      });
    }
  }, [gatewayProvider, gatewayStatus, onlyDiscrepancies]);

  // Reload profit specifically when filter/page/search changing
  useEffect(() => {
    if (profitData !== null || activeTab === 'profit') {
      loadProfit();
    }
  }, [profitOrderStatus, profitPaymentStatus, profitPage, profitSearchQuery]);

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
          <TabsTrigger value="profit" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Profit Report</TabsTrigger>
          <TabsTrigger value="contests" className="gap-1.5"><Trophy className="w-3.5 h-3.5" />Contests</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><Package className="w-3.5 h-3.5" />Orders</TabsTrigger>
          <TabsTrigger value="verifications" className="gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Verifications</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5"><IndianRupee className="w-3.5 h-3.5" />Printer Payouts</TabsTrigger>
          <TabsTrigger value="gateway" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" />Payment Gateway</TabsTrigger>
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

              {Math.abs(revData.reconciliation.diff) >= 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Mismatched Orders */}
                  {revData.reconciliation.mismatchedOrders?.length > 0 && (
                    <Card className="border-rose-200/60 dark:border-rose-900/30 bg-rose-50/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-rose-800 dark:text-rose-400">
                          Mismatched Orders (Paid Status, No Success Txn)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {revData.reconciliation.mismatchedOrders.map((o: any) => (
                          <div key={o.id} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0 text-xs">
                            <div>
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Order #{o.id}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">({format(new Date(o.createdAt), 'dd MMM yyyy')})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-semibold text-[10px]">{o.paymentMethod || 'N/A'}</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{fmt(parseFloat(o.totalAmount))}</span>
                              <Badge className="bg-rose-500 hover:bg-rose-500 border-none text-white text-[8px] font-black uppercase tracking-wider py-0.5 px-1 rounded">No Txn</Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Mismatched Payments */}
                  {revData.reconciliation.mismatchedPayments?.length > 0 && (
                    <Card className="border-rose-200/60 dark:border-rose-900/30 bg-rose-50/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-rose-800 dark:text-rose-400">
                          Mismatched Payments (Captured Txn, Unpaid Orders)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {revData.reconciliation.mismatchedPayments.map((p: any) => (
                          <div key={p.id} className="flex flex-col py-2 border-b border-border/30 last:border-0 text-xs gap-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Txn #{p.id}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">({format(new Date(p.createdAt), 'dd MMM yyyy')})</span>
                              </div>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{fmt(p.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span>Provider: {p.provider} ({p.userName})</span>
                              {p.orders.length === 0 ? (
                                <Badge className="bg-rose-500 hover:bg-rose-500 border-none text-white text-[8px] font-black uppercase tracking-wider py-0 px-1 rounded">Unlinked</Badge>
                              ) : (
                                <div className="flex gap-1.5 items-center">
                                  {p.orders.map((o: any) => (
                                    <span key={o.id} className="font-semibold text-rose-600">Order #{o.id} ({o.paymentStatus})</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
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

        {/* ── PRINTER PAYOUTS TAB ── */}
        <TabsContent value="payouts" className="space-y-6 mt-4">
          <div className="flex flex-wrap gap-3">
            <Select value={payoutPrinter} onValueChange={(val) => { setPayoutPrinter(val); }}>
              <SelectTrigger className="h-9 w-48"><SelectValue placeholder="All Printers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Printers</SelectItem>
                {payoutData?.printers?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.companyName || p.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={payoutStatus} onValueChange={(val) => { setPayoutStatus(val); }}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Payout Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payouts</SelectItem>
                <SelectItem value="fully_paid">Fully Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadAll} variant="outline" size="sm" className="h-9 font-bold text-xs uppercase">Apply Filters</Button>
          </div>

          {loading || !payoutData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Payouts Committed" value={`₹${fmt(payoutData.summary.totalCommitted)}`} sub={`${fmtN(payoutData.summary.count)} print jobs`} icon={<IndianRupee className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-950" />
                <StatCard title="Total Cleared (Paid)" value={`₹${fmt(payoutData.summary.totalCleared)}`} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Outstanding Balance" value={`₹${fmt(payoutData.summary.totalPending)}`} icon={<AlertCircle className="w-5 h-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-950" />
                <StatCard title="Settlement Rate" value={`${payoutData.summary.totalCommitted > 0 ? Math.round((payoutData.summary.totalCleared / payoutData.summary.totalCommitted) * 100) : 0}%`} icon={<BarChart3 className="w-5 h-5 text-violet-600" />} color="bg-violet-100 dark:bg-violet-950" />
              </div>

              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">Printer Payout Ledger</CardTitle></CardHeader>
                <CardContent>
                  {payoutData.orders.length === 0 ? (
                    <p className="text-center py-8 text-sm font-semibold text-muted-foreground">No payout records found matching filters.</p>
                  ) : (
                    <div className="space-y-4">
                      {payoutData.orders.map((o: any) => (
                        <div key={o.id} className="p-4 bg-slate-50/50 dark:bg-zinc-800/10 border border-slate-200/60 dark:border-zinc-850 rounded-xl space-y-3">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">Order #{o.id}</span>
                              <span className="text-[10px] text-muted-foreground font-bold">({format(new Date(o.createdAt), 'dd MMM yyyy')})</span>
                              <Badge className="font-extrabold text-[8px] uppercase tracking-wider">{o.orderStatus}</Badge>
                            </div>
                            
                            {/* Payout status badge */}
                            {o.status === 'fully_paid' ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm shadow-emerald-500/10">Fully Paid</Badge>
                            ) : o.status === 'partially_paid' ? (
                              <Badge className="bg-amber-500 hover:bg-amber-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm shadow-amber-500/10">Part Paid</Badge>
                            ) : (
                              <Badge className="bg-slate-400 hover:bg-slate-400 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">Unpaid</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                            <div>
                              <span className="text-[9px] text-slate-405 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Product Name</span>
                              <span className="text-slate-800 dark:text-slate-200">{o.productName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-405 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Printer Partner</span>
                              <span className="text-slate-800 dark:text-slate-200">{o.printerName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-405 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Total Committed Payout</span>
                              <span className="font-mono text-slate-900 dark:text-white font-extrabold">₹{fmt(o.printingAmount)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-405 dark:text-zinc-550 block mb-0.5 uppercase tracking-wider">Outstanding Balance</span>
                              <span className={`font-mono font-extrabold ${o.remaining > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-450'}`}>₹{fmt(o.remaining)}</span>
                            </div>
                          </div>

                          {/* Installment payments logs timeline */}
                          {o.payments.length > 0 && (
                            <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
                              <span className="text-[8px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Payment Installments Timeline</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {o.payments.map((p: any, pIdx: number) => (
                                  <div key={p.id || pIdx} className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-lg text-[10px] space-y-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-center font-extrabold">
                                      <span className="text-slate-800 dark:text-slate-200">₹{fmt(parseFloat(p.amount))}</span>
                                      <span className="text-[8px] text-slate-400 font-bold">{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                                    </div>
                                    {p.referenceNumber && (
                                      <p className="text-[8px] font-mono text-slate-400 truncate">Ref: {p.referenceNumber}</p>
                                    )}
                                    {p.notes && (
                                      <p className="text-[8px] text-slate-505 italic truncate" title={p.notes}>"{p.notes}"</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── PAYMENT GATEWAY RECONCILIATION TAB ── */}
        <TabsContent value="gateway" className="space-y-6 mt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={gatewayProvider} onValueChange={setGatewayProvider}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="All Gateways" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="dummy">Dummy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gatewayStatus} onValueChange={setGatewayStatus}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Gateway Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="authorized">Authorized</SelectItem>
                <SelectItem value="captured">Captured (Success)</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border px-3 h-9 rounded-xl text-xs font-semibold">
              <input 
                type="checkbox" 
                id="onlyDiscrepancies" 
                checked={onlyDiscrepancies} 
                onChange={(e) => setOnlyDiscrepancies(e.target.checked)} 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <label htmlFor="onlyDiscrepancies" className="cursor-pointer select-none text-muted-foreground">Show Mismatches Only</label>
            </div>

            <Button onClick={loadAll} variant="outline" size="sm" className="h-9 font-bold text-xs uppercase">Apply Filters</Button>
          </div>

          {loading || !gatewayData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              {/* Gateway summary statistics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Initiated" value={fmtN(gatewayData.summary.totalCount)} sub="Gateway requests" icon={<CreditCard className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-950" />
                <StatCard title="Captured Volume" value={`₹${fmt(gatewayData.summary.capturedVolume)}`} sub={`${fmtN(gatewayData.summary.capturedCount)} successful payments`} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950" />
                <StatCard title="Failed / Refunded" value={`₹${fmt(gatewayData.summary.failedVolume + gatewayData.summary.refundedVolume)}`} sub={`${fmtN(gatewayData.summary.failedCount + gatewayData.summary.refundedCount)} transactions`} icon={<TrendingDown className="w-5 h-5 text-rose-600" />} color="bg-rose-100 dark:bg-rose-950" />
                <StatCard title="Gateway Success Rate" value={`${gatewayData.summary.successRate}%`} sub={`Based on captured status`} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-950" />
              </div>

              {/* Actionable discrepancy warnings panel */}
              {gatewayData.summary.discrepancyCount > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span>Reconciliation Notice: {gatewayData.summary.discrepancyCount} Payment Mismatches Found</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-400">
                    Mismatches have been detected where gateway transaction records do not align with store order statuses or payment amounts. Please check the highlighted rows below.
                  </p>
                </div>
              )}

              {/* Transactions Ledger */}
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest">Gateway Reconciliation Ledger</CardTitle></CardHeader>
                <CardContent>
                  {gatewayData.payments.length === 0 ? (
                    <p className="text-center py-8 text-sm font-semibold text-muted-foreground">No transaction records found matching filters.</p>
                  ) : (
                    <div className="space-y-4">
                      {gatewayData.payments.map((p: any) => (
                        <div key={p.id} className={`p-4 border rounded-xl space-y-3 ${p.discrepancy.hasDiscrepancy ? 'border-rose-300 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/5' : 'bg-slate-50/50 dark:bg-zinc-800/10 border-slate-200/60 dark:border-zinc-850'}`}>
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">Txn #{p.id}</span>
                              <span className="text-[10px] text-muted-foreground font-bold">({format(new Date(p.createdAt), 'dd MMM yyyy HH:mm')})</span>
                              <Badge className="font-black text-[9px] uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-none">{p.provider}</Badge>
                              {p.providerPaymentId && <span className="font-mono text-[9px] text-muted-foreground">ID: {p.providerPaymentId}</span>}
                              {p.contestId && <Badge variant="outline" className="text-[8px] border-amber-300 text-amber-600">Contest Prepay #{p.contestId}</Badge>}
                            </div>

                            <div className="flex gap-2">
                              {/* Gateway status badge */}
                              {p.status === 'captured' ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">Captured</Badge>
                              ) : p.status === 'failed' ? (
                                <Badge className="bg-rose-500 hover:bg-rose-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">Failed</Badge>
                              ) : p.status === 'refunded' ? (
                                <Badge className="bg-amber-500 hover:bg-amber-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">Refunded</Badge>
                              ) : (
                                <Badge className="bg-slate-400 hover:bg-slate-400 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">{p.status}</Badge>
                              )}

                              {/* Discrepancy badge */}
                              {p.discrepancy.hasDiscrepancy && (
                                <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg animate-pulse">Mismatch</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                            <div>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Customer Details</span>
                              <span className="text-slate-850 dark:text-slate-200 block truncate font-bold" title={`${p.userName} (${p.userEmail})`}>{p.userName}</span>
                              <span className="text-[9px] text-muted-foreground block truncate">{p.userEmail}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Payment Gateway Record</span>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-slate-900 dark:text-white font-extrabold">₹{fmt(p.amount)}</span>
                                  {p.status === 'captured' ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded">Captured</Badge>
                                  ) : p.status === 'failed' ? (
                                    <Badge className="bg-rose-500 hover:bg-rose-500 border-none text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded">Failed</Badge>
                                  ) : p.status === 'refunded' ? (
                                    <Badge className="bg-amber-500 hover:bg-amber-500 border-none text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded">Refunded</Badge>
                                  ) : (
                                    <Badge className="bg-slate-400 hover:bg-slate-400 border-none text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded">{p.status}</Badge>
                                  )}
                                </div>
                                <p className="text-[9px] font-mono text-muted-foreground truncate" title={p.providerPaymentId || 'N/A'}>ID: {p.providerPaymentId || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Store Order Record</span>
                              {p.orders.length === 0 ? (
                                <span className="text-muted-foreground italic text-[10px]">{p.contestId ? `Contest Prepayment` : 'No linked order'}</span>
                              ) : (
                                <div className="space-y-1">
                                  {p.orders.map((o: any) => (
                                    <div key={o.id} className="flex flex-col gap-0.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">Order #{o.id}</span>
                                        <Badge variant="outline" className={`text-[8px] font-extrabold uppercase px-1 py-0 ${o.paymentStatus === 'paid' ? 'border-emerald-300 text-emerald-600' : 'border-rose-350 text-rose-600'}`}>{o.paymentStatus}</Badge>
                                      </div>
                                      <span className="text-[9px] text-muted-foreground font-semibold">Value: ₹{fmt(o.totalAmount)} ({o.orderStatus})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mb-0.5 uppercase tracking-wider">Reconciliation Status</span>
                              {p.discrepancy.hasDiscrepancy ? (
                                <div className="flex flex-col gap-1">
                                  <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 w-fit rounded">Mismatch</Badge>
                                  <span className="text-[8px] text-rose-600 font-extrabold">Audit Mismatch Found</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 w-fit rounded">Reconciled</Badge>
                                  <span className="text-[8px] text-emerald-600 dark:text-emerald-450 font-extrabold">Status & Amount Match</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Discrepancy reason description callout */}
                          {p.discrepancy.hasDiscrepancy && (
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg text-[10px] text-rose-800 dark:text-rose-300 space-y-1 font-bold">
                              {p.discrepancy.isOrphan && <p>• Unlinked Payment: Successful transaction is not associated with any store order or contest setup.</p>}
                              {p.discrepancy.statusMismatch && <p>• Status Mismatch: Gateway status is '{p.status}' but linked store order paymentStatus is not aligned.</p>}
                              {p.discrepancy.amountMismatch && <p>• Amount Mismatch: Gateway transaction amount (₹{fmt(p.amount)}) does not equal total sum of linked orders.</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── PROFIT REPORT TAB ── */}
        <TabsContent value="profit" className="space-y-6 mt-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search order ID, user, product..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 w-60 text-xs"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setProfitSearchQuery(searchTerm);
                    setProfitPage(1);
                  }
                }}
              />
              <Button 
                onClick={() => {
                  setProfitSearchQuery(searchTerm);
                  setProfitPage(1);
                }} 
                variant="outline" 
                size="sm"
                className="h-9 font-bold text-xs uppercase"
              >
                Search
              </Button>
            </div>

            {/* Order Status */}
            <Select value={profitOrderStatus} onValueChange={(val) => { setProfitOrderStatus(val); setProfitPage(1); }}>
              <SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder="Order Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Statuses</SelectItem>
                {['pending','confirmed','quality_check','processing','under_verification','ready_to_ship','shipped','delivered','cancelled','refunded'].map(s => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status */}
            <Select value={profitPaymentStatus} onValueChange={(val) => { setProfitPaymentStatus(val); setProfitPage(1); }}>
              <SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder="Payment Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            {searchTerm !== profitSearchQuery && (
              <span className="text-[10px] text-amber-500 font-black animate-pulse">Unapplied search term</span>
            )}
          </div>

          {loading || !profitData ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Revenue" 
                  value={`₹${fmt(profitData.summary.totalRevenue)}`} 
                  sub="Sum of order amounts" 
                  icon={<IndianRupee className="w-5 h-5 text-emerald-600" />} 
                  color="bg-emerald-100 dark:bg-emerald-950" 
                />
                <StatCard 
                  title="Total Spendings" 
                  value={`₹${fmt(profitData.summary.totalSpendings)}`} 
                  sub={`Print: ₹${fmt(profitData.summary.totalPrintingCost)} | Verif: ₹${fmt(profitData.summary.totalVerificationCost)}`} 
                  icon={<TrendingDown className="w-5 h-5 text-rose-600" />} 
                  color="bg-rose-100 dark:bg-rose-950" 
                />
                <StatCard 
                  title="Net Profit" 
                  value={`₹${fmt(profitData.summary.totalProfit)}`} 
                  sub={`Contests: ₹${fmt(profitData.summary.totalContestCost)} | Direct: ₹${fmt(profitData.summary.totalDirectSellingCost)}`} 
                  icon={<TrendingUp className={`w-5 h-5 ${profitData.summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />} 
                  color={profitData.summary.totalProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-rose-100 dark:bg-rose-950'} 
                />
                <StatCard 
                  title="Avg Profit Margin" 
                  value={`${profitData.summary.profitMargin.toFixed(1)}%`} 
                  sub="Net Profit / Revenue" 
                  icon={<BarChart3 className="w-5 h-5 text-violet-600" />} 
                  color="bg-violet-100 dark:bg-violet-950" 
                />
              </div>

              {/* Profit Ledger Table */}
              <Card className="border-border/40">
                <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Order Profitability Ledger</CardTitle>
                  <span className="text-xs text-muted-foreground font-semibold">Showing {profitData.orders.length} of {profitData.pagination.totalCount} orders</span>
                </CardHeader>
                <CardContent>
                  {profitData.orders.length === 0 ? (
                    <p className="text-center py-8 text-sm font-semibold text-muted-foreground">No orders found matching filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <th className="pb-3 pl-2">Order</th>
                            <th className="pb-3">Customer</th>
                            <th className="pb-3">Product</th>
                            <th className="pb-3 text-right">Revenue</th>
                            <th className="pb-3 text-center">Cost Deductions</th>
                            <th className="pb-3 text-right">Total Cost</th>
                            <th className="pb-3 text-right">Profit</th>
                            <th className="pb-3 text-right pr-2">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-xs font-semibold">
                          {profitData.orders.map((o: any) => {
                            const isProfit = o.profit >= 0;
                            return (
                              <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10">
                                <td className="py-3 pl-2 font-mono font-black text-indigo-600 dark:text-indigo-400">
                                  #{o.id}
                                  <div className="text-[9px] text-muted-foreground font-normal font-sans">
                                    {format(new Date(o.createdAt), 'dd MMM yy')}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={o.customerName}>
                                    {o.customerName}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground font-normal truncate max-w-[150px]" title={o.customerEmail}>
                                    {o.customerEmail}
                                  </div>
                                </td>
                                <td className="py-3 truncate max-w-[150px]" title={`${o.productName} (x${o.quantity})`}>
                                  <span className="text-slate-800 dark:text-slate-200">{o.productName}</span>
                                  <Badge variant="outline" className="ml-1 text-[8px] py-0 px-1 font-bold">x{o.quantity}</Badge>
                                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                                    <Badge className={`text-[8px] px-1 py-0 border-none font-bold capitalize ${o.orderStatus === 'delivered' ? 'bg-emerald-500 text-white' : o.orderStatus === 'cancelled' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200'}`}>
                                      {o.orderStatus}
                                    </Badge>
                                    <Badge variant="outline" className={`text-[8px] px-1 py-0 font-bold uppercase ${o.paymentStatus === 'paid' ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600'}`}>
                                      {o.paymentStatus}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                                  ₹{fmt(o.revenue)}
                                </td>
                                <td className="py-3">
                                  <div className="flex justify-center flex-wrap gap-1 text-[9px]">
                                    {o.printingCost > 0 && (
                                      <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal">
                                        Print: ₹{fmt(o.printingCost)}
                                      </Badge>
                                    )}
                                    {o.verificationCost > 0 && (
                                      <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200">
                                        Verif: ₹{fmt(o.verificationCost)}
                                      </Badge>
                                    )}
                                    {o.contestCost > 0 && (
                                      <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal bg-violet-50 dark:bg-violet-950/20 text-violet-600 border-violet-200">
                                        Contest: ₹{fmt(o.contestCost)}
                                      </Badge>
                                    )}
                                    {o.directSellingCost > 0 && (
                                      <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-200">
                                        Direct Cost: ₹{fmt(o.directSellingCost)}
                                      </Badge>
                                    )}
                                    {o.printingCost === 0 && o.verificationCost === 0 && o.contestCost === 0 && o.directSellingCost === 0 && (
                                      <span className="text-muted-foreground italic text-[10px]">No spendings</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 text-right font-mono font-bold text-muted-foreground">
                                  ₹{fmt(o.totalSpendings)}
                                </td>
                                <td className={`py-3 text-right font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                                  {isProfit ? '+' : ''}₹{fmt(o.profit)}
                                </td>
                                <td className={`py-3 text-right pr-2 font-black ${isProfit ? 'text-emerald-600 animate-pulse' : 'text-rose-600'}`}>
                                  {o.margin.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {profitData.pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProfitPage(p => Math.max(1, p - 1))}
                        disabled={profitPage === 1 || loading}
                      >
                        Previous
                      </Button>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Page {profitPage} of {profitData.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProfitPage(p => Math.min(profitData.pagination.totalPages, p + 1))}
                        disabled={profitPage === profitData.pagination.totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
