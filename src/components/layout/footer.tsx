import Link from 'next/link';
import { AmazoprintLogo } from '@/components/ui/logo';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Linkedin, ArrowRight, ShieldCheck, CreditCard, Truck } from 'lucide-react';

export function Footer() {
    return (
      <footer className="bg-slate-900 text-slate-200 border-t border-slate-800 pt-24 pb-12">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20">
            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-8">
              <AmazoprintLogo className="scale-110 origin-left brightness-0 invert" />
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
                Revolutionizing the printing industry with AI-powered design and industrial precision. Your vision, expertly crafted and globally delivered.
              </p>
              <div className="flex gap-4">
                {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                  <Link key={i} href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300">
                    <Icon size={18} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-white">Catalog</h4>
              <ul className="space-y-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/products" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Business Cards</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Marketing Materials</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Custom Packaging</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Design Quests</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-white">Support</h4>
              <ul className="space-y-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/about" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Shipping Policy</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Partner Program</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-4 space-y-8 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50">
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white">Get in Touch</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <MapPin className="text-primary" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Corporate HQ</p>
                    <p className="text-sm font-medium text-slate-300">
                      Amazoprint, No.21/2, Udayarpalayam,<br />
                      Attur Main Road, Thammampatti - 636113.<br />
                      Tamilnadu, India.
                    </p>
                    <p className="text-[10px] font-black text-primary/70 mt-2 tracking-widest uppercase">GSTIN: 33BNLPK5597H1ZJ</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Phone className="text-primary" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Direct Contact</p>
                    <div className="text-sm font-medium text-slate-300 flex flex-col">
                        <span>+91 94983 38053</span>
                        <span>+91 81110 63111</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Mail className="text-primary" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">General Inquiry</p>
                    <p className="text-sm font-medium text-slate-300">hello@amazoprint.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-12 border-t border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex flex-wrap justify-center gap-8 order-2 lg:order-1">
              {[
                { icon: ShieldCheck, text: "Secure Payments" },
                { icon: Truck, text: "Global Shipping" },
                { icon: CreditCard, text: "Multiple Gateways" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <item.icon size={14} className="text-primary/50" />
                  {item.text}
                </div>
              ))}
            </div>
            
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest order-1 lg:order-2">
              © {new Date().getFullYear()} Amazoprint Inc. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    );
}
