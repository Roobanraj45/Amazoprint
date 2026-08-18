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
  Loader2, ArrowRight, ShieldCheck, Sparkles, Printer, Tag, 
  Percent, Truck, Gift, Zap, Eye, EyeOff, CheckCircle2, Star, Check 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  keepLoggedIn: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const handleCopyOffer = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: `Coupon Code "${code}" Copied!`,
      description: 'Paste it during checkout to claim your discount.',
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

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
        description: 'Welcome back to AmazoPrint!',
      });
      
      let dashboardUrl = '/';
      switch (result.role) {
        case 'freelancer': dashboardUrl = '/freelancer/dashboard'; break;
        case 'printer': dashboardUrl = '/printer/dashboard'; break;
        case 'user': dashboardUrl = '/client/dashboard'; break;
        case 'accounts': dashboardUrl = '/accounts/dashboard'; break;
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Left Side: Special Offers, Discounts & Feature Showcase */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 xl:p-16 text-white selection:bg-primary selection:text-white">
        
        {/* Background Visual Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-slate-900/80 to-slate-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <AmazoprintLogo className="brightness-0 invert scale-110 origin-left" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Member Benefits Active</span>
          </div>
        </div>

        {/* Center Content: Headline & Deals Matrix */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-2xl">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              India's Premier Custom Print Platform
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Create, customize & print <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-emerald-400">
                with exclusive member savings.
              </span>
            </h1>
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-lg">
              Sign in to unlock personalized member discounts, access 10,000+ designer templates, and track high-definition print orders in real-time.
            </p>
          </div>

          {/* Active Offers Banner Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Offer 1 */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900/80 border border-indigo-500/20 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
              <div className="absolute top-2 right-2 text-indigo-400/20 group-hover:text-indigo-400/30 transition-colors">
                <Percent className="w-12 h-12" />
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest">
                    NEW MEMBER
                  </span>
                  <span className="text-xs font-bold text-indigo-300">Flat 20% OFF</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">On your first custom visiting cards, stickers, or apparel order.</p>
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCopyOffer('PRINT20')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold transition-all"
                  >
                    {copiedCode === 'PRINT20' ? <Check className="w-3 h-3 text-emerald-400" /> : <Tag className="w-3 h-3" />}
                    {copiedCode === 'PRINT20' ? 'COPIED!' : 'CODE: PRINT20'}
                  </button>
                  <span className="text-[10px] text-slate-400">Min. ₹499</span>
                </div>
              </div>
            </div>

            {/* Offer 2 */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-500/20 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-2 right-2 text-emerald-400/20 group-hover:text-emerald-400/30 transition-colors">
                <Truck className="w-12 h-12" />
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest">
                    FREE DELIVERY
                  </span>
                  <span className="text-xs font-bold text-emerald-300">Express Courier</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Zero shipping fee on all bulk corporate stationery and merchandise.</p>
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCopyOffer('FREESHIP')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all"
                  >
                    {copiedCode === 'FREESHIP' ? <Check className="w-3 h-3 text-emerald-400" /> : <Gift className="w-3 h-3" />}
                    {copiedCode === 'FREESHIP' ? 'COPIED!' : 'CODE: FREESHIP'}
                  </button>
                  <span className="text-[10px] text-slate-400">All India</span>
                </div>
              </div>
            </div>

          </div>

          {/* Feature Pillars */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Sparkles, title: "AI Studio", desc: "Live 3D proofs & pre-flight" },
              { icon: ShieldCheck, title: "100% Quality", desc: "Industrial press precision" },
              { icon: Zap, title: "GST Split", desc: "Auto state code invoice" },
            ].map((feature, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-1.5">
                  <feature.icon size={15} />
                </div>
                <p className="text-xs font-bold text-white">{feature.title}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Social Proof Bar */}
          <div className="flex items-center gap-3 pt-2 text-slate-400 text-xs font-medium">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">R</div>
              <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">A</div>
              <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">S</div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="text-slate-300 font-bold ml-1">4.9/5</span>
              <span>from 50,000+ businesses</span>
            </div>
          </div>

        </div>
        
        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-slate-500 text-[11px] font-medium border-t border-slate-800/60 pt-4">
          <p>© {new Date().getFullYear()} AmazoPrint. Official GST Registered Platform.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-slate-400 transition-colors">Help Center</Link>
          </div>
        </div>

      </div>

      {/* Right Side: High-Conversion Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-2">
            <div className="lg:hidden mb-6">
               <AmazoprintLogo />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <Sparkles size={12} /> Member Access
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Enter your credentials to access your design workspace and orders.
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
              
              <div className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@business.com" 
                      className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                      {...register('email')} 
                  />
                  {errors.email && <p className="text-[11px] font-bold text-red-500">{errors.email.message}</p>}
                </div>

                {/* Password Field with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </Label>
                    <Link href="#" className="text-xs font-bold text-primary hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password"
                      className="h-12 pl-4 pr-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
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

                {/* Remember Me */}
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
                      Keep me logged in on this device
                    </Label>
                </div>

              </div>

              {/* Submit Action */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-sm font-extrabold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] group bg-primary hover:bg-primary/90 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        Sign in to Account
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </Button>
            </form>
          </FormProvider>

          {/* Registration & Portals */}
          <div className="pt-6 text-center space-y-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Don't have an AmazoPrint account?{' '}
                <Link href="/register" className="text-primary hover:underline font-bold">
                    Sign up with bonus discount
                </Link>
            </p>
            
            <div className="pt-2 flex flex-wrap justify-center items-center gap-3">
                <Link 
                    href="/printer-login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                >
                    <Printer size={13} className="text-primary group-hover:rotate-12 transition-transform" />
                    Printer Partner Login
                </Link>
                <Link 
                    href="/admin-login" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group"
                >
                    <ShieldCheck size={13} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
                    Admin Staff Portal
                </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
