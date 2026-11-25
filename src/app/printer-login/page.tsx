'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { loginPrinter } from '@/app/actions/printer-actions';
import { LoginShell } from '@/components/auth/LoginShell';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid work email.'),
  password: z.string().min(1, 'Password is required.'),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PrinterLoginPage() {
  const router = useRouter();
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
      await loginPrinter(data);

      toast({
        title: 'Partner Verified',
        description: 'Welcome to your Production & Payout Dashboard.',
      });

      router.push('/printer/dashboard');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: error.message || 'Verification failed. Please check credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginShell
      activePortal="printer"
      badgeText="Print Partner Portal"
      title="Printer Partner Login"
      subtitle="Access your print production queue, dispatch labels, and payouts."
      footerContent={
        <p className="text-sm text-slate-600">
          Want to join our press network?{' '}
          <Link href="/printer-registration" className="text-purple-700 font-bold hover:underline">
            Register Print Press
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="printer-email" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Mail className="h-4 w-4 text-purple-600" />
            Registered Facility Email
          </Label>
          <Input
            id="printer-email"
            type="email"
            placeholder="ops@printpartner.com"
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-purple-600/20"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="printer-password" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Lock className="h-4 w-4 text-purple-600" />
              Password
            </Label>
            <Link href="/help" className="text-xs font-semibold text-purple-700 hover:underline">
              Vendor support
            </Link>
          </div>
          <div className="relative">
            <Input
              id="printer-password"
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
                id="printer-keep-logged-in"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="printer-keep-logged-in" className="text-xs text-slate-600 font-medium cursor-pointer">
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
              Sign in as Print Partner
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </LoginShell>
  );
}
