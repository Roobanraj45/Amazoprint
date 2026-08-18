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
  Loader2, ArrowRight, ShieldCheck, Printer, CheckCircle2, 
  Factory, Coins, Truck, BarChart3, Clock, Eye, EyeOff, Sparkles, Building2 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { loginPrinter } from '@/app/actions/printer-actions';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid work email' }),
  password: z.string().min(1, { message: 'Password is required' }),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PrinterLoginPage() {
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
      const result = await loginPrinter(data);
      
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Left Side: Industrial Partner Network Content */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-slate-950 overflow-hidden flex-col justify-between p-12 xl:p-16 text-white selection:bg-violet-500 selection:text-white">
        
        {/* Background Visual Texture & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-900/30 via-slate-950 to-black" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <AmazoprintLogo className="brightness-0 invert scale-110 origin-left" />
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-black uppercase tracking-wider">
            <Printer size={13} />
            <span>Industrial Press Network</span>
          </div>
        </div>

        {/* Center Content: Partner Features & Value Propositions */}
        <div className="relative z-10 my-auto py-6 space-y-8 max-w-2xl">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles size={13} /> High-Volume Print Production Hub
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Scale your printing facility with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400">
                automated orders & guaranteed payouts.
              </span>
            </h1>
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-lg">
              AmazoPrint connects commercial offset, digital, and screen-printing facilities with verified nationwide client demand. Maximize machine uptime without sales overhead.
            </p>
          </div>

          {/* Printer Partner Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-violet-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Factory size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Direct Production Feeds</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive pre-flighted print-ready 300 DPI vector artwork, die-cuts, and precise job specifications ready for press.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-emerald-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">48-Hr Split GST Payouts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated partner tax invoicing with CGST, SGST, and IGST breakdowns directly settled into your verified bank account.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-indigo-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Truck size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Doorstep Logistics Integration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated Shiprocket courier pickups. Print the pre-generated shipping label and dispatch with zero courier coordination hassle.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 hover:border-amber-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Real-Time Capacity Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Control your active machinery capacity, update turnaround times, and track material utilization metrics from one unified screen.
              </p>
            </div>

          </div>

          {/* Operational Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-violet-950/20 border border-violet-500/20 text-center">
            <div>
              <p className="text-lg font-black text-violet-400 font-mono">100+</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Presses</p>
            </div>
            <div className="border-x border-violet-500/20">
              <p className="text-lg font-black text-emerald-400 font-mono">48 Hrs</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast Settlement</p>
            </div>
            <div>
              <p className="text-lg font-black text-indigo-400 font-mono">99.4%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">On-Time SLA</p>
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="relative z-10 flex items-center justify-between text-slate-500 text-[11px] font-medium border-t border-slate-900 pt-4">
          <p>© {new Date().getFullYear()} AmazoPrint Manufacturing Network. High Precision Industrial Systems.</p>
          <div className="flex gap-4">
            <Link href="/printer-registration" className="text-violet-400 hover:underline">Register New Press</Link>
            <Link href="/support" className="hover:text-slate-400 transition-colors">Vendor Support</Link>
          </div>
        </div>

      </div>

      {/* Right Side: High-Security Printer Login Terminal */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-2">
            <div className="lg:hidden mb-6">
               <AmazoprintLogo />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-bold">
              <Printer size={12} /> Partner Operations Portal
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Partner Login
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Access your production queue, dispatch schedules, and payment ledger.
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
              
              <div className="space-y-4">
                
                {/* Work Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Registered Facility Email
                  </Label>
                  <Input 
                      id="email" 
                      type="email" 
                      placeholder="factory.ops@printpartner.com" 
                      className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium text-sm"
                      {...register('email')} 
                  />
                  {errors.email && <p className="text-[11px] font-bold text-red-500">{errors.email.message}</p>}
                </div>

                {/* Password Field with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Security Key / Password
                    </Label>
                    <Link href="#" className="text-xs font-bold text-violet-600 hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your security key"
                      className="h-12 pl-4 pr-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium text-sm"
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
                      Maintain persistent session for this machine
                    </Label>
                </div>

              </div>

              {/* Submit Action */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-sm font-extrabold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all active:scale-[0.98] group bg-violet-600 hover:bg-violet-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        Access Production Dashboard
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </Button>
            </form>
          </FormProvider>

          {/* Registration & Other Portals */}
          <div className="pt-6 text-center space-y-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Operate a printing or fabrication press?
              </p>
              <Link 
                  href="/printer-registration" 
                  className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
              >
                  Apply to Join AmazoPrint Press Network
                  <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="pt-2 flex flex-wrap justify-center items-center gap-3">
                <Link 
                    href="/login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                >
                    <Building2 size={13} className="text-primary group-hover:rotate-12 transition-transform" />
                    Customer Store Login
                </Link>
                <Link 
                    href="/admin-login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                >
                    <ShieldCheck size={13} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
                    Admin Portal
                </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
