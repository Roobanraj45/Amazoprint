'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OtpFieldProps {
  channel: 'phone' | 'email';
  value: string;
  onChange: (value: string) => void;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  placeholder?: string;
  buttonLabel: string;
  helperText?: string;
  showCountryPrefix?: boolean;
  disabled?: boolean;
}

export function OtpField({
  channel,
  value,
  onChange,
  verified,
  onVerifiedChange,
  placeholder,
  buttonLabel,
  helperText,
  showCountryPrefix = false,
  disabled = false,
}: OtpFieldProps) {
  const { toast } = useToast();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleValueChange = (nextVal: string) => {
    const cleaned =
      channel === 'phone' ? nextVal.replace(/\D/g, '').slice(0, 10) : nextVal;
    if (verified) {
      onVerifiedChange(false);
    }
    setOtpSent(false);
    setOtp('');
    setDevOtpHint(null);
    onChange(cleaned);
  };

  const handleSendOtp = async () => {
    if (!value.trim()) {
      toast({
        variant: 'destructive',
        title: channel === 'phone' ? 'Enter mobile number' : 'Enter email address',
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, target: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setCooldown(30);
      setDevOtpHint(data.devOtp || null);

      toast({
        title: channel === 'phone' ? 'OTP Sent' : 'Verification Code Sent',
        description: data.devOtp
          ? `Dev mode code: ${data.devOtp}`
          : data.message,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Could not send OTP',
        description: err.message,
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter the 6-digit verification code.',
      });
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, target: value, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      onVerifiedChange(true);
      setOtpSent(false);
      setDevOtpHint(null);
      toast({
        title: channel === 'phone' ? 'Mobile Verified' : 'Email Verified',
        description: 'Verification completed successfully.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div
          className={cn(
            'flex-1 flex items-center rounded-xl border bg-white transition-colors focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-600/15',
            verified ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'
          )}
        >
          {showCountryPrefix && (
            <span className="pl-3.5 pr-2 text-sm font-semibold text-slate-700 select-none border-r border-slate-200">
              +91
            </span>
          )}
          <Input
            type={channel === 'phone' ? 'tel' : 'email'}
            inputMode={channel === 'phone' ? 'numeric' : 'email'}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || verified}
            className="border-0 shadow-none focus-visible:ring-0 h-11 bg-transparent text-sm"
          />
          {verified && (
            <span className="pr-3 flex items-center gap-1 text-xs font-semibold text-emerald-600 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </span>
          )}
        </div>

        {!verified && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSendOtp}
            disabled={sending || cooldown > 0 || disabled}
            className="h-11 px-4 rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 font-semibold shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend (${cooldown}s)`
            ) : (
              buttonLabel
            )}
          </Button>
        )}
      </div>

      {otpSent && !verified && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-purple-50/70 border border-purple-100">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="w-40 h-9 bg-white text-center tracking-widest font-semibold text-sm rounded-lg border-purple-200"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleVerifyOtp}
            disabled={verifying}
            className="h-9 bg-purple-700 hover:bg-purple-800 text-white rounded-lg px-4 font-semibold"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify OTP'}
          </Button>
          {devOtpHint && (
            <span className="text-xs text-purple-700 font-medium">
              Dev OTP: <strong>{devOtpHint}</strong>
            </span>
          )}
        </div>
      )}

      {helperText && !verified && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  );
}
