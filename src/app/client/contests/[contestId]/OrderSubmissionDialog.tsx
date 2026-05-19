'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { orderContestSubmission } from '@/app/actions/contest-actions';
import { useToast } from '@/hooks/use-toast';
import { Printer, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function OrderSubmissionDialog({ 
  contestId, 
  submissionId, 
  templateId,
  freelancerName 
}: { 
  contestId: number; 
  submissionId?: number; 
  templateId?: number; 
  freelancerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.zip.trim()) newErrors.zip = 'ZIP code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await orderContestSubmission({
        contestId,
        submissionId,
        templateId,
        shippingAddress: form
      });
      if (response.success) {
        toast({
          title: 'Order Placed!',
          description: 'Your print production order was created successfully.',
        });
        setOpen(false);
        router.refresh();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: error.message || 'Could not place production order.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className="bg-rose-500 hover:bg-rose-600 font-extrabold text-xs rounded-2xl h-9 px-4 flex items-center gap-1.5 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Printer className="w-3.5 h-3.5" /> Order Print
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
            <Printer className="w-5 h-5 text-rose-500" /> Order Print Production
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground/80 leading-relaxed">
            Fill in the shipping address below to print and deliver the design entry submitted by <span className="font-extrabold text-foreground">{freelancerName}</span>. Since this is part of your contest packages, the printing specifications and base cost are fully prepaid upfront.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-foreground">Receiver Name <span className="text-rose-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
            {errors.name && <p className="text-[9px] font-bold text-rose-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-foreground">Contact Phone <span className="text-rose-500">*</span></Label>
            <Input
              id="phone"
              placeholder="e.g. +91 98765 43210"
              value={form.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
            {errors.phone && <p className="text-[9px] font-bold text-rose-500">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="addressLine1" className="text-[10px] font-bold uppercase tracking-wider text-foreground">Shipping Address Line 1 <span className="text-rose-500">*</span></Label>
            <Input
              id="addressLine1"
              placeholder="House/Office No., Street, Area"
              value={form.addressLine1}
              onChange={e => handleInputChange('addressLine1', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
            {errors.addressLine1 && <p className="text-[9px] font-bold text-rose-500">{errors.addressLine1}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="addressLine2" className="text-[10px] font-bold uppercase tracking-wider text-foreground">Address Line 2 <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="addressLine2"
              placeholder="Landmark, Suite, Apartment Unit"
              value={form.addressLine2}
              onChange={e => handleInputChange('addressLine2', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-[10px] font-bold uppercase tracking-wider text-foreground">City <span className="text-rose-500">*</span></Label>
            <Input
              id="city"
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={e => handleInputChange('city', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
            {errors.city && <p className="text-[9px] font-bold text-rose-500">{errors.city}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-[10px] font-bold uppercase tracking-wider text-foreground">State <span className="text-rose-500">*</span></Label>
            <Input
              id="state"
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={e => handleInputChange('state', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
            {errors.state && <p className="text-[9px] font-bold text-rose-500">{errors.state}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zip" className="text-[10px] font-bold uppercase tracking-wider text-foreground">ZIP Code <span className="text-rose-500">*</span></Label>
            <Input
              id="zip"
              placeholder="e.g. 400001"
              value={form.zip}
              onChange={e => handleInputChange('zip', e.target.value)}
              className="h-10 rounded-xl bg-background/50 border-border text-xs font-semibold focus-visible:ring-rose-500"
            />
            {errors.zip && <p className="text-[9px] font-bold text-rose-500">{errors.zip}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-[10px] font-bold uppercase tracking-wider text-foreground">Country</Label>
            <Input
              id="country"
              value={form.country}
              disabled
              className="h-10 rounded-xl bg-background/30 border-border text-xs font-semibold opacity-60"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="rounded-2xl text-xs font-bold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-rose-500 hover:bg-rose-600 font-extrabold text-xs rounded-2xl h-10 px-6"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fulfill Print Production
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </div>
  );
}
