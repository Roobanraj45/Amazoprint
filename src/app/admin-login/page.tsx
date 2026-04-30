'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmazoprintLogo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, Lock, ArrowRight, Home } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid admin identity' }),
  password: z.string().min(1, { message: 'Security key is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

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
        title: 'Authorization successful',
        description: 'Welcome to the Command Center.',
      });
      
      let dashboardUrl = '/';
      switch (result.role) {
        case 'admin':
        case 'super_admin':
        case 'company_admin':
        case 'designer': dashboardUrl = '/admin/dashboard'; break;
        case 'accounts': dashboardUrl = '/accounts/dashboard'; break;
        case 'printer': dashboardUrl = '/printer/dashboard'; break;
        default: dashboardUrl = '/';
      }

      router.push(dashboardUrl);
      router.refresh();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Access denied',
        description: error.message || 'Identity verification failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-6">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
                <AmazoprintLogo className="brightness-0 invert scale-125 mx-auto" />
            </Link>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
                    <ShieldAlert className="text-primary w-6 h-6" />
                    Admin portal
                </h1>
                <p className="text-[11px] font-bold text-slate-500">Authorized personnel only</p>
            </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl shadow-black/50">
            <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-8">
                <div className="space-y-6">
                <div className="space-y-3">
                    <Label htmlFor="email" className="text-[11px] font-bold text-slate-400 ml-1">Admin identity</Label>
                    <div className="relative group">
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="admin@amazoprint.com" 
                            className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 focus:border-primary focus:ring-0 transition-all font-bold text-sm text-white placeholder:text-slate-600"
                            {...register('email')} 
                        />
                    </div>
                    {errors.email && <p className="text-[11px] font-bold text-red-500 ml-4">{errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                    <Label htmlFor="password" className="text-[11px] font-bold text-slate-400 ml-1">Security key</Label>
                    <div className="relative group">
                        <Input 
                            id="password" 
                            type="password" 
                            placeholder="••••••••"
                            className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 focus:border-primary focus:ring-0 transition-all font-bold text-sm text-white placeholder:text-slate-600"
                            {...register('password')} 
                        />
                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    {errors.password && <p className="text-[11px] font-bold text-red-500 ml-4">{errors.password.message}</p>}
                </div>
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 group" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        Secure authorization
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
                </Button>
            </form>
            </FormProvider>
        </div>

        <div className="text-center pt-4">
            <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-white transition-colors"
            >
                <Home size={12} />
                Return to public site
            </Link>
        </div>
      </div>
    </div>
  );
}
