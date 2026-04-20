'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
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
import { AmazoprintLogo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
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
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type PrinterFormValues = z.infer<typeof printerSchema>;

export default function PrinterRegistrationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<PrinterFormValues>({
        resolver: zodResolver(printerSchema),
    });

    const handleRegister = async (data: PrinterFormValues) => {
        setIsLoading(true);
        try {
            await registerPrinter(data);
            toast({
                title: 'Registration Submitted!',
                description: 'Your application has been received. You will be notified once it is approved.',
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
        <div className="flex items-center justify-center min-h-screen bg-muted/40 py-12">
            <Card className="w-full max-w-3xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto"><AmazoprintLogo /></div>
                    <CardTitle className="text-3xl">Join as a Printing Partner</CardTitle>
                    <CardDescription>
                        Become part of our global network of professional printers.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(handleRegister)}>
                    <CardContent className="space-y-8 p-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" {...register('username')} />{errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}</div>
                                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register('email')} />{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}</div>
                                <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" {...register('password')} />{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}</div>
                                <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" {...register('confirmPassword')} />{errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}</div>
                            </div>
                        </div>

                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Company Details</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="fullName">Contact Full Name</Label><Input id="fullName" {...register('fullName')} />{errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}</div>
                                <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" {...register('phone')} />{errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}</div>
                             </div>
                             <div className="space-y-2"><Label htmlFor="companyName">Company Name</Label><Input id="companyName" {...register('companyName')} /></div>
                             <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" {...register('address')} /></div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" {...register('city')} /></div>
                                <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" {...register('state')} /></div>
                                <div className="space-y-2"><Label htmlFor="postalCode">Postal Code</Label><Input id="postalCode" {...register('postalCode')} /></div>
                             </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                            <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
