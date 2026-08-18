import { getMyOrderDetails } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IndianRupee, ArrowLeft, ShieldCheck, Building2, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AmazoprintLogo } from "@/components/ui/logo";
import { InvoiceActions } from "./invoice-actions";
import { calculateGstBreakdown, getGstStateInfo, SUPPLIER_GSTIN, SUPPLIER_STATE_CODE, SUPPLIER_STATE_NAME } from "@/lib/gst";

export default async function InvoicePage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const order = await getMyOrderDetails(orderId);

    if (!order) {
        notFound();
    }

    const isDirectSale = !!order.directSellingProduct;
    const productName = isDirectSale ? order.directSellingProduct.name : (order.product?.name || 'Custom Print Production');
    const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Specifications');
    
    const shippingAddress = (order.shippingAddress as any) || {};
    const billingAddress = (order.billingAddress as any) || shippingAddress;

    // Resolve State & GST details from shipping / billing address
    const targetState = shippingAddress.state || billingAddress.state || 'Tamil Nadu';
    const customerGstin = (order as any).customerGstin || (billingAddress as any).gstNumber || null;

    // Financial calculations
    let totalAmount = parseFloat(order.totalAmount) || 0;
    if (totalAmount === 0 && order.contestId && order.payment?.amount) {
        totalAmount = parseFloat(order.payment.amount);
    }
    const unitPrice = parseFloat(order.unitPrice) || (totalAmount / order.quantity);
    
    let parsedCustomisation: any = null;
    try {
        const rawCustomisation = order.design?.customisation || (order as any).customisation;
        parsedCustomisation = typeof rawCustomisation === 'string' ? JSON.parse(rawCustomisation) : rawCustomisation;
    } catch (e) {}

    const breakup = parsedCustomisation?.priceBreakup;
    const addonsTotal = breakup?.addons?.reduce((acc: number, addon: any) => acc + addon.totalAmount, 0) || 0;
    const discount = breakup?.discount || 0;
    const baseSubtotal = totalAmount - addonsTotal + discount;

    // State-based Split GST calculation (CGST+SGST for Tamil Nadu, IGST for Inter-state)
    const gstCalc = calculateGstBreakdown({
        totalAmount,
        stateInput: targetState,
        gstin: customerGstin,
        gstRate: 0.18,
    });

    const billingStateInfo = getGstStateInfo(billingAddress.state || targetState);
    const shippingStateInfo = getGstStateInfo(shippingAddress.state || targetState);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-5 px-3 sm:px-6 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-3xl mx-auto space-y-4">
                
                {/* Floating Non-Printable Action Bar (Compact) */}
                <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 dark:bg-slate-900/80 backdrop-blur-xl text-white p-3.5 rounded-2xl shadow-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl h-8 text-xs">
                            <Link href={`/client/orders/${order.id}`}>
                                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Order #{order.id}
                            </Link>
                        </Button>
                        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
                        <div>
                            <h2 className="text-xs font-black tracking-tight text-white uppercase">Official Tax Invoice</h2>
                            <p className="text-[10px] text-slate-400 font-medium">Ready for PDF download & print</p>
                        </div>
                    </div>
                    
                    <InvoiceActions />
                </div>

                {/* Printable Invoice Sheet (20% Reduced Footprint for Crisp Single-Page Print) */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 print:p-0 print:shadow-none print:border-none print:bg-white print:text-black">
                    
                    {/* Header: Logo & Company Info vs Invoice Title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-2">
                            <div className="w-36">
                                <AmazoprintLogo className="w-full h-auto text-slate-900 dark:text-white print:text-black" />
                            </div>
                            <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700 font-medium leading-tight">
                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-xs flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-600 print:text-slate-800" /> AMAZOPRINT
                                </p>
                                <p>No.21/2, Udayarpalayam, Attur Mainroad</p>
                                <p>Udayarpalayam, Thammampatti - 636113</p>
                                <p>Tamil Nadu, India (State Code: {SUPPLIER_STATE_CODE})</p>
                                <p className="pt-0.5 flex items-center gap-2 text-[10px]">
                                    <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> +91 94983 38053 / 81110 63111</span>
                                    <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> support@amazoprint.com</span>
                                </p>
                                <div className="pt-0.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
                                    <span className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 px-1.5 py-0.2 rounded text-slate-800 dark:text-slate-200 print:text-slate-800">
                                        GSTIN: {SUPPLIER_GSTIN}
                                    </span>
                                    <span className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 px-1.5 py-0.2 rounded text-slate-800 dark:text-slate-200 print:text-slate-800">
                                        State: {SUPPLIER_STATE_NAME} ({SUPPLIER_STATE_CODE})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="sm:text-right space-y-1">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
                                Tax Invoice
                            </h1>
                            <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700">
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice No:</span> INV-2026-{order.id.toString().padStart(6, '0')}</p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice Date:</span> {format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Order Ref:</span> ORD-{order.id}</p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">GST State Code:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400 print:text-black">{gstCalc.stateCode}</span></p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Payment Status:</span> <span className="text-emerald-600 print:text-emerald-800 font-extrabold uppercase">{order.paymentStatus}</span></p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Payment Method:</span> {order.paymentMethod?.toUpperCase() || 'ONLINE'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Addresses Box with State & State Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                                Billed To (Tax Entity)
                            </h3>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                <p className="font-extrabold text-xs text-slate-900 dark:text-white print:text-black">{billingAddress.name || 'Valued Customer'}</p>
                                <p>{billingAddress.addressLine1}</p>
                                {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                                <p>{billingAddress.city}, {billingStateInfo.stateName} - {billingAddress.zip}</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">
                                    State Code: {billingStateInfo.stateCode} ({billingStateInfo.stateName})
                                </p>
                                {customerGstin && (
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400 print:text-black pt-0.5">
                                        GSTIN: {customerGstin}
                                    </p>
                                )}
                                <p className="pt-0.5 font-bold text-slate-500">Ph: {billingAddress.phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                                Shipped To (Place of Delivery)
                            </h3>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                <p className="font-extrabold text-xs text-slate-900 dark:text-white print:text-black">{shippingAddress.name || billingAddress.name || 'Valued Customer'}</p>
                                <p>{shippingAddress.addressLine1 || billingAddress.addressLine1}</p>
                                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                                <p>{shippingAddress.city || billingAddress.city}, {shippingStateInfo.stateName} - {shippingAddress.zip || billingAddress.zip}</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">
                                    State Code: {shippingStateInfo.stateCode} ({shippingStateInfo.stateName})
                                </p>
                                <p className="pt-0.5 font-bold text-slate-500">Ph: {shippingAddress.phone || billingAddress.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="py-4 space-y-2.5 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                            Production Breakdown & Particulars
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 print:border-slate-400 text-[10px] font-extrabold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
                                        <th className="py-2 px-2.5">#</th>
                                        <th className="py-2 px-2.5">Item Description & Specifications</th>
                                        <th className="py-2 px-2.5 text-center">HSN/SAC</th>
                                        <th className="py-2 px-2.5 text-center">Qty</th>
                                        <th className="py-2 px-2.5 text-right">Unit Rate</th>
                                        <th className="py-2 px-2.5 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-medium divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                                        <td className="py-2.5 px-2.5 font-bold text-slate-500">1</td>
                                        <td className="py-2.5 px-2.5 space-y-0.5">
                                            <p className="font-extrabold text-xs text-slate-900 dark:text-white print:text-black">{productName}</p>
                                            <p className="text-slate-500 dark:text-slate-400 print:text-slate-600 text-[10px]">{subProductName}</p>
                                            {parsedCustomisation && (
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-500 space-y-0.2 pt-0.5">
                                                    {parsedCustomisation.pages && <p>• Pages/Sides: {parsedCustomisation.pages}</p>}
                                                    {parsedCustomisation.spotUv && <p>• Spot UV Gloss Applied</p>}
                                                    {parsedCustomisation.dieCut && <p>• Custom Die-Cut Pattern #{parsedCustomisation.dieCut}</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 font-bold text-[10px]">{(order.subProduct as any)?.hsnCode || '49111090'}</td>
                                        <td className="py-2.5 px-2.5 text-center font-extrabold text-slate-900 dark:text-white print:text-black">{order.quantity}</td>
                                        <td className="py-2.5 px-2.5 text-right font-mono">₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-2.5 px-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-white print:text-black">₹{baseSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    {breakup?.addons?.map((addon: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                                            <td className="py-2 px-2.5 font-bold text-slate-500">{idx + 2}</td>
                                            <td className="py-2 px-2.5 space-y-0.2">
                                                <p className="font-bold text-slate-900 dark:text-white print:text-black text-[11px]">{addon.name}</p>
                                                <p className="text-[9px] text-slate-500">Premium Add-on Service</p>
                                            </td>
                                            <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[10px]">998892</td>
                                            <td className="py-2 px-2.5 text-center font-extrabold text-slate-900 dark:text-white print:text-black">1</td>
                                            <td className="py-2 px-2.5 text-right font-mono">₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-2 px-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-white print:text-black">₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary & Split Tax Breakdown based on Customer State */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 items-start">
                        <div className="sm:col-span-7 space-y-2.5">
                            <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-600 leading-normal font-medium">
                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-[11px] uppercase tracking-wider mb-1">Terms & Tax Rules</p>
                                <p>1. Supply categorized under <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">{gstCalc.isIntrastate ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</span> (GST State Code: <span className="font-bold">{gstCalc.stateCode}</span>).</p>
                                <p>2. Produced strictly as per approved digital artwork proof.</p>
                                <p>3. This is a computer-generated tax invoice and does not require a physical signature.</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 print:text-emerald-800 pt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified GST Compliance
                            </div>
                        </div>

                        <div className="sm:col-span-5 space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 font-medium text-[11px]">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">Subtotal (Taxable Value)</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{gstCalc.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between items-center text-emerald-600 print:text-emerald-800 font-bold">
                                    <span>Special Discount</span>
                                    <span className="font-mono">- ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            {/* Split GST based on Destination State */}
                            {gstCalc.isIntrastate ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                                            CGST (9%) <span className="text-[9px] text-slate-400">[{gstCalc.stateCode}]</span>
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                                            ₹{gstCalc.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                                            SGST (9%) <span className="text-[9px] text-slate-400">[{gstCalc.stateCode}]</span>
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                                            ₹{gstCalc.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                                        IGST (18%) <span className="text-[9px] text-slate-400">[{gstCalc.stateCode}]</span>
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                                        ₹{gstCalc.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700 print:border-slate-300">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">Shipping & Packaging</span>
                                <span className="font-mono font-bold text-emerald-600 print:text-emerald-800 uppercase text-[9px] tracking-wider">Free Express</span>
                            </div>

                            <div className="flex justify-between items-center pt-2.5 mt-1 border-t-2 border-slate-900 dark:border-white print:border-black">
                                <div className="space-y-0.2">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider block">Grand Total</span>
                                    <span className="text-[8px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">All Taxes Included</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 print:text-black">
                                    <IndianRupee className="w-4 h-4 font-extrabold" />
                                    <span className="text-2xl font-black font-mono tracking-tighter">
                                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatory */}
                    <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 print:text-slate-600">
                        <div className="space-y-0.5 text-center sm:text-left">
                            <p className="font-bold text-slate-900 dark:text-white print:text-black">Thank you for choosing AmazoPrint!</p>
                            <p>For support, visit <span className="text-indigo-600 print:text-indigo-800 font-bold">www.amazoprint.com/support</span></p>
                        </div>

                        <div className="text-center sm:text-right space-y-1">
                            <div className="h-8 w-24 border-b border-dashed border-slate-400 print:border-slate-500 mx-auto sm:ml-auto flex items-end justify-center">
                                <span className="font-mono font-bold text-indigo-600/40 dark:text-indigo-400/40 print:text-indigo-800/40 text-[8px] tracking-widest uppercase">Verified Seal</span>
                            </div>
                            <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-[10px]">Authorized Signatory</p>
                            <p className="text-[9px]">AMAZOPRINT</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
