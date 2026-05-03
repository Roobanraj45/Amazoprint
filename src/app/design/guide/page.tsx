'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Layers, 
  Maximize2, 
  ShieldCheck, 
  Zap, 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  Palette, 
  Maximize, 
  FileText, 
  Printer,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProducts } from '@/app/actions/product-actions';
import { resolveImagePath, cn } from '@/lib/utils';

export default function DesignGuidePage() {
  const [catalog, setCatalog] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getProducts().then((data) => {
      setCatalog(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-6 py-2 text-xs font-bold rounded-full">
            The Masterclass
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            Design for <span className="text-primary">Print.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            A professional guide to mastering industrial printing standards, premium finishes, and technical specifications.
          </p>
        </div>
      </section>

      {/* 1. The Golden Rules */}
      <section className="container mx-auto px-4 mb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-400">Section 01: Foundations</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">The Golden Rules of Layout</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                To ensure your design looks exactly as intended once trimmed, you must account for the industrial cutting process.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Bleed Area (3mm)",
                    desc: "Extend your background colors and images 3mm beyond the final trim line to avoid white edges after cutting.",
                    icon: Maximize2,
                    color: "text-blue-600",
                    bg: "bg-blue-50 dark:bg-blue-900/20"
                  },
                  {
                    title: "Safety Zone",
                    desc: "Keep all critical text and logos at least 3-5mm inside the trim line to prevent them from being accidentally cut.",
                    icon: ShieldCheck,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50 dark:bg-emerald-900/20"
                  },
                  {
                    title: "Trim Line",
                    desc: "The final size of your product after it has been cut from the larger production sheet.",
                    icon: Printer,
                    color: "text-purple-600",
                    bg: "bg-purple-50 dark:bg-purple-900/20"
                  }
                ].map((rule, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500 group">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", rule.bg, rule.color)}>
                      <rule.icon size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{rule.title}</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square bg-slate-50 dark:bg-slate-900 rounded-[4rem] p-12 overflow-hidden border border-slate-100 dark:border-slate-800">
                {/* Visual Representation of Bleed/Margin */}
                <div className="relative w-full h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center">
                    <div className="absolute inset-0 m-4 border-2 border-red-500/30 rounded-2xl flex items-center justify-center">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-red-500 uppercase tracking-widest">Trim Line</span>
                        
                        <div className="w-3/4 h-3/4 border-2 border-primary/20 rounded-xl bg-primary/[0.02] flex items-center justify-center relative">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-primary uppercase tracking-widest">Safety Zone</span>
                            <div className="w-1/2 h-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        </div>
                    </div>
                    <span className="absolute top-2 left-2 text-[10px] font-black text-slate-300 uppercase rotate-90 origin-top-left">Bleed Area (3mm)</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Premium Finishes Deep Dive */}
      <section className="bg-slate-950 py-32 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-20">
            <Badge className="bg-white/10 text-white border-none px-6 py-2 text-xs font-bold rounded-full">
              Premium Capabilities
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">The Art of Finishing</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">
                Transform standard print into luxury sensory experiences with our industrial finishing technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spot UV */}
            <div className="group p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <Sparkles size={32} className="text-amber-950" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Spot UV Varnish</h3>
                  <p className="text-amber-500 text-sm font-bold uppercase tracking-widest">Gloss Finish</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8">
                Spot UV is a clear, glossy liquid coating applied to specific areas. It creates a stunning matte-gloss contrast that catches light and adds a subtle raised texture.
              </p>
              <ul className="space-y-4 mb-10">
                {['High-build reflective finish', 'Sensory tactile experience', 'Ideal for logos and patterns'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-amber-500" />
                    <span className="text-sm font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="aspect-video rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="text-white/5 text-6xl font-black select-none">MATTE</div>
                <div className="absolute w-24 h-24 rounded-full bg-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] border-2 border-amber-300 flex items-center justify-center transform group-hover:scale-125 transition-transform duration-700">
                    <span className="text-amber-950 font-black text-xs">GLOSS</span>
                </div>
              </div>
            </div>

            {/* Foils */}
            <div className="group p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                  <Layers size={32} className="text-indigo-100" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Metallic Foil</h3>
                  <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest">Mirror Brilliance</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8">
                Foil stamping applies a true metallic layer to your design. Unlike metallic inks, foil provides a genuine mirror-like brilliance that is unmatched in luxury branding.
              </p>
              <ul className="space-y-4 mb-10">
                {['True metallic mirror finish', 'Available in Gold, Silver & more', 'Premium branding weight'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-indigo-500" />
                    <span className="text-sm font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="aspect-video rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center gap-4">
                {[
                    { color: 'from-[#FFD700] to-[#B8860B]', label: 'Gold' },
                    { color: 'from-[#C0C0C0] to-[#808080]', label: 'Silver' },
                    { color: 'from-[#B76E79] to-[#8B4C55]', label: 'Rose' },
                ].map((foil, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className={cn("w-12 h-12 rounded-full bg-gradient-to-br border border-white/20 shadow-lg transform group-hover:translate-y-[-10px] transition-transform duration-500", foil.color)} style={{ transitionDelay: `${i * 100}ms` }} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{foil.label}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Technical Specs Grid */}
      <section className="py-32 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">The Technical Blueprint</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Essential specifications to ensure your files are production-ready.
                </p>
                <div className="pt-6">
                    <Button size="lg" className="rounded-2xl px-8" asChild>
                        <Link href="/products">Browse products <ArrowRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                    {
                        title: "CMYK Color Mode",
                        desc: "Always design in CMYK (Cyan, Magenta, Yellow, Key/Black). RGB is for screens and will shift during print.",
                        icon: Palette,
                        theme: "indigo"
                    },
                    {
                        title: "300 DPI Minimum",
                        desc: "All images must be high-resolution. Lower DPI results in blurry or pixelated physical prints.",
                        icon: Maximize,
                        theme: "amber"
                    },
                    {
                        title: "PDF File Format",
                        desc: "High-quality PDF is the industry standard. Flatten your layers and embed all fonts.",
                        icon: FileText,
                        theme: "rose"
                    },
                    {
                        title: "Vector Graphics",
                        desc: "Use vector formats for logos and text to ensure infinite scalability and perfect edge clarity.",
                        icon: Zap,
                        theme: "blue"
                    }
                ].map((spec, i) => (
                    <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-colors">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-white dark:bg-slate-800 shadow-sm text-primary group-hover:scale-110 transition-transform")}>
                            <spec.icon size={20} />
                        </div>
                        <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">{spec.title}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{spec.desc}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Advanced Color & Typography Details */}
      <section className="py-32 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Color Science: Rich Black */}
            <div className="p-12 rounded-[3.5rem] bg-slate-900 text-white space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                        <Palette size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">The Rich Black Secret</h3>
                </div>
                <p className="text-slate-400 font-medium leading-relaxed">
                    For a truly deep, obsidian black, avoid using 100% K (Black) alone. It often appears dark gray on paper. Instead, use <span className="text-white font-bold">Rich Black</span>.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="aspect-square rounded-2xl bg-black border border-white/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-500">100% K</span>
                        </div>
                        <p className="text-[10px] font-bold text-center text-slate-500 uppercase">Standard Black</p>
                    </div>
                    <div className="space-y-3">
                        <div className="aspect-square rounded-2xl bg-[#000000] shadow-[0_0_30px_rgba(0,0,0,1)] border-2 border-primary/30 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                            <span className="text-[10px] font-bold text-primary">60/40/40/100</span>
                        </div>
                        <p className="text-[10px] font-bold text-center text-primary uppercase">Rich Black</p>
                    </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        &quot;Use 60% Cyan, 40% Magenta, 40% Yellow, and 100% Black for the most professional depth.&quot;
                    </p>
                </div>
            </div>

            {/* Typography Standards */}
            <div className="p-12 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Typography Standards</h3>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Legibility is paramount. Following these industrial standards ensures your message is sharp and readable.
                </p>

                <div className="space-y-6">
                    {[
                        { label: 'Minimum Font Size', val: '6pt - 7pt', desc: 'Anything smaller may bleed or become illegible during the inking process.' },
                        { label: 'Fine Line Weight', val: '0.25pt', desc: 'The absolute minimum thickness for lines and borders to ensure they don\'t disappear.' },
                        { label: 'Foil Complexity', val: 'Medium', desc: 'Avoid ultra-thin serifs in foil areas; metallic layers need surface area to bond correctly.' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                            <div>
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-slate-900 dark:text-white">{item.label}</h4>
                                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{item.val}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Material & QR Section */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="lg:col-span-2 p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-10 items-center">
                    <div className="shrink-0 w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-xl">
                        <div className="grid grid-cols-3 gap-1">
                            {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="w-4 h-4 bg-slate-300 dark:bg-slate-700 rounded-sm" />)}
                        </div>
                    </div>
                    <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">QR Code Precision</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            For reliable scanning, QR codes should be at least <span className="text-primary font-bold">20mm x 20mm</span>. Ensure a high contrast between the code and the background. Avoid applying Spot UV or Foil over the code as reflections can hinder scan reliability.
                        </p>
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] bg-emerald-600 text-white flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-10" />
                    <ShieldCheck size={48} className="text-emerald-200" />
                    <h3 className="text-xl font-bold leading-tight">Eco-Conscious <br/>Production</h3>
                    <p className="text-emerald-100 text-xs font-medium leading-relaxed">
                        We prioritize FSC-certified papers and soy-based inks to reduce our environmental footprint without compromising on premium quality.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* 6. Industrial Catalog */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-20">
            <Badge className="bg-primary/10 text-primary border-none px-6 py-2 text-xs font-bold rounded-full">
              Production Matrix
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">The Industrial Catalog</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                Explore our full range of professional products, industrial sizes, and premium finishing compatibility.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading catalog...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {catalog.map((product) => (
                    <div key={product.id} className="group bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/20 transition-all duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                            {/* Product Info Side */}
                            <div className="md:col-span-2 p-8 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                        <Printer size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{product.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                                        {product.description || `Professional industrial-grade ${product.name.toLowerCase()} production.`}
                                    </p>
                                </div>
                                <div className="pt-8">
                                    <Button variant="outline" size="sm" className="rounded-xl h-9 text-[11px] font-bold" asChild>
                                        <Link href={`/design/e/start?productId=${product.slug}`}>Configure Project <ArrowRight className="ml-2 w-3 h-3" /></Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Sizes/Specs Side */}
                            <div className="md:col-span-3 p-8 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Formats</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Finishing</span>
                                </div>
                                <div className="space-y-3 flex-grow">
                                    {product.subProducts.map((sub: any) => (
                                        <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-slate-800 transition-all group/size">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover/size:text-primary transition-colors">
                                                    <Maximize2 size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                                                        {sub.width} x {sub.height} {sub.unitType}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400">{sub.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {sub.spotUvAllowed && (
                                                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600" title="Spot UV Available">
                                                        <Sparkle size={12} />
                                                    </div>
                                                )}
                                                {sub.allowedFoils && sub.allowedFoils.length > 0 && (
                                                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600" title="Metallic Foils Available">
                                                        <Layers size={12} />
                                                    </div>
                                                )}
                                                {!sub.spotUvAllowed && (!sub.allowedFoils || sub.allowedFoils.length === 0) && (
                                                    <span className="text-[10px] font-bold text-slate-300 italic">Standard</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto rounded-[4rem] bg-primary p-12 md:p-24 text-center space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter max-w-3xl mx-auto leading-tight">
                Ready to create your <br/> masterpiece?
            </h2>
            <p className="text-white/80 font-medium max-w-xl mx-auto text-lg">
                Put these rules into practice and design something extraordinary with our pro-tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" variant="secondary" className="rounded-2xl px-12 h-16 text-lg font-bold w-full sm:w-auto shadow-2xl" asChild>
                    <Link href="/products">Start Designing Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl px-12 h-16 text-lg font-bold w-full sm:w-auto bg-white/5 border-white/20 text-white hover:bg-white/10" asChild>
                    <Link href="/templates">Browse Templates</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Bottom Footer Link */}
      <footer className="container mx-auto px-4 mt-20 text-center border-t border-slate-100 dark:border-slate-800 pt-12">
        <p className="text-sm text-slate-400 font-medium">
            Need more help? <Link href="/contact" className="text-primary underline decoration-primary/30">Speak with a print specialist</Link>
        </p>
      </footer>
    </div>
  );
}
