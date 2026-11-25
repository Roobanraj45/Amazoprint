'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LoginShell } from '@/components/auth/LoginShell';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = searchParams.get('portal') === 'freelancer' ? 'freelancer' : 'client';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { keepLoggedIn: false },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, portal: portalParam }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast({
        title: 'Login successful',
        description:
          portalParam === 'freelancer'
            ? 'Welcome back to your Designer Workspace!'
            : 'Welcome back to AmazoPrint!',
      });

      const dashboardUrl =
        result.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
      router.push(dashboardUrl);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginShell
      activePortal={portalParam}
      badgeText={portalParam === 'freelancer' ? 'Designer Portal' : 'Customer Portal'}
      title={portalParam === 'freelancer' ? 'Freelancer Login' : 'Client Login'}
      subtitle={
        portalParam === 'freelancer'
          ? 'Sign in to manage design orders, contests, and payouts.'
          : 'Sign in to customize products, track orders, and manage invoices.'
      }
      footerContent={
        portalParam === 'freelancer' ? (
          <p className="text-sm text-slate-600">
            New designer on AmazoPrint?{' '}
            <Link href="/freelancer-registration" className="text-purple-700 font-bold hover:underline">
              Register as a Freelancer (Free)
            </Link>
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-purple-700 font-bold hover:underline">
              Create Account
            </Link>
          </p>
        )
      }
    >
      <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Mail className="h-4 w-4 text-purple-600" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={portalParam === 'freelancer' ? 'designer@studio.com' : 'name@business.com'}
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-purple-600/20"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Lock className="h-4 w-4 text-purple-600" />
              Password
            </Label>
            <Link href="/help" className="text-xs font-semibold text-purple-700 hover:underline">
              Need help signing in?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="h-11 pr-10 rounded-xl border-slate-200 focus-visible:ring-purple-600/20"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Controller
            control={control}
            name="keepLoggedIn"
            render={({ field }) => (
              <Checkbox
                id="keep-logged-in"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="keep-logged-in" className="text-xs text-slate-600 font-medium cursor-pointer">
            Keep me logged in on this device
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-600/25"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {portalParam === 'freelancer' ? 'Sign in as Freelancer' : 'Sign in to Account'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-purple-50/40">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
