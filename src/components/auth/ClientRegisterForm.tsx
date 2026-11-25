'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { OtpField } from '@/components/auth/OtpField';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const clientRegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
    phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number.'),
    email: z.string().trim().email('Please enter a valid email address.'),
    gstNumber: z
      .string()
      .trim()
      .toUpperCase()
      .refine((val) => !val || GSTIN_REGEX.test(val), 'Invalid GSTIN (e.g., 33AAAAA0000A1Z5)')
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms & Conditions and Privacy Policy.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ClientRegisterValues = z.infer<typeof clientRegisterSchema>;

export function ClientRegisterForm({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationDone, setRegistrationDone] = useState<{
    email: string;
    devVerificationUrl?: string;
  } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientRegisterValues>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      gstNumber: '',
      password: '',
      confirmPassword: '',
      acceptTerms: undefined as unknown as true,
    },
  });

  const onSubmit = async (data: ClientRegisterValues) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          name: data.name,
          phone: data.phone,
          email: data.email,
          gstNumber: data.gstNumber || '',
          password: data.password,
          acceptTerms: data.acceptTerms,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setRegistrationDone({
        email: data.email,
        devVerificationUrl: result.devVerificationUrl,
      });

      toast({
        title: 'Account Created!',
        description: 'Please check your email for the verification link.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'flex items-center justify-center p-4 sm:p-8'
          : 'min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-4 sm:p-8'
      }
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100/80 p-6 sm:p-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex flex-col items-center">
            <AmazoprintLogo />
            <span className="text-xs font-medium text-slate-500 mt-1">Your Printing Partner</span>
          </Link>

          <div className="pt-2 flex items-center justify-center gap-2 text-purple-800">
            <UserPlus className="h-6 w-6" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Your Account</h1>
          </div>
          <p className="text-sm text-slate-500">Register and start printing with AmazoPrint</p>
        </div>

        {registrationDone ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Verify Your Email Address</h2>
            <p className="text-sm text-slate-600">
              We&apos;ve sent a verification link to <strong>{registrationDone.email}</strong>. Please
              click the link in your inbox to activate your account before logging in.
            </p>
            {registrationDone.devVerificationUrl && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-800 break-all">
                <p className="font-semibold mb-1">Dev Mode Verification Link:</p>
                <Link href={registrationDone.devVerificationUrl} className="underline font-medium">
                  {registrationDone.devVerificationUrl}
                </Link>
              </div>
            )}
            <Button
              asChild
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
            >
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 sm:p-6 space-y-5">
              {/* Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-start gap-2 sm:gap-4">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:pt-2.5">
                  <User className="h-4 w-4 text-purple-600" />
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <div className="space-y-1">
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-purple-600/20"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
                </div>
              </div>

              {/* Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-start gap-2 sm:gap-4">
                <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:pt-2.5">
                  <Phone className="h-4 w-4 text-purple-600" />
                  Mobile Number <span className="text-rose-500">*</span>
                </Label>
                <div className="space-y-1">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <OtpField
                        channel="phone"
                        value={field.value}
                        onChange={field.onChange}
                        verified={phoneVerified}
                        onVerifiedChange={setPhoneVerified}
                        placeholder="Enter 10-digit mobile number"
                        buttonLabel="Send OTP"
                        helperText="OTP verification required"
                        showCountryPrefix
                      />
                    )}
                  />
                  {errors.phone && <p className="text-xs text-rose-600">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-start gap-2 sm:gap-4">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:pt-2.5">
                  <Mail className="h-4 w-4 text-purple-600" />
                  Email Address <span className="text-rose-500">*</span>
                </Label>
                <div className="space-y-1.5">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-purple-600/20"
                    {...register('email')}
                  />
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span>A verification link will be sent to your email</span>
                  </p>
                  {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
                </div>
              </div>

              {/* GST Number (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-start gap-2 sm:gap-4">
                <Label htmlFor="gstNumber" className="flex items-start gap-2 text-sm font-semibold text-slate-800 sm:pt-2">
                  <FileText className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <span>
                    GST Number
                    <span className="block text-xs font-normal text-slate-500">(Optional)</span>
                  </span>
                </Label>
                <div className="space-y-1.5">
                  <Input
                    id="gstNumber"
                    placeholder="Enter GSTIN (e.g., 33AAAAA0000A1Z5)"
                    maxLength={15}
                    className="h-11 rounded-xl bg-white border-slate-200 uppercase focus-visible:ring-purple-600/20"
                    {...register('gstNumber')}
                  />
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Info className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span>For business customers who require GST invoices</span>
                  </p>
                  {errors.gstNumber && <p className="text-xs text-rose-600">{errors.gstNumber.message}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-start gap-2 sm:gap-4">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:pt-2.5">
                  <Lock className="h-4 w-4 text-purple-600" />
                  Password <span className="text-rose-500">*</span>
                </Label>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="h-11 pr-10 rounded-xl bg-white border-slate-200 focus-visible:ring-purple-600/20"
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
              </div>

              {/* Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] items-start gap-2 sm:gap-4">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold text-slate-800 sm:pt-2.5">
                  <Lock className="h-4 w-4 text-purple-600" />
                  Confirm Password <span className="text-rose-500">*</span>
                </Label>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      className="h-11 pr-10 rounded-xl bg-white border-slate-200 focus-visible:ring-purple-600/20"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2.5">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="acceptTerms"
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true ? true : false)}
                    />
                  )}
                />
                <Label htmlFor="acceptTerms" className="text-sm text-slate-700 font-normal cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" className="text-purple-700 font-semibold underline hover:text-purple-900">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-purple-700 font-semibold underline hover:text-purple-900">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-rose-600 text-center">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-600/25"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        )}

        {/* Footer Links */}
        <div className="text-center space-y-2 pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-700 font-bold hover:underline">
              Login
            </Link>
          </p>
          <p className="text-xs text-slate-500">
            Are you a designer?{' '}
            <Link href="/freelancer-registration" className="text-purple-700 font-semibold hover:underline">
              Register as a Freelancer (Free)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
