'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  Layers,
  Plus,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface SpecColumn {
  name: string;
  value: string;
}

export interface QuantityTier {
  quantity: number;
  singleSidePrice: string;
  doubleSidePrice: string;
  workingDays: string;
  hsnCode: string;
  gstPercentage: string;
}

export interface Proposal {
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
}

export function DesignOptionsClient({ initialProposals }: { initialProposals: Proposal[] }) {
  const [proposals] = React.useState<Proposal[]>(initialProposals);
  const [viewProposal, setViewProposal] = React.useState<Proposal | null>(null);

  const totalCount = proposals.length;
  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const approvedCount = proposals.filter((p) => p.status === 'approved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-full text-[11px] font-bold gap-1">
            <CheckCircle2 size={12} /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/10 text-rose-700 border border-rose-500/20 rounded-full text-[11px] font-bold gap-1">
            <XCircle size={12} /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full text-[11px] font-bold gap-1">
            <Clock size={12} /> Pending Approval
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-8 pb-20">
      {/* Curved Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#061033] via-[#091642] to-[#311b6b] text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold border border-white/15">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#f07000]" />
              Product &amp; Pricing Matrix
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Submit Product Specifications &amp; Rates
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Enter full product specifications, custom columns, quantity-wise Single/Double side pricing, working days, HSN/GST, and AmazoPrint packaging cost for admin approval.
            </p>
          </div>

          <Button
            asChild
            className="rounded-full h-12 px-6 bg-gradient-to-r from-[#f07000] to-orange-600 hover:from-[#d96500] hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 gap-2"
          >
            <Link href="/printer/design-options/new">
              <Plus size={16} /> Add Product Spec Sheet
            </Link>
          </Button>
        </div>

        {/* Summary Pills */}
        <div className="relative flex flex-wrap gap-3 pt-5 mt-5 border-t border-white/10 text-xs">
          <span className="px-4 py-1.5 rounded-full bg-white/10 font-bold">
            Total Sheets: {totalCount}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-200 font-bold">
            Pending: {pendingCount}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold">
            Approved: {approvedCount}
          </span>
        </div>
      </div>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <Layers className="h-10 w-10 text-purple-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Product Spec Sheets Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click &ldquo;Add Product Spec Sheet&rdquo; to submit your product specifications and quantity pricing matrix for admin approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="rounded-[2rem] bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      {prop.categoryName || prop.optionType}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {prop.productName || prop.title}
                    </h3>
                  </div>
                  {getStatusBadge(prop.status)}
                </div>

                {prop.specColumns && prop.specColumns.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {prop.specColumns.slice(0, 4).map((sc, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium"
                      >
                        <strong>{sc.name}:</strong> {sc.value || '—'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 line-clamp-2">{prop.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold capitalize">
                    Shipping: {prop.shippingType || 'excluded'}
                  </span>
                  {prop.packagingCost && (
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-semibold">
                      Packaging: ₹{prop.packagingCost}
                    </span>
                  )}
                  {prop.quantityTiers && prop.quantityTiers.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {prop.quantityTiers.length} Qty Tiers
                    </span>
                  )}
                </div>

                {prop.adminNotes && (
                  <p className="text-xs bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 text-amber-900">
                    <strong>Admin Note:</strong> {prop.adminNotes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {prop.createdAt ? format(new Date(prop.createdAt), 'dd MMM yyyy') : 'Just now'}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setViewProposal(prop)}
                  className="rounded-full h-8 text-xs font-bold border-purple-200 text-purple-700"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Sheet
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Matrix Modal */}
      <Dialog open={!!viewProposal} onOpenChange={(o) => !o && setViewProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          {viewProposal && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                      {viewProposal.categoryName || viewProposal.optionType}
                    </span>
                    <DialogTitle className="text-xl font-bold">
                      {viewProposal.productName || viewProposal.title}
                    </DialogTitle>
                  </div>
                  {getStatusBadge(viewProposal.status)}
                </div>
              </DialogHeader>

              {viewProposal.specColumns && viewProposal.specColumns.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {viewProposal.specColumns.map((sc, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 p-3 bg-slate-50/60">
                      <p className="text-[10px] font-black uppercase text-slate-500">{sc.name}</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{sc.value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {viewProposal.quantityTiers && viewProposal.quantityTiers.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#091642] text-white">
                        <th className="p-2.5 text-left">QUANTITY</th>
                        {viewProposal.quantityTiers.map((t, i) => (
                          <th key={i} className="p-2.5 text-center">{t.quantity}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Single Side (₹)</td>
                        {viewProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.singleSidePrice || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Double Side (₹)</td>
                        {viewProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.doubleSidePrice || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">Working Days</td>
                        {viewProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.workingDays || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">HSN / SAC</td>
                        {viewProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.hsnCode || '—'}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50">GST %</td>
                        {viewProposal.quantityTiers.map((t, i) => (
                          <td key={i} className="p-2.5 text-center">{t.gstPercentage ? `${t.gstPercentage}%` : '—'}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 font-bold capitalize">
                  Shipping: {viewProposal.shippingType || 'excluded'}
                </span>
                {viewProposal.packagingCost && (
                  <span className="px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-800 font-bold">
                    AmazoPrint Packaging Cost: ₹{viewProposal.packagingCost}
                  </span>
                )}
              </div>

              {viewProposal.images && viewProposal.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {viewProposal.images.map((img, i) => (
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
