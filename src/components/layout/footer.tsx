import Link from 'next/link';
import { AmazoprintLogo } from '@/components/ui/logo';

export function Footer() {
    return (
      <footer className="bg-muted/20 border-t py-24">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-16 mb-16">
            <div className="col-span-2 space-y-8">
              <AmazoprintLogo className="scale-110 origin-left" />
              <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xs">Industrial precision. AI-powered creativity. Global delivery.</p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-foreground">Infrastructure</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/products" className="hover:text-primary transition-colors">Catalog</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Quests</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Studio</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-foreground">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-foreground">Legal</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} Amazoprint Inc.</p>
          </div>
        </div>
      </footer>
    );
}
