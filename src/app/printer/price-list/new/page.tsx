'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
  Package,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { savePriceListItem } from '@/app/actions/price-list-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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

const DEFAULT_SPECS: SpecColumn[] = [
  { name: 'SIZE', value: '92 mm × 54 mm' },
  { name: 'THICKNESS', value: '300 GSM' },
  { name: 'LAMINATION', value: 'Gloss Lamination' },
  { name: 'DIE SHAPE', value: 'Yes / No' },
  { name: 'EXTRA WORK', value: 'Yes / No' },
  { name: 'FOLDING', value: '' },
];

const DEFAULT_QUANTITIES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

const buildDefaultTiers = (): QuantityTier[] =>
  DEFAULT_QUANTITIES.map((qty) => ({
    quantity: qty,
    singleSidePrice: '',
    doubleSidePrice: '',
    workingDays: '',
    hsnCode: '',
    gstPercentage: '',
  }));

export default function NewPriceListSpecPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);

  const [categoryName, setCategoryName] = React.useState('BUSINESS CARDS');
  const [productName, setProductName] = React.useState('');
  const [specColumns, setSpecColumns] = React.useState<SpecColumn[]>(DEFAULT_SPECS);
  const [quantityTiers, setQuantityTiers] = React.useState<QuantityTier[]>(buildDefaultTiers);
  const [shippingType, setShippingType] = React.useState<'included' | 'excluded'>('excluded');
  const [packagingCost, setPackagingCost] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);

  const updateSpec = (idx: number, field: 'name' | 'value', val: string) => {
    setSpecColumns((prev) => prev.map((col, i) => (i === idx ? { ...col, [field]: val } : col)));
  };

  const addSpecColumn = () => {
    setSpecColumns((prev) => [...prev, { name: 'CUSTOM SPEC', value: '' }]);
  };

  const removeSpecColumn = (idx: number) => {
    if (specColumns.length <= 1) return;
    setSpecColumns((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: keyof QuantityTier, val: string) => {
    setQuantityTiers((prev) =>
      prev.map((tier, i) =>
        i === idx
          ? {
              ...tier,
              [field]: field === 'quantity' ? Math.max(1, Number(val) || 0) : val,
            }
          : tier
      )
    );
  };

  const addQuantityTier = () => {
    const lastQty = quantityTiers[quantityTiers.length - 1]?.quantity || 0;
    setQuantityTiers((prev) => [
      ...prev,
      {
        quantity: lastQty + 100,
        singleSidePrice: '',
        doubleSidePrice: '',
        workingDays: '',
        hsnCode: prev[0]?.hsnCode || '',
        gstPercentage: prev[0]?.gstPercentage || '',
      },
    ]);
  };

  const removeQuantityTier = (idx: number) => {
    if (quantityTiers.length <= 1) return;
    setQuantityTiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyFirstToAll = (field: 'workingDays' | 'hsnCode' | 'gstPercentage') => {
    const val = quantityTiers[0]?.[field] || '';
    if (!val) return;
    setQuantityTiers((prev) => prev.map((t) => ({ ...t, [field]: val })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !productName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Please enter both Category and Product Name.',
      });
      return;
    }

    const hasAtLeastOnePrice = quantityTiers.some(
      (t) => t.singleSidePrice.trim() !== '' || t.doubleSidePrice.trim() !== ''
    );
    if (!hasAtLeastOnePrice) {
      toast({
        variant: 'destructive',
        title: 'Pricing required',
        description: 'Enter Single Side or Double Side price for at least one quantity.',
      });
      return;
    }

    let uploadedUrl = '';
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'price-lists');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) uploadedUrl = uploadData.url;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: err.message || 'Could not upload sample image.',
        });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const findSpec = (key: string) =>
      specColumns.find((c) => c.name.toUpperCase().includes(key))?.value || null;
    const findQtyPrice = (qty: number) => {
      const match = quantityTiers.find((t) => t.quantity === qty);
      const val = match?.singleSidePrice || match?.doubleSidePrice;
      return val ? Number(val) : null;
    };

    startTransition(async () => {
      try {
        const res = await savePriceListItem({
          catalogName: productName.trim(),
          imageUrl: uploadedUrl,
          categoryName: categoryName.trim(),
          productName: productName.trim(),
          size: findSpec('SIZE'),
          gsm: findSpec('THICKNESS') || findSpec('GSM'),
          laminationType: findSpec('LAMINATION'),
          qty250: findQtyPrice(250) ?? findQtyPrice(200),
          qty500: findQtyPrice(500),
          qty1000: findQtyPrice(1000),
          qty5000: findQtyPrice(5000),
          specColumns: specColumns.filter((c) => c.name.trim()),
          quantityTiers,
          shippingType,
          packagingCost: packagingCost ? Number(packagingCost) : null,
          remarks: remarks.trim() || null,
          isActive: true,
        });

        if (res.success) {
          toast({
            title: 'Price List Sheet Saved',
            description: 'Your product specification & pricing sheet has been submitted for admin approval.',
          });
          router.push('/printer/price-list');
          router.refresh();
        }
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: err.message || 'Could not save price list sheet.',
        });
      }
    });
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 pb-20 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline" className="rounded-full font-bold text-xs">
          <Link href="/printer/price-list">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Price List
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#091642] via-[#1e1b4b] to-[#4c1d95] px-6 sm:px-8 py-6 text-white">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-[#f07000]" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              New Product Specification &amp; Quantity Pricing Form
            </h1>
          </div>
          <p className="text-purple-100 text-xs sm:text-sm mt-1">
            Customize product name, specification columns, and quantity pricing tiers for your Price List.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/50 p-5 rounded-3xl border border-purple-100">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Product Category (Custom) <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., BUSINESS CARDS, FLYERS, BROCHURES"
                className="h-11 rounded-xl bg-white font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Product Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Gloss Lamination Business Cards"
                className="h-11 rounded-xl bg-white font-semibold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Product Specifications (Editable Column Names)
                </h2>
                <p className="text-xs text-slate-500">
                  Rename, add, or edit specification columns for this product.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecColumn}
                className="rounded-full text-xs font-bold border-purple-200 text-purple-700"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Column
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {specColumns.map((col, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={col.name}
                      onChange={(e) => updateSpec(idx, 'name', e.target.value)}
                      placeholder="Column Name"
                      className="h-8 text-[11px] font-black uppercase tracking-wider bg-[#091642] text-white border-0 rounded-xl"
                    />
                    {specColumns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecColumn(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={col.value}
                    onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                    placeholder={`Enter ${col.name.toLowerCase()}`}
                    className="h-10 text-xs bg-white rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Quantity Pricing &amp; Tax Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Customize quantities, Single/Double side pricing, working days, HSN/SAC, and GST %.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => applyFirstToAll('workingDays')} className="rounded-full text-[11px] h-8">
                  Copy Days to All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyFirstToAll('hsnCode')} className="rounded-full text-[11px] h-8">
                  Copy HSN to All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyFirstToAll('gstPercentage')} className="rounded-full text-[11px] h-8">
                  Copy GST% to All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addQuantityTier} className="rounded-full text-[11px] h-8 border-purple-200 text-purple-700 font-bold">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Qty
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-xs">
              <table className="w-full text-xs border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-[#091642] text-white">
                    <th className="p-3 text-left font-bold w-44 sticky left-0 bg-[#091642] z-10">
                      QUANTITY
                    </th>
                    {quantityTiers.map((tier, idx) => (
                      <th key={idx} className="p-2 min-w-[96px]">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={tier.quantity}
                            onChange={(e) => updateTier(idx, 'quantity', e.target.value)}
                            className="h-7 text-center font-bold text-xs bg-white/15 border-white/20 text-white rounded-lg px-1"
                          />
                          {quantityTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuantityTier(idx)}
                              className="text-white/60 hover:text-rose-300"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {[
                    { key: 'singleSidePrice', label: 'Single Side Price (₹)', placeholder: '0' },
                    { key: 'doubleSidePrice', label: 'Double Side Price (₹)', placeholder: '0' },
                    { key: 'workingDays', label: 'Working Days', placeholder: 'e.g. 2' },
                    { key: 'hsnCode', label: 'HSN / SAC Code', placeholder: '4911' },
                    { key: 'gstPercentage', label: 'GST Percentage (%)', placeholder: '18' },
                  ].map((row) => (
                    <tr key={row.key}>
                      <td className="p-3 font-bold text-slate-700 bg-slate-50 sticky left-0 z-10 border-r border-slate-100">
                        {row.label}
                      </td>
                      {quantityTiers.map((tier, idx) => (
                        <td key={idx} className="p-2">
                          <Input
                            value={String(tier[row.key as keyof QuantityTier] ?? '')}
                            onChange={(e) =>
                              updateTier(idx, row.key as keyof QuantityTier, e.target.value)
                            }
                            placeholder={row.placeholder}
                            className="h-8 text-center text-xs rounded-xl border-slate-200"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-5 rounded-3xl border border-slate-200/80">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-purple-600" />
                Shipping
              </Label>
              <div className="flex gap-2">
                {(['included', 'excluded'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setShippingType(opt)}
                    className={cn(
                      'flex-1 h-10 rounded-full text-xs font-bold capitalize border transition-all',
                      shippingType === opt
                        ? 'bg-[#091642] text-white border-[#091642]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-[#f07000]" />
                AmazoPrint Brand Name Packaging Cost (₹)
              </Label>
              <Input
                type="number"
                min={0}
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                placeholder="e.g., 25"
                className="h-10 rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Sample Product Image (Optional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Additional Remarks (Optional)
              </Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Paper stock notes, finish options, or turnaround details..."
                className="min-h-[70px] rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button asChild type="button" variant="outline" className="rounded-full px-6">
              <Link href="/printer/price-list">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isPending || uploading}
              className="rounded-full px-8 h-12 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 font-bold shadow-lg shadow-purple-600/20"
            >
              {isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit for Admin Approval
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
