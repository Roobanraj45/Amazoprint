'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Eye,
  Factory,
  FileText,
  Loader2,
  MapPin,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProposalStatusAdmin } from '@/app/actions/proposal-actions';
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
import type { QuantityTier, SpecColumn } from '@/app/printer/design-options/DesignOptionsClient';

interface PrinterProfile {
  fullName: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  optionType: string;
  categoryName?: string | null;
  productName?: string | null;
  specColumns?: SpecColumn[] | null;
  quantityTiers?: QuantityTier[] | null;
  shippingType?: string | null;
  packagingCost?: string | null;
  estimatedCost: string | null;
  status: string;
  adminNotes?: string | null;
  images?: string[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  printer: PrinterProfile;
}

export function ProposalsAdminClient({ initialProposals }: { initialProposals: Proposal[] }) {
  const [proposals, setProposals] = React.useState<Proposal[]>(initialProposals);
  const [activeTab, setActiveTab] = React.useState('all');
  const [processingId, setProcessingId] = React.useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = React.useState<Proposal | null>(null);
  const [adminNotes, setAdminNotes] = React.useState('');
  const { toast } = useToast();

  const handleAction = (proposalId: number, status: 'approved' | 'rejected') => {
    setProcessingId(proposalId);
    React.startTransition(async () => {
      try {
        const res = await updateProposalStatusAdmin(proposalId, status, adminNotes.trim() || undefined);
        if (res.success) {
          toast({
            title: `Proposal ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            description: `The product specification sheet has been ${status}.`,
          });
          setProposals((prev) =>
            prev.map((p) =>
              p.id === proposalId
                ? { ...p, status, adminNotes: adminNotes.trim() || p.adminNotes, updatedAt: new Date() }
                : p
            )
          );
          setSelectedProposal(null);
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

  const getStatusBadge = (status: string) => {
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

  const totalCount = proposals.length;
  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const approvedCount = proposals.filter((p) => p.status === 'approved').length;
  const rejectedCount = proposals.filter((p) => p.status === 'rejected').length;

  const filteredProposals = proposals.filter((prop) => {
    if (activeTab === 'all') return true;
    return prop.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Printer Product &amp; Pricing Proposals
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Review detailed product specifications, quantity pricing matrices, shipping, and packaging costs submitted by printers.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Proposals', val: totalCount, icon: FileText, color: 'bg-blue-500/10 text-blue-500' },
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
              <CardTitle className="text-base font-bold tracking-tight">Product Matrix Submissions</CardTitle>
              <CardDescription className="text-xs font-medium">
                Inspect full specification sheets before approving
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
            {filteredProposals.length > 0 ? (
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
                    {filteredProposals.map((prop) => (
                      <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                              <Factory size={15} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {prop.printer?.companyName || prop.printer?.fullName}
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <MapPin size={10} /> {prop.printer?.city || 'India'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {prop.categoryName || prop.optionType}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {prop.productName || prop.title}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-700">
                            {prop.specColumns?.length || 0} specs • {prop.quantityTiers?.length || 0} qty tiers
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {prop.createdAt ? format(new Date(prop.createdAt), 'dd MMM yyyy') : ''}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="capitalize font-semibold text-slate-700">
                            Shipping: {prop.shippingType || 'excluded'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pkg: {prop.packagingCost ? `₹${prop.packagingCost}` : '—'}
                          </p>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(prop.status)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProposal(prop);
                                setAdminNotes(prop.adminNotes || '');
                              }}
                              className="rounded-full h-8 text-xs font-bold"
                            >
                              <Eye size={13} className="mr-1" /> Review Matrix
                            </Button>
                            {prop.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={processingId === prop.id}
                                  onClick={() => handleAction(prop.id, 'approved')}
                                  className="rounded-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                  {processingId === prop.id ? <Loader2 size={13} className="animate-spin" /> : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={processingId === prop.id}
                                  onClick={() => handleAction(prop.id, 'rejected')}
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
                No proposals found in this category.
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Matrix Review Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={(o) => !o && setSelectedProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          {selectedProposal && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase text-purple-700">
                      {selectedProposal.categoryName || selectedProposal.optionType}
                    </span>
                    <DialogTitle className="text-xl font-bold">
                      {selectedProposal.productName || selectedProposal.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Submitted by {selectedProposal.printer?.companyName || selectedProposal.printer?.fullName} ({selectedProposal.printer?.email})
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedProposal.status)}
                </div>
              </DialogHeader>

              {selectedProposal.specColumns && selectedProposal.specColumns.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedProposal.specColumns.map((sc, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 p-3 bg-slate-50/70">
                      <p className="text-[10px] font-black uppercase text-slate-500">{sc.name}</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{sc.value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedProposal.quantityTiers && selectedProposal.quantityTiers.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#091642] text-white">
                        <th className="p-2.5 text-left">QUANTITY</th>
                        {selectedProposal.quantityTiers.map((t, i) => (
                          <th key={i} className="p-2.5 text-center">{t.quantity}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Single Side (₹)</td>
                        {selectedProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.singleSidePrice || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Double Side (₹)</td>
                        {selectedProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.doubleSidePrice || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Working Days</td>
                        {selectedProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.workingDays || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">HSN / SAC</td>
                        {selectedProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.hsnCode || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">GST %</td>
                        {selectedProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.gstPercentage ? `${t.gstPercentage}%` : '—'}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 font-bold capitalize">
                  Shipping: {selectedProposal.shippingType || 'excluded'}
                </span>
                {selectedProposal.packagingCost && (
                  <span className="px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-800 font-bold">
                    AmazoPrint Packaging Cost: ₹{selectedProposal.packagingCost}
                  </span>
                )}
              </div>

              {selectedProposal.images && selectedProposal.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {selectedProposal.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img}
                      alt="Sample"
                      className="w-24 h-24 object-cover rounded-2xl border border-slate-200"
                    />
                  ))}
                </div>
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
                    disabled={processingId === selectedProposal.id}
                    onClick={() => handleAction(selectedProposal.id, 'rejected')}
                    className="rounded-full px-6"
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    disabled={processingId === selectedProposal.id}
                    onClick={() => handleAction(selectedProposal.id, 'approved')}
                    className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {processingId === selectedProposal.id ? (
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
