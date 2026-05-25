import { getPrinterOrderDetails } from "@/app/actions/order-actions";
import { getFoilTypes } from "@/app/actions/foil-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
    IndianRupee, Package, Truck, CreditCard, Hash, FileText, Download, 
    ShieldCheck, Clock, Type, Image as ImageIcon, Sparkles, Box, Scissors,
    Eye, ArrowLeft, Layers
} from "lucide-react";
import Link from "next/link";
import { resolveImagePath, cn } from "@/lib/utils";
import type { DesignElement } from "@/lib/types";
import { RenderPdfButton } from "./RenderPdfButton";
import { OrderStatusDropdown } from "./OrderStatusDropdown";
import * as lucide from "lucide-react";
import { MASK_SHAPES } from "@/lib/mask-shapes";

const getShapePath = (shapeType: string): string | null => {
    const maskShape = MASK_SHAPES.find(s => s.id === shapeType);
    if (maskShape) return maskShape.path;

    switch (shapeType) {
        case 'circle':
        case 'oval':
            return "M 50, 50 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0";
        case 'triangle':
            return "M 50,0 L 100,100 L 0,100 Z";
        case 'star':
            return "M 50,0 L 61,35 L 98,35 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 2,35 L 39,35 Z";
        case 'hexagon':
            return "M 87.5 66.6 V 33.3 A 8.3 8.3 0 0 0 83.3 26.1 L 54.1 9.4 A 8.3 8.3 0 0 0 45.8 9.4 L 16.6 26.1 A 8.3 8.3 0 0 0 12.5 33.3 V 66.6 A 8.3 8.3 0 0 0 16.6 73.8 L 45.8 90.5 A 8.3 8.3 0 0 0 54.1 90.5 L 83.3 73.8 A 8.3 8.3 0 0 0 87.5 66.6 Z";
        case 'pentagon':
            return "M 50 2 L 98 38 L 80 98 L 20 98 L 2 38 Z";
        case 'octagon':
            return "M 30 2 H 70 L 98 30 V 70 L 70 98 H 30 L 2 70 V 30 Z";
        case 'heart':
            return "M 50 90 C 50 90 2 60 2 35 A 23 23 0 0 1 48 35 A 23 23 0 0 1 98 35 C 98 60 50 90 50 90 Z";
        case 'diamond':
            return "M 50 2 L 98 50 L 50 98 L 2 50 Z";
        case 'arrow-right':
            return "M 2 40 H 70 V 15 L 98 50 L 70 85 V 60 H 2 Z";
        case 'arrow-left':
            return "M 98 40 H 30 V 15 L 2 50 L 30 85 V 60 H 98 Z";
        case 'arrow-up':
            return "M 40 98 V 30 H 15 L 50 2 L 85 30 H 60 V 98 Z";
        case 'arrow-down':
            return "M 40 2 V 70 H 15 L 50 98 L 85 70 H 60 V 2 Z";
        case 'plus':
            return "M 35 2 H 65 V 35 H 98 V 65 H 65 V 98 H 35 V 65 H 2 V 35 H 35 Z";
        case 'x':
            return "M 20 2 L 50 32 L 80 2 L 98 20 L 68 50 L 98 80 L 80 98 L 50 68 L 20 98 L 2 80 L 32 50 L 2 20 Z";
        case 'cloud':
            return "M 25 80 A 20 20 0 0 1 25 40 A 25 25 0 0 1 70 30 A 20 20 0 0 1 85 80 Z";
        case 'shield':
            return "M 50 2 C 50 2 98 10 98 45 C 98 80 50 98 50 98 C 50 98 2 80 2 45 C 2 10 50 2 50 2 Z";
        case 'tag':
            return "M 20 10 H 90 V 90 H 20 L 2 50 Z M 25 50 A 5 5 0 1 0 35 50 A 5 5 0 1 0 25 50 Z";
        case 'bookmark':
            return "M 10 2 H 90 V 98 L 50 75 L 10 98 Z";
        case 'message-square':
            return "M 2 10 H 98 V 80 H 30 L 10 98 V 80 H 2 Z";
        case 'rounded-rect':
        case 'rectangle':
            return "M 0 0 H 100 V 100 H 0 Z";
        default:
            return null;
    }
};

const ShapePreview = ({ el }: { el: DesignElement }) => {
    // 1. Check if it's custom-svg and has src
    if (el.shapeType === 'custom-svg' && el.src) {
        return (
            <img src={resolveImagePath(el.src)} alt="shape preview" className="w-full h-full object-contain" />
        );
    }

    // 2. Check if we have pathData
    const pathData = getShapePath(el.shapeType || '');
    if (pathData) {
        return (
            <svg viewBox="0 0 100 100" className="w-7 h-7" style={{ overflow: 'visible' }}>
                <path 
                    d={pathData} 
                    fill={el.fillType === 'none' ? 'none' : (el.color || '#cccccc')} 
                    stroke={el.strokeColor || el.borderColor || 'none'}
                    strokeWidth={el.strokeWidth || el.borderWidth || 0}
                />
            </svg>
        );
    }

    // 3. Fall back to Lucide icon
    const shapeName = el.shapeType || 'rectangle';
    const lucideName = shapeName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    const Icon = (lucide as any)[lucideName] || (lucide as any)[shapeName.charAt(0).toUpperCase() + shapeName.slice(1)];

    if (Icon) {
        return (
            <Icon 
                size={24} 
                style={{ 
                    color: el.color || '#cccccc',
                    fill: el.fillType === 'none' ? 'none' : (el.color || '#cccccc') 
                }} 
            />
        );
    }

    // 4. Default box icon
    return <lucide.Box size={20} className="text-slate-500" />;
};


interface PrinterOrderDetailProps {
    params: {
        orderId: string;
    };
}

export default async function PrinterOrderDetailPage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const [order, allFoils] = await Promise.all([
        getPrinterOrderDetails(orderId),
        getFoilTypes()
    ]);

    if (!order) {
        notFound();
    }

    const foilMap = new Map(allFoils.map(f => [f.id, f.name]));

    const isDirectSale = !!order.directSellingProduct;
    const productName = isDirectSale ? order.directSellingProduct.name : (order.product?.name || 'Custom Product');
    const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Size');

    let parsedCustomisation: any = null;
    try {
        const rawCustomisation = order.design?.customisation || (order as any).customisation;
        parsedCustomisation = typeof rawCustomisation === 'string' 
            ? JSON.parse(rawCustomisation) 
            : rawCustomisation;
    } catch (e) {}

    // Extract pages from design
    const pages = order.design 
        ? (Array.isArray(order.design.elements) && Array.isArray(order.design.elements[0])
            ? (order.design.elements as any[][]).map((els, i) => ({
                elements: els as DesignElement[],
                background: (order.design!.background as any[])[i]
            }))
            : [{ 
                elements: order.design.elements as any[] as DesignElement[], 
                background: order.design.background as any 
            }])
        : [];

    // Audit finishing elements from design pages
    interface FinishingElementAudit {
        pageIndex: number;
        pageLabel: string;
        element: DesignElement;
        type: 'spot_uv' | 'foil';
        foilName?: string;
    }

    const auditedElements: FinishingElementAudit[] = [];
    pages.forEach((page, pageIdx) => {
        const pageLabel = pages.length > 1 ? `Side ${pageIdx + 1}` : 'Front';
        page.elements.forEach((el) => {
            if (el.spotUv === true) {
                if (el.foilId !== undefined && el.foilId !== null) {
                    auditedElements.push({
                        pageIndex: pageIdx,
                        pageLabel,
                        element: el,
                        type: 'foil',
                        foilName: foilMap.get(el.foilId) || `Foil #${el.foilId}`
                    });
                } else {
                    auditedElements.push({
                        pageIndex: pageIdx,
                        pageLabel,
                        element: el,
                        type: 'spot_uv'
                    });
                }
            }
        });
    });

    const hasFinishes = auditedElements.length > 0;

    const selectedFoils = new Set<string>();
    if (parsedCustomisation?.foilName) {
        selectedFoils.add(parsedCustomisation.foilName);
    }
    if (parsedCustomisation?.foils && Array.isArray(parsedCustomisation.foils)) {
        parsedCustomisation.foils.forEach((f: any) => {
            if (typeof f === 'string') selectedFoils.add(f);
            else if (f && typeof f === 'object') selectedFoils.add(f.name || f.Name || String(f));
        });
    }
    auditedElements.forEach((audit) => {
        if (audit.type === 'foil' && audit.foilName) {
            selectedFoils.add(audit.foilName);
        }
    });
    const foilsDisplay = selectedFoils.size > 0 ? Array.from(selectedFoils).join(', ') : 'None';

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-8 pb-20 animate-in fade-in duration-700">
            {/* Back Button */}
            <div className="flex items-center">
                <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500">
                    <Link href="/printer/orders">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Queue
                    </Link>
                </Button>
            </div>

            {/* Industrial Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-tight border border-white/10">
                            <Layers className="w-3 h-3 text-primary animate-pulse" />
                            Production Specifications Sheet
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Order #{order.id}</h1>
                        <p className="text-slate-400 font-medium text-[11px]">
                            Received on {format(new Date(order.createdAt), 'PPP p')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Client Name</span>
                            <span className="text-sm font-black text-slate-200 mt-0.5">{order.user.name}</span>
                        </div>
                        <OrderStatusDropdown orderId={order.id} initialStatus={order.orderStatus || 'pending'} />
                    </div>
                </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Specifications Checklist */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Visual Blueprint card */}
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight">Item Specifications Summary</CardTitle>
                                        <CardDescription className="text-[11px] font-medium">Verify standard options before proceeding to print</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{productName}</h3>
                                    <p className="text-primary font-bold text-[10px] uppercase">{subProductName}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Batch Quantity</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{order.quantity} Units</span>
                                </div>
                            </div>

                            {/* Options Checklist */}
                            {(() => {
                                const pagesStr = parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double Sided' : 'Single Sided';
                                const dimensions = `${order.design?.width || order.designUpload?.width || 'Custom'} x ${order.design?.height || order.designUpload?.height || 'Custom'} mm`;
                                const spotUv = parsedCustomisation?.spotUv ? 'Yes, Included' : 'No';
                                const dieCut = parsedCustomisation?.dieCut ? `Custom Die Cut (#${parsedCustomisation.dieCut})` : 'Standard Rectangle';
                                const lamination = parsedCustomisation?.lamination || 'None';
                                const foil = parsedCustomisation?.foilName || parsedCustomisation?.foil || (parsedCustomisation?.foilId ? `Foil ID #${parsedCustomisation.foilId}` : 'None');

                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Printing side</span>
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{pagesStr}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Dimensions</span>
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{dimensions}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Spot UV Gloss</span>
                                            <span className={cn("font-extrabold text-xs", parsedCustomisation?.spotUv ? "text-amber-600" : "text-slate-500")}>{spotUv}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Foils</span>
                                            <span className={cn("font-extrabold text-xs", selectedFoils.size > 0 ? "text-indigo-600" : "text-slate-500")}>{foilsDisplay}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Die Cut / Shape</span>
                                            <span className={cn("font-extrabold text-xs", parsedCustomisation?.dieCut ? "text-primary" : "text-slate-500")}>{dieCut}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Lamination</span>
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs capitalize">{lamination}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* Objects with Add-ons Audit List */}
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Sparkles size={16} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight">Custom Addon Layer Audit</CardTitle>
                                        <CardDescription className="text-[11px] font-medium">Detailed breakdown of text, shapes, or images having special spot UV or foils applied</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {hasFinishes ? (
                                <div className="space-y-4">
                                    {auditedElements.map((audit, index) => {
                                        const el = audit.element;
                                        
                                        let TypeIcon = Box;
                                        if (el.type === 'text') TypeIcon = Type;
                                        if (el.type === 'image') TypeIcon = ImageIcon;

                                        return (
                                            <div 
                                                key={index} 
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 transition-colors"
                                            >
                                                {/* Left: Element info & properties */}
                                                <div className="flex items-start gap-3">
                                                    {((el.type === 'image' && el.src) || (el.type === 'shape' && el.fillImageSrc)) ? (
                                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 flex items-center justify-center">
                                                            <img src={resolveImagePath(el.fillImageSrc || el.src || '')} alt="layer preview" className="w-full h-full object-contain" />
                                                        </div>
                                                    ) : el.type === 'shape' ? (
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                                                            <ShapePreview el={el} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                            <TypeIcon size={20} className="text-slate-500" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-200">
                                                                {el.type} Layer
                                                            </span>
                                                            <Badge className="font-extrabold text-[8px] bg-slate-100 hover:bg-slate-100 dark:bg-zinc-800 text-slate-500 border-none px-2 rounded-md">
                                                                {audit.pageLabel}
                                                            </Badge>
                                                        </div>
                                                        
                                                        {el.type === 'text' && (
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">
                                                                Text value: "{el.content || 'N/A'}"
                                                            </p>
                                                        )}
                                                        {el.type === 'shape' && (
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize flex items-center gap-1.5">
                                                                Shape: {el.shapeType || 'Rectangle'} (Fill: {el.fillType || 'Solid'})
                                                                {el.color && el.fillType === 'solid' && (
                                                                    <span className="w-3.5 h-3.5 rounded border border-slate-200 dark:border-slate-800 flex-shrink-0 inline-block" style={{ backgroundColor: el.color }} />
                                                                )}
                                                            </p>
                                                        )}
                                                        {el.type === 'image' && (
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                                                Image source: {el.src ? el.src.split('/').pop() : 'Direct upload'}
                                                            </p>
                                                        )}

                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            Size: {Math.round(el.width)} x {Math.round(el.height)} mm | Pos: X:{Math.round(el.x)}, Y:{Math.round(el.y)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Applied Finish Badge */}
                                                <div>
                                                    {audit.type === 'foil' ? (
                                                        <Badge className="bg-amber-500 hover:bg-amber-500 border-none text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-md shadow-amber-500/10 flex items-center gap-1">
                                                            <Sparkles size={11} className="animate-spin duration-1000" />
                                                            {audit.foilName} Finish
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-indigo-600 hover:bg-indigo-600 border-none text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-md shadow-indigo-600/10 flex items-center gap-1">
                                                            <Eye size={11} />
                                                            Spot UV Gloss
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Spot UV or Metallic Foil Add-ons applied to design layers.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Job Files & Action Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* View/Download card */}
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-base font-bold tracking-tight">Job Files & Rendering</CardTitle>
                            <CardDescription className="text-[11px] font-medium">Process blueprint files to print-ready PDF formats</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            
                            {/* PDF Render Button */}
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Render Print Masks</span>
                                <RenderPdfButton 
                                    design={order.design} 
                                    designUpload={order.designUpload}
                                    variant="default"
                                    label="View / Render PDF"
                                    className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/95 text-white shadow-xl shadow-primary/10 font-bold text-xs uppercase tracking-widest gap-2"
                                />
                            </div>

                            {/* Job File Download Button */}
                            {order.designUpload && (
                                <div className="space-y-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Download Original File</span>
                                    <Button asChild variant="outline" className="w-full h-10 rounded-xl text-xs font-bold border-slate-200 gap-2">
                                        <a href={resolveImagePath(order.designUpload.filePath)} download>
                                            <Download size={15} /> Download Design File
                                        </a>
                                    </Button>
                                </div>
                            )}

                            {order.design && (
                                <div className="space-y-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Download Vector Layout</span>
                                    <RenderPdfButton
                                        design={order.design}
                                        designUpload={order.designUpload}
                                        variant="outline"
                                        label="Generate Job File"
                                        showDownloadIcon={true}
                                        className="w-full h-10 rounded-xl text-xs font-bold border-slate-200 gap-2"
                                    />
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {/* Operational Guard Info */}
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-base font-bold tracking-tight">Fulfillment Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Internal ID</span>
                                    <span className="font-black text-slate-900 dark:text-white">#INT-{order.id.toString().padStart(6, '0')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Delivery</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'PPP') : 'TBD'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    );
}
