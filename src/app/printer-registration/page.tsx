'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AmazoprintLogo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { registerPrinter } from '@/app/actions/printer-actions';

const printerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name is required.'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  gstNumber: z.string().optional(),
  workDescription: z.string().optional(),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, "You must accept the privacy policy."),
  acceptTermsConditions: z.boolean().refine(val => val === true, "You must accept the terms."),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type PrinterFormValues = z.infer<typeof printerSchema>;

export default function PrinterRegistrationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, control, formState: { errors } } = useForm<PrinterFormValues>({
        resolver: zodResolver(printerSchema),
        defaultValues: {
            acceptPrivacyPolicy: false,
            acceptTermsConditions: false,
        }
    });

    const handleRegister = async (data: PrinterFormValues) => {
        setIsLoading(true);
        try {
            await registerPrinter(data);
            toast({
                title: 'Registration Submitted!',
                description: 'Your application has been received. Our team will review your details shortly.',
            });
            router.push('/');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 py-12 px-4">
            <Card className="w-full max-w-4xl border-none shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="bg-primary p-12 text-primary-foreground text-center">
                    <div className="mx-auto mb-6 flex justify-center bg-white p-4 rounded-3xl w-fit shadow-xl">
                        <AmazoprintLogo isSimple className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase font-headline mb-2">Production Partnership</h1>
                    <p className="opacity-80 font-medium max-w-md mx-auto">Join the elite network of industrial printing hubs powering global brands.</p>
                </div>
                
                <form onSubmit={handleSubmit(handleRegister)}>
                    <CardContent className="p-8 md:p-12 space-y-12">
                        {/* Account Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight font-headline">Account Credentials</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Internal Username</Label>
                                    <Input id="username" placeholder="e.g. factory_x1" {...register('username')} className="h-12 bg-muted/30" />
                                    {errors.username && <p className="text-xs text-destructive font-bold">{errors.username.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Work Email</Label>
                                    <Input id="email" type="email" placeholder="production@company.com" {...register('email')} className="h-12 bg-muted/30" />
                                    {errors.email && <p className="text-xs text-destructive font-bold">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Security Password</Label>
                                    <Input id="password" type="password" {...register('password')} className="h-12 bg-muted/30" />
                                    {errors.password && <p className="text-xs text-destructive font-bold">{errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Verify Password</Label>
                                    <Input id="confirmPassword" type="password" {...register('confirmPassword')} className="h-12 bg-muted/30" />
                                    {errors.confirmPassword && <p className="text-xs text-destructive font-bold">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>
                        </div>

                         {/* Industrial Info Section */}
                         <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <FileText size={20} />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight font-headline">Company & Compliance</h3>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Lead Contact Person</Label>
                                    <Input id="fullName" placeholder="Full Name" {...register('fullName')} className="h-12 bg-muted/30" />
                                    {errors.fullName && <p className="text-xs text-destructive font-bold">{errors.fullName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Contact Number</Label>
                                    <Input id="phone" type="tel" placeholder="+91" {...register('phone')} className="h-12 bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Registered Company Name</Label>
                                    <Input id="companyName" {...register('companyName')} className="h-12 bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gstNumber">GST Identification Number</Label>
                                    <Input id="gstNumber" placeholder="Optional for initial review" {...register('gstNumber')} className="h-12 bg-muted/30 font-mono" />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="workDescription">Production Capabilities & Machinery</Label>
                                <Textarea id="workDescription" placeholder="Describe your press types (Offset, Digital, UV), daily capacity, and specialty finishes..." {...register('workDescription')} className="min-h-[120px] bg-muted/30" />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="address">Physical Facility Address</Label>
                                <Textarea id="address" {...register('address')} className="bg-muted/30" />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" {...register('city')} className="h-12 bg-muted/30" /></div>
                                <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" {...register('state')} className="h-12 bg-muted/30" /></div>
                                <div className="space-y-2"><Label htmlFor="postalCode">Postal Code</Label><Input id="postalCode" {...register('postalCode')} className="h-12 bg-muted/30" /></div>
                             </div>
                        </div>

                        {/* Legal Section */}
                        <div className="p-6 bg-muted/20 rounded-3xl space-y-4 border border-border/40">
                             <div className="flex items-start space-x-3">
                                <Controller
                                    name="acceptTermsConditions"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox 
                                            id="terms" 
                                            checked={field.value} 
                                            onCheckedChange={field.onChange} 
                                            className="mt-1"
                                        />
                                    )}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="terms" className="text-sm font-bold leading-tight cursor-pointer">
                                        Accept Industrial Service Terms
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        I agree to the production standards, quality audits, and fulfillment timelines outlined in the partner agreement.
                                    </p>
                                    {errors.acceptTermsConditions && <p className="text-[10px] text-destructive font-bold">{errors.acceptTermsConditions.message}</p>}
                                </div>
                            </div>
                             <div className="flex items-start space-x-3">
                                <Controller
                                    name="acceptPrivacyPolicy"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox 
                                            id="privacy" 
                                            checked={field.value} 
                                            onCheckedChange={field.onChange} 
                                            className="mt-1"
                                        />
                                    )}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="privacy" className="text-sm font-bold leading-tight cursor-pointer">
                                        Data Privacy & Security
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        I understand how my company data and facility information will be handled under the Privacy Policy.
                                    </p>
                                    {errors.acceptPrivacyPolicy && <p className="text-[10px] text-destructive font-bold">{errors.acceptPrivacyPolicy.message}</p>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-12 md:px-12">
                        <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/30" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    Initialize Partnership Review
                                    <ArrowRight className="ml-3 h-5 w-5"/>
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
