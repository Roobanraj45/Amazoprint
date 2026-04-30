'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmazoprintLogo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      keepLoggedIn: false,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to Amazoprint!',
      });
      
      let dashboardUrl = '/';
      switch (result.role) {
        case 'freelancer': dashboardUrl = '/freelancer/dashboard'; break;
        case 'admin':
        case 'super_admin':
        case 'company_admin':
        case 'designer': dashboardUrl = '/admin/dashboard'; break;
        default: dashboardUrl = '/';
      }
      
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
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left Side: Brand & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562654508-4c3246f238c6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay scale-110 animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-slate-900" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link href="/">
             <AmazoprintLogo className="brightness-0 invert scale-125 origin-left" />
          </Link>
          
          <div className="space-y-8">
            <h1 className="text-6xl font-bold text-white leading-tight tracking-tight">
              Industrial precision.<br />
              <span className="text-primary text-5xl">AI-powered</span> design.
            </h1>
            <p className="text-xl text-slate-300 max-w-lg font-medium leading-relaxed">
              Log in to access your dashboard, manage design quests, and experience the next generation of printing technology.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-8">
                {[
                    { icon: ShieldCheck, title: "Secure workflow", desc: "Enterprise-grade safety" },
                    { icon: Sparkles, title: "AI tools", desc: "Smart design assistance" },
                ].map((feature, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <feature.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-white">{feature.title}</p>
                            <p className="text-[10px] text-slate-400">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          
          <p className="text-slate-500 text-[11px] font-bold">
            © {new Date().getFullYear()} Amazoprint Inc.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <div className="lg:hidden mb-8">
               <AmazoprintLogo />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 font-semibold text-[13px]">
              Access your industrial design workspace
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-bold text-slate-400 ml-1">Email identity</Label>
                  <div className="relative">
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@identity.com" 
                        className="h-14 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:border-primary focus:ring-0 transition-all font-bold text-sm"
                        {...register('email')} 
                    />
                  </div>
                  {errors.email && <p className="text-[11px] font-bold text-red-500 ml-4">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-[11px] font-bold text-slate-400">Security key</Label>
                    <Link href="#" className="text-[11px] font-bold text-primary hover:opacity-70 transition-opacity">Reset key?</Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="h-14 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:border-primary focus:ring-0 transition-all font-bold text-sm"
                    {...register('password')} 
                  />
                  {errors.password && <p className="text-[11px] font-bold text-red-500 ml-4">{errors.password.message}</p>}
                </div>

                <div className="flex items-center space-x-3 px-1">
                    <Controller
                    control={control}
                    name="keepLoggedIn"
                    render={({ field }) => (
                        <Checkbox
                        id="keep-logged-in"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md h-5 w-5 border-2"
                        />
                    )}
                    />
                    <Label htmlFor="keep-logged-in" className="text-[12px] font-bold text-slate-500 cursor-pointer select-none">Remember this session</Label>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 group" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        Authorize access
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </Button>
            </form>
          </FormProvider>

          <div className="pt-8 text-center space-y-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[13px] font-bold text-slate-500">
                New to the platform?{' '}
                <Link href="/register" className="text-primary hover:underline font-bold">
                    Create new identity
                </Link>
            </p>
            <div className="pt-2">
                <Link 
                    href="/admin-login" 
                    className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors group"
                >
                    <ShieldCheck size={12} className="group-hover:rotate-12 transition-transform" />
                    Admin portal
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
