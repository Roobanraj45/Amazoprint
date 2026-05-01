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
import { Loader2, ArrowRight, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { loginPrinter } from '@/app/actions/printer-actions';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PrinterLoginPage() {
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
      const result = await loginPrinter(data);
      
      toast({
        title: 'Authentication successful',
        description: 'Welcome to the Printer Dashboard.',
      });
      
      router.push('/printer/dashboard');
      router.refresh();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: error.message || 'Verification failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left Side: Industrial Brand Presence */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-multiply grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link href="/">
             <AmazoprintLogo className="brightness-0 invert scale-125 origin-left" />
          </Link>
          
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-black uppercase tracking-widest">
                <Printer size={14} />
                Printer Partner Portal
            </div>
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter uppercase font-headline">
              Powering<br />
              <span className="text-primary">Production</span><br />
              at Scale.
            </h1>
            <p className="text-lg text-slate-400 max-w-lg font-medium leading-relaxed">
              Access the industrial command center to manage orders, track fulfillment metrics, and synchronize your printing facility with global demand.
            </p>
            
            <div className="flex flex-col gap-4 pt-4">
                {[
                    "Live order management",
                    "Automated fulfillment tracking",
                    "Quality audit dashboard",
                    "Direct payout integration"
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                        <CheckCircle2 size={18} className="text-primary" />
                        {feature}
                    </div>
                ))}
            </div>
          </div>
          
          <p className="text-slate-600 text-[11px] font-black uppercase tracking-widest">
            Industrial Systems Interface v4.0
          </p>
        </div>
      </div>

      {/* Right Side: Login Terminal */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-4">
            <div className="lg:hidden mb-8">
               <AmazoprintLogo />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase font-headline">Partner Login</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
              Secure access for verified print-press facilities
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Identity (Email)</Label>
                  <Input 
                      id="email" 
                      type="email" 
                      placeholder="factory.lead@amazoprint.com" 
                      className="h-14 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:border-primary focus:ring-0 transition-all font-bold text-sm"
                      {...register('email')} 
                  />
                  {errors.email && <p className="text-[11px] font-bold text-red-500 ml-4">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Key</Label>
                    <Link href="#" className="text-[10px] font-black text-primary hover:opacity-70 transition-opacity uppercase tracking-widest">Forgot key?</Link>
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

                <div className="flex items-center space-x-3 px-1 pt-2">
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
                    <Label htmlFor="keep-logged-in" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Maintain persistent session</Label>
                </div>
              </div>

              <Button type="submit" className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] group" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        Initialize Dashboard
                        <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </Button>
            </form>
          </FormProvider>

          <div className="pt-10 text-center space-y-6 border-t-2 border-slate-50 dark:border-slate-900 border-dashed">
            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Not a partner yet?
                </p>
                <Link 
                    href="/printer-registration" 
                    className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline underline-offset-4 decoration-2"
                >
                    Apply for Production Access
                </Link>
            </div>
            
            <div className="flex justify-center items-center gap-6">
                <Link 
                    href="/admin-login" 
                    className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group uppercase tracking-widest"
                >
                    <ShieldCheck size={14} className="group-hover:rotate-12 transition-transform" />
                    Internal Admin
                </Link>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group uppercase tracking-widest"
                >
                    Customer Login
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
