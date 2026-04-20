import { Header } from '@/components/layout/header';
import { AmazoprintLogo } from '@/components/ui/logo';
import Link from 'next/link';
import { Globe, Briefcase } from 'lucide-react';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="bg-card border-t py-20">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <AmazoprintLogo />
              <p className="text-muted-foreground max-w-xs">High-fidelity printing with AI intelligence and a global soul.</p>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"><Globe size={20}/></div>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"><Briefcase size={20}/></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Explore</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Design Contests</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">AI Studio</Link></li>
                <li><Link href="/freelancer/dashboard" className="hover:text-primary transition-colors">For Freelancers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Support</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm font-medium">© {new Date().getFullYear()} Amazoprint Inc. All rights reserved.</p>
            <div className="flex gap-8 text-muted-foreground font-bold text-xs uppercase tracking-widest">
              <Link href="/privacy" className="cursor-pointer hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="cursor-pointer hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
