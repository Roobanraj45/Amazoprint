'use client';

import { useState, useTransition } from 'react';
import { saveBankDetails } from '@/app/actions/bank-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Building2, ShieldCheck, AlertTriangle, Loader2, Sparkles, CheckCircle2, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankDetailsFormProps {
    initialData?: {
        id: string;
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        branchName?: string | null;
        ifscCode: string;
        accountType: string;
        isPrimary: boolean;
        isVerified: boolean;
    } | null;
}

export function BankDetailsForm({ initialData }: BankDetailsFormProps) {
    const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName || '');
    const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
    const [bankName, setBankName] = useState(initialData?.bankName || '');
    const [branchName, setBranchName] = useState(initialData?.branchName || '');
    const [ifscCode, setIfscCode] = useState(initialData?.ifscCode || '');
    const [accountType, setAccountType] = useState<any>(initialData?.accountType || 'savings');
    
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!accountHolderName.trim() || !accountNumber.trim() || !bankName.trim() || !ifscCode.trim()) {
            setError('All fields except Branch Name are required.');
            return;
        }

        // Simple IFSC validation
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
            setError('Invalid IFSC Code format. E.g. HDFC0001234');
            return;
        }

        startTransition(async () => {
            try {
                await saveBankDetails({
                    accountHolderName,
                    accountNumber,
                    bankName,
                    branchName: branchName || undefined,
                    ifscCode,
                    accountType,
                });
                setSuccess('Bank details saved successfully!');
            } catch (err: any) {
                setError(err.message || 'Failed to save bank details. Please try again.');
            }
        });
    };

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-violet-500" /> Bank Payout Account
                        </CardTitle>
                        <CardDescription className="font-medium text-xs">
                            Add or update your bank details to receive payments.
                        </CardDescription>
                    </div>
                    {initialData && (
                        <div className="flex items-center gap-1.5 self-start sm:self-center">
                            {initialData.isVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending verification
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Account Holder */}
                        <div className="space-y-1.5">
                            <Label htmlFor="holderName" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Holder Name *</Label>
                            <Input
                                id="holderName"
                                placeholder="Enter account holder name"
                                value={accountHolderName}
                                onChange={(e) => setAccountHolderName(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
                                disabled={isPending}
                            />
                        </div>

                        {/* Account Number */}
                        <div className="space-y-1.5">
                            <Label htmlFor="accountNum" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Number *</Label>
                            <Input
                                id="accountNum"
                                type="text"
                                placeholder="Enter account number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                                disabled={isPending}
                            />
                        </div>

                        {/* Bank Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="bankName" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bank Name *</Label>
                            <Input
                                id="bankName"
                                placeholder="E.g. HDFC Bank, ICICI Bank"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
                                disabled={isPending}
                            />
                        </div>

                        {/* Branch Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="branchName" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Branch Name</Label>
                            <Input
                                id="branchName"
                                placeholder="Enter bank branch name"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
                                disabled={isPending}
                            />
                        </div>

                        {/* IFSC Code */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ifsc" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IFSC Code *</Label>
                            <Input
                                id="ifsc"
                                placeholder="11 character IFSC, e.g. HDFC0001234"
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs font-mono uppercase"
                                maxLength={11}
                                disabled={isPending}
                            />
                        </div>

                        {/* Account Type */}
                        <div className="space-y-1.5">
                            <Label htmlFor="accountType" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Type *</Label>
                            <Select value={accountType} onValueChange={setAccountType} disabled={isPending}>
                                <SelectTrigger id="accountType" className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs">
                                    <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="savings">Savings Account</SelectItem>
                                    <SelectItem value="current">Current Account</SelectItem>
                                    <SelectItem value="business">Business Account</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl animate-in fade-in-50 duration-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{success}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold px-6 py-4 shadow-lg shadow-violet-600/20 gap-2 h-9"
                        >
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Save Bank Details
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
