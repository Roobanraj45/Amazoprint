'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Eye,
  Factory,
  FileSpreadsheet,
  Loader2,
  MapPin,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePriceListApprovalAdmin } from '@/app/actions/price-list-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SpecColumn {
  name: string;
  value: string;
}

interface QuantityTier {
  quantity: number;
  singleSidePrice: string;
  doubleSidePrice: string;
  workingDays: string;
  hsnCode: string;
  gstPercentage: string;
}

interface AdminPriceListItem {
  id: string;
  categoryName: string;
  productName: string;
  catalogName: string | null;
  imageUrl: string | null;
  specColumns?: SpecColumn[] | null;
  quantityTiers?: QuantityTier[] | null;
  shippingType?: string | null;
  packagingCost?: string | null;
  approvalStatus?: string | null;
  adminNotes?: string | null;
  remarks?: string | null;
  createdAt: Date | null;
  printer?: {
    fullName: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    city: string | null;
  } | null;
}

export function AdminPriceListsClient({
  initialPriceLists,
}: {
  initialPriceLists: AdminPriceListItem[];
}) {
  const [items, setItems] = React.useState<AdminPriceListItem[]>(initialPriceLists);
  const [activeTab, setActiveTab] = React.useState('all');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<AdminPriceListItem | null>(null);
  const [adminNotes, setAdminNotes] = React.useState('');
  const { toast } = useToast();

  const handleAction = (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    React.startTransition(async () => {
      try {
        const res = await updatePriceListApprovalAdmin(id, status, adminNotes.trim() || undefined);
        if (res.success) {
          toast({
            title: `Price Sheet ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            description: `The printer price sheet has been ${status}.`,
          });
          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, approvalStatus: status, adminNotes: adminNotes.trim() || item.adminNotes }
                : item
            )
          );
          setSelectedItem(null);
          setAdminNotes('');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description: error.message || 'Failed to update status.',
        });
      } finally {
        setProcessingId(null);
      }
    });
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold gap-1">
            <CheckCircle2 size={11} /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold gap-1">
            <XCircle size={11} /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold gap-1">
            <Clock size={11} /> Pending Review
          </Badge>
        );
    }
  };

  const totalCount = items.length;
  const pendingCount = items.filter((i) => !i.approvalStatus || i.approvalStatus === 'pending').length;
  const approvedCount = items.filter((i) => i.approvalStatus === 'approved').length;
  const rejectedCount = items.filter((i) => i.approvalStatus === 'rejected').length;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    const status = item.approvalStatus || 'pending';
    return status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Printer Price Lists &amp; Spec Sheets
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Review and approve detailed product specifications, quantity pricing matrices, shipping, and packaging costs submitted by printers.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sheets', val: totalCount, icon: FileSpreadsheet, color: 'bg-blue-500/10 text-blue-500' },
          { label: 'Pending Review', val: pendingCount, icon: Clock, color: 'bg-amber-500/10 text-amber-500' },
          { label: 'Approved', val: approvedCount, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-500' },
          { label: 'Rejected', val: rejectedCount, icon: XCircle, color: 'bg-rose-500/10 text-rose-500' },
        ].map((m) => (
          <Card key={m.label} className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-3xl">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{m.label}</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{m.val}</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.color}`}>
              <m.icon size={18} />
            </div>
          </Card>
        ))}
      </div>

      {/* Ledger */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="p-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Submitted Price Lists</CardTitle>
              <CardDescription className="text-xs font-medium">
                Inspect specification columns and quantity rates before approving
              </CardDescription>
            </div>
            <TabsList className="bg-slate-100 dark:bg-zinc-800 rounded-full p-1 self-start sm:self-center">
              <TabsTrigger value="all" className="rounded-full text-xs font-bold px-3.5 py-1">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-full text-xs font-bold px-3.5 py-1">Pending</TabsTrigger>
              <TabsTrigger value="approved" className="rounded-full text-xs font-bold px-3.5 py-1">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-full text-xs font-bold px-3.5 py-1">Rejected</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            {filteredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-4 px-6">Printer Press</th>
                      <th className="py-4 px-4">Category &amp; Product</th>
                      <th className="py-4 px-4">Specs / Tiers</th>
                      <th className="py-4 px-4">Shipping / Packaging</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                              <Factory size={15} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {item.printer?.companyName || item.printer?.fullName || 'Print Partner'}
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <MapPin size={10} /> {item.printer?.city || 'India'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {item.categoryName}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {item.productName}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-700">
                            {item.specColumns?.length || 0} specs • {item.quantityTiers?.length || 0} qty tiers
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : ''}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="capitalize font-semibold text-slate-700">
                            Shipping: {item.shippingType || 'excluded'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pkg: {item.packagingCost ? `₹${item.packagingCost}` : '—'}
                          </p>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(item.approvalStatus)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setAdminNotes(item.adminNotes || '');
                              }}
                              className="rounded-full h-8 text-xs font-bold"
                            >
                              <Eye size={13} className="mr-1" /> Review Matrix
                            </Button>
                            {(!item.approvalStatus || item.approvalStatus === 'pending') && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={processingId === item.id}
                                  onClick={() => handleAction(item.id, 'approved')}
                                  className="rounded-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                  {processingId === item.id ? <Loader2 size={13} className="animate-spin" /> : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={processingId === item.id}
                                  onClick={() => handleAction(item.id, 'rejected')}
                                  className="rounded-full h-8 text-xs font-bold"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                No printer price lists found in this tab.
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Matrix Review Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          {selectedItem && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase text-purple-700">
                      {selectedItem.categoryName}
                    </span>
                    <DialogTitle className="text-xl font-bold">{selectedItem.productName}</DialogTitle>
                    <DialogDescription className="text-xs">
                      Submitted by {selectedItem.printer?.companyName || selectedItem.printer?.fullName} ({selectedItem.printer?.email})
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedItem.approvalStatus)}
                </div>
              </DialogHeader>

              {selectedItem.specColumns && selectedItem.specColumns.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedItem.specColumns.map((sc, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 p-3 bg-slate-50/70">
                      <p className="text-[10px] font-black uppercase text-slate-500">{sc.name}</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{sc.value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedItem.quantityTiers && selectedItem.quantityTiers.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#091642] text-white">
                        <th className="p-2.5 text-left">QUANTITY</th>
                        {selectedItem.quantityTiers.map((t, i) => (
                          <th key={i} className="p-2.5 text-center">{t.quantity}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Single Side (₹)</td>
                        {selectedItem.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.singleSidePrice || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Double Side (₹)</td>
                        {selectedItem.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.doubleSidePrice || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Working Days</td>
                        {selectedItem.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.workingDays || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">HSN / SAC</td>
                        {selectedItem.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.hsnCode || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">GST %</td>
                        {selectedItem.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.gstPercentage ? `${t.gstPercentage}%` : '—'}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 font-bold capitalize">
                  Shipping: {selectedItem.shippingType || 'excluded'}
                </span>
                {selectedItem.packagingCost && (
                  <span className="px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-800 font-bold">
                    AmazoPrint Packaging Cost: ₹{selectedItem.packagingCost}
                  </span>
                )}
              </div>

              {selectedItem.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.productName}
                  className="w-36 h-28 object-contain rounded-2xl border border-slate-200 p-1"
                />
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional admin review notes for the printer..."
                  className="rounded-xl"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={processingId === selectedItem.id}
                    onClick={() => handleAction(selectedItem.id, 'rejected')}
                    className="rounded-full px-6"
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    disabled={processingId === selectedItem.id}
                    onClick={() => handleAction(selectedItem.id, 'approved')}
                    className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {processingId === selectedItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : null}
                    Approve Sheet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
