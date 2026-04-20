'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getProductBySlug } from '@/app/actions/product-actions';

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export default function CustomRequestPage() {
  const params = useParams();
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  useEffect(() => {
    if (typeof productId !== 'string') {
      setLoading(false);
      return;
    }
    async function fetchProduct() {
      try {
        const fetchedProduct = await getProductBySlug(productId as string);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);
  
  if (loading) {
    return (
      <div className="container px-4 md:px-6 max-w-3xl mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            if (newImages.length === files.length) {
              setReferenceImages((prev) => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, this would submit to a backend.
    toast({
      title: 'Request Submitted!',
      description: "Our design team will get back to you shortly.",
    });
  };

  return (
        <div className="container px-4 md:px-6 max-w-3xl mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Custom Design Request</CardTitle>
              <CardDescription>
                Tell us what you need for your {product.name}. Our designers will bring your vision to life.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectTitle">Project Title</Label>
                  <Input id="projectTitle" placeholder="e.g., Modern Business Cards for Tech Startup" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designBrief">Design Brief</Label>
                  <Textarea
                    id="designBrief"
                    placeholder="Describe your vision. Include details about style, colors, text content, and any other ideas you have."
                    required
                    rows={8}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Reference Images (Optional)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {referenceImages.map((src, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={src}
                          alt={`Reference ${index + 1}`}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    ))}
                    <Label className="cursor-pointer aspect-square relative flex flex-col items-center justify-center overflow-hidden rounded-md group bg-muted hover:bg-accent text-foreground border-2 border-dashed">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-center text-muted-foreground">
                        Upload
                      </span>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload images that inspire your design.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input id="name" placeholder="Anand Kumar" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="anand.kumar@example.com" required />
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Submit Request</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
  );
}
