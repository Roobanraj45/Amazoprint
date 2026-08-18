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
import { 
  Loader2, ShieldAlert, ShieldCheck, ArrowRight, Home, Lock, 
  Eye, EyeOff, Sparkles, Activity, Database, KeyRound, Building2, Printer 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid administrator email' }),
  password: z.string().min(1, { message: 'Security key is required' }),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      
      let dashboardUrl = '/';
      switch (result.role) {
        case 'admin':
        case 'super_admin':
        case 'company_admin':
        case 'designer': dashboardUrl = '/admin/dashboard'; break;
        case 'accounts': dashboardUrl = '/accounts/dashboard'; break;
        case 'printer': dashboardUrl = '/printer/dashboard'; break;
        default: dashboardUrl = '/admin/dashboard';
      }

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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Left Side: Enterprise Command Center Showcase */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-slate-950 overflow-hidden flex-col justify-between p-12 xl:p-16 text-white selection:bg-rose-500 selection:text-white">
        
        {/* Background Visual Effects & Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/25 via-slate-950 to-black" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <AmazoprintLogo className="brightness-0 invert scale-110 origin-left" />
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider">
            <ShieldAlert size={13} />
            <span>Restricted Staff Access</span>
          </div>
        </div>

        {/* Center Content: Governance & Platform Pillars */}
        <div className="relative z-10 my-auto py-6 space-y-8 max-w-2xl">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
              <KeyRound size={13} /> Multi-Tier Central Command
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Enterprise administration, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-indigo-300 to-emerald-400">
                governance & press operations.
              </span>
            </h1>
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-lg">
              Manage live production pipelines, review digital print verification proofs, oversee vendor financial settlements, and monitor customer orders in real time.
            </p>
          </div>

          {/* Admin Pillars Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-rose-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Activity size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Live Pipeline Operations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatch orders directly to partner facilities, track Shiprocket tracking events, and oversee proofing checkpoints.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-emerald-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Database size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Split GST & Payout Ledgers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated tax audit engines with state-code-based CGST, SGST, and IGST breakdowns for all client orders and vendor partner invoices.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-indigo-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Zero-Trust Role Governance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Role-based access controls for Super Admins, Production Managers, Accountants, and Design Pre-flight Engineers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-amber-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Catalog & Pricing Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure direct selling products, sub-product tiers, quantity volume discounts, and custom finish options dynamically.
              </p>
            </div>

          </div>

          {/* Operational Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-center">
            <div>
              <p className="text-lg font-black text-rose-400 font-mono">99.9%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uptime SLA</p>
            </div>
            <div className="border-x border-rose-500/20">
              <p className="text-lg font-black text-emerald-400 font-mono">256-Bit</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Encrypted Logs</p>
            </div>
            <div>
              <p className="text-lg font-black text-indigo-400 font-mono">Real-Time</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Press Dispatch</p>
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="relative z-10 flex items-center justify-between text-slate-500 text-[11px] font-medium border-t border-slate-900 pt-4">
          <p>© {new Date().getFullYear()} AmazoPrint Internal Systems. Authorized Staff Access Only.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-slate-400 transition-colors">Public Store</Link>
            <Link href="/support" className="hover:text-slate-400 transition-colors">IT Helpdesk</Link>
          </div>
        </div>

      </div>

      {/* Right Side: High-Security Admin Login Terminal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-2">
            <div className="lg:hidden mb-6">
               <AmazoprintLogo />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
              <ShieldAlert size={12} /> Staff Terminal
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Admin Portal
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Authenticate your administrator credentials to initialize session.
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
              
              <div className="space-y-4">
                
                {/* Admin Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Administrator Email
                  </Label>
                  <Input 
                      id="email" 
                      type="email" 
                      placeholder="admin@amazoprint.com" 
                      className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-sm"
                      {...register('email')} 
                  />
                  {errors.email && <p className="text-[11px] font-bold text-red-500">{errors.email.message}</p>}
                </div>

                {/* Security Key Field with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Security Key / Master Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      className="h-12 pl-4 pr-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-sm"
                      {...register('password')} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] font-bold text-red-500">{errors.password.message}</p>}
                </div>

                {/* Maintain Session */}
                <div className="flex items-center space-x-2 pt-1">
                    <Controller
                      control={control}
                      name="keepLoggedIn"
                      render={({ field }) => (
                          <Checkbox
                            id="keep-logged-in"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="rounded h-4 w-4"
                          />
                      )}
                    />
                    <Label htmlFor="keep-logged-in" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Maintain secure authorization token
                    </Label>
                </div>

              </div>

              {/* Submit Action */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-sm font-extrabold shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all active:scale-[0.98] group bg-rose-600 hover:bg-rose-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        Authorize Staff Access
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </Button>
            </form>
          </FormProvider>

          {/* Quick Portal Switcher */}
          <div className="pt-6 text-center space-y-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500">
                Switch to public or partner portals:
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-3">
                <Link 
                    href="/login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                >
                    <Building2 size={13} className="text-primary group-hover:rotate-12 transition-transform" />
                    Customer Store Login
                </Link>
                <Link 
                    href="/printer-login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                >
                    <Printer size={13} className="text-violet-500 group-hover:rotate-12 transition-transform" />
                    Printer Partner Login
                </Link>
            </div>

            <div className="pt-2">
                <Link 
                    href="/" 
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                    <Home size={12} />
                    Return to Public Homepage
                </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
