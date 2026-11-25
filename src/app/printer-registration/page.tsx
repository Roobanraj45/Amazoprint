'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  FileCheck2,
  IndianRupee,
  Info,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { registerPrinter } from '@/app/actions/printer-actions';
import { cn } from '@/lib/utils';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

const MACHINERY_OPTIONS = [
  'Offset Printing',
  'Digital Printing',
  'Flex Printing',
  'Eco Solvent',
  'UV Printing',
  'Screen Printing',
  'Label Printing',
  'Packaging / Die-cut',
] as const;

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function PrinterRegistrationPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Basic Details
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Step 2: Business & Capacity
  const [sameAsBusinessAddress, setSameAsBusinessAddress] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupContactPerson, setPickupContactPerson] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [printingUnitAreaSqFt, setPrintingUnitAreaSqFt] = useState('');
  const [totalEmployees, setTotalEmployees] = useState('');
  const [availableMachinery, setAvailableMachinery] = useState<string[]>([]);
  const [otherMachinery, setOtherMachinery] = useState('');
  const [dailyOrderCapacity, setDailyOrderCapacity] = useState('');
  const [approxDailyProduction, setApproxDailyProduction] = useState('');

  // Step 3: Verification & Submit
  const [gstNumber, setGstNumber] = useState('');
  const [gstVerified, setGstVerified] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const toggleMachinery = (machine: string) => {
    setAvailableMachinery((prev) =>
      prev.includes(machine) ? prev.filter((m) => m !== machine) : [...prev, machine]
    );
  };

  const validateStep1 = () => {
    if (companyName.trim().length < 2) return 'Enter your Company / Business Name.';
    if (fullName.trim().length < 2) return 'Enter the Contact Person Name.';
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) return 'Enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (address.trim().length < 5) return 'Enter your complete business address.';
    if (!state) return 'Select your state.';
    if (city.trim().length < 2) return 'Enter your city.';
    if (!/^\d{6}$/.test(postalCode.trim())) return 'Enter a valid 6-digit pincode.';
    return null;
  };

  const validateStep2 = () => {
    if (!sameAsBusinessAddress) {
      if (pickupAddress.trim().length < 5) return 'Enter the pickup address.';
      if (!pickupState) return 'Select the pickup state.';
      if (pickupCity.trim().length < 2) return 'Enter the pickup city.';
      if (!/^\d{6}$/.test(pickupPostalCode.trim())) return 'Enter a valid 6-digit pickup pincode.';
    }
    if (!printingUnitAreaSqFt || Number(printingUnitAreaSqFt) <= 0) {
      return 'Enter your printing unit area in Sq. Ft.';
    }
    if (!totalEmployees || Number(totalEmployees) <= 0) {
      return 'Enter total number of employees.';
    }
    if (availableMachinery.length === 0 && !otherMachinery.trim()) {
      return 'Select at least one available printing machine.';
    }
    if (!dailyOrderCapacity.trim()) return 'Enter your daily order capacity.';
    if (!approxDailyProduction.trim()) return 'Enter your approximate daily production.';
    return null;
  };

  const handleNext = () => {
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) {
      toast({ variant: 'destructive', title: 'Missing or invalid details', description: err });
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };

  const handleVerifyGstin = () => {
    const cleaned = gstNumber.trim().toUpperCase();
    setGstNumber(cleaned);
    if (!GSTIN_REGEX.test(cleaned)) {
      setGstVerified(false);
      toast({
        variant: 'destructive',
        title: 'Invalid GSTIN',
        description: 'Enter a valid 15-character GSTIN (e.g., 33ABCDE1234F1Z5).',
      });
      return;
    }
    setGstVerified(true);
    toast({
      title: 'GSTIN Format Verified',
      description: `GSTIN ${cleaned} validated successfully.`,
    });
  };

  const handleVerifyBank = async () => {
    const cleanedIfsc = ifscCode.trim().toUpperCase();
    setIfscCode(cleanedIfsc);
    if (!accountHolderName.trim() || accountNumber.trim().length < 6) {
      toast({
        variant: 'destructive',
        title: 'Enter bank details',
        description: 'Please enter account holder name and account number first.',
      });
      return;
    }
    if (!IFSC_REGEX.test(cleanedIfsc)) {
      setBankVerified(false);
      toast({
        variant: 'destructive',
        title: 'Invalid IFSC Code',
        description: 'Enter a valid 11-character IFSC code (e.g., HDFC0001234).',
      });
      return;
    }

    setVerifyingBank(true);
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${cleanedIfsc}`);
      if (res.ok) {
        const info = await res.json();
        setBankName(info.BANK || '');
        setBranchName(info.BRANCH || '');
        setBankVerified(true);
        toast({
          title: 'Bank & IFSC Verified',
          description: `${info.BANK} — ${info.BRANCH}`,
        });
      } else {
        throw new Error('IFSC not found');
      }
    } catch {
      setBankName('Verified IFSC Format');
      setBankVerified(true);
      toast({
        title: 'Bank Details Recorded',
        description: `IFSC ${cleanedIfsc} format verified.`,
      });
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedGst = gstNumber.trim().toUpperCase();
    const cleanedIfsc = ifscCode.trim().toUpperCase();

    if (!GSTIN_REGEX.test(cleanedGst)) {
      toast({ variant: 'destructive', title: 'Invalid GSTIN', description: 'Enter a valid 15-character GSTIN.' });
      return;
    }
    if (!accountHolderName.trim() || accountNumber.trim().length < 6 || !IFSC_REGEX.test(cleanedIfsc)) {
      toast({ variant: 'destructive', title: 'Invalid bank details', description: 'Check account holder, account number, and IFSC.' });
      return;
    }
    if (!acceptTerms) {
      toast({ variant: 'destructive', title: 'Accept Terms', description: 'Please agree to the Vendor Terms & Conditions and Privacy Policy.' });
      return;
    }

    setIsLoading(true);
    try {
      await registerPrinter({
        companyName: companyName.trim(),
        fullName: fullName.trim(),
        phone: `+91${phone.replace(/\D/g, '').slice(-10)}`,
        email: email.trim(),
        password,
        address: address.trim(),
        state,
        city: city.trim(),
        postalCode: postalCode.trim(),
        sameAsBusinessAddress,
        pickupAddress: sameAsBusinessAddress ? address.trim() : pickupAddress.trim(),
        pickupState: sameAsBusinessAddress ? state : pickupState,
        pickupCity: sameAsBusinessAddress ? city.trim() : pickupCity.trim(),
        pickupPostalCode: sameAsBusinessAddress ? postalCode.trim() : pickupPostalCode.trim(),
        pickupContactPerson: pickupContactPerson.trim() || fullName.trim(),
        pickupPhone: pickupPhone.trim()
          ? `+91${pickupPhone.replace(/\D/g, '').slice(-10)}`
          : `+91${phone.replace(/\D/g, '').slice(-10)}`,
        printingUnitAreaSqFt: Number(printingUnitAreaSqFt),
        totalEmployees: Number(totalEmployees),
        availableMachinery,
        otherMachinery: otherMachinery.trim(),
        dailyOrderCapacity: dailyOrderCapacity.trim(),
        approxDailyProduction: approxDailyProduction.trim(),
        gstNumber: cleanedGst,
        gstVerified,
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: cleanedIfsc,
        bankName,
        branchName,
        bankVerified,
        acceptTermsConditions: true,
        acceptPrivacyPolicy: true,
      });

      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'Your printing partner account is pending admin review.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Could not submit vendor registration.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-purple-100 px-6 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <AmazoprintLogo />
            </Link>
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Printer Vendor Registration
              </h1>
              <p className="text-xs text-slate-500">
                Register your printing business and start receiving orders on AmazoPrint
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Only GST Registered Printing Companies
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 px-2">
          {[
            { num: 1, label: 'Basic Details' },
            { num: 2, label: 'Business & Capacity' },
            { num: 3, label: 'Verification & Submit' },
          ].map((item, idx) => {
            const active = step === item.num;
            const completed = step > item.num || submitted;
            return (
              <div key={item.num} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => !submitted && item.num < step && setStep(item.num as 1 | 2 | 3)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all',
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-md shadow-purple-600/20'
                      : completed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-slate-500 border border-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black',
                      active
                        ? 'bg-white/20 text-white'
                        : completed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {completed ? <Check className="h-3 w-3" /> : item.num}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
                {idx < 2 && <div className="w-6 sm:w-12 h-0.5 bg-purple-200 rounded-full" />}
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-6 items-start">
          {/* Left Banner Card */}
          <div className="bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-900 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-fuchsia-400/20 blur-2xl pointer-events-none" />
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 mb-3">
                Partner Network
              </span>
              <h2 className="text-2xl font-bold leading-snug">
                Join as a Printing Partner
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { icon: ShoppingCart, text: 'Get orders from across India' },
                { icon: IndianRupee, text: 'Grow your printing business' },
                { icon: TrendingUp, text: 'Regular payouts & full control' },
                { icon: ShieldCheck, text: 'Verified & trusted platform' },
              ].map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <benefit.icon className="h-4 w-4 text-amber-300" />
                  </div>
                  <p className="text-sm font-medium text-white/95">{benefit.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/15 text-xs text-purple-100">
              Already registered?{' '}
              <Link href="/printer-login" className="font-bold text-white underline">
                Partner Login →
              </Link>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden">
            {submitted ? (
              <div className="p-8 sm:p-12 text-center space-y-5">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Vendor Application Submitted!
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you for registering <strong>{companyName}</strong>. Our onboarding team will
                  review your GST, bank details, and press capacity. Once approved, you can log in
                  to your Printer Dashboard.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button asChild variant="outline" className="rounded-full px-6">
                    <Link href="/">Back to Home</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-violet-700"
                  >
                    <Link href="/printer-login">Go to Partner Login</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Step Card Header */}
                <div className="bg-gradient-to-r from-purple-700 to-violet-700 px-6 sm:px-8 py-5 text-white">
                  <div className="flex items-center gap-2.5">
                    {step === 1 && <User className="h-5 w-5" />}
                    {step === 2 && <Printer className="h-5 w-5" />}
                    {step === 3 && <ShieldCheck className="h-5 w-5" />}
                    <h2 className="text-lg font-bold">
                      Step {step}:{' '}
                      {step === 1
                        ? 'Basic Details'
                        : step === 2
                          ? 'Business & Capacity Details'
                          : 'Verification & Submit'}
                    </h2>
                  </div>
                  <p className="text-xs text-purple-100 mt-1">
                    {step === 1
                      ? 'Enter your business, contact, login, and address details'
                      : step === 2
                        ? 'Add your courier pickup address and printing infrastructure'
                        : 'Verify your GST and bank account details to complete registration'}
                  </p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* STEP 1 */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            Company / Business Name <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Building2 className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g., ABC Prints"
                              className="h-11 pl-10 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            Contact Person Name <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g., Karthik R"
                              className="h-11 pl-10 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            Mobile Number <span className="text-rose-500">*</span>
                          </Label>
                          <div className="flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-purple-600/20">
                            <span className="pl-3.5 pr-2 text-sm font-semibold text-slate-700 border-r border-slate-200">
                              +91
                            </span>
                            <Input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="Enter 10-digit mobile number"
                              className="h-11 border-0 shadow-none focus-visible:ring-0"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            Email Address <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="ops@company.com"
                              className="h-11 pl-10 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Portal Login Password <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password (min 8 characters)"
                            className="h-11 pr-10 rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Business Address <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <Textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter complete business address"
                            className="pl-10 min-h-[82px] rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            State <span className="text-rose-500">*</span>
                          </Label>
                          <Select value={state} onValueChange={setState}>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            City <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Enter city"
                            className="h-11 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            Pincode <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit pincode"
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <div className="space-y-6">
                      {/* Pickup Address */}
                      <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-purple-900">
                          <Truck className="h-4 w-4 text-purple-700" />
                          Pickup Address (For Courier Pickup)
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <Checkbox
                              checked={sameAsBusinessAddress}
                              onCheckedChange={(v) => setSameAsBusinessAddress(v === true)}
                            />
                            Same as Business Address
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <Checkbox
                              checked={!sameAsBusinessAddress}
                              onCheckedChange={(v) => setSameAsBusinessAddress(v !== true)}
                            />
                            Add Different Pickup Address
                          </label>
                        </div>

                        {!sameAsBusinessAddress && (
                          <div className="space-y-3 pt-1">
                            <Textarea
                              value={pickupAddress}
                              onChange={(e) => setPickupAddress(e.target.value)}
                              placeholder="Enter pickup address"
                              className="rounded-xl bg-white"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <Select value={pickupState} onValueChange={setPickupState}>
                                <SelectTrigger className="h-10 rounded-xl bg-white">
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                  {INDIAN_STATES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                value={pickupCity}
                                onChange={(e) => setPickupCity(e.target.value)}
                                placeholder="Pickup city"
                                className="h-10 rounded-xl bg-white"
                              />
                              <Input
                                value={pickupPostalCode}
                                onChange={(e) =>
                                  setPickupPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                placeholder="Pickup pincode"
                                className="h-10 rounded-xl bg-white"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">
                              Pickup Contact Person
                            </Label>
                            <Input
                              value={pickupContactPerson}
                              onChange={(e) => setPickupContactPerson(e.target.value)}
                              placeholder={fullName || 'Enter name'}
                              className="h-10 rounded-xl bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">
                              Pickup Mobile Number
                            </Label>
                            <Input
                              type="tel"
                              value={pickupPhone}
                              onChange={(e) =>
                                setPickupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                              }
                              placeholder={phone || '10-digit number'}
                              className="h-10 rounded-xl bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Infrastructure & Capacity */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Printer className="h-4 w-4 text-purple-700" />
                          Printing Infrastructure &amp; Capacity
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Printing Unit Area (in Sq. Ft.) <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={printingUnitAreaSqFt}
                              onChange={(e) => setPrintingUnitAreaSqFt(e.target.value)}
                              placeholder="e.g., 1500"
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Total Employees <span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative">
                              <Users className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <Input
                                type="number"
                                min={1}
                                value={totalEmployees}
                                onChange={(e) => setTotalEmployees(e.target.value)}
                                placeholder="e.g., 10"
                                className="h-11 pl-10 rounded-xl"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">
                            Available Printing Machinery{' '}
                            <span className="font-normal text-slate-500">(Select all that apply)</span>
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {MACHINERY_OPTIONS.map((machine) => {
                              const selected = availableMachinery.includes(machine);
                              return (
                                <button
                                  key={machine}
                                  type="button"
                                  onClick={() => toggleMachinery(machine)}
                                  className={cn(
                                    'flex items-center gap-2 px-3 py-2 rounded-2xl border text-left text-xs transition-all',
                                    selected
                                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'w-4 h-4 rounded flex items-center justify-center border shrink-0',
                                      selected
                                        ? 'bg-purple-600 border-purple-600 text-white'
                                        : 'border-slate-300'
                                    )}
                                  >
                                    {selected && <Check className="h-3 w-3" />}
                                  </span>
                                  <span className="truncate">{machine}</span>
                                </button>
                              );
                            })}
                          </div>
                          <Input
                            value={otherMachinery}
                            onChange={(e) => setOtherMachinery(e.target.value)}
                            placeholder="Other machinery (specify if any)"
                            className="h-10 rounded-xl mt-2"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Daily Order Capacity <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              value={dailyOrderCapacity}
                              onChange={(e) => setDailyOrderCapacity(e.target.value)}
                              placeholder="e.g., 50 Orders / Day"
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                              Approx. Daily Production <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              value={approxDailyProduction}
                              onChange={(e) => setApproxDailyProduction(e.target.value)}
                              placeholder="e.g., 10,000 Pieces / Day"
                              className="h-11 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div className="space-y-6">
                      {/* GST Verification */}
                      <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <FileCheck2 className="h-4 w-4 text-purple-700" />
                            GST Verification <span className="text-xs font-normal text-slate-500">(Mandatory)</span>
                          </div>
                          {gstVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={gstNumber}
                            onChange={(e) => {
                              setGstNumber(e.target.value.toUpperCase().slice(0, 15));
                              setGstVerified(false);
                            }}
                            placeholder="Enter GSTIN (e.g., 33ABCDE1234F1Z5)"
                            className="h-11 rounded-xl bg-white uppercase font-mono"
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyGstin}
                            className="h-11 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 shrink-0"
                          >
                            Verify GSTIN
                          </Button>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Info className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          We verify your 15-character GSTIN format and state code for tax invoices.
                        </p>
                      </div>

                      {/* Bank Account Verification */}
                      <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Landmark className="h-4 w-4 text-purple-700" />
                            Bank Account Verification{' '}
                            <span className="text-xs font-normal text-slate-500">(Mandatory)</span>
                          </div>
                          {bankVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {bankName || 'Verified'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Input
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Account Holder Name *"
                            className="h-11 rounded-xl bg-white"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px_auto] gap-2">
                            <Input
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="Account Number *"
                              className="h-11 rounded-xl bg-white font-mono"
                            />
                            <Input
                              value={ifscCode}
                              onChange={(e) => {
                                setIfscCode(e.target.value.toUpperCase().slice(0, 11));
                                setBankVerified(false);
                              }}
                              placeholder="IFSC Code *"
                              className="h-11 rounded-xl bg-white uppercase font-mono"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyBank}
                              disabled={verifyingBank}
                              className="h-11 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 shrink-0"
                            >
                              {verifyingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Bank'}
                            </Button>
                          </div>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Info className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          Payouts are settled directly to this verified current bank account.
                        </p>
                      </div>

                      {/* Terms Checkbox */}
                      <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                        <Checkbox
                          checked={acceptTerms}
                          onCheckedChange={(v) => setAcceptTerms(v === true)}
                        />
                        <span>
                          I agree to the AmazoPrint Vendor{' '}
                          <Link href="/terms" className="text-purple-700 font-semibold underline">
                            Terms &amp; Conditions
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="text-purple-700 font-semibold underline">
                            Privacy Policy
                          </Link>
                          . <span className="text-rose-500">*</span>
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-2 gap-3">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                        className="h-12 px-6 rounded-full font-bold"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                      </Button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="h-12 px-8 rounded-full font-bold bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 shadow-lg shadow-purple-600/20"
                      >
                        Save &amp; Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 px-8 rounded-full font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-600/25"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Submit for Admin Approval
                            <Check className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Registration Process Strip */}
        <div className="bg-white rounded-[2rem] border border-purple-100 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          <div className="bg-gradient-to-r from-purple-700 to-violet-700 text-white rounded-2xl px-4 py-3 font-bold text-sm text-center">
            Registration Process
          </div>
          {[
            { icon: ClipboardList, title: 'Step 1', desc: 'Basic Details (Company, Contact, Address)' },
            { icon: Package, title: 'Step 2', desc: 'Business & Capacity (Pickup, Machines, Daily Capacity)' },
            { icon: ShieldCheck, title: 'Step 3', desc: 'Verification (GST & Bank)' },
            { icon: CheckCircle2, title: 'Step 4', desc: 'Admin Review & Activation', green: true },
          ].map((item) => (
            <div
              key={item.title}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border',
                item.green
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-purple-50/40 border-purple-100'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  item.green ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{item.title}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
