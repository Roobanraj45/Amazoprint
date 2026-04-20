'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactUsPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. We'll get back to you shortly.",
    });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-xl text-muted-foreground mt-2">We'd love to hear from you.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>Fill out the form and our team will get back to you within 24 hours.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Send Message</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Contact Information</h3>
            <div className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 mt-1 text-primary"/>
                    <div>
                        <h4 className="font-semibold text-foreground">Email</h4>
                        <p>support@amazoprint.com</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 mt-1 text-primary"/>
                    <div>
                        <h4 className="font-semibold text-foreground">Phone</h4>
                        <p>+91 987 654 3210</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 mt-1 text-primary"/>
                    <div>
                        <h4 className="font-semibold text-foreground">Office</h4>
                        <p>123 Print Avenue, Design City, India</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
