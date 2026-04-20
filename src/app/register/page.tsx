'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AmazoprintLogo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

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
        title: 'Registration Successful!',
        description: 'Please log in to continue.',
      });
      router.push('/login');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <AmazoprintLogo />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join our community of clients and designers.
          </CardDescription>
        </CardHeader>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleRegister)}>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-center block">Are you a...</Label>
                <RadioGroup
                  defaultValue={role}
                  onValueChange={(value) => methods.setValue('role', value as 'user' | 'freelancer')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="user" id="client" className="peer sr-only" {...register('role')} />
                    <Label
                      htmlFor="client"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 h-full hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      Client
                      <span className="text-sm text-muted-foreground mt-1 text-center">I need design work done.</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="freelancer"
                      id="freelancer"
                      className="peer sr-only"
                      {...register('role')}
                    />
                    <Label
                      htmlFor="freelancer"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 h-full hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      Freelancer
                       <span className="text-sm text-muted-foreground mt-1 text-center">I am a designer looking for work.</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.role && <p className="text-sm text-destructive text-center">{errors.role.message}</p>}
              </div>

              {role && (
                <div className="space-y-6 animate-in fade-in-0">
                  <h3 className="font-semibold text-center">{role === 'user' ? 'Client' : 'Freelancer'} Registration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder={role === 'user' ? "Priya Kumar" : "Arun Kumar"} {...register('name')} />
                          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder={role === 'user' ? "priya.kumar@example.com" : "arun.kumar@design.co"} {...register('email')} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input id="phone" type="tel" placeholder="+91 98765 43210" {...register('phone')} />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                      </div>
                  </div>
                  
                  {role === 'freelancer' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl">Portfolio or Website (Optional)</Label>
                        <Input id="portfolioUrl" placeholder="https://behance.net/arunkumar" {...register('portfolioUrl')} />
                        {errors.portfolioUrl && <p className="text-sm text-destructive">{errors.portfolioUrl.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills / Specialties (Optional)</Label>
                        <Textarea id="skills" placeholder="e.g., Logo Design, Brochure Design, Tamil Typography..." {...register('skills')} />
                        <p className="text-xs text-muted-foreground">Please list your skills, separated by commas.</p>
                        {errors.skills && <p className="text-sm text-destructive">{errors.skills.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio (Optional)</Label>
                        <Textarea id="bio" placeholder="A brief introduction about yourself..." {...register('bio')} />
                        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" {...register('password')} />
                          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input id="confirm-password" type="password" {...register('confirmPassword')} />
                          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                      </div>
                  </div>
                </div>
              )}
            </CardContent>
          
            {role && (
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={!role || isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
              </CardFooter>
            )}
          </form>
        </FormProvider>
         <CardFooter className="justify-center pt-4">
            <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                    Login
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
