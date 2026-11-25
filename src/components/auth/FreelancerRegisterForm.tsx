'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AtSign,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Info,
  Link2,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Tag,
  UploadCloud,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OtpField } from '@/components/auth/OtpField';
import { cn } from '@/lib/utils';

const SPECIALIZATIONS = [
  'Graphic Design',
  'Print Design',
  'Packaging Design',
  'Logo & Branding',
  'Illustration',
  'Others',
] as const;

const BUSINESS_STATUS_OPTIONS = [
  'Individual / Unregistered',
  'Sole Proprietorship',
  'Partnership Firm',
  'LLP (Limited Liability Partnership)',
  'Private Limited Company',
] as const;

const freelancerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number.'),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{3,30}$/, '3-30 chars (letters, numbers, _ or -).'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  skills: z.array(z.string()).min(1, 'Select at least one design specialization.'),
  accountType: z.enum(['individual', 'agency'], {
    required_error: 'Please select an account type.',
  }),
  businessRegistrationStatus: z.string().optional(),
  portfolioUrl: z.string().trim().url('Please enter a valid URL.').optional().or(z.literal('')),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms of Service and Privacy Policy.' }),
  }),
});

type FreelancerRegisterValues = z.infer<typeof freelancerRegisterSchema>;

interface UploadedSample {
  name: string;
  url: string;
}

export function FreelancerRegisterForm({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sampleDesigns, setSampleDesigns] = useState<UploadedSample[]>([]);
  const [uploadingSamples, setUploadingSamples] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FreelancerRegisterValues>({
    resolver: zodResolver(freelancerRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      skills: [],
      accountType: 'individual',
      businessRegistrationStatus: '',
      portfolioUrl: '',
      acceptTerms: undefined as unknown as true,
    },
  });

  const selectedSkills = watch('skills') || [];

  const toggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setValue('skills', next, { shouldValidate: true });
  };

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = 5 - sampleDesigns.length;
    if (remainingSlots <= 0) {
      toast({
        variant: 'destructive',
        title: 'Limit reached',
        description: 'You can upload up to 5 sample designs.',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type) && !/\.(jpe?g|png|pdf)$/i.test(file.name)) {
        toast({
          variant: 'destructive',
          title: 'Unsupported file',
          description: `${file.name} is not a JPG, PNG, or PDF file.`,
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds the 10 MB limit.`,
        });
        return;
      }
    }

    setUploadingSamples(true);
    try {
      const uploaded: UploadedSample[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'freelancer-samples');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
        uploaded.push({ name: file.name, url: data.url });
      }
      setSampleDesigns((prev) => [...prev, ...uploaded]);
      toast({
        title: 'Sample designs uploaded',
        description: `${uploaded.length} file(s) uploaded successfully.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: err.message || 'Could not upload sample design.',
      });
    } finally {
      setUploadingSamples(false);
    }
  };

  const removeSample = (idx: number) => {
    setSampleDesigns((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: FreelancerRegisterValues) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'freelancer',
          name: data.name,
          email: data.email,
          phone: data.phone,
          username: data.username,
          password: data.password,
          skills: data.skills,
          accountType: data.accountType,
          businessRegistrationStatus: data.businessRegistrationStatus || '',
          portfolioUrl: data.portfolioUrl || '',
          sampleDesigns: sampleDesigns.map((s) => s.url),
          acceptTerms: data.acceptTerms,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'Your freelancer profile is now pending admin verification.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'py-6 px-4 sm:px-6 lg:px-8'
          : 'min-h-screen bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/70 py-8 px-4 sm:px-6 lg:px-8'
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <AmazoprintLogo />
          </Link>
          <div className="px-4 py-1.5 rounded-xl border border-purple-200 bg-white text-purple-800 font-bold text-sm shadow-sm">
            Free Freelancer Registration
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Left Form Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <UserPlus className="h-6 w-6 text-purple-700" />
                <h1 className="text-2xl font-bold text-slate-900">Freelancer Registration Form</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-700 text-white">
                  Free
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Join AmazoPrint as a designer and get orders from real customers.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center space-y-4">
                <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your email and mobile number have been verified. Our admin team will review your
                  profile, portfolio, and sample designs. Once approved, you&apos;ll be able to log
                  in and receive customer orders.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/">Back to Home</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
                  >
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fl-name" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <User className="h-4 w-4 text-slate-600" />
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="fl-name"
                    placeholder="Enter your full name"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-purple-600/20"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
                </div>

                {/* Email Address + Verify Email */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Mail className="h-4 w-4 text-slate-600" />
                    Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <OtpField
                        channel="email"
                        value={field.value}
                        onChange={field.onChange}
                        verified={emailVerified}
                        onVerifiedChange={setEmailVerified}
                        placeholder="Enter your email"
                        buttonLabel="Verify Email"
                      />
                    )}
                  />
                  {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
                </div>

                {/* Mobile Number + Send OTP */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Phone className="h-4 w-4 text-slate-600" />
                    Mobile Number <span className="text-rose-500">*</span>
                  </Label>
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
                        showCountryPrefix
                      />
                    )}
                  />
                  {errors.phone && <p className="text-xs text-rose-600">{errors.phone.message}</p>}
                </div>

                {/* Designer Username & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fl-username" className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <AtSign className="h-4 w-4 text-slate-600" />
                      Designer Username <span className="text-rose-500">*</span>
                      <span title="3-30 characters: letters, numbers, _ or -">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                      </span>
                    </Label>
                    <Input
                      id="fl-username"
                      placeholder="Choose a unique username"
                      className="h-11 rounded-xl border-slate-200 focus-visible:ring-purple-600/20"
                      {...register('username')}
                    />
                    {errors.username && (
                      <p className="text-xs text-rose-600">{errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fl-password" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Lock className="h-4 w-4 text-slate-600" />
                      Password <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="fl-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
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
                    {errors.password && (
                      <p className="text-xs text-rose-600">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                {/* Design Specialization */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Tag className="h-4 w-4 text-slate-600" />
                    Design Specialization <span className="text-rose-500">*</span>
                    <span className="text-xs font-normal text-slate-500">(Select one or more)</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SPECIALIZATIONS.map((skill) => {
                      const checked = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm transition-all',
                            checked
                              ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200'
                          )}
                        >
                          <span
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                              checked
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 bg-white'
                            )}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate">{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.skills && <p className="text-xs text-rose-600">{errors.skills.message}</p>}
                </div>

                {/* Account Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Users className="h-4 w-4 text-slate-600" />
                    Account Type <span className="text-rose-500">*</span>
                  </Label>
                  <Controller
                    name="accountType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        <Label
                          htmlFor="acc-individual"
                          className={cn(
                            'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                            field.value === 'individual'
                              ? 'border-purple-600 bg-purple-50/60'
                              : 'border-slate-200 hover:border-purple-200'
                          )}
                        >
                          <RadioGroupItem value="individual" id="acc-individual" className="mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Individual Freelancer</p>
                            <p className="text-xs text-slate-500 font-normal">I&apos;m a single designer</p>
                          </div>
                        </Label>

                        <Label
                          htmlFor="acc-agency"
                          className={cn(
                            'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                            field.value === 'agency'
                              ? 'border-purple-600 bg-purple-50/60'
                              : 'border-slate-200 hover:border-purple-200'
                          )}
                        >
                          <RadioGroupItem value="agency" id="acc-agency" className="mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Design Studio / Agency</p>
                            <p className="text-xs text-slate-500 font-normal">
                              I represent a design studio or team
                            </p>
                          </div>
                        </Label>
                      </RadioGroup>
                    )}
                  />
                  {errors.accountType && (
                    <p className="text-xs text-rose-600">{errors.accountType.message}</p>
                  )}
                </div>

                {/* Business Registration Status (Optional) */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Building2 className="h-4 w-4 text-slate-600" />
                    Business Registration Status{' '}
                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </Label>
                  <Controller
                    name="businessRegistrationStatus"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Portfolio Link (Optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="fl-portfolio" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Link2 className="h-4 w-4 text-slate-600" />
                    Portfolio Link{' '}
                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </Label>
                  <Input
                    id="fl-portfolio"
                    placeholder="https://your-portfolio-link.com"
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-purple-600/20"
                    {...register('portfolioUrl')}
                  />
                  {errors.portfolioUrl && (
                    <p className="text-xs text-rose-600">{errors.portfolioUrl.message}</p>
                  )}
                </div>

                {/* Sample Designs Upload (Optional) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ImagePlus className="h-4 w-4 text-slate-600" />
                    Sample Designs Upload{' '}
                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFilesUpload(e.target.files)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFilesUpload(e.dataTransfer.files);
                    }}
                    className={cn(
                      'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors',
                      isDragging
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-400 bg-slate-50/50'
                    )}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {uploadingSamples ? (
                        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                      ) : (
                        <UploadCloud className="h-8 w-8 text-purple-600" />
                      )}
                      <p className="text-sm font-semibold text-slate-800">Upload sample designs</p>
                      <p className="text-xs text-slate-500">
                        Drag &amp; drop files here or click to upload
                      </p>
                      <p className="text-[11px] text-slate-400">
                        (JPG, PNG, PDF, up to 10 MB, max 5 files)
                      </p>
                    </div>
                  </div>

                  {sampleDesigns.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sampleDesigns.map((sample, idx) => (
                        <div
                          key={sample.url}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900"
                        >
                          <span className="truncate max-w-[180px] font-medium">{sample.name}</span>
                          <button
                            type="button"
                            onClick={() => removeSample(idx)}
                            className="text-purple-500 hover:text-rose-600"
                            aria-label={`Remove ${sample.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Terms of Service & Privacy Policy */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Controller
                      name="acceptTerms"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="fl-acceptTerms"
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true ? true : false)}
                        />
                      )}
                    />
                    <Label htmlFor="fl-acceptTerms" className="text-sm text-slate-700 font-normal cursor-pointer">
                      I agree to the AmazoPrint{' '}
                      <Link href="/terms" className="text-purple-700 font-semibold underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-purple-700 font-semibold underline">
                        Privacy Policy
                      </Link>
                      . <span className="text-rose-500">*</span>
                    </Label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-xs text-rose-600">{errors.acceptTerms.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || uploadingSamples}
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-600/25"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Register as a Freelancer (Free)'
                  )}
                </Button>

                <p className="text-center text-xs text-slate-500 pt-1">
                  Already have an account?{' '}
                  <Link href="/login" className="text-purple-700 font-semibold hover:underline">
                    Login
                  </Link>{' '}
                  • Looking to print?{' '}
                  <Link href="/register" className="text-purple-700 font-semibold hover:underline">
                    Create Client Account
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Registration & Approval Process */}
            <div className="bg-white rounded-3xl shadow-lg shadow-purple-900/5 border border-purple-100 p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Registration &amp; Approval Process</h2>
              <div className="space-y-4">
                {[
                  {
                    icon: FileText,
                    title: '1. Register',
                    desc: 'Fill the free registration form with your details.',
                  },
                  {
                    icon: Mail,
                    title: '2. Verify',
                    desc: 'Confirm your email and mobile number (OTP).',
                  },
                  {
                    icon: ShieldCheck,
                    title: '3. Admin Verification',
                    desc: 'Our team will review your profile, portfolio, and details.',
                  },
                  {
                    icon: UserCheck,
                    title: '4. Profile Approval',
                    desc: 'Once approved, your designer profile will be activated.',
                  },
                  {
                    icon: ShoppingCart,
                    title: '5. Get Orders',
                    desc: 'Start receiving design orders from AmazoPrint customers.',
                  },
                ].map((step) => (
                  <div key={step.title} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-purple-50/80 rounded-3xl border border-purple-100 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-700" />
                <h2 className="text-lg font-bold text-slate-900">Key Points</h2>
              </div>
              <ul className="space-y-2.5">
                {[
                  'Registration is completely free.',
                  'Email verification and Mobile OTP are mandatory.',
                  <>
                    Profile will be approved only <strong>after admin verification</strong>.
                  </>,
                  "You'll start getting customer orders only after approval.",
                  'Portfolio link and sample uploads are optional but highly recommended.',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
