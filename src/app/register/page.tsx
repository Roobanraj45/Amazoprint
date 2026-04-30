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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AmazoprintLogo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, User, Palette, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
    role: z.enum(['user', 'freelancer'], { required_error: 'Please select a role.' }),
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
    // Freelancer specific fields
    skills: z.string().optional(),
    portfolioUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    bio: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const methods = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const { register, handleSubmit, watch, formState: { errors } } = methods;
  const role = watch('role');

  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast({
        title: 'Identity created!',
        description: 'Welcome to the future of printing.',
      });
      router.push('/login');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Creation failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left Side: Brand Visuals */}
      <div className="hidden lg:flex lg:w-1/3 relative bg-slate-900 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-12">
          <Link href="/">
             <AmazoprintLogo className="brightness-0 invert scale-110 origin-left" />
          </Link>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Join the industrial<br />
              <span className="text-primary text-5xl">Revolution.</span>
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">
                Connect with professional designers or manage your industrial printing projects with our advanced AI ecosystem.
            </p>
            
            <div className="space-y-4 pt-6">
                {[
                    { icon: Zap, title: "Instant scaling", desc: "Grow your print business" },
                    { icon: Globe, title: "Global network", desc: "Expert designers worldwide" },
                    { icon: ShieldCheck, title: "Verified quality", desc: "Print-ready guarantees" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                            <item.icon size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-white">{item.title}</p>
                            <p className="text-[10px] text-slate-500 font-semibold">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          
          <p className="text-slate-600 text-[11px] font-bold">
            Precision engineering • Design excellence
          </p>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative overflow-y-auto">
        <div className="w-full max-w-2xl space-y-10 py-12">
          <div className="text-center lg:text-left space-y-3">
             <div className="lg:hidden flex justify-center mb-6">
               <AmazoprintLogo />
             </div>
             <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create new identity</h2>
             <p className="text-slate-500 font-semibold text-[13px]">Select your role to begin the journey</p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-10">
              {/* Role Selection */}
              <div className="space-y-4">
                <RadioGroup
                  defaultValue={role}
                  onValueChange={(value) => methods.setValue('role', value as 'user' | 'freelancer')}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <RadioGroupItem value="user" id="client" className="peer sr-only" {...register('role')} />
                    <Label
                      htmlFor="client"
                      className="flex items-start gap-4 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-primary/30 transition-all cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border shadow-sm group-peer-data-[state=checked]:text-primary group-peer-data-[state=checked]:border-primary/20">
                        <User size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold mb-1">Corporate client</p>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">I need professional designs and industrial printing services.</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem
                      value="freelancer"
                      id="freelancer"
                      className="peer sr-only"
                      {...register('role')}
                    />
                    <Label
                      htmlFor="freelancer"
                      className="flex items-start gap-4 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-primary/30 transition-all cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border shadow-sm group-peer-data-[state=checked]:text-primary group-peer-data-[state=checked]:border-primary/20">
                        <Palette size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold mb-1">Expert designer</p>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">I am a professional looking to contribute to global projects.</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.role && <p className="text-[11px] font-bold text-red-500 text-center">{errors.role.message}</p>}
              </div>

              {role && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 ml-1">Full identity</Label>
                          <Input id="name" placeholder="John Doe" className="h-12 px-5 rounded-xl border-2 bg-slate-50/50 focus:border-primary transition-all font-bold text-sm" {...register('name')} />
                          {errors.name && <p className="text-[11px] font-bold text-red-500 ml-2">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[11px] font-bold text-slate-400 ml-1">Primary email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" className="h-12 px-5 rounded-xl border-2 bg-slate-50/50 focus:border-primary transition-all font-bold text-sm" {...register('email')} />
                        {errors.email && <p className="text-[11px] font-bold text-red-500 ml-2">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[11px] font-bold text-slate-400 ml-1">Secure contact</Label>
                        <Input id="phone" type="tel" placeholder="+91 00000 00000" className="h-12 px-5 rounded-xl border-2 bg-slate-50/50 focus:border-primary transition-all font-bold text-sm" {...register('phone')} />
                        {errors.phone && <p className="text-[11px] font-bold text-red-500 ml-2">{errors.phone.message}</p>}
                      </div>
                  </div>
                  
                  {role === 'freelancer' && (
                    <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl" className="text-[11px] font-bold text-slate-400 ml-1">Portfolio matrix (URL)</Label>
                        <Input id="portfolioUrl" placeholder="https://behance.net/identity" className="h-12 px-5 rounded-xl border-2 bg-white focus:border-primary transition-all font-bold text-sm" {...register('portfolioUrl')} />
                        {errors.portfolioUrl && <p className="text-[11px] font-bold text-red-500 ml-2">{errors.portfolioUrl.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skills" className="text-[11px] font-bold text-slate-400 ml-1">Skill arsenal</Label>
                        <Textarea id="skills" placeholder="Logo design, typography, branding..." className="min-h-[100px] p-5 rounded-xl border-2 bg-white focus:border-primary transition-all font-bold text-sm resize-none" {...register('skills')} />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="password" className="text-[11px] font-bold text-slate-400 ml-1">Secure key</Label>
                          <Input id="password" type="password" placeholder="••••••••" className="h-12 px-5 rounded-xl border-2 bg-slate-50/50 focus:border-primary transition-all font-bold text-sm" {...register('password')} />
                          {errors.password && <p className="text-[11px] font-bold text-red-500 ml-2">{errors.password.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-[11px] font-bold text-slate-400 ml-1">Verify key</Label>
                          <Input id="confirm-password" type="password" placeholder="••••••••" className="h-12 px-5 rounded-xl border-2 bg-slate-50/50 focus:border-primary transition-all font-bold text-sm" {...register('confirmPassword')} />
                          {errors.confirmPassword && <p className="text-[11px] font-bold text-red-500 ml-2">{errors.confirmPassword.message}</p>}
                      </div>
                  </div>

                  <div className="pt-6">
                    <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 group" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Establish identity
                                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </FormProvider>

          <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[13px] font-bold text-slate-500">
                Already part of the network?{' '}
                <Link href="/login" className="text-primary hover:underline font-bold">
                    Authorized login
                </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
