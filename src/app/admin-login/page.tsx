'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LoginShell } from '@/components/auth/LoginShell';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid administrator email.'),
  password: z.string().min(1, 'Security key is required.'),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
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
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Authorization failed');
      }

      toast({
        title: 'Authorization Granted',
        description: 'Welcome to the AmazoPrint Command Center.',
      });

      const dashboardUrl =
        result.role === 'accounts' ? '/accounts/dashboard' : '/admin/dashboard';
      router.push(dashboardUrl);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: error.message || 'Identity verification failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginShell
      activePortal="admin"
      badgeText="Restricted Staff Access"
      title="Admin & Accounts Login"
      subtitle="Authenticate your staff credentials to access operations or accounts."
      footerContent={
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
          Authorized AmazoPrint personnel only.{' '}
          <Link href="/help" className="text-rose-700 font-semibold hover:underline">
            IT Helpdesk
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="admin-email" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Mail className="h-4 w-4 text-rose-600" />
            Administrator Email
          </Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@amazoprint.com"
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-rose-600/20"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-password" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Lock className="h-4 w-4 text-rose-600" />
            Security Key / Password
          </Label>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your security key"
              className="h-11 pr-10 rounded-xl border-slate-200 focus-visible:ring-rose-600/20"
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
                id="admin-keep-logged-in"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="admin-keep-logged-in" className="text-xs text-slate-600 font-medium cursor-pointer">
            Keep staff session active on this device
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-700 hover:to-purple-800 shadow-lg shadow-rose-600/20"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sign in to Admin Portal
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </LoginShell>
  );
}
