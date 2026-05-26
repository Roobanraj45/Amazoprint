"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { savePriceListItem, deletePriceListItem } from "@/app/actions/price-list-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
    Plus, FileText, CheckCircle2, Clock, Trash2, Edit, 
    IndianRupee, Tag, Info, Layers, Loader2, Image as ImageIcon, Eye 
} from "lucide-react";

interface PriceListItem {
    id: string;
    catalogName: string | null;
    imageUrl: string;
    categoryName: string;
    subCategory: string | null;
    productName: string;
    size: string | null;
    gsm: string | null;
    paperType: string | null;
    finishType: string | null;
    colorType: string | null;
    laminationType: string | null;
    qty250: number | null;
    qty500: number | null;
    qty1000: number | null;
    qty5000: number | null;
    currency: string | null;
    isGlossy: boolean | null;
    isMatt: boolean | null;
    isFAndB: boolean | null;
    isActive: boolean | null;
    displayOrder: number | null;
    remarks: string | null;
    createdAt: Date | null;
}

interface PriceListClientProps {
    initialPriceList: PriceListItem[];
}

export function PriceListClient({ initialPriceList }: PriceListClientProps) {
    const [priceList, setPriceList] = React.useState<PriceListItem[]>(initialPriceList);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isPending, startTransition] = React.useTransition();
    const [uploading, setUploading] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<PriceListItem | null>(null);
    const { toast } = useToast();

    // Form states
    const [catalogName, setCatalogName] = React.useState("");
    const [imageUrl, setImageUrl] = React.useState("");
    const [categoryName, setCategoryName] = React.useState("");
    const [subCategory, setSubCategory] = React.useState("");
    const [productName, setProductName] = React.useState("");
    const [size, setSize] = React.useState("");
    const [gsm, setGsm] = React.useState("");
    const [paperType, setPaperType] = React.useState("");
    const [finishType, setFinishType] = React.useState("");
    const [colorType, setColorType] = React.useState("");
    const [laminationType, setLaminationType] = React.useState("");
    const [qty250, setQty250] = React.useState("");
    const [qty500, setQty500] = React.useState("");
    const [qty1000, setQty1000] = React.useState("");
    const [qty5000, setQty5000] = React.useState("");
    const [isGlossy, setIsGlossy] = React.useState(false);
    const [isMatt, setIsMatt] = React.useState(false);
    const [isFAndB, setIsFAndB] = React.useState(false);
    const [isActive, setIsActive] = React.useState(true);
    const [displayOrder, setDisplayOrder] = React.useState("0");
    const [remarks, setRemarks] = React.useState("");
    
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    // Totals
    const totalItems = priceList.length;
    const activeItems = priceList.filter(p => p.isActive).length;
    const totalCategories = new Set(priceList.map(p => p.categoryName)).size;

    // Reset Form
    const resetForm = () => {
        setCatalogName("");
        setImageUrl("");
        setCategoryName("");
        setSubCategory("");
        setProductName("");
        setSize("");
        setGsm("");
        setPaperType("");
        setFinishType("");
        setColorType("");
        setLaminationType("");
        setQty250("");
        setQty500("");
        setQty1000("");
        setQty5000("");
        setIsGlossy(false);
        setIsMatt(false);
        setIsFAndB(false);
        setIsActive(true);
        setDisplayOrder("0");
        setRemarks("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingItem(null);
    };

    // Trigger Edit Mode
    const startEdit = (item: PriceListItem) => {
        setEditingItem(item);
        setCatalogName(item.catalogName || "");
        setImageUrl(item.imageUrl);
        setCategoryName(item.categoryName);
        setSubCategory(item.subCategory || "");
        setProductName(item.productName);
        setSize(item.size || "");
        setGsm(item.gsm || "");
        setPaperType(item.paperType || "");
        setFinishType(item.finishType || "");
        setColorType(item.colorType || "");
        setLaminationType(item.laminationType || "");
        setQty250(item.qty250 ? String(item.qty250) : "");
        setQty500(item.qty500 ? String(item.qty500) : "");
        setQty1000(item.qty1000 ? String(item.qty1000) : "");
        setQty5000(item.qty5000 ? String(item.qty5000) : "");
        setIsGlossy(item.isGlossy || false);
        setIsMatt(item.isMatt || false);
        setIsFAndB(item.isFAndB || false);
        setIsActive(item.isActive || false);
        setDisplayOrder(String(item.displayOrder || 0));
        setRemarks(item.remarks || "");
        setPreviewUrl(item.imageUrl);
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let uploadedUrl = imageUrl;
        if (selectedFile) {
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("folder", "printers");

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();
                if (data.success && data.url) {
                    uploadedUrl = data.url;
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Image Upload Failed",
                    description: "Failed to upload print catalog image.",
                });
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        if (!uploadedUrl) {
            toast({
                variant: "destructive",
                title: "Image Required",
                description: "Please upload a catalog template image.",
            });
            return;
        }

        // Auto-generate display names and catalog references
        const finalCategory = "Catalog";
        const finalProduct = selectedFile 
            ? selectedFile.name.replace(/\.[^/.]+$/, "") 
            : (catalogName || "Catalog Upload");

        startTransition(async () => {
            try {
                const res = await savePriceListItem({
                    id: editingItem?.id,
                    catalogName: finalProduct,
                    imageUrl: uploadedUrl,
                    categoryName: finalCategory,
                    subCategory: null,
                    productName: finalProduct,
                    size: null,
                    gsm: null,
                    paperType: null,
                    finishType: null,
                    colorType: null,
                    laminationType: null,
                    qty250: null,
                    qty500: null,
                    qty1000: null,
                    qty5000: null,
                    isGlossy: false,
                    isMatt: false,
                    isFAndB: false,
                    isActive: true,
                    displayOrder: 0,
                    remarks: null,
                });

                if (res.success) {
                    toast({
                        title: editingItem ? "Catalog Updated" : "Catalog Uploaded",
                        description: `Your catalog image was successfully ${editingItem ? 'saved' : 'uploaded'}.`,
                    });
                    
                    // Trigger reload of local client list
                    window.location.reload();
                }
            } catch (err: any) {
                toast({
                    variant: "destructive",
                    title: "Action Failed",
                    description: err.message || "Failed to save catalog configuration.",
                });
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this pricing item?")) return;
        try {
            const res = await deletePriceListItem(id);
            if (res.success) {
                toast({
                    title: "Item Deleted",
                    description: "Pricing item has been successfully removed.",
                });
                setPriceList(prev => prev.filter(item => item.id !== id));
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: err.message || "Failed to delete pricing item.",
            });
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-8 pb-20 animate-in fade-in duration-500">
            {/* Header banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-tight border border-white/10">
                            <Layers className="w-3 h-3 text-primary animate-pulse" />
                            Price Settings Control
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Printing Price Lists</h1>
                        <p className="text-slate-400 font-medium text-[11px] max-w-xl">
                            Configure standard pricing matrix categories, specifications, paper variants, and bulk quantitive cost payout tiers.
                        </p>
                    </div>

                    <div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            if (!open) resetForm();
                            setIsDialogOpen(open);
                        }}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl h-11 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-2 px-5">
                                    <Plus size={16} /> Add Price Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] overflow-y-auto bg-slate-900 text-white border-slate-800 rounded-3xl p-6 no-scrollbar">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-black tracking-tight">{editingItem ? "Edit Catalog Item" : "Upload Catalog Image"}</DialogTitle>
                                    <DialogDescription className="text-slate-400 text-xs font-medium">
                                        Select and upload a catalog design template or layout reference image.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="imageFile" className="text-xs font-bold text-slate-300">Catalog Image File <span className="text-rose-500">*</span></Label>
                                        <Input 
                                            id="imageFile"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl text-xs h-11 flex items-center"
                                        />
                                    </div>

                                    {previewUrl && (
                                        <div className="relative aspect-video max-h-48 rounded-xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center p-2">
                                            <img src={previewUrl} alt="catalog reference" className="max-h-full object-contain" />
                                        </div>
                                    )}

                                    <div className="pt-2 flex justify-end gap-3">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={() => setIsDialogOpen(false)}
                                            className="rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isPending || uploading}
                                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider gap-2 px-5"
                                        >
                                            {(isPending || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            {editingItem ? "Save Changes" : "Upload Image"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Metric widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Catalogued Items</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalItems}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Offers</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeItems}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sub Categories</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCategories}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Layers size={20} />
                    </div>
                </Card>
            </div>

            {/* Pricing ledger */}
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-base font-bold tracking-tight">Active Catalog Matrix</CardTitle>
                    <CardDescription className="text-xs font-medium">Standard unit rates and spec payouts matching product sizes</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {priceList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                        <th className="py-4 px-6 md:px-8">Layout Image</th>
                                        <th className="py-4 px-6">Product Details</th>
                                        <th className="py-4 px-6">Product attributes</th>
                                        <th className="py-4 px-6">Qty 250</th>
                                        <th className="py-4 px-6">Qty 500</th>
                                        <th className="py-4 px-6">Qty 1000</th>
                                        <th className="py-4 px-6">Qty 5000</th>
                                        <th className="py-4 px-6 md:px-8 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                                    {priceList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                                            {/* Mockup image preview */}
                                            <td className="py-4 px-6 md:px-8">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white flex items-center justify-center relative">
                                                    <img src={item.imageUrl} alt="catalog layout" className="w-full h-full object-cover" />
                                                </div>
                                            </td>

                                            {/* Product Specs */}
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <span className="font-black text-slate-800 dark:text-slate-100 block">{item.productName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold block capitalize">
                                                        {item.categoryName} {item.subCategory ? ` / ${item.subCategory}` : ''}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Attributes list */}
                                            <td className="py-4 px-6 max-w-xs">
                                                <div className="flex flex-wrap items-center gap-1">
                                                    {item.size && <Badge variant="secondary" className="text-[9px] font-bold py-0">{item.size}</Badge>}
                                                    {item.gsm && <Badge variant="secondary" className="text-[9px] font-bold py-0">{item.gsm}</Badge>}
                                                    {item.paperType && <Badge variant="secondary" className="text-[9px] font-bold py-0">{item.paperType}</Badge>}
                                                    {item.isFAndB && <Badge variant="default" className="text-[9px] font-bold py-0 bg-indigo-600">F&B</Badge>}
                                                </div>
                                            </td>

                                            {/* Quantity Rates */}
                                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                                                {item.qty250 ? `₹${item.qty250}` : <span className="text-slate-400 font-medium italic">-</span>}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                                                {item.qty500 ? `₹${item.qty500}` : <span className="text-slate-400 font-medium italic">-</span>}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                                                {item.qty1000 ? `₹${item.qty1000}` : <span className="text-slate-400 font-medium italic">-</span>}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                                                {item.qty5000 ? `₹${item.qty5000}` : <span className="text-slate-400 font-medium italic">-</span>}
                                            </td>

                                            {/* Action triggers */}
                                            <td className="py-4 px-6 md:px-8 text-right">
                                                <div className="flex justify-end items-center gap-1.5">
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        onClick={() => startEdit(item)}
                                                        className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500"
                                                    >
                                                        <Edit size={13} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6">
                            <Info className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-3 animate-pulse" />
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">No print pricing configs found</h4>
                            <p className="text-slate-400 text-[11px] mt-1 max-w-sm mx-auto">
                                Add price specifications and file layouts to advertise your printing options to administrators.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
