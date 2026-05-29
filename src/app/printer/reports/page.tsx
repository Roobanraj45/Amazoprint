'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getPrinterPayoutReport } from '@/app/actions/report-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, CheckCircle2, AlertCircle, Loader2, BarChart3, RefreshCw, Calendar } from 'lucide-react';

function fmt(n: number) { return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtN(n: number) { return n.toLocaleString('en-IN'); }

function StatCard({ title, value, sub, icon, color }: { title: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/40 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
            <p className="text-2xl font-black mt-1 tracking-tight">{value}</p>
            {sub && <p className="text-[10px] font-bold text-muted-foreground mt-1.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PrinterReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payoutStatus, setPayoutStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [payoutData, setPayoutData] = useState<any>(null);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await getPrinterPayoutReport({ startDate, endDate, payoutStatus });
      setPayoutData(data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [payoutStatus]);

  return (
    <div className="space-y-6 px-6 py-6 lg:px-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Payouts & Settlement Report
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Track your earnings, advance payments, cleared installments, and outstanding balances.
          </p>
        </div>
        <Button onClick={loadReport} disabled={loading} size="sm" className="gap-2 h-9 rounded-xl font-bold text-xs uppercase tracking-wider">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Interactive Filters Panel */}
      <Card className="border-border/40 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">From Date</Label>
              <div className="relative">
                <Input type="date" className="h-9 w-40 pl-3 pr-2 text-xs font-semibold rounded-xl bg-background/50 border-border/50" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">To Date</Label>
              <div className="relative">
                <Input type="date" className="h-9 w-40 pl-3 pr-2 text-xs font-semibold rounded-xl bg-background/50 border-border/50" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Payout Status</Label>
              <Select value={payoutStatus} onValueChange={setPayoutStatus}>
                <SelectTrigger className="h-9 w-40 text-xs font-semibold rounded-xl bg-background/50 border-border/50"><SelectValue placeholder="All Payouts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">All Payouts</SelectItem>
                  <SelectItem value="fully_paid" className="text-xs font-semibold">Fully Paid</SelectItem>
                  <SelectItem value="partially_paid" className="text-xs font-semibold">Partially Paid</SelectItem>
                  <SelectItem value="unpaid" className="text-xs font-semibold">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadReport} disabled={loading} variant="outline" size="sm" className="h-9 font-bold text-xs uppercase tracking-wider rounded-xl border-border/50 hover:bg-muted">Apply Filters</Button>
              <Button onClick={() => { setStartDate(''); setEndDate(''); }} variant="ghost" size="sm" className="h-9 font-bold text-xs uppercase tracking-wider rounded-xl">Clear Dates</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading || !payoutData ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Assembling report ledger...</p>
        </div>
      ) : (
        <>
          {/* Summary Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Contract Value" 
              value={`₹${fmt(payoutData.summary.totalCommitted)}`} 
              sub={`${fmtN(payoutData.summary.count)} active jobs`} 
              icon={<IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} 
              color="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30" 
            />
            <StatCard 
              title="Total Settled" 
              value={`₹${fmt(payoutData.summary.totalCleared)}`} 
              sub="Paid installments"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} 
              color="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30" 
            />
            <StatCard 
              title="Outstanding Balance" 
              value={`₹${fmt(payoutData.summary.totalPending)}`} 
              sub="Remaining pending"
              icon={<AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-450" />} 
              color="bg-amber-50 dark:bg-amber-955/40 border border-amber-100/50 dark:border-amber-900/30" 
            />
            <StatCard 
              title="Settlement Ratio" 
              value={`${payoutData.summary.totalCommitted > 0 ? Math.round((payoutData.summary.totalCleared / payoutData.summary.totalCommitted) * 100) : 0}%`} 
              sub="Contract completion rate"
              icon={<BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />} 
              color="bg-violet-50 dark:bg-violet-950/40 border border-violet-100/50 dark:border-violet-900/30" 
            />
          </div>

          {/* Detailed Ledger List */}
          <Card className="border-border/40 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
                Detailed Payout Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {payoutData.orders.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Calendar className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs font-bold text-muted-foreground">No payout records found matching active filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payoutData.orders.map((o: any) => (
                    <div key={o.id} className="p-4 bg-slate-50/50 dark:bg-zinc-800/10 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl space-y-3 transition-colors hover:bg-slate-100/30 dark:hover:bg-zinc-800/20">
                      
                      {/* Order Title & Status Badges */}
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">Order #{o.id}</span>
                          <span className="text-[10px] text-muted-foreground font-bold">({format(new Date(o.createdAt), 'dd MMM yyyy')})</span>
                          <Badge className="font-extrabold text-[8px] uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-none">{o.orderStatus}</Badge>
                        </div>
                        
                        {/* Status Label */}
                        {o.status === 'fully_paid' ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">Fully Paid</Badge>
                        ) : o.status === 'partially_paid' ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">Part Paid</Badge>
                        ) : (
                          <Badge className="bg-slate-400 hover:bg-slate-400 border-none text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">Unpaid</Badge>
                        )}
                      </div>

                      {/* Financial Detail Summary Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                        <div>
                          <span className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wider">Product Name</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{o.productName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wider">Printing Cost</span>
                          <span className="font-mono text-slate-900 dark:text-white font-extrabold">₹{fmt(o.printingAmount)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wider">Total Paid So Far</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-450 font-extrabold">₹{fmt(o.totalPaid)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wider">Outstanding Balance</span>
                          <span className={`font-mono font-extrabold ${o.remaining > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{fmt(o.remaining)}</span>
                        </div>
                      </div>

                      {/* Payment Timeline History */}
                      {o.payments.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                          <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Payment Installments Log</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {o.payments.map((p: any, pIdx: number) => (
                              <div key={p.id || pIdx} className="p-2.5 bg-white dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-[10px] space-y-1 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-center font-extrabold">
                                  <span className="text-slate-850 dark:text-slate-200">₹{fmt(parseFloat(p.amount))}</span>
                                  <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold">{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                                </div>
                                {p.referenceNumber && (
                                  <p className="text-[8px] font-mono text-slate-400 dark:text-zinc-500 truncate">Ref: {p.referenceNumber}</p>
                                )}
                                {p.notes && (
                                  <p className="text-[8px] text-slate-500 italic truncate" title={p.notes}>"{p.notes}"</p>
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
    </div>
  );
}
