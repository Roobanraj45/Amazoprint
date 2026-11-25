'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Verification failed');
        }
        setStatus('success');
        setMessage(data.message || 'Your email has been verified! You can now log in.');
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-purple-100 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <AmazoprintLogo />
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <h1 className="text-xl font-bold text-slate-900">Verifying Email</h1>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900">Email Verified!</h1>
            <p className="text-sm text-slate-600">{message}</p>
            <Button asChild className="w-full mt-4 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800">
              <Link href="/login">Proceed to Login</Link>
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <XCircle className="h-14 w-14 text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">Verification Failed</h1>
            <p className="text-sm text-slate-600">{message}</p>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/register">Back to Registration</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
