'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  getPrinterDirectSellingProducts, 
  createPrinterDirectSellingProduct, 
  updatePrinterDirectSellingProduct, 
  deletePrinterDirectSellingProduct 
} from '@/app/actions/direct-selling-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, PlusCircle, Edit, Trash2, IndianRupee, Image as ImageIcon, 
  Upload, X, Search, Filter, XCircle, Package, Sparkles, CheckCircle2, 
  Clock, AlertTriangle, Store, SlidersHorizontal, DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveImagePath } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Zod Schema ---
const jsonFromString = z.string().transform((val, ctx) => {
    if (!val || val.trim() === '') return undefined;
    try {
        return JSON.parse(val);
    } catch (e) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON format',
        });
        return z.NEVER;
    }
});

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.coerce.number().optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().optional().default(0),
  minStockLevel: z.coerce.number().int().optional().default(5),
  weight: z.coerce.number().optional(),
  dimensions: jsonFromString.optional(),
  imageUrls: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  supplierInfo: jsonFromString.optional(),
  shippingInfo: jsonFromString.optional(),
  textAllowed: z.boolean().default(false),
});

type DirectProduct = Awaited<ReturnType<typeof getPrinterDirectSellingProducts>>[0];

// --- Image Manager Component ---
function ImageManager({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
    const [urls, setUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        setUrls(value ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
    }, [value]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'direct-selling');

        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            const newUrls = [...urls, result.url];
            onChange(newUrls.join(', '));
            toast({ title: 'Image uploaded successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = (urlToDelete: string) => {
        const newUrls = urls.filter(url => url !== urlToDelete);
        onChange(newUrls.join(', '));
    };

    return (
        <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Gallery</Label>
            <div className="p-3 sm:p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {urls.map((url, idx) => (
                        <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                            <Image src={resolveImagePath(url)} alt={`Product image ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            {idx === 0 && (
                                <Badge variant="secondary" className="absolute top-2 left-2 bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm pointer-events-none z-10">
                                    MAIN
                                </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="destructive" size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                                    onClick={() => handleDelete(url)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                     <label className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm p-2 text-center">
                        {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" /> : <Upload className="h-6 w-6 mb-1" />}
                        <span className="text-[11px] font-bold mt-1">Upload Image</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>
            </div>
             <p className="text-xs text-muted-foreground font-medium italic">First image will be the primary catalog thumbnail shown to shoppers.</p>
        </div>
    );
}

// --- Main Printer Client Component ---
export function PrinterDirectSellingClient({ initialProducts }: { initialProducts: DirectProduct[] }) {
  const [products, setProducts] = useState<DirectProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DirectProduct | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusTab, setStatusTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const prods = await getPrinterDirectSellingProducts();
      setProducts(prods);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to refresh products.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Derived metrics
  const totalCount = products.length;
  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = products.filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = products.filter(p => p.approvalStatus === 'rejected').length;

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStatus = statusTab === 'all' || p.approvalStatus === statusTab;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusTab]);

  // Unique categories
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(cats))];
  }, [products]);

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (editingProduct) {
        await updatePrinterDirectSellingProduct(editingProduct.id, data);
        toast({ 
          title: 'Product Updated', 
          description: 'Your product has been saved and submitted for admin review.' 
        });
      } else {
        await createPrinterDirectSellingProduct(data);
        toast({ 
          title: 'Product Created', 
          description: 'Your product was submitted and is pending admin approval.' 
        });
      }
      setFormOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deletePrinterDirectSellingProduct(id);
      toast({ title: "Deleted", description: "Product was successfully removed." });
      await loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
            Approved & Live
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/15 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
            <XCircle size={12} className="text-rose-600 dark:text-rose-400" />
            Needs Revision
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
            <Clock size={12} className="text-amber-600 dark:text-amber-400 animate-pulse" />
            Pending Approval
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-12 w-full overflow-hidden">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                <Store className="w-3.5 h-3.5 mr-1.5 inline-block text-indigo-400" />
                Printer Partner Products
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">Direct Selling Inventory</h1>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
              List physical products, accessories, and print merchandise directly on AmazoPrint. Products undergo a quick quality check by our team before going live.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Dialog open={isFormOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingProduct(null); }}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-11 sm:h-12 rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-5 sm:px-6 transition-all hover:scale-[1.02] w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Direct Product
                </Button>
              </DialogTrigger>
              <PrinterProductForm onSubmit={handleFormSubmit} product={editingProduct} onClose={() => setFormOpen(false)} />
            </Dialog>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-indigo-500/40 transition-colors" onClick={() => setStatusTab('all')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Listed</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Package size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setStatusTab('pending')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-emerald-500/40 transition-colors" onClick={() => setStatusTab('approved')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved & Live</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-4 cursor-pointer hover:border-rose-500/40 transition-colors" onClick={() => setStatusTab('rejected')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Needs Revision</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{rejectedCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                statusTab === tab 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'All Items' : tab === 'pending' ? `Pending (${pendingCount})` : tab}
            </button>
          ))}
        </div>

        {/* Search + Category */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, SKU, or category..." 
              className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold text-xs">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="font-semibold text-xs">
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || categoryFilter !== 'all' || statusTab !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-11 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0" 
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusTab('all'); }}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading your catalog items...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
                <div className="flex-1 flex flex-col">
                  <CardHeader className="p-0 relative flex-shrink-0">
                      <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950 relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                          {product.imageUrls?.[0] ? (
                              <Image src={resolveImagePath(product.imageUrls[0])} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2">
                                  <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">No Image</span>
                              </div>
                          )}
                      </div>
                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
                          {getStatusBadge(product.approvalStatus)}
                      </div>
                      {product.textAllowed && (
                          <Badge variant="secondary" className="absolute top-2.5 left-2.5 bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-md z-10">
                              <Sparkles className="w-2.5 h-2.5 mr-1 inline-block" /> Custom Text
                          </Badge>
                      )}
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">{product.category || 'General Product'}</p>
                          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 mt-1 min-h-[2.5rem] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</CardTitle>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {/* Rejection Note Alert */}
                        {product.approvalStatus === 'rejected' && product.rejectionReason && (
                            <Alert variant="destructive" className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 rounded-xl">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                                <AlertTitle className="text-xs font-bold text-rose-800 dark:text-rose-200">Admin Feedback:</AlertTitle>
                                <AlertDescription className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 line-clamp-2">
                                    {product.rejectionReason}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center">
                                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 mr-0.5 text-indigo-500" />
                                {product.sellingPrice}
                            </span>
                            <Badge variant={product.stockQuantity > (product.minStockLevel || 0) ? 'secondary' : 'destructive'} className={`h-5 sm:h-6 text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 rounded-lg shadow-sm ${product.stockQuantity > (product.minStockLevel || 0) ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' : 'bg-red-500 text-white'}`}>
                                {product.stockQuantity} in stock
                            </Badge>
                        </div>
                      </div>
                  </CardContent>
                </div>

                <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1.5 flex-shrink-0 mt-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 text-xs font-bold transition-colors" 
                    onClick={() => { setEditingProduct(product); setFormOpen(true); }}
                  >
                      <Edit className="h-3.5 w-3.5 mr-1" /> 
                      {product.approvalStatus === 'rejected' ? 'Fix & Resubmit' : 'Edit'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-destructive text-xs font-bold transition-colors">
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl max-w-md mx-4">
                      <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg sm:text-xl font-bold">Remove Product?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs sm:text-sm font-medium">Are you sure you want to delete &ldquo;{product.name}&rdquo;? This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="h-9 sm:h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
                          <AlertDialogAction className="h-9 sm:h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDelete(product.id)}>Delete Product</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center px-4 gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                <Store className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">No Direct Products Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">You haven&apos;t added any products matching the current filter, or your catalog is empty. Start adding products to begin direct selling.</p>
            <Button className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-5 mt-1 text-xs" onClick={() => { setEditingProduct(null); setFormOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Product
            </Button>
        </div>
      )}
    </div>
  );
}

// --- Product Form for Printers ---
function PrinterProductForm({ onSubmit, product, onClose }: { onSubmit: (data: any) => void; product: DirectProduct | null; onClose: () => void; }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (product) {
        reset({
            ...product,
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
            weight: Number(product.weight),
            imageUrls: product.imageUrls?.join(', ') || '',
            tags: product.tags?.join(', ') || '',
            dimensions: product.dimensions ? JSON.stringify(product.dimensions, null, 2) : '',
            supplierInfo: product.supplierInfo ? JSON.stringify(product.supplierInfo, null, 2) : '',
            shippingInfo: product.shippingInfo ? JSON.stringify(product.shippingInfo, null, 2) : '',
            textAllowed: !!product.textAllowed,
            isActive: product.isActive ?? true,
        });
    } else {
      reset({ 
        name: '', 
        slug: '', 
        description: '', 
        category: '', 
        costPrice: 0, 
        sellingPrice: 0, 
        sku: '', 
        stockQuantity: 10, 
        minStockLevel: 5, 
        weight: 0, 
        dimensions: '', 
        imageUrls: '', 
        tags: '', 
        isFeatured: false, 
        isActive: true, 
        supplierInfo: '', 
        shippingInfo: '', 
        textAllowed: false 
      });
    }
  }, [product, reset]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!product) {
      // Auto generate slug
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  };

  return (
    <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 bg-background border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden mx-2 sm:mx-auto">
      <DialogHeader className="p-5 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 flex-shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-md">
                        <Store className="w-3.5 h-3.5 mr-1.5 inline-block text-indigo-400" />
                        Printer Marketplace
                    </Badge>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {product ? 'Edit Direct Selling Product' : 'Add Direct Selling Product'}
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-xs sm:text-sm mt-1">
                  Products submitted will be reviewed by admin before appearing on the public store catalog.
                </DialogDescription>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner flex-shrink-0">
                <Store className="w-7 h-7 text-indigo-400" />
            </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 sm:px-8 mt-4 flex-shrink-0">
            <TabsList className="flex overflow-x-auto sm:grid sm:grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-full shadow-inner">
              <TabsTrigger value="basic" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="media" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Images & Weight</TabsTrigger>
              <TabsTrigger value="custom" className="rounded-lg font-bold text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Customization & Tags</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
              <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Product Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Name *</Label>
                                <Input 
                                  id="name" 
                                  placeholder="e.g. Laser Engraved Wooden Desk Clock" 
                                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" 
                                  {...register('name', { onChange: handleNameChange })} 
                                />
                                {errors.name && <p className="text-xs font-bold text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">URL Slug *</Label>
                                <Input 
                                  id="slug" 
                                  placeholder="e.g. laser-engraved-wooden-desk-clock" 
                                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold font-mono text-xs" 
                                  {...register('slug')} 
                                />
                                {errors.slug && <p className="text-xs font-bold text-destructive mt-1">{errors.slug.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</Label>
                                <Input 
                                  id="category" 
                                  placeholder="e.g. Stationery, Drinkware, Gifts" 
                                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" 
                                  {...register('category')} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">SKU / Item Code</Label>
                                <Input 
                                  id="sku" 
                                  placeholder="e.g. PRN-CLK-001" 
                                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" 
                                  {...register('sku')} 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Description</Label>
                            <Textarea 
                              id="description" 
                              placeholder="Describe materials, build quality, included accessories, and key features..." 
                              className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-4" 
                              {...register('description')} 
                              rows={4} 
                            />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Pricing & Stock Inventory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="costPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cost / Production Price (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="costPrice" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('costPrice')} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Customer Selling Price (₹) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                    <Input id="sellingPrice" type="number" step="0.01" placeholder="0.00" className="h-10 rounded-xl pl-7 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('sellingPrice')} />
                                </div>
                                {errors.sellingPrice && <p className="text-xs font-bold text-destructive mt-1">{errors.sellingPrice.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="stockQuantity" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Current Available Stock</Label>
                                <Input id="stockQuantity" type="number" placeholder="0" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('stockQuantity')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Low Stock Threshold Alert</Label>
                                <Input id="minStockLevel" type="number" placeholder="5" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('minStockLevel')} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 sm:space-y-6 mt-0">
                 <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                     <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                         <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                             Product Media & Physical Weight
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                         <Controller
                            name="imageUrls"
                            control={control}
                            render={({ field }) => (
                                <ImageManager value={field.value} onChange={field.onChange} />
                            )}
                        />
                        {errors.imageUrls && <p className="text-xs font-bold text-destructive mt-1">{errors.imageUrls.message}</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="weight" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Weight (kg)</Label>
                                <Input id="weight" type="number" step="0.01" placeholder="e.g. 0.35" className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold" {...register('weight')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dimensions" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dimensions JSON (Optional)</Label>
                                <Textarea id="dimensions" {...register('dimensions')} placeholder='e.g. {"length": 15, "width": 10, "height": 5}' className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-3 font-mono text-xs" rows={2} />
                            </div>
                        </div>
                     </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4 sm:space-y-6 mt-0">
                <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Customization & Discoverability
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm gap-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="textAllowed" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Enable Custom Engraving / Text</Label>
                                <p className="text-xs text-muted-foreground font-medium">Allow buyers to specify their name, message, or company title to print on this item.</p>
                            </div>
                            <Controller 
                              name="textAllowed" 
                              control={control} 
                              render={({ field }) => (
                                <Switch id="textAllowed" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600 shrink-0" />
                              )} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Search Keywords / Tags</Label>
                            <Textarea id="tags" {...register('tags')} placeholder="e.g. engraved, corporate, gift, luxury, wooden" className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold p-3 text-xs" rows={2} />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
          <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {product ? 'Update & Re-Submit' : 'Submit for Approval'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
